@echo off
setlocal
title Preventivi Botosan - pubblica aggiornamento su GitHub
cd /d "%~dp0"

echo =================================================
echo   PUBBLICA AGGIORNAMENTO - Preventivi Botosan
echo =================================================
echo.

if "%GH_TOKEN%"=="" (
  echo ERRORE: manca il token GitHub.
  echo.
  echo Apri il Prompt dei comandi e lancia una volta sola:
  echo    setx GH_TOKEN "il_tuo_token_github"
  echo poi chiudi e riapri la finestra e rilancia questo file.
  echo.
  echo Il token si crea su: https://github.com/settings/tokens
  echo ^(token classic, spunta solo "repo"^)
  echo.
  pause
  exit /b 1
)

echo Chiudo il programma se e' aperto...
taskkill /IM "Preventivi Botosan.exe" /F >nul 2>&1

for /f "tokens=2 delims=:, " %%a in ('findstr /C:"\"version\"" package.json') do set VER=%%~a
echo Versione attuale: %VER%
echo.
set /p NUOVA=Nuova versione da pubblicare (invio = tieni %VER%):

if not "%NUOVA%"=="" (
  call npm version %NUOVA% --no-git-tag-version
  if errorlevel 1 goto errore
  echo Versione portata a %NUOVA%
)

echo.
echo [1/2] Controllo componenti...
if not exist node_modules call npm install
if errorlevel 1 goto errore

echo.
echo [2/2] Creo e pubblico la release su GitHub...
call npm run publish
if errorlevel 1 goto errore

echo.
echo ==========================================
echo   FATTO.
echo   La release e' su GitHub come BOZZA.
echo   Vai su github.com/simoxst91-lgtm/preventivi-botosan/releases
echo   apri la bozza e premi "Publish release".
echo   Da quel momento i PC installati si aggiornano da soli.
echo ==========================================
echo.
start "" "https://github.com/simoxst91-lgtm/preventivi-botosan/releases"
pause
exit /b 0

:errore
echo.
echo Qualcosa e' andato storto. Copia il messaggio qui sopra e mandamelo.
pause
exit /b 1
