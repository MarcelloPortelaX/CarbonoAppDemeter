# Tela 3 — Passaporte de Carbono

## Estrutura

1. Cabeçalho `Passaporte de Carbono` e compartilhar.
2. Cartão de identidade da propriedade com símbolo e status.
3. Cartão de potencial preliminar/cenário.
4. Cartão de elegibilidade.
5. Cartão de pendências.
6. Linha de progresso.

## Regra científica de UI

O cartão de potencial deve obedecer ao estado do cálculo:

- `blocked`: mostrar `Quantificação ainda não habilitada`;
- `demo`: mostrar valor com selo `Cenário demonstrativo`;
- `screening`: mostrar faixa e incerteza, nunca crédito;
- `validated`: só após revisão registrada e metodologia ativa;
- `issued`: fora do escopo do MVP e dependente de registro externo.

O texto `Elegível` significa apenas elegibilidade à próxima análise de triagem, não elegibilidade definitiva a crédito.
