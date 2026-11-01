@echo off
title Preventivi Botosan - controllo token GitHub
cd /d "%~dp0"

echo ==========================================
echo   CONTROLLO TOKEN GITHUB
echo ==========================================
echo.

if "%GH_TOKEN%"=="" (
  echo Nessun token impostato in questa finestra.
  echo Se lo hai appena messo con setx, devi CHIUDERE e RIAPRIRE il Prompt.
  goto fine
)

echo Token trovato ^(mostro solo l'inizio^): %GH_TOKEN:~0,8%...
echo.
echo Chiedo a GitHub a chi appartiene...
echo.

curl -s -H "Authorization: Bearer %GH_TOKEN%" https://api.github.com/user | findstr /C:"\"login\"" /C:"\"message\""
echo.
echo Deve comparire:  "login": "simoxst91-lgtm"
echo Se compare un altro nome, il token e' di un altro account
echo e non puo' pubblicare su questo repository.
echo.

echo Controllo i permessi sul repository...
curl -s -o nul -w "Risposta: %%{http_code}  (200 = ok, 404 = nessun accesso)\n" -H "Authorization: Bearer %GH_TOKEN%" https://api.github.com/repos/simoxst91-lgtm/preventivi-botosan

:fine
echo.
pause
