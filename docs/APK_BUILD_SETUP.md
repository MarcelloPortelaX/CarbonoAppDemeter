# Configuração do Workflow de Build de APK

Este documento lista os segredos (Secrets) que precisam ser configurados no repositório GitHub para o funcionamento correto das Actions de CI e Build do Demeter Carbono.

## Secrets Obrigatórios (Repository Secrets)

Para configurar esses segredos, vá até:
**Settings > Secrets and variables > Actions > New repository secret**

1. **`EXPO_TOKEN`**
   - **Descrição**: Token de acesso à conta do Expo para o download e execução do EAS CLI.
   - **Como obter**: No painel do Expo (expo.dev), vá em *Account settings > Access tokens* e gere um novo token.

2. **`EXPO_PUBLIC_API_URL`**
   - **Descrição**: URL do backend para apontamento do aplicativo (ex: `https://api.demeter.com/api/v1`).
   - **Como obter**: Defina com a URL pública de onde o servidor está hospedado. Se não for definido, será feito fallback para o localhost/offline mode.

3. **`APK_EMAIL_SENDER`**
   - **Descrição**: Endereço de e-mail (Gmail) que será utilizado como remetente das notificações de build do APK.
   - **Como obter**: Use um e-mail do Gmail válido.

4. **`APK_EMAIL_APP_PASSWORD`**
   - **Descrição**: Senha de Aplicativo gerada na conta Google do e-mail remetente.
   - **Como obter**: Na conta Google do remetente, ative a Verificação em Duas Etapas e crie uma Senha de Aplicativo específica para este fim. **Não** é a senha da conta.

## Como gerar o APK manualmente

Se precisar rodar o build no seu computador:
1. Instale o Java 17 e o Android Studio/SDK.
2. Na pasta `apps/mobile`:
   ```bash
   npm install -g eas-cli
   eas build -p android --profile preview --local
   ```
O APK será salvo localmente.
