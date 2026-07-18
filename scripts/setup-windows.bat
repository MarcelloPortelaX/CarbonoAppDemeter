@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0\.."

echo [1/5] Verificando ferramentas...
where python >nul 2>nul || (echo Python nao encontrado. & exit /b 1)
where node >nul 2>nul || (echo Node.js nao encontrado. & exit /b 1)

if not exist services\api\.venv (
  echo [2/5] Criando ambiente Python...
  python -m venv services\api\.venv
) else (
  echo [2/5] Ambiente Python existente.
)
call services\api\.venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -e "services\api[dev]"

echo [3/5] Instalando dependencias mobile...
cd apps\mobile
call npm install
call npx expo install --fix
call npx expo install expo-system-ui expo-navigation-bar expo-linear-gradient react-native-svg expo-secure-store expo-file-system
call npx expo-doctor
cd ..\..

echo [4/5] Preparando validacao visual...
node scripts\prepare-screenshot-checklist.cjs

echo [5/5] Executando testes iniciais...
call scripts\validate-all.bat

echo.
echo Setup concluido.
echo Copie apps\mobile\.env.example para apps\mobile\.env e ajuste o IP da API.
endlocal
