# Infraestrutura local

Com Docker Desktop instalado:

```bash
docker compose -f infra/docker-compose.yml up --build
```

API: `http://localhost:8000/docs`

O repositório inicial usa memória na API para execução imediata. A onda de backend do Codex deve ativar PostGIS e Alembic.
