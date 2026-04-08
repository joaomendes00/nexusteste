# Nexus

Sistema de processamento e revisão de documentos com IA.

## Pré-requisitos

- Python 3.12+
- Node.js 20+
- Ollama instalado (`curl -fsSL https://ollama.com/install.sh | sh`)

## Setup rápido

### 1. Setup com Ollama

Baixe o modelo de IA:

```bash
ollama pull qwen2.5:7b
```

Aguarde o download (~4.7GB). Para verificar se o modelo está disponível:

```bash
ollama list
```

### 2. Backend

```bash
cd nexus/backend
cp .env.example .env

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

uvicorn app.main:app --reload
```

O banco SQLite (`nexus.db`) é criado automaticamente na primeira execução.
O backend estará disponível em `http://localhost:8000`.

### 3. Frontend

```bash
cd nexus/frontend
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:5173`.

## Estrutura do projeto

```
nexus/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app
│   │   ├── config.py        # Configurações (pydantic-settings)
│   │   ├── database.py      # SQLAlchemy async (SQLite)
│   │   ├── models/          # Modelos do banco
│   │   ├── schemas/         # Schemas Pydantic
│   │   ├── routers/         # Endpoints da API
│   │   └── services/        # Lógica de negócio
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Rotas da aplicação
│   │   ├── main.jsx         # Entry point
│   │   ├── components/      # Componentes React
│   │   ├── pages/           # Páginas
│   │   ├── services/        # Cliente API (axios)
│   │   └── store/           # Estado global
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── docker-compose.yml        # Opcional (Ollama via Docker)
└── README.md
```

## Acessos

| Serviço   | URL                     |
| --------- | ----------------------- |
| Frontend  | http://localhost:5173    |
| Backend   | http://localhost:8000    |
| Ollama    | http://localhost:11434   |
