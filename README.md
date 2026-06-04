# Blackstone Clone — RAG-Integrated Website

A pixel-faithful clone of the [Blackstone](https://blackstone.com) website, extended with a fully functional **Retrieval-Augmented Generation (RAG) chat assistant** that lets visitors ask natural-language questions about the firm and receive grounded, accurate answers in real time.

---

## ✨ Features

| Area | Details |
|---|---|
| **Website Clone** | Hero, Navbar, Stats, What We Do, Earnings, Insights, Private Wealth, Newsletter, Footer — all matching Blackstone's design language |
| **RAG Chat Widget** | Floating "Ask Blackstone" button → 560 px chat panel with streaming responses |
| **Dual Retrieval Modes** | **Vector search** (pgvector cosine similarity) when an embed provider is configured; **keyword scoring** as a zero-config default |
| **Streaming LLM** | DeepSeek `deepseek-chat` via OpenAI-compatible API, streamed token-by-token to the client |
| **Knowledge Base** | ~40 hand-authored chunks covering AUM, funds (BREIT, BPP, BCP…), leadership, ESG, and more |
| **Ingest API** | Protected `POST /api/ingest` endpoint for adding new chunks at runtime |
| **Seed Script** | One-command database population with `npm run seed` |

---

## 🏗️ Architecture

```
User Browser
    │
    ▼
Next.js 16 (App Router)
    ├── /app/page.tsx          → Landing page (all sections)
    ├── /app/api/chat          → Streaming RAG chat endpoint
    └── /app/api/ingest        → Knowledge chunk ingest endpoint
    │
    ├── /components/
    │   ├── ChatWidget.tsx     → Floating chat UI (streaming, suggested prompts)
    │   ├── Hero.tsx           → Hero section
    │   ├── Navbar.tsx         → Top navigation
    │   ├── Stats.tsx          → AUM / key metrics bar
    │   ├── WhatWeDo.tsx       → Strategy cards
    │   ├── Earnings.tsx       → Earnings highlights
    │   ├── Insights.tsx       → Insights/articles section
    │   ├── PrivateWealth.tsx  → Private wealth section
    │   ├── Newsletter.tsx     → Email subscription form
    │   └── Footer.tsx         → Site footer
    │
    └── /lib/
        ├── db.ts              → PostgreSQL pool (Neon-compatible)
        ├── embeddings.ts      → OpenAI-compatible embed client
        ├── knowledge.ts       → Static knowledge-base content (~40 chunks)
        ├── llm.ts             → DeepSeek streaming chat client
        └── retrieval.ts       → Vector & keyword retrieval logic
```

### RAG Flow

```
User Question
     │
     ▼
POST /api/chat
     │
     ├── retrieve(query, topK=6)
     │       ├─ [Vector mode]   embed(query) → pgvector cosine search
     │       └─ [Keyword mode]  TF-style term scoring across all chunks
     │
     ├── buildContext(chunks) → numbered context block
     │
     └── streamChat(messages, context)
             │
             └── DeepSeek API (SSE) → streamed to browser
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** database (e.g. [Neon](https://neon.tech) free tier)
- **DeepSeek API key** — [platform.deepseek.com](https://platform.deepseek.com)
- *(Optional)* An OpenAI-compatible **embedding endpoint** for vector search

### 1. Clone & Install

```bash
git clone https://github.com/CommonCapital/RAG-system-integrated-in.git
cd RAG-system-integrated-in
npm install
```

### 2. Configure Environment

Copy the example below into `.env.local` and fill in your values:

```env
# ── PostgreSQL (Neon recommended) ────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# ── Chat LLM — DeepSeek ──────────────────────────────────────────────────────
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_CHAT_MODEL=deepseek-chat

# ── Embeddings (optional — enables vector search) ────────────────────────────
# Leave blank to use the built-in keyword retrieval (no extra cost / setup)
EMBED_API_URL=https://api.openai.com/v1/embeddings
EMBED_API_KEY=sk-...
EMBED_API_MODEL=text-embedding-3-small

# ── Ingest API protection ────────────────────────────────────────────────────
INGEST_API_KEY=change-me-to-a-secret
```

### 3. Seed the Database

This creates the `knowledge_chunks` table and inserts all built-in content:

```bash
npm run seed
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **"Ask Blackstone"** in the bottom-right corner.

---

## 🔍 Retrieval Modes

The system automatically selects the best available retrieval strategy:

| Mode | Trigger | How it works |
|---|---|---|
| **Vector (pgvector)** | `EMBED_API_URL` + `EMBED_API_KEY` both set | Embeds the query, runs cosine similarity search in Postgres |
| **Keyword (default)** | No embed provider configured | TF-style term scoring with exact-phrase bonus; no extra cost |

To enable vector search, set the embedding env vars and run:

```sql
-- In your Postgres database
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS embedding vector(1536);
```

Then re-seed to populate the `embedding` column.

---

## 📡 API Reference

### `POST /api/chat`

Streams a RAG-grounded response.

**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "What is BREIT?" }
  ]
}
```

**Response:** `text/plain` stream (raw token chunks).

---

### `POST /api/ingest`

Adds a new knowledge chunk to the database.

**Headers:** `x-api-key: <INGEST_API_KEY>`

**Request body:**
```json
{
  "source": "blackstone.com/breit",
  "category": "real-estate",
  "content": "BREIT is Blackstone's non-traded REIT..."
}
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Components) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Icons | [Lucide React](https://lucide.dev) |
| Database | PostgreSQL via [`pg`](https://node-postgres.com) (Neon-compatible) |
| Vector Search | [pgvector](https://github.com/pgvector/pgvector) *(optional)* |
| LLM | [DeepSeek](https://deepseek.com) (`deepseek-chat`) |
| Embeddings | Any OpenAI-compatible endpoint *(optional)* |

---

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── chat/route.ts       # Streaming RAG endpoint
│   │   └── ingest/route.ts     # Knowledge ingestion endpoint
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # Main landing page
├── components/                 # All UI sections + ChatWidget
├── lib/
│   ├── db.ts                   # DB pool & schema init
│   ├── embeddings.ts           # Embed API client
│   ├── knowledge.ts            # Built-in knowledge base (~40 chunks)
│   ├── llm.ts                  # DeepSeek streaming client
│   └── retrieval.ts            # Retrieval logic (vector + keyword)
├── scripts/
│   └── seed.ts                 # Database seeding script
└── .env.local                  # Environment variables (not committed)
```

---

## ⚠️ Disclaimer

This project is built for **educational and demonstration purposes only**. It is not affiliated with, endorsed by, or connected to Blackstone Inc. in any way. Nothing on this site constitutes investment advice.

---

## 📄 License

MIT
