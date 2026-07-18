@echo off
cd /d "%~dp0\..\services\api"
call .venv\Scripts\activate.bat
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
