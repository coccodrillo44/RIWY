@echo off
title RIWY - SuperAdmin Dashboard
cd /d "%~dp0"
echo ========================================================
echo   Avvio di RIWY (Rook Intelligent Web Yard)
echo ========================================================
echo.

REM 1. Verifica che Node.js sia installato sul computer
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRORE] Node.js non risulta installato su questo computer!
    echo Scaricalo gratuitamente da: https://nodejs.org
    echo.
    pause
    exit /b
)

REM 2. Se e' la prima volta (manca node_modules), installa le dipendenze in automatico
if not exist node_modules (
    echo [INFO] Rilevato primo avvio: cartella node_modules assente.
    echo Esecuzione automatica di 'npm install' in corso...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERRORE] Installazione delle dipendenze fallita.
        pause
        exit /b
    )
    echo.
    echo [OK] Dipendenze installate con successo!
    echo.
)

REM 3. Avvia il server di sviluppo Next.js
echo Avvio del server su http://localhost:3000 ...
echo Premi CTRL+C per arrestare il server.
echo.
call npm run dev
pause
