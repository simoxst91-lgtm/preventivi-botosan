@echo off
title Preventivi Botosan - prova senza installare
cd /d "%~dp0"
if not exist node_modules (
  echo Prima installazione componenti, attendi...
  call npm install
)
call npm start
