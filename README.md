# TypingRace - 多人在线打字竞速游戏

一款功能丰富的在线打字练习与竞速游戏，支持多人实时对战、课程学习、每日挑战、成就系统等。

**在线体验**: http://182.92.160.46

## 功能特性

### 核心功能
- **打字练习** — 支持英文/中文拼音，三种难度（简单/中等/困难），随机文本或自定义文本
- **多人对战** — Socket.IO 实时匹配，最多 5 人同场竞技，赛道可视化
- **课程系统** — 从基础键位到高级技巧的渐进式课程体系，30+ 课程
- **每日挑战** — 每天一篇统一文本，全服排行，挑战你的极限
- **代码模式** — JavaScript / Python / Go 代码片段打字练习

### 游戏与娱乐
- **10 种打字游戏** — BOSS 大战、塔防、赛车、格斗、打字泡泡、盲打挑战等
- **成就徽章** — 30+ 成就，包括速度里程碑、连续打卡、练习量等
- **等级系统** — 经验值累积升级，从"新手学员"到"打字之神"

### 数据与统计
- **统计仪表盘** — WPM 趋势图、按键错误热力图、连续打卡天数
- **排行榜** — 全服速度排名，练习/对战分类
- **打字回放** — 保存并回放每次练习的击键轨迹

### 社交功能
- **好友系统** — 好友码添加，在线状态，私人房间
- **排行竞争** — 与好友比较打字速度

### 个性化
- **暗色/亮色主题** — 完整的双主题支持
- **音效系统** — 6 种预设音效主题 + 自定义音效上传
- **背景音乐** — Lo-Fi / 自然 / 雨声 / 白噪音 / 咖啡厅
- **虚拟键盘** — QWERTY / Dvorak / Colemak 三种布局，手指指引
- **壁纸背景** — 自动轮换的高清壁纸背景
- **护眼模式** — 暖色滤镜保护眼睛
- **休息提醒** — 定时提醒休息

### 响应式设计
- 完整适配桌面、平板和手机端

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 19 + TypeScript + Tailwind CSS 4 + Arco Design + Framer Motion |
| **后端** | Express 4 + Socket.IO 4 + TypeScript |
| **数据库** | SQLite (better-sqlite3) + WAL 模式 |
| **构建** | Vite 8 |
| **部署** | PM2 + Nginx |

## 项目结构

```
typingGame/
├── client/                     # 前端 React 应用
│   ├── src/
│   │   ├── components/         # 通用组件 (TypingArea, VirtualKeyboard, Stats 等)
│   │   ├── pages/              # 页面组件 (Home, Practice, Multiplayer 等)
│   │   ├── lib/                # 工具库 (api, sounds, theme, i18n 等)
│   │   ├── hooks/              # React Hooks (useTyping 等)
│   │   ├── assets/             # 静态资源
│   │   ├── App.tsx             # 应用入口与路由
│   │   ├── main.tsx            # 渲染入口
│   │   └── index.css           # 全局样式与 CSS 变量
│   ├── dist/                   # 构建输出
│   └── vite.config.ts          # Vite 配置
├── server/                     # 后端 Express 应用
│   └── src/
│       ├── index.ts            # 服务器主入口 & API 路由
│       ├── db/
│       │   ├── schema.ts       # 数据库表结构定义
│       │   └── queries.ts      # 数据库查询函数
│       ├── socket/
│       │   ├── handlers.ts     # Socket.IO 事件处理
│       │   ├── matchmaking.ts  # 匹配逻辑
│       │   └── gameRoom.ts     # 房间管理
│       ├── texts/
│       │   ├── passages.ts     # 打字文本库
│       │   └── codeTexts.ts    # 代码文本库
│       └── auth/
│           └── oauth.ts        # OAuth 认证
├── data/                       # SQLite 数据库 (自动创建)
├── deploy/                     # 部署相关文件
│   ├── nginx.conf              # Nginx 配置
│   ├── backup-db.sh            # 数据库备份脚本
│   ├── setup.sh                # 首次部署脚本
│   └── update.sh               # 更新部署脚本
├── ecosystem.config.cjs        # PM2 配置
├── package.json                # 项目依赖
└── .env                        # 环境变量 (需手动创建)
```

## 本地开发

### 环境要求

- Node.js >= 20
- npm >= 10

### 安装与启动

```bash
# 1. 克隆项目
git clone https://gitee.com/zhujunfeng2025/typing-race.git
cd typing-race

# 2. 安装所有依赖
npm run setup

# 3. 创建环境变量文件 (可选)
cp .env.example .env

# 4. 启动开发模式 (前后端同时启动)
npm run dev
```

开发模式下:
- 前端: http://localhost:5173
- 后端: http://localhost:3001
- Vite 会自动将 `/api` 和 `/socket.io` 请求代理到后端

### 常用命令

```bash
npm run dev          # 开发模式 (前后端)
npm run dev:server   # 只启动后端
npm run dev:client   # 只启动前端
npm run build        # 构建前端生产版本
npm start            # 生产模式启动后端 (需先 build)
```

## 部署指南

### 服务器要求

- Linux (推荐 Ubuntu 22.04+)
- Node.js 20+
- Nginx
- 1GB+ 内存
- 10GB+ 磁盘

### 首次部署

```bash
# 1. 上传项目到服务器
rsync -avz --exclude 'node_modules' --exclude '.git' ./ root@YOUR_SERVER:/opt/typing-race/

# 2. 在服务器上执行初始化脚本
ssh root@YOUR_SERVER 'bash /opt/typing-race/deploy/setup.sh'
```

或手动部署:

