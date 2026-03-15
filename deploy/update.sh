#!/bin/bash
# 更新部署脚本 - 用于后续代码更新
# 在远程服务器上执行

set -e

APP_DIR="/opt/typing-race"

echo "===== 1. 备份当前数据库 ====="
$APP_DIR/deploy/backup-db.sh

echo "===== 2. 安装依赖 ====="
cd "$APP_DIR"
npm install --omit=dev
cd "$APP_DIR/client"
npm install

echo "===== 3. 构建前端 ====="
npm run build

echo "===== 4. 重启应用 ====="
cd "$APP_DIR"
pm2 restart typing-race

echo "===== 5. 重载 Nginx ====="
cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/conf.d/typing-race.conf
nginx -t && systemctl reload nginx

echo ""
echo "更新完成！当前状态:"
pm2 status typing-race
