// ===== i18n internationalization =====

export type Locale = 'zh' | 'en';

const LOCALE_KEY = 'typerace_locale';

export function getStoredLocale(): Locale {
  return (localStorage.getItem(LOCALE_KEY) as Locale) || 'zh';
}

export function setStoredLocale(locale: Locale): void {
  localStorage.setItem(LOCALE_KEY, locale);
}

// Translation dictionary
const translations = {
  // Navbar
  'nav.home': { zh: '首页', en: 'Home' },
  'nav.lessons': { zh: '课程', en: 'Lessons' },
  'nav.practice': { zh: '练习', en: 'Practice' },
  'nav.test': { zh: '测试', en: 'Test' },
  'nav.multiplayer': { zh: '对战', en: 'Battle' },
  'nav.dashboard': { zh: '统计', en: 'Stats' },
  'nav.daily': { zh: '每日', en: 'Daily' },
  'nav.friends': { zh: '好友', en: 'Friends' },
  'nav.leaderboard': { zh: '排行', en: 'Rank' },
  'nav.settings': { zh: '设置', en: 'Settings' },
  'nav.online': { zh: '在线', en: 'Online' },
  'nav.games': { zh: '游戏', en: 'Games' },

  // Home page
  'home.badge': { zh: '在线打字竞速平台', en: 'Online Typing Race Platform' },
  'home.title1': { zh: '用指尖', en: 'Master' },
  'home.title2': { zh: '征服速度', en: 'Speed Typing' },
  'home.subtitle': { zh: '从零基础到打字高手，渐进式课程 + 多人实时竞速 + 全球排行榜', en: 'From beginner to typing master. Progressive courses + real-time multiplayer racing + global leaderboard' },
  'home.lessons': { zh: '打字课程', en: 'Lessons' },
  'home.lessonsDesc': { zh: '28节渐进式课程，从Home Row到全键盘', en: '28 progressive lessons from Home Row to full keyboard' },
  'home.practice': { zh: '自由练习', en: 'Free Practice' },
  'home.practiceDesc': { zh: '中英文自选，三种难度，虚拟键盘引导', en: 'CN/EN text, 3 difficulty levels, virtual keyboard guide' },
  'home.test': { zh: '计时测试', en: 'Timed Test' },
  'home.testDesc': { zh: '30秒 / 1分钟 / 2分钟 / 5分钟限时挑战', en: '30s / 1min / 2min / 5min timed challenge' },
  'home.multiplayer': { zh: '多人对战', en: 'Multiplayer' },
  'home.multiplayerDesc': { zh: '实时匹配在线玩家，赛车式竞速比赛', en: 'Real-time matchmaking, racing-style competition' },
  'home.rank': { zh: '排行榜', en: 'Leaderboard' },
  'home.rankDesc': { zh: '查看全球玩家排名和最佳打字成绩', en: 'View global player rankings and best scores' },
  'home.settings': { zh: '设置', en: 'Settings' },
  'home.settingsDesc': { zh: '音效主题、语言、键盘显示等个性化配置', en: 'Sound themes, language, keyboard display and more' },
  'home.hot': { zh: '热门', en: 'Hot' },
  'home.feat.keyboard': { zh: '虚拟键盘指引', en: 'Virtual Keyboard Guide' },
  'home.feat.finger': { zh: '手指位置提示', en: 'Finger Position Hints' },
  'home.feat.lang': { zh: '中英文切换', en: 'CN/EN Switch' },
  'home.feat.sound': { zh: '6种音效主题', en: '6 Sound Themes' },
  'home.feat.star': { zh: '星级评分', en: 'Star Rating' },
  'home.feat.race': { zh: '赛车可视化', en: 'Racing Visualization' },

  // Practice page
  'practice.title': { zh: '练习模式', en: 'Practice Mode' },
  'practice.subtitle': { zh: '提升你的打字速度和准确率', en: 'Improve your typing speed and accuracy' },
  'practice.random': { zh: '随机文本', en: 'Random Text' },
  'practice.custom': { zh: '自定义文本', en: 'Custom Text' },
  'practice.easy': { zh: '简单', en: 'Easy' },
  'practice.medium': { zh: '中等', en: 'Medium' },
  'practice.hard': { zh: '困难', en: 'Hard' },
  'practice.keyboard': { zh: '键盘', en: 'Keyboard' },
  'practice.nicknamePlaceholder': { zh: '输入昵称保存成绩', en: 'Enter nickname to save scores' },
  'practice.save': { zh: '保存', en: 'Save' },
  'practice.done': { zh: '完成！', en: 'Done!' },
  'practice.speed': { zh: '速度', en: 'Speed' },
  'practice.accuracy': { zh: '准确率', en: 'Accuracy' },
  'practice.time': { zh: '用时', en: 'Time' },
  'practice.seconds': { zh: '秒', en: 's' },
  'practice.next': { zh: '下一篇', en: 'Next' },
  'practice.backToList': { zh: '返回列表', en: 'Back to List' },
  'practice.saveReplay': { zh: '保存回放', en: 'Save Replay' },
  'practice.replaySaved': { zh: '回放已保存！', en: 'Replay saved!' },
  'practice.continueTyping': { zh: '继续打字...', en: 'Keep typing...' },
  'practice.startTyping': { zh: '点击任意键开始打字', en: 'Press any key to start typing' },
  'practice.addCustomTitle': { zh: '添加自定义文本', en: 'Add Custom Text' },
  'practice.titlePlaceholder': { zh: '标题', en: 'Title' },
  'practice.contentPlaceholder': { zh: '粘贴或输入练习文本...', en: 'Paste or type practice text...' },
  'practice.add': { zh: '添加', en: 'Add' },
  'practice.delete': { zh: '删除', en: 'Delete' },
  'practice.noCustom': { zh: '还没有自定义文本', en: 'No custom texts yet' },
  'practice.inputWarning': { zh: '请输入标题和内容', en: 'Please enter title and content' },
  'practice.customAdded': { zh: '自定义文本已添加', en: 'Custom text added' },
  'practice.backCustomList': { zh: '返回自定义文本列表', en: 'Back to custom text list' },

  // Lessons page
  'lessons.title': { zh: '打字课程', en: 'Typing Lessons' },
  'lessons.subtitle': { zh: '从基础到高级，循序渐进掌握盲打技能', en: 'From basics to advanced, master touch typing step by step' },
  'lessons.all': { zh: '全部', en: 'All' },
  'lessons.stars': { zh: '收集星星', en: 'Stars' },
  'lessons.completed': { zh: '已完成', en: 'Completed' },
  'lessons.badges': { zh: '徽章', en: 'Badges' },
  'lessons.badgesTitle': { zh: '成就徽章', en: 'Achievement Badges' },
  'lessons.best': { zh: '最佳', en: 'Best' },
  'lessons.accuracyLabel': { zh: '准确率', en: 'Accuracy' },
  'lessons.practiceCount': { zh: '练习', en: 'Practice' },
  'lessons.times': { zh: '次', en: 'times' },

  // Daily challenge
  'daily.title': { zh: '每日挑战', en: 'Daily Challenge' },
  'daily.subtitle': { zh: '每天一篇，和全球玩家一起竞速', en: 'One text daily, race with players worldwide' },

  // Friends
  'friends.title': { zh: '好友', en: 'Friends' },
  'friends.subtitle': { zh: '添加好友，一起竞速！', en: 'Add friends, race together!' },
  'friends.myCode': { zh: '我的好友码', en: 'My Friend Code' },
  'friends.copy': { zh: '复制', en: 'Copy' },
  'friends.copied': { zh: '已复制', en: 'Copied' },
  'friends.addFriend': { zh: '添加好友', en: 'Add Friend' },
  'friends.codePlaceholder': { zh: '输入好友码', en: 'Enter friend code' },
  'friends.pending': { zh: '待接受请求', en: 'Pending Requests' },
  'friends.accept': { zh: '接受', en: 'Accept' },
  'friends.reject': { zh: '拒绝', en: 'Reject' },
  'friends.list': { zh: '好友列表', en: 'Friends List' },
  'friends.empty': { zh: '还没有好友，分享你的好友码给朋友吧！', en: 'No friends yet, share your friend code!' },
  'friends.online': { zh: '在线', en: 'Online' },
  'friends.offline': { zh: '离线', en: 'Offline' },
  'friends.privateRoom': { zh: '私人房间', en: 'Private Room' },
  'friends.createRoom': { zh: '创建私人房间', en: 'Create Private Room' },
  'friends.roomCode': { zh: '房间码', en: 'Room Code' },
  'friends.joinRoom': { zh: '输入房间码加入', en: 'Enter room code to join' },
  'friends.join': { zh: '加入', en: 'Join' },
  'friends.requestSent': { zh: '好友请求已发送！', en: 'Friend request sent!' },
  'friends.accepted': { zh: '已接受好友请求', en: 'Friend request accepted' },
  'friends.removed': { zh: '已删除好友', en: 'Friend removed' },

  // Dashboard
  'dashboard.title': { zh: '统计仪表盘', en: 'Statistics Dashboard' },
  'dashboard.subtitle': { zh: '追踪你的打字进步', en: 'Track your typing progress' },

  // Settings
  'settings.title': { zh: '个人设置', en: 'Settings' },
  'settings.subtitle': { zh: '自定义你的打字体验', en: 'Customize your typing experience' },
  'settings.profile': { zh: '个人资料', en: 'Profile' },
  'settings.nickname': { zh: '昵称', en: 'Nickname' },
  'settings.theme': { zh: '主题', en: 'Theme' },
  'settings.light': { zh: '亮色', en: 'Light' },
  'settings.dark': { zh: '暗色', en: 'Dark' },
  'settings.language': { zh: '界面语言', en: 'Interface Language' },
  'settings.typingLang': { zh: '打字语言', en: 'Typing Language' },
  'settings.sound': { zh: '音效设置', en: 'Sound Settings' },
  'settings.keyboardLayout': { zh: '键盘布局', en: 'Keyboard Layout' },

  // Replay
  'replay.title': { zh: '打字回放', en: 'Typing Replay' },
  'replay.empty': { zh: '还没有回放记录', en: 'No replays yet' },
  'replay.emptyHint': { zh: '完成练习后可以保存回放', en: 'Save replays after completing practice' },
  'replay.play': { zh: '播放', en: 'Play' },
  'replay.stop': { zh: '停止', en: 'Stop' },
  'replay.speed': { zh: '速度', en: 'Speed' },
  'replay.backList': { zh: '返回列表', en: 'Back to List' },

  // Common
  'common.loading': { zh: '加载中...', en: 'Loading...' },
  'common.error': { zh: '出错了', en: 'Error' },
  'common.confirm': { zh: '确认', en: 'Confirm' },
  'common.cancel': { zh: '取消', en: 'Cancel' },
  'common.level': { zh: '等级', en: 'Level' },
  'common.xp': { zh: '经验值', en: 'XP' },
  'common.combo': { zh: '连击', en: 'Combo' },

  // Encouragement messages
  'encourage.perfect': { zh: '完美表现！太棒了！', en: 'Perfect! Amazing!' },
  'encourage.excellent': { zh: '出色！继续保持！', en: 'Excellent! Keep it up!' },
  'encourage.great': { zh: '很好！你在进步！', en: 'Great! You are improving!' },
  'encourage.good': { zh: '不错！再练习一下吧！', en: 'Good! Practice a bit more!' },
  'encourage.keepGoing': { zh: '加油！熟能生巧！', en: 'Keep going! Practice makes perfect!' },
  'encourage.newRecord': { zh: '新纪录！', en: 'New Record!' },
  'encourage.firstComplete': { zh: '恭喜完成第一次练习！', en: 'Congrats on your first completion!' },
  'encourage.streakBonus': { zh: '连续打卡奖励！', en: 'Streak bonus!' },

  // Level titles
  'level.bronze': { zh: '青铜', en: 'Bronze' },
  'level.silver': { zh: '白银', en: 'Silver' },
  'level.gold': { zh: '黄金', en: 'Gold' },
  'level.platinum': { zh: '铂金', en: 'Platinum' },
  'level.diamond': { zh: '钻石', en: 'Diamond' },
  'level.master': { zh: '大师', en: 'Master' },
  'level.legend': { zh: '传奇', en: 'Legend' },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale?: Locale): string {
  const entry = translations[key];
  if (!entry) return key;
  const lang = locale ?? getStoredLocale();
  return entry[lang] ?? entry.zh;
}

