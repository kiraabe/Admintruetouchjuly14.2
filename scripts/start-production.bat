@echo off
REM True Touch - Production Startup Script (Windows)
REM This script builds and starts the application in production mode

setlocal enabledelayedexpansion

echo.
echo 🚀 Starting True Touch in production mode...
echo.

REM Check if .env file exists
if not exist ".env" (
  echo ⚠️  .env file not found!
  echo Creating .env from .env.example...
  copy .env.example .env
  echo Please update .env with your configuration and run this script again.
  exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
  echo 📦 Installing dependencies...
  call npm ci
  if errorlevel 1 (
    echo ❌ npm ci failed!
    exit /b 1
  )
)

REM Build frontend and backend
echo 🔨 Building application...
call npm run build:production
if errorlevel 1 (
  echo ❌ Build failed!
  exit /b 1
)

REM Check if dist directory exists
if not exist "dist" (
  echo ❌ Build failed! dist directory not found.
  exit /b 1
)

echo ✅ Build completed successfully
echo 🌐 Starting server on port %PORT:5000%...
echo.

REM Start the application
call npm run start:production

endlocal
