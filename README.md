<!-- Project overview and local setup instructions. -->
# Vasooli Agent

Vasooli Agent is a voice-first collections assistant for Indian MSMEs. It captures invoices in Hindi, preserves buyer intent, watches the MSMED payment timeline, verifies payments, and prepares a Samadhaan complaint draft when an invoice remains unpaid.

```
vasooli-agent/
├── README.md
├── .env.example
├── shared/
├── frontend/
├── backend/
└── orchestration/
    ├── workflows/
    ├── demo/
    ├── breeth/
    └── dodo/
```

## Local backend setup

```bash
cd backend
npm install
cp ../.env.example .env
# edit .env → set DATABASE_URL to a local Postgres or Render's external URL
# schema is applied automatically on server startup
npm run seed
npm run dev
```

## Local frontend setup

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:10000" > .env.local
npm run dev
```

## Deploy to Render

1. Push the repo to GitHub.
2. On Render, select **New → Blueprint** and connect the repository.
3. Render reads `render.yaml` and provisions the backend, frontend, and Postgres in one pass.
4. Set the `sync: false` secrets (ElevenLabs, Dodo, Breeth keys) in the Render dashboard.

Import the n8n workflow JSON files from `orchestration/workflows/`, then create credentials named `Vasooli Backend API`, `Breeth MCP`, and `ElevenLabs API`.
