# Validação científica e metodológica

## Escopo do MVP

O MVP faz triagem, organização de evidências e preparação de dados. A quantificação certificável permanece bloqueada até que uma metodologia aplicável seja implementada, testada e revisada por especialista independente.

## Bases oficiais registradas

- **IPCC 2006, Volume 4 AFOLU**, usado como base geral para representação de terras, estoques e mudanças de carbono.
- **Refinamento IPCC 2019**, que atualiza e complementa as Diretrizes de 2006 sem substituí-las.
- **Verra VM0047 v1.1**, aplicável a atividades de florestamento, reflorestamento e revegetação, com abordagens por área e por censo.
- **VCS versão 5**, com transição de requisitos conforme data de início do projeto.
- **ISO 14064-2:2019**, referência program-neutral para quantificação, monitoramento, relato e qualidade de dados em projetos.
- **ICVCM Core Carbon Principles**, especialmente adicionalidade, permanência, quantificação robusta e ausência de dupla contagem.
- **Lei brasileira 15.042/2024**, que institui o SBCE; o aplicativo não deve presumir que um crédito voluntário seja automaticamente ativo fungível no sistema regulado.

## Hierarquia de resultados

1. `screening`: triagem não quantitativa.
2. `scenario`: exercício de planejamento com hipóteses explícitas.
3. `estimate`: estimativa metodológica com incerteza e revisão.
4. `verified`: resultado verificado por terceira parte, fora do controle exclusivo do app.
5. `issued`: unidade emitida em registro, fora do escopo do MVP.

## Requisitos de qualquer cálculo

- limites espaciais e temporais;
- cenário de linha de base;
- fontes, sumidouros e reservatórios incluídos/excluídos;
- dados de atividade;
- fatores e equações versionados;
- unidades SI e conversões explícitas;
- análise de incerteza;
- tratamento conservador;
- avaliação de vazamento e risco de reversão quando aplicável;
- trilha completa de auditoria.

## Proibição

Nunca calcular `tCO2e = hectares × fator genérico` como resultado de produto. Uma aproximação assim pode existir apenas em teste interno nomeado `toy_model`, não exibido ao usuário.
