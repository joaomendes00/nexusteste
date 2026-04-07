# Nexus

Sistema de processamento e revisão de documentos com IA.

## Pré-requisitos

- Docker e Docker Compose
- Python 3.12+
- Node.js 20+

## Setup rápido

### 1. Subir os serviços de infraestrutura

```bash
docker compose up -d
```

Isso inicia o PostgreSQL (porta 5432), Redis (porta 6379) e Adminer (porta 8080).

### 2. Backend

```bash
cd nexus/backend
cp .env.example .env
# Edite o .env com suas chaves reais

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

uvicorn app.main:app --reload
```

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
│   │   ├── database.py      # SQLAlchemy async
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
├── docker-compose.yml
└── README.md
```

## Acessos

| Serviço   | URL                     |
| --------- | ----------------------- |
| Frontend  | http://localhost:5173    |
| Backend   | http://localhost:8000    |
| Adminer   | http://localhost:8080    |
| Postgres  | localhost:5432           |
| Redis     | localhost:6379           |
