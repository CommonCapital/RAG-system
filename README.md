# Blackstone Clone — RAG AI Assistant

A pixel-faithful clone of the [Blackstone](https://blackstone.com) website with a fully functional AI chat assistant powered by a **dedicated .NET backend**, **RabbitMQ message queue**, **PostgreSQL**, and the **DeepSeek LLM** — all running locally via Docker.

> Next.js is the frontend only. All AI logic lives in the .NET server.

---

## Architecture

```
Browser (Next.js UI)
        │
        │  HTTP REST
        ▼
┌─────────────────────────────────────────┐
│         .NET ASP.NET Core API           │
│                                         │
│  ChatController  HistoryController      │
│        │                                │
│        │ publishes request + corr. ID   │
│        ▼                                │
│   RabbitMQ (blackstone.chat.requests)   │  ← reliability layer
│        │                                │
│        │ consumed by                    │
│        ▼                                │
│     ChatWorker (BackgroundService)      │
│        │                                │
│        ├── RetrievalService             │  keyword search → Postgres
│        ├── MemoryService                │  sliding-window memory → Postgres
│        └── DeepSeekClient              │  LLM call → DeepSeek API
│        │                                │
│        │ publishes reply                │
│        ▼                                │
│   RabbitMQ (blackstone.chat.replies)    │
│        │                                │
│        │ controller awaits by corr. ID  │
│        ▼                                │
│     HTTP response → Browser             │
└─────────────────────────────────────────┘
        │
        ▼
   PostgreSQL (Docker)
   ├── knowledge_chunks     ← 38 Blackstone knowledge documents
   ├── user_conversations   ← per-user message history
   └── user_summaries       ← compressed conversation summaries
```

### Why RabbitMQ?

RabbitMQ sits **inside the .NET server** between the HTTP controller and the AI worker. This is the RPC pattern:

1. `ChatController` receives an HTTP request, generates a correlation ID, and **publishes** the message to the `blackstone.chat.requests` queue. It then waits on a `TaskCompletionSource` keyed by that ID.
2. `ChatWorker` (a `BackgroundService`) **consumes** from the queue, runs the full AI pipeline (retrieval → memory → LLM), and **publishes** the result to `blackstone.chat.replies`.
3. A reply consumer on the controller side resolves the `TaskCompletionSource`, and the HTTP response is returned.

**Benefits:** requests queue up instead of failing under load; the worker reconnects automatically if it crashes; processing is decoupled from the HTTP layer.

---

## How the AI Pipeline Works

Every message goes through three steps inside `ChatWorker`, run in parallel where possible:

### 1. RAG Retrieval (`RetrievalService`)

The user's message is scored against **38 Blackstone knowledge chunks** stored in Postgres using TF-style keyword scoring with an exact-phrase bonus. The top 6 most relevant chunks are injected as grounding context into the LLM prompt.

### 2. Sliding-Window Memory (`MemoryService`)

Each user is identified by a UUID stored in their browser (`localStorage`). The backend maintains per-user conversation history in Postgres:

- **Last 10 messages** are fetched verbatim and included in the prompt.
- When stored messages exceed 20, the **oldest messages are summarised** into a rolling summary via a second LLM call, then deleted. The DB never grows unbounded.
- The summary is injected above the recent messages, so the model always has full context without hitting token limits.

### 3. LLM Call (`DeepSeekClient`)

The final prompt structure sent to DeepSeek:

```
[System: Blackstone assistant persona]
[System: RAG context — top 6 retrieved knowledge chunks]
[System: Summary of earlier conversation]   ← if exists
[Last 10 messages verbatim]
[New user message]
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | ASP.NET Core 10 (.NET 10) |
| Message Queue | RabbitMQ 3 |
| Database | PostgreSQL 16 |
| LLM | DeepSeek (`deepseek-chat`) |
| Infrastructure | Docker + Docker Compose |

---

## Running Locally

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- A [DeepSeek API key](https://platform.deepseek.com/)

### 1. Start infrastructure

```bash
docker compose up -d
```

Starts:
- **PostgreSQL** on `localhost:5432` (user: `blackstone`, pass: `blackstone`, db: `blackstone`)
- **RabbitMQ** on `localhost:5672` — management UI at http://localhost:15672 (`guest/guest`)

### 2. Configure the backend

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
```

### 3. Start the .NET backend

```bash
cd backend/BlackstoneAI
dotnet run
```

On first run, the backend automatically:
- Creates all Postgres tables (`knowledge_chunks`, `user_conversations`, `user_summaries`)
- Seeds 38 Blackstone knowledge documents
- Connects to RabbitMQ and starts the chat worker

The API listens on **http://localhost:5187**.

### 4. Configure the frontend

Add to `.env.local` in the project root:

```env
NEXT_PUBLIC_DOTNET_URL=http://localhost:5187
```

### 5. Start the frontend

```bash
npm install
npm run dev
```

Open http://localhost:3000 and click **Ask Blackstone**.

---

## Project Structure

```
├── app/                             # Next.js pages — UI only
├── components/
│   ├── ChatWidget.tsx               # Chat UI — calls .NET directly
│   └── ...                          # Hero, Navbar, Footer, etc.
├── backend/
│   └── BlackstoneAI/
│       ├── Controllers/
│       │   ├── ChatController.cs    # POST /api/chat
│       │   └── HistoryController.cs # GET  /api/history
│       ├── Services/
│       │   ├── ChatQueueService.cs  # RabbitMQ RPC (publish + await reply)
│       │   ├── RetrievalService.cs  # Keyword search over knowledge_chunks
│       │   ├── MemoryService.cs     # Sliding-window conversation memory
│       │   ├── DeepSeekClient.cs    # LLM + summarisation calls
│       │   └── KnowledgeSeeder.cs   # Auto-seeds 38 chunks on first run
│       ├── Workers/
│       │   └── ChatWorker.cs        # RabbitMQ consumer — AI pipeline
│       ├── Models/
│       │   └── ChatModels.cs        # Request/response records
│       ├── Program.cs
│       └── .env                     # Backend secrets (not committed)
└── docker-compose.yml               # Postgres + RabbitMQ
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
