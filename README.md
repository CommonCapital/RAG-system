# Blackstone Clone — RAG AI Assistant

A pixel-faithful clone of the [Blackstone](https://blackstone.com) website with a fully functional AI chat assistant powered by a **dedicated .NET backend**, **RabbitMQ**, **Qdrant vector search**, **Ollama embeddings**, **PostgreSQL**, and **DeepSeek LLM** — all running locally via Docker.

> Next.js is the frontend only. All AI logic lives in the .NET server.

---

## How It Works

### Full request flow

```
User types message in browser
        │
        ▼
ChatWidget (Next.js) → POST /api/chat to .NET
        │
        ▼
ChatController generates correlation ID
publishes to RabbitMQ: ai.chat.requests
        │
        ▼
ChatWorker picks up the message
runs 2 things IN PARALLEL:
        │
        ├── MemoryService → Postgres
        │     fetches last 10 messages + rolling summary for this user
        │
        └── RetrievalService → EmbeddingService → Ollama (nomic-embed-text)
              embeds the question as a 768-dim vector
              → searches Qdrant by cosine similarity
              → returns top 6 most relevant knowledge chunks
        │
        ▼
DeepSeekClient assembles the prompt:
  [System: Blackstone assistant persona]
  [Top 6 RAG chunks from Qdrant]
  [Summary of old conversation]         ← compressed history
  [Last 10 messages verbatim]           ← recent context
  [New user message]
→ calls DeepSeek API → gets answer
        │
        ▼
ChatWorker publishes reply to ai.chat.replies
saves exchange to Postgres (async, non-blocking)
if history > 20 msgs → summarise old ones via LLM → delete them from DB
        │
        ▼
ChatController resolves the correlation ID
returns HTTP response to browser
```

---

## Architecture

```
Browser (Next.js UI)
        │
        │  HTTP REST
        ▼
┌──────────────────────────────────────────────────┐
│             .NET ASP.NET Core API                │
│                                                  │
│   ChatController       HistoryController         │
│         │                                        │
│         │ publish + correlation ID               │
│         ▼                                        │
│    RabbitMQ (ai.chat.requests)  ← durable queue  │
│         │                                        │
│         ▼                                        │
│      ChatWorker (BackgroundService)              │
│         │                                        │
│         ├── EmbeddingService → Ollama            │  768-dim vectors, local
│         ├── RetrievalService → Qdrant            │  cosine similarity search
│         ├── MemoryService    → Postgres          │  sliding-window history
│         └── DeepSeekClient  → DeepSeek API      │  LLM answer
│         │                                        │
│         │ publish reply                          │
│         ▼                                        │
│    RabbitMQ (ai.chat.replies)                    │
│         │                                        │
│         │ resolved by correlation ID             │
│         ▼                                        │
│      HTTP response → Browser                     │
└──────────────────────────────────────────────────┘

External tenant backend (your main .NET service)
  → publishes directly to ai.chat.requests
  → subscribes to ai.chat.replies
  (same queue, no HTTP involved)
```

---

## Why Each Piece Exists

| Piece | Role | Why |
|---|---|---|
| **RabbitMQ** | Message queue | Requests queue up instead of failing under load. Worker can crash and restart without losing messages. Tenant backend publishes directly — no HTTP needed. |
| **Qdrant** | Vector database | Finds semantically similar knowledge even when words don't match. "What does BX put money into?" finds chunks about "Blackstone invests across..." |
| **Ollama / nomic-embed-text** | Embeddings | Converts text to 768-dim vectors locally. No internet, no API cost, no external latency. |
| **Sliding-window memory** | Conversation context | Last 10 messages sent verbatim. Older messages compressed into a rolling summary via a second LLM call, then deleted. DB never grows unbounded. |
| **Postgres** | Persistent storage | Stores conversation history, summaries, and knowledge chunks (source of record). Qdrant is the search index on top. |
| **DeepSeek** | LLM | Generates answers grounded in RAG context + conversation history. |

---

## RabbitMQ — Why It's Better Than Plain HTTP

HTTP is a phone call — if nobody answers, the call fails. RabbitMQ is a voicemail — the message is stored and processed when ready, nothing is lost.

| Scenario | Plain HTTP | RabbitMQ |
|---|---|---|
| Worker crashes mid-request | Request lost | Message stays in queue, replayed on restart |
| 1000 users send messages at once | 1000 simultaneous LLM calls → rate limit hit | Messages queue up, worker processes at its own pace |
| Scale to multiple workers | Need a load balancer | Multiple workers consume from the same queue automatically |
| Tenant backend integration | Must call HTTP endpoint | Publishes directly to queue, completely decoupled |

---

## Tenant Backend Integration

Your main .NET tenant backend connects to the same RabbitMQ instance and interacts with the AI service **without any HTTP**:

```csharp
// Publish a request
var request = new ChatRequest(
    CorrelationId: Guid.NewGuid().ToString(),
    UserId: "tenant-user-id",
    Message: "What is BREIT?"
);
await channel.BasicPublishAsync("", "ai.chat.requests", body: Serialize(request));

// Subscribe for replies on ai.chat.replies
// Match by CorrelationId to route reply back to the right caller
```

**Message contracts:**

```json
// Request → ai.chat.requests
{ "correlationId": "uuid", "userId": "string", "message": "string" }

// Reply ← ai.chat.replies
{ "correlationId": "uuid", "content": "string", "error": null }
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | ASP.NET Core 10 (.NET 10) |
| Message Queue | RabbitMQ 3 |
| Vector Database | Qdrant |
| Embeddings | Ollama (`nomic-embed-text`, 768-dim, local) |
| Database | PostgreSQL 16 |
| LLM | DeepSeek (`deepseek-chat`) |
| Infrastructure | Docker + Docker Compose |

---

## Production Readiness

### What's solid ✅
- RabbitMQ durable queuing — survives worker crashes, messages never lost
- Qdrant vector search — semantically accurate retrieval at scale
- Sliding-window memory — conversation context without unbounded DB growth
- Schema auto-creation and knowledge auto-seeding on first startup
- Worker reconnects automatically if RabbitMQ restarts
- Tenant backend can integrate via RabbitMQ with zero HTTP coupling

### What needs work before production ❌

| Gap | What's needed |
|---|---|
| **No authentication** | Any `userId` string is accepted. Needs JWT / API key validation. |
| **Ollama on localhost** | In prod, Ollama must run as a containerised service, not on the dev machine. |
| **No dead-letter queue** | Failed messages are lost. Add a DLQ + retry policy in RabbitMQ. |
| **No observability** | No metrics, no distributed tracing, no structured logs. Add OpenTelemetry. |
| **Secrets in `.env`** | Replace with Vault / Azure Key Vault / AWS Secrets Manager. |
| **Single worker instance** | One worker handles 4 concurrent messages. Run multiple replicas for real load. |
| **No rate limiting** | A single user can flood the queue. Add per-user rate limiting at the controller. |

The architecture is production-grade. The gaps are operational — things your team adds on top, not things that need to be rebuilt.

---

## Running Locally

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- [Ollama](https://ollama.com/) with `nomic-embed-text` pulled
- A [DeepSeek API key](https://platform.deepseek.com/)

### 1. Pull the embedding model

```bash
ollama pull nomic-embed-text
```

### 2. Start infrastructure

```bash
docker compose up -d
```

Starts:
- **PostgreSQL** on `localhost:5432`
- **RabbitMQ** on `localhost:5672` — management UI at http://localhost:15672 (`guest/guest`)
- **Qdrant** on `localhost:6333` — dashboard at http://localhost:6333/dashboard

### 3. Configure the backend

Create `backend/BlackstoneAI/.env`:

```env
DATABASE_URL=postgresql://blackstone:blackstone@localhost:5432/blackstone
DEEPSEEK_API_KEY=sk-your-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_CHAT_MODEL=deepseek-chat
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
QDRANT_HOST=localhost
QDRANT_PORT=6334
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=nomic-embed-text
```

### 4. Start the .NET backend

```bash
cd backend/BlackstoneAI
dotnet run
```

On first run, the backend automatically:
- Creates all Postgres tables
- Embeds 38 Blackstone knowledge chunks via Ollama and loads them into Qdrant
- Connects to RabbitMQ and starts the chat worker

The API listens on **http://localhost:5187**.

### 5. Configure and start the frontend

```env
# .env.local (project root)
NEXT_PUBLIC_DOTNET_URL=http://localhost:5187
```

```bash
npm install && npm run dev
```

Open http://localhost:3000 and click **Ask Blackstone**.

---

## Project Structure

```
├── app/                              # Next.js pages — UI only
├── components/
│   ├── ChatWidget.tsx                # Chat UI — calls .NET directly
│   └── ...                           # Hero, Navbar, Footer, etc.
├── backend/
│   └── BlackstoneAI/
│       ├── Controllers/
│       │   ├── ChatController.cs     # POST /api/chat
│       │   └── HistoryController.cs  # GET  /api/history
│       ├── Services/
│       │   ├── ChatQueueService.cs   # RabbitMQ RPC (publish + await reply)
│       │   ├── EmbeddingService.cs   # Ollama nomic-embed-text (768-dim)
│       │   ├── QdrantService.cs      # Vector upsert + cosine search
│       │   ├── RetrievalService.cs   # Embed query → search Qdrant → context
│       │   ├── MemoryService.cs      # Sliding-window conversation memory
│       │   ├── DeepSeekClient.cs     # LLM + summarisation calls
│       │   └── KnowledgeSeeder.cs    # Auto-embeds + seeds on first run
│       ├── Workers/
│       │   └── ChatWorker.cs         # RabbitMQ consumer — orchestrates pipeline
│       ├── Models/
│       │   └── ChatModels.cs         # Request/response records
│       ├── Program.cs
│       └── .env                      # Backend secrets (not committed)
└── docker-compose.yml                # Postgres + RabbitMQ + Qdrant
```

---

## API Reference

### `POST /api/chat`

```json
// Request
{ "userId": "uuid", "message": "What is BREIT?" }

// Response
{ "content": "BREIT is Blackstone Real Estate Income Trust..." }
```

### `GET /api/history?userId=<uuid>`

```json
// Response
{
  "messages": [
    { "role": "user", "content": "What is BREIT?" },
    { "role": "assistant", "content": "BREIT is..." }
  ]
}
```

---

## Disclaimer

Built for educational and demonstration purposes only. Not affiliated with or endorsed by Blackstone Inc. Nothing on this site constitutes investment advice.
