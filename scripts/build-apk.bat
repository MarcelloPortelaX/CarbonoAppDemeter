@echo off
setlocal
cd /d "%~dp0\.."
call scripts\validate-all.bat
if errorlevel 1 exit /b 1
cd apps\mobile

echo O perfil preview gera APK instalavel diretamente no Android.
echo O EAS exigira login e podera criar credenciais de assinatura.
call npx eas-cli@latest login
if errorlevel 1 exit /b 1
call npx eas-cli@latest build:configure
if errorlevel 1 exit /b 1
call npx eas-cli@latest build --platform android --profile preview
endlocal
