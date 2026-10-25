@echo off
title RIWY - Pubblicazione Firebase Hosting
cd /d "%~dp0"
echo ========================================================
echo   Pubblicazione di RIWY su Firebase Hosting
echo ========================================================
echo.
echo 1. Creazione della build di produzione...
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRORE] Build fallita. Operazione annullata.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo 2. Deploy su Firebase Hosting (cosafare-c0e33)...
firebase deploy --only hosting
echo.
pause
