# Tela 2 — Delimitar área

## Estrutura

- cabeçalho com nome e município;
- mapa satélite/dark map;
- chips `Satélite` e `Camadas`;
- polígono neon com vértices circulares;
- botões flutuantes: localizar, adicionar, desfazer;
- bottom sheet com área, perímetro, vértices, editar e confirmar.

## Geometria

- Calcular área geodésica; não usar área plana em latitude/longitude.
- Impedir auto-interseção antes da confirmação.
- Exibir unidade em hectares e perímetro em km.
- A área é um dado geográfico, não uma estimativa de carbono.

## Visual

- Stroke do polígono neon de 3 dp com contorno escuro/halo separado.
- Fill entre 10% e 18% de opacidade.
- Vértices com centro branco ou superfície e anel neon.
- No escuro, aplicar estilo de mapa escuro e reduzir saturação.
