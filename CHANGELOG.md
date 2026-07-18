# Changelog

## 0.2.0 — 2026-07-18

- Código, especificações, contratos e guardrails sincronizados a partir do pacote mestre `DemeterCarbono 2`.
- Redesenho completo inspirado nas referências oficiais em temas claro e escuro, com tokens reutilizáveis, navegação de cinco abas e rota de inspeção do design system.
- Símbolo principal substituído pela arte fornecida pelo proprietário e aplicado ao ícone, adaptive icon, splash, cabeçalho, resumo, passaporte e perfil.
- Novo fluxo funcional Dashboard → Cadastro offline → Delimitação no mapa → Passaporte preliminar.
- Estado mobile persistente com fila local de sincronização, busca, filtros, alertas e tratamento de estados vazios/rotas inválidas.
- Área, perímetro e cruzamento de polígonos calculados e testados no aparelho; confirmação inválida é bloqueada.
- Passaporte criado pelo usuário permanece com quantificação bloqueada. Valores `tCO₂e` só aparecem no cenário explicitamente marcado `DEMO`.
- Compartilhamento inclui automaticamente a ressalva científica e não apresenta triagem como emissão ou certificação.
- Compatibilidade alinhada ao Expo SDK 57 e versão mobile elevada para `0.2.0`.
- APK Android `preview` compilado e assinado no Expo/EAS pelo build `1a6035ff-f556-4340-af08-d9000c2067f3`.

## 0.1.0

- Primeira base de triagem, passaporte e backend em memória.
