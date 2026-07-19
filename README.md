# Demeter Carbono

Aplicativo mobile para organização e triagem de propriedades candidatas a projetos de restauração florestal e agrofloresta, com rastreabilidade científica e operacional.

## Sobre o projeto

O Demeter Carbono é uma ferramenta de triagem preliminar, não de certificação. Ele organiza propriedades rurais, documenta características de uso do solo e gera um **Passaporte de Carbono** com indicadores de elegibilidade para futuras análises técnicas.

Nenhum valor exibido no app representa crédito de carbono emitido, certificado ou disponível para negociação.

## O que o app faz

- Painel com lista de propriedades e status de triagem
- Cadastro e delimitação de área em mapa satélite
- Triagem preliminar baseada em critérios objetivos (uso do solo, documentação, histórico)
- Passaporte de Carbono com elegibilidade, pendências e progresso
- Modo claro e escuro com alternância automática
- Funcionamento offline com sincronização posterior

## Estrutura

```
apps/mobile/        Expo + React Native (Android/iOS)
services/api/       Backend FastAPI com domínio auditável
scientific/         Governança científica e metodologias de referência
design/             Referências visuais, tokens e especificações
infra/              Infraestrutura local (PostgreSQL/PostGIS via Docker)
scripts/            Scripts de validação e build (Windows)
packages/           Contratos e schemas compartilhados
docs/               Arquitetura, produto e documentação técnica
```

## Como rodar localmente

### Pré-requisitos

- Node.js 20+
- Python 3.12+
- Docker Desktop
- Expo CLI / EAS CLI

### Mobile

```bash
cd apps/mobile
npm install
npx expo start
```

### Backend + banco de dados

```bash
cd infra
docker-compose up -d

cd ../services/api
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload
```

## Validação

```bash
# Mobile
cd apps/mobile && npm run validate

# API
cd services/api && pytest && ruff check . && mypy app

# Tudo no Windows
scripts\validate-all.bat
```

## Guardrails científicos

As metodologias de quantificação de carbono referenciadas neste projeto (VM0047, IPCC 2006 AFOLU) estão listadas como **referência** e permanecem com `enabled_for_credit_calculation: false` até implementação completa com revisão técnica independente.

Veja `scientific/SCIENTIFIC_GUARDRAILS.md` para os limites do que o MVP pode e não pode afirmar.

## Licença

Projeto proprietário. Todos os direitos reservados.