// Get encouragement message based on accuracy and WPM
export function getEncouragement(accuracy: number, wpm: number, isNewRecord: boolean, locale?: Locale): string {
  if (isNewRecord) return t('encourage.newRecord', locale);
  if (accuracy >= 100) return t('encourage.perfect', locale);
  if (accuracy >= 95 && wpm >= 60) return t('encourage.excellent', locale);
  if (accuracy >= 90) return t('encourage.great', locale);
  if (accuracy >= 80) return t('encourage.good', locale);
  return t('encourage.keepGoing', locale);
}

// Level system
export interface LevelInfo {
  readonly level: number;
  readonly title: TranslationKey;
  readonly xp: number;
  readonly xpToNext: number;
  readonly totalXp: number;
  readonly color: string;
}

const LEVEL_THRESHOLDS = [
  { xp: 0, title: 'level.bronze' as const, color: '#cd7f32' },
  { xp: 100, title: 'level.bronze' as const, color: '#cd7f32' },
  { xp: 300, title: 'level.silver' as const, color: '#c0c0c0' },
  { xp: 600, title: 'level.gold' as const, color: '#ffd700' },
  { xp: 1200, title: 'level.platinum' as const, color: '#e5e4e2' },
  { xp: 2500, title: 'level.diamond' as const, color: '#b9f2ff' },
  { xp: 5000, title: 'level.master' as const, color: '#ff6b6b' },
  { xp: 10000, title: 'level.legend' as const, color: '#ffd700' },
];

