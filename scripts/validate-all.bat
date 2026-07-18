@echo off
setlocal
cd /d "%~dp0\.."

echo [API] Testes e qualidade
call services\api\.venv\Scripts\activate.bat
cd services\api
python -m pytest
if errorlevel 1 exit /b 1
ruff check .
if errorlevel 1 exit /b 1
cd ..\..

echo [MOBILE] Sintaxe, tipos, lint e testes
node scripts\validate-ts-syntax.cjs
if errorlevel 1 exit /b 1
cd apps\mobile
call npm run validate
if errorlevel 1 exit /b 1
call npx expo-doctor
if errorlevel 1 exit /b 1
cd ..\..

echo [ARQUIVOS] JSON e YAML
python scripts\validate-project-files.py
if errorlevel 1 exit /b 1

echo Tudo validado.
endlocal
