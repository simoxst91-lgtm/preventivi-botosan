@echo off
setlocal enabledelayedexpansion
title Preventivi Botosan - pubblica aggiornamento su GitHub
cd /d "%~dp0"

echo =================================================
echo   PUBBLICA AGGIORNAMENTO - Preventivi Botosan
echo =================================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERRORE: Node.js non e' installato.
  echo Scaricalo da https://nodejs.org ^(versione LTS^) e rilancia questo file.
  goto fine_errore
)

if "%GH_TOKEN%"=="" (
  echo ERRORE: manca il token GitHub.
  echo.
  echo Apri il Prompt dei comandi e lancia una volta sola:
  echo    setx GH_TOKEN "il_tuo_token_github"
  echo poi CHIUDI e RIAPRI la finestra e rilancia questo file.
  echo.
  echo Il token si crea su https://github.com/settings/tokens
  echo ^(token classic, spunta solo "repo"^)
  goto fine_errore
)

echo Chiudo il programma se e' aperto...
taskkill /IM "Preventivi Botosan.exe" /F >nul 2>&1
rem il comando qui sopra fallisce se il programma non era aperto: e' normale,
rem questa riga azzera il codice di errore cosi' non blocca i controlli dopo
ver >nul

for /f "tokens=2 delims=:," %%a in ('findstr /C:"\"version\"" package.json') do (
  set VER=%%~a
  set VER=!VER: =!
  set VER=!VER:"=!
)
echo Versione attuale: !VER!
echo.
set "NUOVA="
set /p NUOVA=Nuova versione da pubblicare (invio = tieni !VER!):

if not "!NUOVA!"=="" (
  call npm version !NUOVA! --no-git-tag-version
  if errorlevel 1 (
    echo Non sono riuscito a cambiare la versione.
    goto fine_errore
  )
  echo Versione portata a !NUOVA!
)

echo.
echo [1/2] Controllo componenti...
if not exist node_modules (
  call npm install
  if errorlevel 1 (
    echo Installazione componenti fallita.
    goto fine_errore
  )
) else (
  echo componenti gia' presenti, salto.
)

echo.
echo [2/2] Creo l'installer e lo carico su GitHub...
call npm run publish
if errorlevel 1 (
  echo Creazione o caricamento della release fallito.
  goto fine_errore
)

echo.
echo ==========================================
echo   FATTO.
echo   La release e' su GitHub come BOZZA.
echo   Apri la pagina Releases, apri la bozza
echo   e premi "Publish release".
echo   Da quel momento i PC installati si
echo   aggiornano da soli.
echo ==========================================
echo.
start "" "https://github.com/simoxst91-lgtm/preventivi-botosan/releases"
pause
exit /b 0

:fine_errore
echo.
echo Copia il messaggio qui sopra e mandamelo.
pause
exit /b 1