```bash
# 在服务器上
cd /opt/typing-race

# 安装后端依赖
npm install

# 安装前端依赖并构建
cd client && npm install && npm run build && cd ..

# 配置 Nginx
cp deploy/nginx.conf /etc/nginx/conf.d/typing-race.conf
nginx -t && systemctl reload nginx

# 用 PM2 启动
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### 更新部署

```bash
# 方法1: 使用更新脚本
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'data' ./ root@SERVER:/opt/typing-race/
ssh root@SERVER 'bash /opt/typing-race/deploy/update.sh'

# 方法2: 手动更新
ssh root@SERVER
cd /opt/typing-race
# 先备份数据库！
./deploy/backup-db.sh
# 更新代码后
npm install && cd client && npm install && npm run build && cd ..
pm2 restart typing-race
```

## 数据持久化与备份

### 数据库

- 位置: `/opt/typing-race/data/typing-race.db`
- 类型: SQLite + WAL 模式 (高并发读写性能)
- 首次启动自动创建所有表

### 数据表说明

| 表名 | 说明 |
|------|------|
| `user_profiles` | 用户档案 (device_id 绑定) |
| `leaderboard` | 排行榜记录 |
| `match_history` | 多人对战记录 |
| `daily_stats` | 每日统计 |
| `key_error_stats` | 按键错误统计 |
| `custom_texts` | 用户自定义文本 |
| `daily_challenges` | 每日挑战 |
| `daily_challenge_scores` | 挑战成绩 |
| `friends` | 好友关系 |
| `replays` | 打字回放 |
| `lesson_practice_counts` | 课程练习计数 |

### 自动备份

部署脚本已配置 crontab，**每天凌晨 3 点**自动备份数据库:

```
0 3 * * * /opt/typing-race/deploy/backup-db.sh
```

- 备份目录: `/opt/typing-race/backups/`
- 格式: `typing-race_YYYYMMDD_HHMMSS.db.gz` (gzip 压缩)
- 保留天数: 30 天 (超过自动清理)
- 使用 SQLite 的 `.backup` 命令，不会锁定数据库

### 手动备份

```bash
# 执行手动备份
/opt/typing-race/deploy/backup-db.sh

# 查看备份文件
ls -la /opt/typing-race/backups/

# 恢复备份
gunzip /opt/typing-race/backups/typing-race_XXXXXXXX_XXXXXX.db.gz
cp /opt/typing-race/backups/typing-race_XXXXXXXX_XXXXXX.db /opt/typing-race/data/typing-race.db
pm2 restart typing-race
```

## 维护指南

### PM2 常用命令

```bash
pm2 status                  # 查看进程状态
pm2 logs typing-race        # 查看实时日志
pm2 logs typing-race --lines 100  # 查看最近100行日志
pm2 restart typing-race     # 重启应用
pm2 stop typing-race        # 停止应用
pm2 monit                   # 监控面板 (CPU/内存)
```

### 日志位置

```
/opt/typing-race/logs/out.log      # 应用标准输出
/opt/typing-race/logs/error.log    # 错误日志
/opt/typing-race/logs/backup.log   # 备份日志
```

### 常见问题

**Q: 应用无法启动?**
```bash
pm2 logs typing-race --lines 50   # 查看错误日志
node -v                            # 确认 Node.js 版本 >= 20
ls /opt/typing-race/data/          # 确认 data 目录存在
```

**Q: 端口被占用?**
```bash
lsof -i :3001                      # 查看端口占用
pm2 kill                           # 杀掉所有 PM2 进程
pm2 start ecosystem.config.cjs     # 重新启动
```

**Q: Nginx 502 Bad Gateway?**
```bash
pm2 status                         # 确认应用在运行
curl http://127.0.0.1:3001/        # 测试本地直连
nginx -t                           # 测试 Nginx 配置
systemctl restart nginx             # 重启 Nginx
```

**Q: 数据库损坏?**
```bash
# 停止应用
pm2 stop typing-race

# 恢复最近的备份
ls /opt/typing-race/backups/
gunzip -k /opt/typing-race/backups/typing-race_LATEST.db.gz
cp /opt/typing-race/backups/typing-race_LATEST.db /opt/typing-race/data/typing-race.db

# 重启
pm2 restart typing-race
```

## API 接口

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/texts/random` | GET | 获取随机文本 (?difficulty=easy\|medium\|hard&language=en\|zh) |
| `/api/texts/code` | GET | 获取代码文本 (?language=js\|py\|go) |
| `/api/leaderboard` | GET | 排行榜 (?mode=practice\|multiplayer) |
| `/api/profile/:deviceId` | GET/PUT | 用户档案 |
| `/api/score` | POST | 提交成绩 |
| `/api/stats/:deviceId/daily` | GET | 每日统计 (?days=30) |
| `/api/stats/:deviceId/keys` | GET | 按键错误统计 |
| `/api/daily-challenge` | GET | 今日挑战 |
| `/api/daily-challenge/score` | POST | 提交挑战成绩 |
| `/api/daily-challenge/leaderboard` | GET | 挑战排行榜 |
| `/api/friends/:deviceId` | GET | 好友列表 |
| `/api/replays` | GET/POST | 回放管理 |
| `/api/online-count` | GET | 在线人数 |

## 环境变量

创建 `.env` 文件:

```env
PORT=3001                        # 服务端口 (默认 3001)
NODE_ENV=production              # 环境 (production/development)
GOOGLE_CLIENT_ID=xxx             # Google OAuth (可选)
GOOGLE_CLIENT_SECRET=xxx         # Google OAuth (可选)
GITHUB_CLIENT_ID=xxx             # GitHub OAuth (可选)
GITHUB_CLIENT_SECRET=xxx         # GitHub OAuth (可选)
```

## 许可证

MIT License
