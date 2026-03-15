export interface LessonProgress {
  readonly lessonId: number;
  readonly stars: number;         // 0-5
  readonly bestWpm: number;
  readonly bestAccuracy: number;
  readonly attempts: number;
  readonly completed: boolean;
  readonly lastPlayed: string;    // ISO date
}

export interface Badge {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly description: string;
  readonly condition: (progress: UserProgress) => boolean;
}

export interface UserProgress {
  readonly nickname: string;
  readonly avatar: number;
  readonly lessons: Record<number, LessonProgress>;
  readonly totalTyped: number;
  readonly totalTime: number;     // ms
  readonly badges: readonly string[];
}

export interface UserProgressExtended extends UserProgress {
  readonly streakDays: number;
}

const STORAGE_KEY = 'typerace_progress';

function getDefaultProgress(): UserProgress {
  return {
    nickname: localStorage.getItem('nickname') || '',
    avatar: parseInt(localStorage.getItem('avatar') || '0'),
    lessons: {},
    totalTyped: 0,
    totalTime: 0,
    badges: [],
  };
}

export function loadProgress(): UserProgress {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return getDefaultProgress();
    return JSON.parse(data) as UserProgress;
  } catch {
    return getDefaultProgress();
  }
}

export function saveProgress(progress: UserProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function calculateStars(wpm: number, accuracy: number): number {
  let stars = 0;
  // Accuracy-based
  if (accuracy >= 70) stars = 1;
  if (accuracy >= 80) stars = 2;
  if (accuracy >= 90) stars = 3;
  // Speed bonus
  if (accuracy >= 90 && wpm >= 30) stars = 4;
  if (accuracy >= 95 && wpm >= 50) stars = 5;
  return stars;
}

export function updateLessonProgress(
  lessonId: number,
  wpm: number,
  accuracy: number,
  timeMs: number
): UserProgress {
  const progress = loadProgress();
  const existing = progress.lessons[lessonId];
  const stars = calculateStars(wpm, accuracy);

  const updated: UserProgress = {
    ...progress,
    nickname: localStorage.getItem('nickname') || progress.nickname,
    avatar: parseInt(localStorage.getItem('avatar') || '0'),
    lessons: {
      ...progress.lessons,
      [lessonId]: {
        lessonId,
        stars: Math.max(existing?.stars ?? 0, stars),
        bestWpm: Math.max(existing?.bestWpm ?? 0, wpm),
        bestAccuracy: Math.max(existing?.bestAccuracy ?? 0, accuracy),
        attempts: (existing?.attempts ?? 0) + 1,
        completed: stars >= 1 || (existing?.completed ?? false),
        lastPlayed: new Date().toISOString(),
      },
    },
    totalTyped: progress.totalTyped + 1,
    totalTime: progress.totalTime + timeMs,
  };

  // Check badges
  const newBadges = [...updated.badges];
  for (const badge of BADGES) {
    if (!newBadges.includes(badge.id) && badge.condition(updated)) {
      newBadges.push(badge.id);
    }
  }

  const final = { ...updated, badges: newBadges };
  saveProgress(final);
  return final;
}

export const BADGES: readonly Badge[] = [
  // === Original badges ===
  {
    id: 'first-step',
    name: '第一步',
    icon: '👶',
    description: '完成第一课',
    condition: (p) => Object.values(p.lessons).some(l => l.completed),
  },
  {
    id: 'home-master',
    name: 'Home Row 大师',
    icon: '🏠',
    description: '完成所有 Home Row 课程',
    condition: (p) => {
      for (let i = 1; i <= 7; i++) {
        if (!p.lessons[i]?.completed) return false;
      }
      return true;
    },
  },
  {
    id: 'full-keyboard',
    name: '键盘征服者',
    icon: '⌨️',
    description: '完成所有基础课程 (1-19)',
    condition: (p) => {
      for (let i = 1; i <= 19; i++) {
        if (!p.lessons[i]?.completed) return false;
      }
      return true;
    },
  },
  {
    id: 'speed-demon',
    name: '极速飞车',
    icon: '🏎️',
    description: '任意课程达到 60 WPM',
    condition: (p) => Object.values(p.lessons).some(l => l.bestWpm >= 60),
  },
  {
    id: 'perfectionist',
    name: '完美主义者',
    icon: '💎',
    description: '任意课程达到 100% 准确率',
    condition: (p) => Object.values(p.lessons).some(l => l.bestAccuracy >= 100),
  },
  {
    id: 'five-star',
    name: '五星好评',
    icon: '⭐',
    description: '获得首个五星评价',
    condition: (p) => Object.values(p.lessons).some(l => l.stars >= 5),
  },
  {
    id: 'persistent',
    name: '坚持不懈',
    icon: '🔥',
    description: '累计完成 50 次练习',
    condition: (p) => p.totalTyped >= 50,
  },
  {
    id: 'all-stars',
    name: '全明星',
    icon: '🌟',
    description: '所有课程获得 3 星以上',
    condition: (p) => {
      const completed = Object.values(p.lessons);
      return completed.length >= 20 && completed.every(l => l.stars >= 3);
    },
  },
  {
    id: 'speed-master',
    name: '速度大师',
    icon: '⚡',
    description: '任意课程达到 100 WPM',
    condition: (p) => Object.values(p.lessons).some(l => l.bestWpm >= 100),
  },
  {
    id: 'code-warrior',
    name: '代码战士',
    icon: '💻',
    description: '完成编程代码课程并获得 3 星',
    condition: (p) => (p.lessons[28]?.stars ?? 0) >= 3,
  },

  // === Streak badges ===
  {
    id: 'streak-3',
    name: '三日连击',
    icon: '📅',
    description: '连续练习 3 天',
    condition: (p) => (p as UserProgressExtended).streakDays >= 3,
  },
  {
    id: 'streak-7',
    name: '周末战士',
    icon: '🗓️',
    description: '连续练习 7 天',
    condition: (p) => (p as UserProgressExtended).streakDays >= 7,
  },
  {
    id: 'streak-30',
    name: '月度坚持',
    icon: '📆',
    description: '连续练习 30 天',
    condition: (p) => (p as UserProgressExtended).streakDays >= 30,
  },
  {
    id: 'streak-100',
    name: '百日传奇',
    icon: '🏆',
    description: '连续练习 100 天',
    condition: (p) => (p as UserProgressExtended).streakDays >= 100,
  },

  // === Speed milestones ===
  {
    id: 'wpm-20',
    name: '起步',
    icon: '🐢',
    description: '达到 20 WPM',
    condition: (p) => Object.values(p.lessons).some(l => l.bestWpm >= 20),
  },
  {
    id: 'wpm-40',
    name: '加速中',
    icon: '🚶',
    description: '达到 40 WPM',
    condition: (p) => Object.values(p.lessons).some(l => l.bestWpm >= 40),
  },
  {
    id: 'wpm-80',
    name: '飞速',
    icon: '🏃',
    description: '达到 80 WPM',
    condition: (p) => Object.values(p.lessons).some(l => l.bestWpm >= 80),
  },
  {
    id: 'wpm-120',
    name: '闪电手指',
    icon: '🦅',
    description: '达到 120 WPM',
    condition: (p) => Object.values(p.lessons).some(l => l.bestWpm >= 120),
  },

  // === Practice volume ===
  {
    id: 'practice-100',
    name: '百次磨炼',
    icon: '💪',
    description: '累计练习 100 次',
    condition: (p) => p.totalTyped >= 100,
  },
  {
    id: 'practice-500',
    name: '五百精通',
    icon: '🎯',
    description: '累计练习 500 次',
    condition: (p) => p.totalTyped >= 500,
  },
  {
    id: 'practice-1000',
    name: '千锤百炼',
    icon: '👑',
    description: '累计练习 1000 次',
    condition: (p) => p.totalTyped >= 1000,
  },

  // === Perfect series ===
  {
    id: 'perfect-3',
    name: '三连完美',
    icon: '✨',
    description: '3 个课程达到 100% 准确率',
    condition: (p) => Object.values(p.lessons).filter(l => l.bestAccuracy >= 100).length >= 3,
  },
  {
    id: 'perfect-10',
    name: '十全十美',
    icon: '🎊',
    description: '10 个课程达到 100% 准确率',
    condition: (p) => Object.values(p.lessons).filter(l => l.bestAccuracy >= 100).length >= 10,
  },

  // === Time-based ===
  {
    id: 'time-1h',
    name: '一小时',
    icon: '⏰',
    description: '累计练习 1 小时',
    condition: (p) => p.totalTime >= 3600000,
  },
  {
    id: 'time-10h',
    name: '十小时',
    icon: '⏱️',
    description: '累计练习 10 小时',
    condition: (p) => p.totalTime >= 36000000,
  },

  // === Special ===
  {
    id: 'night-owl',
    name: '夜猫子',
    icon: '🦉',
    description: '在深夜练习 (00:00-05:00)',
    condition: () => {
      const hour = new Date().getHours();
      return hour >= 0 && hour < 5;
    },
  },
  {
    id: 'early-bird',
    name: '早起鸟儿',
    icon: '🐦',
    description: '在清晨练习 (05:00-07:00)',
    condition: () => {
      const hour = new Date().getHours();
      return hour >= 5 && hour < 7;
    },
  },
  {
    id: 'accuracy-90-avg',
    name: '精确制导',
    icon: '🎯',
    description: '5 个以上课程平均准确率 90%+',
    condition: (p) => {
      const lessons = Object.values(p.lessons);
      if (lessons.length < 5) return false;
      const avg = lessons.reduce((s, l) => s + l.bestAccuracy, 0) / lessons.length;
      return avg >= 90;
    },
  },
  {
    id: 'all-difficulties',
    name: '全面发展',
    icon: '🌈',
    description: '完成所有 28 个课程',
    condition: (p) => {
      for (let i = 1; i <= 28; i++) {
        if (!p.lessons[i]?.completed) return false;
      }
      return true;
    },
  },
  {
    id: 'speed-growth',
    name: '突飞猛进',
    icon: '📈',
    description: '最高 WPM 超过首次 WPM 50%以上',
    condition: (p) => {
      const lessons = Object.values(p.lessons).filter(l => l.bestWpm > 0);
      if (lessons.length < 2) return false;
      const first = lessons[0].bestWpm;
      const best = Math.max(...lessons.map(l => l.bestWpm));
      return best >= first * 1.5;
    },
  },
];

export function getBadgeById(id: string): Badge | undefined {
  return BADGES.find(b => b.id === id);
}
