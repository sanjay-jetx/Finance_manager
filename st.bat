@echo off
echo Starting FastAPI Backend...
cd backend
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found. Please create one with 'python -m venv venv' and install requirements.
    pause
    exit /b 1
)
call venv\Scripts\activate.bat
uvicorn main:app --port 8000 --reload
