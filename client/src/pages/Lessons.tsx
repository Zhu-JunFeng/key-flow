import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { lessons, CATEGORIES, type Lesson } from '../lib/lessons';
import { loadProgress, type LessonProgress } from '../lib/progress';
import { t, getLevelInfo } from '../lib/i18n';
import { useLocale } from '../lib/hooks';
import StarRating from '../components/StarRating';
import BadgeDisplay from '../components/BadgeDisplay';

const LESSONS_PER_ROW = typeof window !== 'undefined' && window.innerWidth < 640 ? 4 : 6;

const CATEGORY_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  'home-row': { bg: '#10b981', border: '#34d399', glow: 'rgba(16,185,129,0.4)' },
  'top-row': { bg: '#3b82f6', border: '#60a5fa', glow: 'rgba(59,130,246,0.4)' },
  'bottom-row': { bg: '#8b5cf6', border: '#a78bfa', glow: 'rgba(139,92,246,0.4)' },
  'shift-key': { bg: '#f43f5e', border: '#fb7185', glow: 'rgba(244,63,94,0.4)' },
  'punctuation': { bg: '#f59e0b', border: '#fbbf24', glow: 'rgba(245,158,11,0.4)' },
  'numbers': { bg: '#f97316', border: '#fb923c', glow: 'rgba(249,115,22,0.4)' },
  'symbols': { bg: '#d946ef', border: '#e879f9', glow: 'rgba(217,70,239,0.4)' },
  'common-patterns': { bg: '#0ea5e9', border: '#38bdf8', glow: 'rgba(14,165,233,0.4)' },
  'words': { bg: '#14b8a6', border: '#2dd4bf', glow: 'rgba(20,184,166,0.4)' },
  'tricky-words': { bg: '#ef4444', border: '#f87171', glow: 'rgba(239,68,68,0.4)' },
  'sentences': { bg: '#6366f1', border: '#818cf8', glow: 'rgba(99,102,241,0.4)' },
  'advanced': { bg: '#ec4899', border: '#f472b6', glow: 'rgba(236,72,153,0.4)' },
};

