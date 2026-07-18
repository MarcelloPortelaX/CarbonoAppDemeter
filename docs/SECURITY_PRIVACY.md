# Segurança, privacidade e LGPD — requisitos de engenharia

## Riscos principais

- exposição de localização rural e geometrias;
- acesso indevido entre organizações (IDOR);
- documentos de posse e dados pessoais em logs;
- adulteração de evidência;
- credenciais no bundle mobile;
- uploads maliciosos;
- falsa atribuição de titularidade ambiental.

## Controles mínimos

- autenticação OIDC/OAuth2 em produção;
- RBAC e checagem de organização em toda consulta;
- URLs assinadas e expiração curta para anexos;
- allowlist MIME, limite de tamanho e varredura;
- SHA-256 de anexos, tamanho e metadata de captura;
- SecureStore para tokens; AsyncStorage apenas para dados não secretos;
- TLS e banco criptografado pelo provedor;
- logs estruturados sem tokens, documentos ou geometria completa;
- rate limit e proteção contra enumeração;
- retenção e finalidade documentadas;
- exportação, correção e exclusão conforme política aprovada.

## Mobile

O APK de demonstração não deve aceitar documento pessoal real. A tela deve indicar ambiente `demo`/`preview` quando não houver backend de produção.

## Auditoria

Eventos relevantes incluem login, criação, revisão de perímetro, upload, triagem, alteração de gate, cálculo e compartilhamento. Auditoria não deve ser editável por usuários comuns.
