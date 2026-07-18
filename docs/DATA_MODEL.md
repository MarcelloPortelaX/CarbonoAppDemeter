# Modelo de dados

## Núcleo

### Organization

Representa cooperativa, consultoria, projeto ou instituição. Define fronteira de autorização.

### User

Usuário vinculado a uma ou mais organizações e papéis.

### Property

Identidade estável da área. Nome, município e uso declarado são versionáveis por eventos.

### BoundaryVersion

Versão imutável do polígono/multipolígono, SRID, área, perímetro, hash e autor. Uma propriedade possui várias versões e uma versão ativa.

### Evidence

Foto, documento, arquivo geográfico, dado remoto ou declaração. Guarda tipo, hash, origem, data de captura, coordenadas quando aplicável e política de retenção.

### Assessment

Execução de triagem por ruleset versionado. Contém entradas canônicas, hash, resultado, motivos e pendências.

### IntegrityGateSet

Estados independentes para aplicabilidade, direitos, baseline, adicionalidade, vazamento, permanência, quantificação, dupla contagem, salvaguardas e verificação externa.

### Passport

Visão consolidada para o usuário. Não substitui PDD, relatório de monitoramento ou registro certificador.

### CalculationRun

Execução reprodutível de módulo científico. Guarda método, versão, commit, entradas, unidades, saídas, incerteza, fontes e revisão.

### AuditEvent

Evento append-only de ação relevante. Deve ser consultável por entidade, ator, tempo e correlation ID.

### SyncOperation

Operação enviada pelo dispositivo, com idempotency key, base version, estado e erro.

## Regras

- IDs públicos são UUID.
- Datas são UTC com timezone.
- Unidades científicas são explícitas e preferencialmente SI.
- Geometria de origem é preservada; áreas derivadas guardam método/projeção.
- Exclusão lógica não apaga trilha de auditoria; políticas legais de eliminação precisam de desenho próprio.