export default function Lessons() {
  const locale = useLocale();
  const navigate = useNavigate();
  const progress = useMemo(() => loadProgress(), []);
  const totalStars = Object.values(progress.lessons).reduce((sum, l) => sum + l.stars, 0);
  const maxStars = lessons.length * 5;
  const completedCount = Object.values(progress.lessons).filter(l => l.completed).length;
  const overallPercent = Math.round((completedCount / lessons.length) * 100);
  const totalXp = parseInt(localStorage.getItem('typerace_xp') || '0');
  const levelInfo = getLevelInfo(totalXp);

  const [lockedPopup, setLockedPopup] = useState<number | null>(null);
  const [practiceCounts, setPracticeCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    fetch('/api/lesson-counts')
      .then(r => r.json())
      .then(data => setPracticeCounts(data))
      .catch(() => {});
  }, []);

  // Group lessons by category (in order they appear)
  const groupedLessons = useMemo(() => {
    const groups: { category: typeof CATEGORIES[number]; lessons: Lesson[] }[] = [];
    let currentCat = '';
    for (const lesson of lessons) {
      if (lesson.category !== currentCat) {
        currentCat = lesson.category;
        const catInfo = CATEGORIES.find(c => c.id === currentCat);
        if (catInfo) {
          groups.push({ category: catInfo, lessons: [] });
        }
      }
      if (groups.length > 0) {
        groups[groups.length - 1].lessons.push(lesson);
      }
    }
    return groups;
  }, []);

  // Find the next lesson to do
  const nextLessonId = useMemo(() => {
    for (const lesson of lessons) {
      if (!progress.lessons[lesson.id]?.completed) return lesson.id;
    }
    return lessons.length;
  }, [progress]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold mb-2" style={{
          background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>{t('lessons.title', locale)}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t('lessons.subtitle', locale)}</p>
      </div>

      {/* Stats bar */}
      <div className="glass-card p-5 mb-8 flex justify-center items-center flex-wrap gap-6" style={{ cursor: 'default' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
        <StatBox value={`${totalStars}`} sub={`/ ${maxStars}`} label={t('lessons.stars', locale)} color="#f59e0b" />
        <StatBox value={`${completedCount}`} sub={`/ ${lessons.length}`} label={t('lessons.completed', locale)} color="#10b981" percent={overallPercent} />
        <StatBox value={`${progress.badges.length}`} label={t('lessons.badges', locale)} color="#8b5cf6" />
        <StatBox value={`Lv.${levelInfo.level}`} label={t(levelInfo.title, locale)} color={levelInfo.color} />
      </div>

      {/* Badges */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>{t('lessons.badgesTitle', locale)}</h2>
        <BadgeDisplay progress={progress} showAll />
      </div>

      {/* Lesson Path - TypingClub style */}
      <div className="relative">
        {groupedLessons.map((group, groupIdx) => (
          <div key={group.category.id} className="mb-6">
            {/* Category header */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg"
                style={{
                  background: CATEGORY_COLORS[group.category.id]?.bg ?? '#6366f1',
                  boxShadow: `0 4px 15px ${CATEGORY_COLORS[group.category.id]?.glow ?? 'rgba(99,102,241,0.3)'}`,
                }}>
                {group.category.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{group.category.name}</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {group.lessons.filter(l => progress.lessons[l.id]?.completed).length} / {group.lessons.length} {locale === 'zh' ? '已完成' : 'completed'}
                </p>
              </div>
              <div className="w-[160px] flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.35)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${Math.round((group.lessons.filter(l => progress.lessons[l.id]?.completed).length / group.lessons.length) * 100)}%`,
                    background: CATEGORY_COLORS[group.category.id]?.bg ?? '#6366f1',
                  }} />
                </div>
                <span className="text-[11px] font-semibold tabular-nums min-w-[32px] text-right" style={{ color: CATEGORY_COLORS[group.category.id]?.bg ?? '#6366f1' }}>
                  {Math.round((group.lessons.filter(l => progress.lessons[l.id]?.completed).length / group.lessons.length) * 100)}%
                </span>
              </div>
            </div>

            {/* Winding path */}
            <LessonPath
              lessons={group.lessons}
              progress={progress.lessons}
              nextLessonId={nextLessonId}
              categoryId={group.category.id}
              navigate={navigate}
              locale={locale}
              practiceCounts={practiceCounts}
              onLockedClick={setLockedPopup}
              groupIdx={groupIdx}
            />
          </div>
        ))}
      </div>

      {/* Locked lesson popup */}
      {lockedPopup !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setLockedPopup(null)}>
          <div className="relative max-w-md w-full mx-4 p-6 rounded-3xl" style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setLockedPopup(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ color: '#6b7280', background: '#f3f4f6' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center space-y-4">
              <div className="text-4xl">🔒</div>
              <h3 className="text-lg font-bold" style={{ color: '#1f2937' }}>
                {locale === 'zh' ? '课程未解锁' : 'Lesson Locked'}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#4b5563' }}>
                {locale === 'zh'
                  ? '强烈建议您尝试并通过每一节课，不要跳跃至后面的课程。循序渐进的学习方式能帮助您打下更扎实的基础。'
                  : 'We strongly recommend you try and pass each lesson in order. Do not skip ahead. A step-by-step approach helps build a solid foundation.'}
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button onClick={() => setLockedPopup(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ color: '#4b5563', background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
                  {locale === 'zh' ? '关闭' : 'Close'}
                </button>
                <button onClick={() => { setLockedPopup(null); navigate(`/lessons/${lockedPopup}`); }}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }}>
                  {locale === 'zh' ? '继续挑战' : 'Challenge Anyway'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ value, sub, label, color, percent }: {
  readonly value: string;
  readonly sub?: string;
  readonly label: string;
  readonly color: string;
  readonly percent?: number;
}) {
  return (
    <div className="text-center p-3 rounded-xl min-w-[90px]" style={{ background: 'var(--bg-card)', backdropFilter: 'blur(10px)' }}>
      <div className="text-2xl font-extrabold tabular-nums" style={{ color }}>
        {value}
        {sub && <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>{sub}</span>}
      </div>
      <div className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      {percent !== undefined && (
        <div className="mt-1.5 h-1 rounded-full overflow-hidden w-20 mx-auto" style={{ background: 'rgba(16,185,129,0.3)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, background: '#10b981' }} />
        </div>
      )}
    </div>
  );
}

function LessonPath({ lessons: lessonList, progress, nextLessonId, categoryId, navigate, locale, practiceCounts, onLockedClick, groupIdx }: {
  readonly lessons: readonly Lesson[];
  readonly progress: Record<number, LessonProgress>;
  readonly nextLessonId: number;
  readonly categoryId: string;
  readonly navigate: (path: string) => void;
  readonly locale: 'zh' | 'en';
  readonly practiceCounts: Record<number, number>;
  readonly onLockedClick: (id: number) => void;
  readonly groupIdx: number;
}) {
  const colors = CATEGORY_COLORS[categoryId] ?? { bg: '#6366f1', border: '#818cf8', glow: 'rgba(99,102,241,0.4)' };

  // Split into winding rows
  const rows: Lesson[][] = [];
  for (let i = 0; i < lessonList.length; i += LESSONS_PER_ROW) {
    rows.push(lessonList.slice(i, i + LESSONS_PER_ROW) as Lesson[]);
  }

  return (
    <div className="relative pb-4">
      {rows.map((row, rowIdx) => {
        const isReversed = rowIdx % 2 === 1;
        const displayRow = isReversed ? [...row].reverse() : row;

        return (
          <div key={rowIdx} className="relative">
            {/* Vertical connector between rows */}
            {rowIdx > 0 && (
              <div className="absolute h-6 w-[2px] rounded-full"
                style={{
                  background: `${colors.bg}CC`,
                  left: isReversed ? 'auto' : '44px',
                  right: isReversed ? '44px' : 'auto',
                  top: '-12px',
                }} />
            )}

            {/* Row */}
            <div className={`flex items-start gap-1 sm:gap-2 mb-3 ${isReversed ? 'flex-row-reverse' : ''}`}>
              {displayRow.map((lesson, nodeIdx) => {
                const lp = progress[lesson.id];
                const isCompleted = !!lp?.completed;
                const isLocked = lesson.id > 1 && !progress[lesson.id - 1]?.completed;
                const isCurrent = lesson.id === nextLessonId;
                const actualIdx = isReversed ? row.length - 1 - nodeIdx : nodeIdx;
                const delay = (groupIdx * 0.05) + (rowIdx * LESSONS_PER_ROW + actualIdx) * 0.025;

                return (
                  <div key={lesson.id}
                    className="flex flex-col items-center relative group"
                    style={{
                      flex: '1 1 0',
                      maxWidth: `${100 / LESSONS_PER_ROW}%`,
                      animation: `fadeInUp 0.4s ease ${delay}s forwards`,
                      opacity: 0,
                    }}>

                    {/* Horizontal connector line */}
                    {nodeIdx > 0 && (
                      <div className="absolute top-[25px] h-[2px] z-0"
                        style={{
                          background: isCompleted
                            ? `linear-gradient(${isReversed ? '270deg' : '90deg'}, ${colors.bg}, ${colors.bg}80)`
                            : `${colors.bg}CC`,
                          left: isReversed ? '50%' : 0,
                          right: isReversed ? 0 : '50%',
                          width: '100%',
                        }} />
                    )}

                    {/* Circle node */}
                    <button
                      onClick={() => {
                        if (isLocked) {
                          onLockedClick(lesson.id);
                        } else {
                          navigate(`/lessons/${lesson.id}`);
                        }
                      }}
                      className="relative z-10 w-[42px] h-[42px] sm:w-[54px] sm:h-[54px] rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer"
                      style={{
                        background: isCompleted
                          ? `linear-gradient(135deg, ${colors.bg}, ${colors.border})`
                          : isLocked
                          ? 'var(--bg-card)'
                          : isCurrent
                          ? `linear-gradient(135deg, ${colors.bg}, ${colors.border})`
                          : 'var(--glass-bg)',
                        border: `2.5px solid ${isCompleted ? colors.border : isLocked ? 'var(--glass-border)' : isCurrent ? colors.border : 'var(--glass-border)'}`,
                        color: isCompleted || isCurrent ? '#fff' : isLocked ? 'var(--text-muted)' : 'var(--text-primary)',
                        boxShadow: isCompleted
                          ? `0 4px 15px ${colors.glow}`
                          : isCurrent
                          ? `0 0 0 4px ${colors.glow}, 0 4px 20px ${colors.glow}`
                          : 'var(--glass-shadow)',
                        transform: isCurrent ? 'scale(1.18)' : 'scale(1)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                      }}
                      onMouseEnter={e => {
                        if (!isCurrent) e.currentTarget.style.transform = 'scale(1.14)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = isCurrent ? 'scale(1.18)' : 'scale(1)';
                      }}
                    >
                      {isLocked ? (
                        <svg className="w-4 h-4 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/>
                        </svg>
                      ) : isCompleted ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-sm font-bold">{lesson.id}</span>
                      )}

                      {/* Current lesson pulse ring */}
                      {isCurrent && (
                        <span className="absolute inset-0 rounded-full animate-ping opacity-20"
                          style={{ background: colors.bg }} />
                      )}
                    </button>

                    {/* Stars below node */}
                    {lp && lp.stars > 0 ? (
                      <div className="mt-1.5">
                        <StarRating stars={lp.stars} size="xs" />
                      </div>
                    ) : (
                      <div className="mt-1.5 h-3" />
                    )}

                    {/* Lesson title below stars */}
                    <div className="mt-0.5 text-center w-full px-0.5">
                      <div className="text-[10px] font-medium leading-tight truncate" style={{ color: 'var(--text-muted)' }}>
                        {lesson.title.replace(/^(Home Row|Top Row|Bottom Row|Shift Key|符号|常用组合|同音词|易混淆词|难拼写词|标点|数字)[:：]\s*/, '')}
                      </div>
                    </div>

                    {/* Current lesson badge */}
                    {isCurrent && (
                      <div className="absolute -top-1.5 -right-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white z-20"
                        style={{ background: '#f59e0b', boxShadow: '0 2px 8px rgba(245,158,11,0.5)' }}>
                        NEXT
                      </div>
                    )}

                    {/* Hover tooltip */}
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-2.5 rounded-xl text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30"
                      style={{
                        background: '#1f2937',
                        color: '#f9fafb',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                      }}>
                      <div className="font-semibold mb-0.5">{lesson.title}</div>
                      <div style={{ color: '#9ca3af' }}>{lesson.description}</div>
                      <div className="flex items-center gap-1 mt-1" style={{ color: '#9ca3af' }}>
                        <span>{locale === 'zh' ? '按键' : 'Keys'}:</span>
                        <span className="font-mono text-[10px]">{lesson.keys}</span>
                      </div>
                      {lp && (
                        <div className="mt-1 flex gap-2" style={{ color: '#9ca3af' }}>
                          <span>{lp.bestWpm} WPM</span>
                          <span>{lp.bestAccuracy}%</span>
                          <span>{lp.attempts}{locale === 'zh' ? '次' : 'x'}</span>
                        </div>
                      )}
                      {(practiceCounts[lesson.id] ?? 0) > 0 && (
                        <div style={{ color: '#6b7280' }}>{(practiceCounts[lesson.id]).toLocaleString()} {locale === 'zh' ? '人练习过' : 'practiced'}</div>
                      )}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                        style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1f2937' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
