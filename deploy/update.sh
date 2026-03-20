#!/bin/bash
# 更新部署脚本 - 用于后续代码更新
# 前端产物由本地构建并上传，服务器仅安装运行时依赖并重启服务

set -euo pipefail

APP_DIR="/opt/typing-race"

echo "===== 1. 备份当前数据库 ====="
bash "$APP_DIR/deploy/backup-db.sh"

echo "===== 2. 安装依赖 ====="
cd "$APP_DIR"
npm install --omit=dev --no-fund --no-audit
npm install --no-save tsx --no-fund --no-audit

echo "===== 3. 检查前端产物 ====="
if [ ! -f "$APP_DIR/client/dist/index.html" ]; then
  echo "ERROR: missing $APP_DIR/client/dist/index.html"
  echo "Please build locally and upload client/dist before running deploy/update.sh"
  exit 1
fi

echo "===== 4. 重启应用 ====="
cd "$APP_DIR"
if pm2 describe typing-race >/dev/null 2>&1; then
  pm2 restart typing-race --update-env
else
  pm2 start ecosystem.config.cjs
fi
pm2 save

echo "===== 5. 重载 Nginx ====="
cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/conf.d/typing-race.conf
nginx -t && systemctl reload nginx

echo ""
echo "更新完成！当前状态:"
pm2 status typing-race
