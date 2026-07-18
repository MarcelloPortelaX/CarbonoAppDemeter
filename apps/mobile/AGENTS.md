# Mobile AGENTS — Demeter Carbono

## Fonte visual obrigatória

- `../../design/references/demeter-carbono-light.png`
- `../../design/references/demeter-carbono-dark.png`
- recortes em `../../design/references/screens/`
- especificações em `../../design/specs/`

O código inicial é uma base, não a aprovação final. Reproduza hierarquia, proporções, densidade, cartões, navegação, mapa, folha inferior e comportamento dos dois temas. Corrija textos deformados ou cientificamente indevidos das imagens sem alterar o fluxo.

## Regras

- Preserve Android via Expo SDK compatível e mantenha iOS viável.
- Use componentes em `src/components` e tokens em `src/theme`; não espalhe cores ou métricas literais.
- O modo escuro deve possuir superfícies e glows próprios; não use inversão automática simples.
- Persistência local e fila de sincronização não podem depender da UI.
- Não solicite login no fluxo demonstração.
- Toda informação de carbono deve declarar o estágio: triagem, cenário, estimativa, verificado ou emitido.
- O valor visual de `2.850 tCO₂e` só pode aparecer com selo `DEMO`/`Cenário demonstrativo` enquanto a quantificação estiver bloqueada.
- Use `accessibilityLabel`, área mínima de 44 dp, contraste adequado e suporte a fonte 130%.
- Gere screenshots reais e use `scripts/visual_diff.py`; não declare paridade apenas por inspeção do código.
- Rode `npm run validate`, `npm run doctor` e o checklist de screenshots antes de concluir.
