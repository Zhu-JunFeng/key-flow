#!/bin/bash
# SQLite 数据库自动备份脚本
# 通过 crontab 每天自动执行，保留最近30天的备份

APP_DIR="/opt/typing-race"
DB_FILE="$APP_DIR/data/typing-race.db"
BACKUP_DIR="$APP_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 检查数据库文件是否存在
if [ ! -f "$DB_FILE" ]; then
    echo "[$(date)] ERROR: Database file not found: $DB_FILE"
    exit 1
fi

# 使用 SQLite 的 .backup 命令进行安全备份（不会锁定数据库）
sqlite3 "$DB_FILE" ".backup '$BACKUP_DIR/typing-race_$DATE.db'"

if [ $? -eq 0 ]; then
    # 压缩备份
    gzip "$BACKUP_DIR/typing-race_$DATE.db"
    echo "[$(date)] SUCCESS: Backup created: typing-race_$DATE.db.gz"

    # 清理超过 KEEP_DAYS 天的旧备份
    find "$BACKUP_DIR" -name "typing-race_*.db.gz" -mtime +$KEEP_DAYS -delete
    echo "[$(date)] Cleaned backups older than $KEEP_DAYS days"
else
    echo "[$(date)] ERROR: Backup failed"
    exit 1
fi
