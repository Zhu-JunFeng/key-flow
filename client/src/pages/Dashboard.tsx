import { useState, useEffect, useRef, useCallback } from 'react';
import { Spin } from '@arco-design/web-react';
import { fetchDailyStats, fetchDashboardInsights, fetchKeyErrorStats, type DashboardInsights } from '../lib/api';
import { loadProfile } from '../lib/device';
import { useLocale } from '../lib/hooks';

interface DailyStat {
  readonly date: string;
  readonly chars: number;
  readonly wpm: number;
  readonly accuracy: number;
  readonly sessions: number;
  readonly timeMs: number;
}

interface KeyStat {
  readonly keyChar: string;
  readonly correct: number;
  readonly incorrect: number;
}

export default function Dashboard() {
  const locale = useLocale();
  const [dailyStats, setDailyStats] = useState<readonly DailyStat[]>([]);
  const [keyStats, setKeyStats] = useState<readonly KeyStat[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    Promise.all([
      fetchDailyStats(30),
      fetchKeyErrorStats(),
      loadProfile(),
      fetchDashboardInsights(),
    ]).then(([daily, keys, prof, smartInsights]) => {
      setDailyStats(daily);
      setKeyStats(keys);
      setProfile(prof);
       setInsights(smartInsights);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Draw WPM trend chart
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || dailyStats.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    // Clear
    ctx.clearRect(0, 0, w, h);

    const wpms = dailyStats.map(d => d.wpm);
    const maxWpm = Math.max(...wpms, 10);
    const minWpm = Math.min(...wpms);

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(71,85,105,0.3)' : 'rgba(226,232,240,0.8)';

    // Grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = textColor;
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      const val = Math.round(maxWpm - (maxWpm - minWpm) * (i / 4));
      ctx.fillText(String(val), padding.left - 8, y + 4);
    }

    // X-axis labels
    ctx.fillStyle = textColor;
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(dailyStats.length / 6));
    dailyStats.forEach((d, i) => {
      if (i % step === 0 || i === dailyStats.length - 1) {
        const x = padding.left + (i / (dailyStats.length - 1 || 1)) * chartW;
        ctx.fillText(d.date.slice(5), x, h - padding.bottom + 18);
      }
    });

    // Line chart
    if (dailyStats.length > 1) {
      // Gradient fill
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top + chartH);
      dailyStats.forEach((d, i) => {
        const x = padding.left + (i / (dailyStats.length - 1)) * chartW;
        const y = padding.top + chartH - ((d.wpm - minWpm) / (maxWpm - minWpm || 1)) * chartH;
        ctx.lineTo(x, y);
      });
      ctx.lineTo(padding.left + chartW, padding.top + chartH);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Line
      ctx.beginPath();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      dailyStats.forEach((d, i) => {
        const x = padding.left + (i / (dailyStats.length - 1)) * chartW;
        const y = padding.top + chartH - ((d.wpm - minWpm) / (maxWpm - minWpm || 1)) * chartH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Dots
      dailyStats.forEach((d, i) => {
        const x = padding.left + (i / (dailyStats.length - 1)) * chartW;
        const y = padding.top + chartH - ((d.wpm - minWpm) / (maxWpm - minWpm || 1)) * chartH;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#6366f1';
        ctx.fill();
        ctx.strokeStyle = isDark ? '#1e293b' : '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }
  }, [dailyStats]);

  useEffect(() => { drawChart(); }, [drawChart]);

  // Key error heatmap data
  const keyErrorMap = new Map(keyStats.map(k => [k.keyChar, k]));
  const KEYBOARD_KEYS = [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l'],
    ['z','x','c','v','b','n','m'],
  ];

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Spin size={32} /></div>;
  }

  const totalChars = dailyStats.reduce((sum, d) => sum + d.chars, 0);
  const totalSessions = dailyStats.reduce((sum, d) => sum + d.sessions, 0);
  const totalTimeMs = dailyStats.reduce((sum, d) => sum + d.timeMs, 0);
  const avgWpm = dailyStats.length > 0
    ? Math.round(dailyStats.reduce((s, d) => s + d.wpm, 0) / dailyStats.length)
    : 0;
  const bestWpm = dailyStats.length > 0 ? Math.round(Math.max(...dailyStats.map(d => d.wpm))) : 0;
  const streakDays = (profile as { streakDays?: number } | null)?.streakDays ?? 0;
  const coach = insights?.coach;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2" style={{
          background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>{locale === 'zh' ? '统计仪表盘' : 'Dashboard'}</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '追踪你的打字进步' : 'Track your typing progress'}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard label={locale === 'zh' ? '连续打卡' : 'Streak'} value={locale === 'zh' ? `${streakDays}天` : `${streakDays}d`} color="#f59e0b" />
        <SummaryCard label={locale === 'zh' ? '平均 WPM' : 'Avg WPM'} value={String(avgWpm)} color="#6366f1" />
        <SummaryCard label={locale === 'zh' ? '最高 WPM' : 'Best WPM'} value={String(bestWpm)} color="#10b981" />
        <SummaryCard label={locale === 'zh' ? '总练习' : 'Sessions'} value={locale === 'zh' ? `${totalSessions}次` : String(totalSessions)} color="#8b5cf6" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard label={locale === 'zh' ? '总字符' : 'Total Chars'} value={totalChars.toLocaleString()} color="#3b82f6" />
        <SummaryCard label={locale === 'zh' ? '总时长' : 'Total Time'} value={locale === 'zh' ? `${Math.round(totalTimeMs / 60000)}分` : `${Math.round(totalTimeMs / 60000)}m`} color="#ec4899" />
        <SummaryCard label={locale === 'zh' ? '30天准确率' : '30d Accuracy'} value={`${dailyStats.length > 0 ? Math.round(dailyStats.reduce((s,d) => s+d.accuracy, 0)/dailyStats.length) : 0}%`} color="#10b981" />
        <SummaryCard label={locale === 'zh' ? '日均字符' : 'Daily Avg'} value={String(dailyStats.length > 0 ? Math.round(totalChars / dailyStats.length) : 0)} color="#f43f5e" />
      </div>

      {insights && coach && (
        <>
          <div className="glass-card p-5 sm:p-6 mb-6" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{locale === 'zh' ? '智能训练建议' : 'Coach Suggestions'}</h2>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {locale === 'zh' ? '当前优先级' : 'Priority'}: <strong style={{ color: 'var(--primary-color)' }}>{formatPriority(coach.priority, locale)}</strong>
                  {' '}· {locale === 'zh' ? '推荐模式' : 'Mode'}: <strong style={{ color: '#8b5cf6' }}>{formatMode(coach.recommendedMode, locale)}</strong>
                  {' '}· {locale === 'zh' ? '建议难度' : 'Difficulty'}: <strong style={{ color: '#f59e0b' }}>{coach.suggestedDifficulty}</strong>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <MetricChip label={locale === 'zh' ? '目标 WPM' : 'Target WPM'} value={String(coach.targetWpm)} color="#6366f1" />
                <MetricChip label={locale === 'zh' ? '目标准确率' : 'Target Acc'} value={`${coach.targetAccuracy}%`} color="#10b981" />
                <MetricChip label={locale === 'zh' ? '周练习次数' : 'Weekly Sessions'} value={String(coach.targetSessions)} color="#f97316" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {coach.drills.map(drill => (
                <div key={drill.id} className="rounded-2xl p-4" style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--glass-border)',
                }}>
                  <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{drill.title}</div>
                  <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{drill.description}</div>
                  <div className="mt-3 text-[11px] font-medium" style={{ color: 'var(--primary-color)' }}>{drill.path}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {(coach.focusKeys.length > 0 ? coach.focusKeys : [locale === 'zh' ? '基础键位' : 'home row']).map(key => (
                <span key={key} className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.22)',
                  color: '#ef4444',
                }}>
                  {key}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="glass-card p-5" style={{ cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{locale === 'zh' ? '本周动量' : 'Weekly Momentum'}</h2>
              <div className="grid grid-cols-2 gap-3">
                <SummaryCard label={locale === 'zh' ? '稳定度' : 'Consistency'} value={`${insights.consistencyScore}`} color="#8b5cf6" />
                <SummaryCard label={locale === 'zh' ? 'WPM 变化' : 'WPM Delta'} value={formatDelta(insights.wpmTrend, 'WPM')} color={insights.wpmTrend >= 0 ? '#10b981' : '#ef4444'} />
                <SummaryCard label={locale === 'zh' ? '准确率变化' : 'Accuracy Delta'} value={formatDelta(insights.accuracyTrend, '%')} color={insights.accuracyTrend >= 0 ? '#10b981' : '#ef4444'} />
                <SummaryCard label={locale === 'zh' ? '本周分钟数' : 'Weekly Minutes'} value={String(insights.weeklyMinutes)} color="#3b82f6" />
              </div>
              <div className="mt-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {locale === 'zh'
                  ? <>本周已完成 <strong style={{ color: 'var(--primary-color)' }}>{insights.weeklySessions}</strong> 次训练，累计输入 <strong style={{ color: '#f97316' }}>{insights.weeklyChars.toLocaleString()}</strong> 字符。</>
                  : <>This week you completed <strong style={{ color: 'var(--primary-color)' }}>{insights.weeklySessions}</strong> sessions and typed <strong style={{ color: '#f97316' }}>{insights.weeklyChars.toLocaleString()}</strong> chars.</>}
                {insights.bestHour && (
                  <>
                    {locale === 'zh'
                      ? <> 你的高峰时段在 <strong style={{ color: '#10b981' }}>{formatHour(insights.bestHour.hour)}</strong> 左右，平均可达到 <strong style={{ color: '#10b981' }}>{insights.bestHour.avgWpm} WPM</strong>。</>
                      : <> Your best hour is around <strong style={{ color: '#10b981' }}>{formatHour(insights.bestHour.hour)}</strong>, where you average <strong style={{ color: '#10b981' }}>{insights.bestHour.avgWpm} WPM</strong>.</>}
                  </>
                )}
              </div>
            </div>

            <div className="glass-card p-5" style={{ cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{locale === 'zh' ? '模式拆解' : 'Mode Breakdown'}</h2>
              {insights.modeBreakdown.length === 0 ? (
                <div className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>{locale === 'zh' ? '开始练习后这里会给出模式画像' : 'Start practicing to unlock mode insights'}</div>
              ) : (
                <div className="space-y-3">
                  {insights.modeBreakdown.map(mode => (
                    <div key={mode.mode} className="rounded-2xl p-3.5" style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--glass-border)',
                    }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{mode.mode}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{mode.sessions} {locale === 'zh' ? '次' : ''}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <span>{locale === 'zh' ? '均速' : 'Avg'} <strong style={{ color: '#6366f1' }}>{mode.avgWpm} WPM</strong></span>
                        <span>{locale === 'zh' ? '准确率' : 'Accuracy'} <strong style={{ color: '#10b981' }}>{mode.avgAccuracy}%</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* WPM Trend Chart */}
      <div className="glass-card p-4 sm:p-6 mb-6" style={{ cursor: 'default' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{locale === 'zh' ? 'WPM 趋势 (30天)' : 'WPM Trend (30d)'}</h2>
        {dailyStats.length > 0 ? (
          <canvas ref={canvasRef} style={{ width: '100%', height: '240px' }} />
        ) : (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
            {locale === 'zh' ? '还没有数据，开始练习吧！' : 'No data yet. Start practicing.'}
          </div>
        )}
      </div>

      {/* Key Error Heatmap */}
      <div className="glass-card p-4 sm:p-6" style={{ cursor: 'default' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{locale === 'zh' ? '按键错误热力图' : 'Key Error Heatmap'}</h2>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium" style={{ color: '#10b981' }}>{locale === 'zh' ? '优秀' : 'Strong'}</span>
            <div className="w-24 h-2 rounded-full overflow-hidden" style={{
              background: 'linear-gradient(90deg, #10b981, #fbbf24, #ef4444)',
            }} />
            <span className="text-[10px] font-medium" style={{ color: '#ef4444' }}>{locale === 'zh' ? '薄弱' : 'Weak'}</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 sm:gap-[6px] py-3 sm:py-4 px-1 sm:px-2 rounded-2xl overflow-x-auto" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--glass-border)',
        }}>
          {KEYBOARD_KEYS.map((row, ri) => (
            <div key={ri} className="flex gap-1 sm:gap-[6px]" style={{ marginLeft: ri === 1 ? (window.innerWidth < 640 ? 10 : 20) : ri === 2 ? (window.innerWidth < 640 ? 22 : 44) : 0 }}>
              {row.map(key => {
                const stat = keyErrorMap.get(key);
                const total = stat ? stat.correct + stat.incorrect : 0;
                const errorRate = stat && total > 0 ? stat.incorrect / total : 0;
                const accuracy = total > 0 ? Math.round((1 - errorRate) * 100) : -1;

                // Smooth gradient: green → yellow → red
                let bgColor: string;
                let textColor: string;
                let borderColor: string;
                let shadowColor: string;
                if (total === 0) {
                  bgColor = 'var(--bg-card)';
                  textColor = 'var(--text-muted)';
                  borderColor = 'var(--glass-border)';
                  shadowColor = 'transparent';
                } else if (errorRate <= 0.05) {
                  bgColor = 'linear-gradient(135deg, #10b981, #34d399)';
                  textColor = '#fff';
                  borderColor = '#34d399';
                  shadowColor = 'rgba(16,185,129,0.3)';
                } else if (errorRate <= 0.15) {
                  bgColor = 'linear-gradient(135deg, #84cc16, #a3e635)';
                  textColor = '#1a2e05';
                  borderColor = '#a3e635';
                  shadowColor = 'rgba(132,204,22,0.25)';
                } else if (errorRate <= 0.25) {
                  bgColor = 'linear-gradient(135deg, #eab308, #fbbf24)';
                  textColor = '#451a03';
                  borderColor = '#fbbf24';
                  shadowColor = 'rgba(234,179,8,0.3)';
                } else if (errorRate <= 0.4) {
                  bgColor = 'linear-gradient(135deg, #f97316, #fb923c)';
                  textColor = '#fff';
                  borderColor = '#fb923c';
                  shadowColor = 'rgba(249,115,22,0.3)';
                } else {
                  bgColor = 'linear-gradient(135deg, #dc2626, #ef4444)';
                  textColor = '#fff';
                  borderColor = '#f87171';
                  shadowColor = 'rgba(239,68,68,0.35)';
                }

                return (
                  <div key={key} className="group relative">
                    <div
                      className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex flex-col items-center justify-center font-semibold transition-all duration-200 hover:scale-110 hover:-translate-y-0.5 cursor-default"
                      style={{
                        background: bgColor,
                        border: `1.5px solid ${borderColor}`,
                        color: textColor,
                        boxShadow: `0 2px 8px ${shadowColor}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                      }}>
                      <span className="text-[11px] sm:text-[14px]">{key}</span>
                      {total > 0 && (
                        <span className="text-[6px] sm:text-[8px] opacity-75 -mt-px font-medium">
                          {accuracy}%
                        </span>
                      )}
                    </div>
                    {/* Tooltip */}
                    {total > 0 && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-xl text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30"
                        style={{
                          background: '#1e293b',
                          color: '#f1f5f9',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                        }}>
                        <div className="font-bold text-sm mb-1" style={{ color: '#fff' }}>{key.toUpperCase()}</div>
                        <div className="flex gap-3">
                          <span><span style={{ color: '#34d399' }}>{stat!.correct}</span> {locale === 'zh' ? '正确' : 'correct'}</span>
                          <span><span style={{ color: '#f87171' }}>{stat!.incorrect}</span> {locale === 'zh' ? '错误' : 'errors'}</span>
                        </div>
                        <div className="mt-1">
                          {locale === 'zh' ? '准确率' : 'Accuracy'}: <span style={{ color: accuracy >= 90 ? '#34d399' : accuracy >= 75 ? '#fbbf24' : '#f87171', fontWeight: 700 }}>{accuracy}%</span>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                          style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1e293b' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {/* Space bar row */}
          <div className="flex gap-1 sm:gap-[6px]" style={{ marginLeft: window.innerWidth < 640 ? 22 : 44 }}>
            <div className="h-7 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-medium"
              style={{
                width: window.innerWidth < 640 ? '140px' : '220px',
                background: 'var(--bg-card)',
                border: '1.5px solid var(--glass-border)',
                color: 'var(--text-muted)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
              }}>
              {locale === 'zh' ? '空格' : 'space'}
            </div>
          </div>
        </div>
        {/* Stats summary below keyboard */}
        {keyStats.length > 0 && (() => {
          const totalCorrect = keyStats.reduce((s, k) => s + k.correct, 0);
          const totalIncorrect = keyStats.reduce((s, k) => s + k.incorrect, 0);
          const totalAll = totalCorrect + totalIncorrect;
          const overallAccuracy = totalAll > 0 ? Math.round((totalCorrect / totalAll) * 100) : 0;
          const worstKeys = [...keyStats]
            .filter(k => k.correct + k.incorrect > 5)
            .sort((a, b) => (b.incorrect / (b.correct + b.incorrect)) - (a.incorrect / (a.correct + a.incorrect)))
            .slice(0, 3);
          return (
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-4 text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>{locale === 'zh' ? '总准确率' : 'Overall accuracy'}: <strong style={{ color: overallAccuracy >= 90 ? '#10b981' : overallAccuracy >= 75 ? '#eab308' : '#ef4444' }}>{overallAccuracy}%</strong></span>
              <span>{locale === 'zh' ? '总按键' : 'Total keys'}: <strong style={{ color: 'var(--text-secondary)' }}>{totalAll.toLocaleString()}</strong></span>
              {worstKeys.length > 0 && (
                <span>{locale === 'zh' ? '最薄弱' : 'Weakest'}: {worstKeys.map(k => (
                  <strong key={k.keyChar} className="inline-flex items-center justify-center w-5 h-5 rounded mx-0.5 text-[10px]"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                    {k.keyChar}
                  </strong>
                ))}</span>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { readonly label: string; readonly value: string; readonly color: string }) {
  return (
    <div className="rounded-2xl p-3.5" style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(var(--glass-blur))',
      border: '1px solid var(--glass-border)',
      boxShadow: 'var(--glass-shadow)',
    }}>
      <div className="text-[11px] mb-1 font-medium" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-xl font-bold tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}

function MetricChip({ label, value, color }: { readonly label: string; readonly value: string; readonly color: string }) {
  return (
    <div className="px-3 py-2 rounded-2xl min-w-[88px]" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--glass-border)',
    }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-sm font-bold tabular-nums mt-1" style={{ color }}>{value}</div>
    </div>
  );
}

function formatDelta(value: number, suffix: string): string {
  return `${value >= 0 ? '+' : ''}${value}${suffix}`;
}

function formatPriority(priority: DashboardInsights['coach']['priority'], locale: 'zh' | 'en'): string {
  switch (priority) {
    case 'accuracy': return locale === 'zh' ? '准确率修正' : 'Accuracy';
    case 'stamina': return locale === 'zh' ? '耐力节奏' : 'Stamina';
    case 'competition': return locale === 'zh' ? '实战对抗' : 'Competition';
    default: return locale === 'zh' ? '速度推进' : 'Speed';
  }
}

function formatMode(mode: DashboardInsights['coach']['recommendedMode'], locale: 'zh' | 'en'): string {
  switch (mode) {
    case 'lessons': return locale === 'zh' ? '课程' : 'Lessons';
    case 'code': return locale === 'zh' ? '代码模式' : 'Code Mode';
    case 'multiplayer': return locale === 'zh' ? '多人竞速' : 'Multiplayer';
    case 'daily': return locale === 'zh' ? '每日挑战' : 'Daily Challenge';
    default: return locale === 'zh' ? '自由练习' : 'Practice';
  }
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}
