# RUNBOOK OPERACIONAL

## Subir sistema

cd /opt/ptt
docker compose up -d

## Reiniciar backend

docker restart ptt_backend

## Validar banco

https://api.ipushvoice.pro/db/test

## Backup manual

/opt/ptt/scripts/backup.sh
