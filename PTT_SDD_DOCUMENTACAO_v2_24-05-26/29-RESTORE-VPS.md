# RESTORE COMPLETO DA VPS

## Fluxo

1. Criar nova VPS Ubuntu
2. Instalar Docker
3. Restaurar projeto
4. Restaurar PostgreSQL
5. Restaurar volumes Docker
6. Subir containers
7. Validar APIs
8. Validar LiveKit
9. Validar frontend

## Restore SQL

docker exec -i ptt_postgres psql -U ptt_user -d ptt < backup.sql
