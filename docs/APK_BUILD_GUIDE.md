# Gerar o APK instalável

## Pré-requisitos

- Node.js compatível com o Expo definido em `apps/mobile/package.json`;
- conta Expo/EAS;
- Android físico com instalação de fontes externas autorizada;
- credenciais apenas no ambiente local/EAS, nunca no repositório.

## Preparação

```bat
scripts\setup-windows.bat
```

Copie `apps/mobile/.env.example` para `.env`. Em aparelho físico, use o IP da rede local para alcançar a API. O modo demonstração deve funcionar sem backend.

## Validação anterior ao build

```bat
scripts\validate-all.bat
```

Depois execute o app, capture as seis telas previstas e compare-as com `design/references/` conforme `docs/VISUAL_VALIDATION_WORKFLOW.md`. Não gere release com tela principal divergente, texto deformado ou alegação científica indevida.

## APK interno

```bat
scripts\build-apk.bat
```

O perfil `preview` de `apps/mobile/eas.json` usa `android.buildType = apk`. A primeira execução deve autenticar no Expo, criar/vincular o projeto EAS e substituir o `projectId` fictício.

## Instalação

1. Abra o link do build concluído no Android.
2. Baixe o APK.
3. Autorize a instalação para a fonte usada.
4. Instale e teste os modos claro, escuro e sistema.

## Loja

Use o perfil `production` para AAB. Antes da publicação, configure assinatura, política de privacidade, exclusão/exportação de dados, URLs de suporte e revisão legal/científica.
