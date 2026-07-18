# AGENTS.md — Demeter Carbono

## Missão

Construir um aplicativo mobile de alta fidelidade visual, instalável por APK, que organize propriedades candidatas a projetos coletivos de restauração/agrofloresta com rastreabilidade científica e operacional.

## Prioridade das fontes de verdade

1. Segurança, legislação e guardrails científicos.
2. Contratos de domínio e testes.
3. Referências visuais em `design/references/`.
4. Especificações em `design/specs/`.
5. Código atual.

Quando o código divergir das referências, corrija o código. Quando a imagem tiver texto cientificamente indevido, preserve o layout e corrija a mensagem.

## Regras de trabalho

- Antes de editar, apresente plano curto e critérios de conclusão.
- Faça mudanças em ondas pequenas e verificáveis.
- Não deixe TODO silencioso: registre em `docs/KNOWN_GAPS.md`.
- Use screenshots reais do app para validar interface.
- Não declare “igual à referência” sem comparação lado a lado e checklist.
- Atualize documentação, changelog e testes ao mudar comportamento.
- Não use `any` sem justificativa local.
- Não use valores mágicos de cor, raio, espaçamento ou tipografia fora dos tokens.
- Não adicione bibliotecas de UI genéricas que descaracterizem o design.
- Prefira componentes próprios e ícones consistentes.

## Regras científicas

- Triagem não é certificação.
- Cenário não é crédito.
- Remoção estimada não é unidade emitida.
- Não invente fator, curva, baseline ou taxa de crescimento.
- Todo cálculo deve carregar `methodology_id`, versão, fonte, unidades, data, entradas, saída, incerteza e hash.
- Carbono só pode ser quantificado quando o módulo metodológico correspondente estiver `enabled: true` e tiver revisão técnica registrada.
- Adicionalidade, permanência, vazamento, titularidade, dupla contagem e salvaguardas são portas independentes.
- Alterações em `scientific/` exigem atualização do `REVIEW_LOG.md`.

## Regras visuais

- O neon é acento, não fundo permanente.
- Modo claro: branco/gelo, texto verde-preto, cartões brancos, neon concentrado em CTA e geometrias.
- Modo escuro: preto esverdeado, superfícies grafite, texto claro, contorno verde profundo e brilho neon controlado.
- A densidade deve lembrar aplicativo financeiro/mapa premium, não landing page.
- Textos curtos, naturais e operacionais.
- Área tocável mínima de 44x44 pt/dp.
- Respeitar redução de movimento e aumento de fonte.

## Comandos

- Mobile: `cd apps/mobile && npm run validate`
- API: `cd services/api && pytest && ruff check . && mypy app`
- Tudo no Windows: `scripts\\validate-all.bat`
- APK: `scripts\\build-apk.bat`
