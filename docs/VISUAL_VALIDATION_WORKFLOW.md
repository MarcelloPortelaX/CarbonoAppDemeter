# Fluxo de validação visual

1. Rode o app em Android com resolução estável.
2. Force tema claro e capture Início, Mapa e Passaporte.
3. Force tema escuro e repita.
4. Salve os seis arquivos em `artifacts/validation/`.
5. Rode `scripts/visual_diff.py` contra os recortes `*-screen.png`.
6. Abra lado a lado; a nota de pixels é apenas um sinal, não um aceite automático.
7. Preencha `visual-diff-report.md` com diferenças estruturais, textuais e de contraste.
8. Só marque concluído após corrigir elementos ausentes, densidade, tamanhos e copy.
