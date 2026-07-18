# API, persistência e auditoria

## Princípios

- UUID em todas as entidades públicas.
- Geometrias em SRID 4326; operações de área devem transformar para projeção apropriada ou usar função geodésica documentada.
- Cada alteração de perímetro cria uma nova versão, nunca sobrescreve silenciosamente.
- Anexos carregam SHA-256 e metadados de captura.
- Operações mutáveis aceitam `Idempotency-Key`.
- Sincronização usa versão otimista e outbox no mobile.
- Eventos de auditoria são append-only e encadeados por hash quando implementados.

## Estados de resultado

`screening → scenario → estimate → verified → issued`

A API deve rejeitar qualquer transição que pule revisão e gates. `issued` exige referência a registro externo e não será implementado no MVP.
