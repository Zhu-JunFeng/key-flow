#!/bin/bash
# 服务器初始化部署脚本
# 在远程服务器上执行，用于首次部署
# 前端产物由本地构建并上传，服务器仅安装运行时依赖并启动服务

set -euo pipefail

APP_DIR="/opt/typing-race"

echo "===== 1. 安装系统依赖 ====="
# 更新包管理器并安装必要软件
if command -v apt-get &> /dev/null; then
    apt-get update -y
    apt-get install -y curl git nginx sqlite3
elif command -v yum &> /dev/null; then
    yum update -y
    yum install -y curl git nginx sqlite
fi

echo "===== 2. 安装 Node.js 20 ====="
if ! command -v node &> /dev/null || [[ $(node -v | cut -d. -f1 | tr -d v) -lt 20 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>/dev/null || \
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - 2>/dev/null
    if command -v apt-get &> /dev/null; then
        apt-get install -y nodejs
    else
        yum install -y nodejs
    fi
fi
echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"

echo "===== 3. 安装 PM2 ====="
npm install -g pm2 2>/dev/null || true
echo "PM2: $(pm2 -v)"

echo "===== 4. 创建应用目录 ====="
mkdir -p "$APP_DIR/data"
mkdir -p "$APP_DIR/logs"
mkdir -p "$APP_DIR/backups"

echo "===== 5. 安装依赖 ====="
cd "$APP_DIR"
npm install --omit=dev --no-fund --no-audit
npm install --no-save tsx --no-fund --no-audit

if [ ! -f "$APP_DIR/client/dist/index.html" ]; then
    echo "ERROR: missing $APP_DIR/client/dist/index.html"
    echo "Please build locally and upload client/dist before running deploy/setup.sh"
    exit 1
fi

echo "===== 6. 配置 Nginx ====="
cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/conf.d/typing-race.conf
# 移除默认站点（如果存在）
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t && systemctl reload nginx
systemctl enable nginx

echo "===== 7. 启动应用 ====="
cd "$APP_DIR"
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || pm2 startup

echo "===== 8. 配置数据库自动备份 ====="
chmod +x "$APP_DIR/deploy/backup-db.sh"
# 每天凌晨3点自动备份
(crontab -l 2>/dev/null | grep -v "backup-db.sh"; echo "0 3 * * * $APP_DIR/deploy/backup-db.sh >> $APP_DIR/logs/backup.log 2>&1") | crontab -

echo "===== 9. 配置防火墙 ====="
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp 2>/dev/null || true
    ufw allow 443/tcp 2>/dev/null || true
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=80/tcp 2>/dev/null || true
    firewall-cmd --permanent --add-port=443/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
fi

echo ""
echo "=========================================="
echo "  部署完成！"
echo "  访问地址: keyflow.zcn.world (HTTPS 证书配置后使用 https://)"
echo "  应用目录: $APP_DIR"
echo "  数据库:   $APP_DIR/data/typing-race.db"
echo "  备份目录: $APP_DIR/backups/"
echo "  日志目录: $APP_DIR/logs/"
echo "=========================================="
echo ""
echo "常用维护命令:"
echo "  pm2 status              # 查看应用状态"
echo "  pm2 logs typing-race    # 查看日志"
echo "  pm2 restart typing-race # 重启应用"
echo "  pm2 monit               # 监控面板"
echo "  $APP_DIR/deploy/backup-db.sh  # 手动备份数据库"
