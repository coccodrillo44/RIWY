@echo off
title RIWY - SuperAdmin Dashboard
cd /d "%~dp0"
echo ========================================================
echo   Avvio di RIWY (Rook Intelligent Web Yard)
echo ========================================================
echo.
echo Avvio del server di sviluppo su http://localhost:3000 ...
echo Premi CTRL+C per arrestare il server.
echo.
npm run dev
pause