export function getLevelInfo(totalXp: number): LevelInfo {
  let level = 1;
  let titleKey: TranslationKey = 'level.bronze';
  let color = '#cd7f32';
  let currentLevelXp = 0;
  let nextLevelXp = 100;

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i].xp) {
      level = i + 1;
      titleKey = LEVEL_THRESHOLDS[i].title;
      color = LEVEL_THRESHOLDS[i].color;
      currentLevelXp = LEVEL_THRESHOLDS[i].xp;
      nextLevelXp = i < LEVEL_THRESHOLDS.length - 1 ? LEVEL_THRESHOLDS[i + 1].xp : LEVEL_THRESHOLDS[i].xp * 2;
      break;
    }
  }

  return {
    level,
    title: titleKey,
    xp: totalXp - currentLevelXp,
    xpToNext: nextLevelXp - currentLevelXp,
    totalXp,
    color,
  };
}

// Calculate XP earned from a practice session
export function calculateXp(wpm: number, accuracy: number, textLength: number, combo: number): number {
  const baseXp = Math.round(textLength / 5);
  const speedBonus = Math.max(0, Math.round((wpm - 20) / 10));
  const accuracyMultiplier = accuracy >= 100 ? 2 : accuracy >= 95 ? 1.5 : accuracy >= 90 ? 1.2 : 1;
  const comboBonus = Math.min(combo, 50);
  return Math.round((baseXp + speedBonus + comboBonus) * accuracyMultiplier);
}
