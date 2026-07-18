# Critérios de aceitação visual

## Fonte de verdade

Compare o aplicativo com:

- `demeter-carbono-light.png` para o tema claro;
- `demeter-carbono-dark.png` para o tema escuro.

A comparação deve ser feita em 1080x2400 ou resolução equivalente, escala 1x e fonte do sistema em 100%.

## Regras globais

- Diferença estrutural máxima: nenhum componente principal ausente ou em ordem diferente.
- Navegação inferior com cinco itens, ícone acima do rótulo e item ativo em neon.
- Cabeçalhos não ultrapassam duas linhas.
- Cartões usam borda visível e sombra baixa no claro; borda e luminância no escuro.
- CTA primário ocupa largura quase total e possui borda escura no claro e halo controlado no escuro.
- Nenhum parágrafo longo na tela principal.
- Nenhum texto fictício ou palavra deformada.
- O mapa ocupa a maior parte da tela de delimitação.
- A folha inferior do mapa não pode esconder mais de 38% da altura útil quando recolhida.

## Modo claro

- Fundo predominantemente branco/gelo.
- Verde escuro no cartão de resumo.
- Neon usado em CTA, gráfico, status positivo e geometria.
- Contorno escuro reforça o neon; não usar sombra cinza genérica pesada.

## Modo escuro

- Fundo preto com leve matiz verde.
- Cartões diferenciados por luminância e borda, não apenas sombra.
- Texto primário quase branco; texto secundário nunca cinza de baixo contraste.
- Halo neon limitado a até 12 px visuais em CTA e polígono.
- Fotos e satélite recebem overlay escuro para preservar legibilidade.

## Estados obrigatórios

- carregando;
- vazio;
- erro de rede;
- offline;
- permissão de localização negada;
- área inválida;
- sincronização pendente;
- tema claro, escuro e sistema;
- fonte do sistema em 130%;
- redução de movimento.

## Evidência de conclusão

Salvar em `artifacts/validation/`:

- `home-light.png`, `home-dark.png`;
- `map-light.png`, `map-dark.png`;
- `passport-light.png`, `passport-dark.png`;
- `visual-diff-report.md` com observações e desvios conhecidos;
- saída de lint, typecheck e testes.
