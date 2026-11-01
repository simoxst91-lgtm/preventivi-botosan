@echo off
title Preventivi Botosan - creazione installer Windows
cd /d "%~dp0"

echo ============================================
echo   PREVENTIVI BOTOSAN - creazione installer
echo ============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERRORE: Node.js non e' installato.
  echo Scaricalo da https://nodejs.org ^(versione LTS^) e rilancia questo file.
  echo.
  pause
  exit /b 1
)

echo [1/3] Installazione componenti... ^(solo la prima volta, qualche minuto^)
call npm install
if errorlevel 1 goto errore

echo.
echo [2/3] Creazione installer...
call npm run build
if errorlevel 1 goto errore

echo.
echo [3/3] FATTO!
echo L'installer si trova nella cartella: dist\
echo Si chiama "Preventivi Botosan Setup 1.0.0.exe"
echo.
start "" "%~dp0dist"
pause
exit /b 0

:errore
echo.
echo Qualcosa e' andato storto. Copia il messaggio qui sopra e mandamelo.
pause
exit /b 1
