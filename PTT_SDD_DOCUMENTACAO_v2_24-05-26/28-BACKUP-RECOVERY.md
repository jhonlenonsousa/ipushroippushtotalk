# BACKUP E RECOVERY

## Estrutura de Backup

/opt/backups/
├── codigo/
├── postgres/
├── docker/
└── logs/

## Backup Automático

Script principal:
/opt/ptt/scripts/backup.sh

## Componentes protegidos

- Código-fonte
- Banco PostgreSQL
- Volumes Docker
- Logs operacionais

## Retenção

- Código: 7 dias
- PostgreSQL: 7 dias
- Docker volumes: 7 dias
- Logs: 15 dias

## Cron

0 2 * * * /opt/ptt/scripts/backup.sh
