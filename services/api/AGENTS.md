# API AGENTS — Demeter Carbono

- Regras de domínio devem ser determinísticas, versionadas e cobertas por testes.
- Separe HTTP, aplicação, domínio e persistência.
- Geometria entra como GeoJSON EPSG:4326; medidas derivadas pelo servidor devem registrar CRS, algoritmo e unidade.
- Eventos de auditoria são append-only e encadeados por hash quando aplicável.
- Mudanças de esquema exigem migrations Alembic.
- Nunca aceite uma saída do cliente como cálculo científico autoritativo.
- Um cálculo deve armazenar metodologia, versão, módulo, inputs, unidades, fontes, hipóteses, incerteza, software, timestamp e hash.
- Quantificação pública permanece bloqueada enquanto `calculation_enabled` for falso ou qualquer integrity gate obrigatório estiver pendente.
- `verified` e `issued` exigem evidência de terceira parte/registro e não podem ser atribuídos pelo próprio aplicativo.
- Rode `pytest`, `ruff check .` e `mypy app` antes de concluir.
