# Arquitetura alvo

```text
Android/iOS — Expo / React Native
├── Expo Router e tabs
├── Design system Demeter dual-theme
├── Store de sessão e domínio local
├── Storage versionado + outbox
├── Mapas, perímetros e evidências
└── API client idempotente
            │ HTTPS / JSON / uploads assinados
FastAPI
├── API e autenticação
├── application services
├── domínio puro
│   ├── triagem
│   ├── gates de integridade
│   ├── passaporte
│   └── proveniência de cálculo
├── repositories
├── auditoria append-only
└── registry científico versionado
            │
PostgreSQL + PostGIS
├── organizações e usuários
├── propriedades
├── versões de perímetro
├── evidências e checksums
├── assessments e passports
├── calculation_runs
├── sync_operations
└── audit_events
            │
Object storage
└── fotos, documentos e exportações
```

## Fronteiras

### Mobile

O mobile pode operar em modo demonstração sem API. Mutações reais entram em outbox, recebem UUID no dispositivo e são reenviadas com idempotência. Documentos sensíveis não devem ser armazenados em AsyncStorage.

### API

A API coordena autorização, persistência, regras de domínio e trilha de auditoria. Equações científicas permanecem em módulos isolados e versionados; endpoints não contêm lógica de cálculo.

### Ciência

`scientific/` é código regulado internamente. Toda fonte possui identificador; toda metodologia possui estado e flag explícita de cálculo. A UI lê o nível de maturidade e adapta a alegação.

## Decisões técnicas

- Expo Router para navegação declarativa e build Android/iOS.
- TypeScript estrito e contratos Zod/JSON Schema.
- FastAPI/Pydantic para OpenAPI e validação.
- SQLAlchemy async e PostGIS para geometrias e versionamento.
- Outbox e optimistic concurrency para campo offline.
- SHA-256 para integridade de entradas e anexos; não é assinatura digital.
- Correlation ID em cada requisição e evento.

## Não negociável

- Nenhuma alteração destrutiva de perímetro sem nova versão.
- Nenhum resultado científico sem proveniência.
- Nenhuma transição para `verified` ou `issued` feita somente pelo aplicativo.
- Nenhum segredo no bundle mobile.
