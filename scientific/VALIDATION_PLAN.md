# Plano de validação

## Etapa 1 — Validação do produto

- Conferir se perguntas são compreendidas por proprietários e técnicos.
- Medir consistência entre triagens repetidas.
- Verificar se motivos e pendências são explicáveis.

## Etapa 2 — Validação geoespacial

- Comparar polígonos desenhados com limites de referência.
- Definir tolerância de GPS e procedimento de correção.
- Registrar CRS, datum, resolução e origem de cada camada.

## Etapa 3 — Validação metodológica

- Selecionar uma metodologia e versão específicas.
- Criar matriz requisito → dado → cálculo → evidência → teste.
- Implementação independente revisada por especialista.
- Conjunto de casos conhecidos e cálculo paralelo.
- Bloqueio de release se resultados divergirem além da tolerância aprovada.

## Critério de passagem do MVP

O MVP passa sem quantificação certificável quando a triagem é determinística, versionada, testada e claramente rotulada como preliminar.
