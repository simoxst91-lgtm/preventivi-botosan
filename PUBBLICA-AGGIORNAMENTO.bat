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

rem ------------------------------------------------------------------
rem  TOKEN: questo programma usa il PROPRIO token, letto dal file
rem  token-github.txt che sta in questa cartella.
rem  Cosi' la variabile GH_TOKEN di Windows resta quella di Gama
rem  e i due programmi non si danno fastidio.
rem  setlocal fa si' che la modifica valga solo dentro questo script.
rem ------------------------------------------------------------------
if exist token-github.txt (
  set /p GH_TOKEN=<token-github.txt
  echo Token: uso quello di Botosan ^(token-github.txt^)
) else (
  echo ERRORE: manca il file token-github.txt in questa cartella.
  echo.
  echo Crea un file di testo chiamato  token-github.txt
  echo e scrivici dentro SOLO il token di GitHub dell'account
  echo simoxst91-lgtm ^(una riga, niente spazi^).
  echo.
  echo Il token si crea su https://github.com/settings/tokens
  echo ^(Generate new token classic, spunta solo "repo"^)
  goto fine_errore
)

echo.
echo Controllo che il token sia dell'account giusto...
for /f "delims=" %%a in ('curl -s -o nul -w "%%{http_code}" -H "Authorization: Bearer !GH_TOKEN!" https://api.github.com/repos/simoxst91-lgtm/preventivi-botosan') do set CODICE=%%a
if not "!CODICE!"=="200" (
  echo.
  echo ERRORE: con questo token GitHub risponde !CODICE! invece di 200.
  echo Il token non ha accesso a simoxst91-lgtm/preventivi-botosan:
  echo probabilmente e' di un altro account.
  echo Lancia CONTROLLA-TOKEN.bat per vedere a chi appartiene.
  goto fine_errore
)
echo Token corretto, accesso al repository confermato.

echo.
echo Chiudo il programma se e' aperto...
taskkill /IM "Preventivi Botosan.exe" /F >nul 2>&1
rem taskkill fallisce se il programma non era aperto: e' normale,
rem questa riga azzera il codice di errore
ver >nul

for /f "tokens=2 delims=:," %%a in ('findstr /C:"\"version\"" package.json') do (
  set VER=%%~a
  set VER=!VER: =!
  set VER=!VER:"=!
)
echo.
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
