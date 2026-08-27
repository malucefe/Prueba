#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR
docker exec caudo-postgres-1 pg_dump -U postgres caudo > "$BACKUP_DIR/caudo_$TIMESTAMP.sql"
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
echo "Backup created: caudo_$TIMESTAMP.sql"
