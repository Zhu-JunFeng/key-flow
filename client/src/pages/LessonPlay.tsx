import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Switch, Button } from '@arco-design/web-react';
import { getLessonById } from '../lib/lessons';
import { updateLessonProgress, calculateStars } from '../lib/progress';
import { useElapsedTime } from '../hooks/useElapsedTime';
import { useTyping } from '../hooks/useTyping';
import { resumeAudioContext } from '../lib/sounds';
import { reportSession } from '../lib/api';
import { t, getEncouragement, calculateXp, getLevelInfo } from '../lib/i18n';
import { useLocale } from '../lib/hooks';
import TypingArea from '../components/TypingArea';
import VirtualKeyboard from '../components/VirtualKeyboard';
import Stats from '../components/Stats';
import StarRating from '../components/StarRating';

export default function LessonPlay() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const locale = useLocale();
  const lessonId = parseInt(id ?? '1');
  const lesson = useMemo(() => getLessonById(lessonId), [lessonId]);
  const [textIndex, setTextIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [lastPressedKey, setLastPressedKey] = useState<string | undefined>();
  const [lastWasError, setLastWasError] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [showFingers, setShowFingers] = useState(true);
  const [encourageMsg, setEncourageMsg] = useState('');
  const [xpEarned, setXpEarned] = useState(0);
  const text = lesson?.texts[textIndex] ?? '';

  const prevBestWpm = parseInt(localStorage.getItem(`lesson_best_${lessonId}`) || '0');

  const onProgress = useCallback((s: { isComplete: boolean; wpm: number; accuracy: number; startTime: number | null; endTime: number | null }) => {
    if (s.isComplete && lesson) {
      setShowResult(true);

      // Report session
      const timeMs = s.startTime && s.endTime ? s.endTime - s.startTime : 0;
      reportSession({ chars: text.length, wpm: s.wpm, accuracy: s.accuracy, timeMs }).catch(() => {});

      // Increment lesson practice count
      fetch(`/api/lesson-counts/${lessonId}`, { method: 'POST' }).catch(() => {});

      // XP
      const currentXp = parseInt(localStorage.getItem('typerace_xp') || '0');
      const earned = calculateXp(s.wpm, s.accuracy, text.length, 0);
      localStorage.setItem('typerace_xp', String(currentXp + earned));
      setXpEarned(earned);

      // Encouragement
      const isNewRecord = s.wpm > prevBestWpm;
      if (isNewRecord) {
        localStorage.setItem(`lesson_best_${lessonId}`, String(s.wpm));
      }
      setEncourageMsg(getEncouragement(s.accuracy, s.wpm, isNewRecord));
    }
  }, [lesson, text.length, prevBestWpm, lessonId]);

  const { state: typingState, handleKeyDown, reset } = useTyping(text, onProgress);

  useEffect(() => {
    queueMicrotask(() => {
      reset();
      setShowResult(false);
      setEncourageMsg('');
      setXpEarned(0);
    });
  }, [text, reset]);
  useEffect(() => {
    if (typingState.isComplete && lesson && typingState.startTime && typingState.endTime) {
      updateLessonProgress(lessonId, typingState.wpm, typingState.accuracy, typingState.endTime - typingState.startTime);
    }
  }, [typingState.isComplete, lesson, lessonId, typingState.wpm, typingState.accuracy, typingState.startTime, typingState.endTime]);

  useEffect(() => {
    if (showResult) return;
    const handler = (e: KeyboardEvent) => {
      resumeAudioContext(); setLastPressedKey(e.key);
      const expected = text[typingState.currentIndex];
      if (e.key.length === 1 && expected !== undefined) setLastWasError(e.key !== expected); else setLastWasError(false);
      handleKeyDown(e);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyDown, showResult, text, typingState.currentIndex]);

  const timeElapsed = useElapsedTime(typingState.startTime, typingState.endTime);
  if (!lesson) {
    return (<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="text-lg" style={{ color: 'var(--text-muted)' }}>{locale === 'zh' ? '课程不存在' : 'Lesson not found'}</div>
      <Link to="/lessons" className="transition-colors" style={{ color: 'var(--primary-color)' }}>{locale === 'zh' ? '返回课程列表' : 'Back to lessons'}</Link>
    </div>);
  }

  const activeKey = !typingState.isComplete ? text[typingState.currentIndex] : undefined;
  const stars = calculateStars(typingState.wpm, typingState.accuracy);
  const levelInfo = getLevelInfo(parseInt(localStorage.getItem('typerace_xp') || '0'));

  const resultEmoji = stars >= 5 ? '🌟' : stars >= 3 ? '🎉' : stars >= 1 ? '👍' : '💪';
  const resultTitle = stars >= 5
    ? (locale === 'zh' ? '完美！' : 'Perfect!')
    : stars >= 3
    ? (locale === 'zh' ? '做得好！' : 'Well done!')
    : stars >= 1
    ? (locale === 'zh' ? '通过了！' : 'Passed!')
    : (locale === 'zh' ? '再试试！' : 'Try again!');

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="glass-card p-4 mb-5 flex items-center justify-between" style={{ cursor: 'default' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
        <div className="flex items-center gap-3">
          <Link to="/lessons" className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{lesson.title}</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{lesson.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums px-2.5 py-1 rounded-lg" style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>{textIndex + 1} / {lesson.texts.length}</span>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span>{locale === 'zh' ? '键盘' : 'KB'}</span>
            <Switch size="small" checked={showKeyboard} onChange={setShowKeyboard} />
          </div>
          {showKeyboard && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span>{locale === 'zh' ? '指引' : 'Guide'}</span>
              <Switch size="small" checked={showFingers} onChange={setShowFingers} />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-5">
        {lesson.texts.map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-500"
            style={{ background: i < textIndex ? '#10b981' : i === textIndex ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(148,163,184,0.2)' }} />
        ))}
      </div>

      <div className="mb-5"><Stats wpm={typingState.wpm} accuracy={typingState.accuracy} progress={typingState.currentIndex} total={text.length} timeElapsed={timeElapsed} /></div>

      {showResult ? (
        <div className="glass-card p-8 text-center space-y-5" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-5xl">{resultEmoji}</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{resultTitle}</h2>
          {encourageMsg && (
            <p className="text-lg font-semibold" style={{ color: 'var(--primary-color)' }}>{encourageMsg}</p>
          )}
          <div className="flex justify-center"><StarRating stars={stars} size="lg" /></div>
          <div className="flex justify-center gap-8">
            <div className="text-center"><div className="text-2xl font-extrabold" style={{ color: 'var(--primary-color)' }}>{typingState.wpm}</div><div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>WPM</div></div>
            <div className="text-center"><div className="text-2xl font-extrabold text-emerald-500">{typingState.accuracy}%</div><div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('practice.accuracy', locale)}</div></div>
            <div className="text-center"><div className="text-2xl font-extrabold" style={{ color: '#8b5cf6' }}>{timeElapsed ? Math.round(timeElapsed / 1000) : 0}s</div><div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('practice.time', locale)}</div></div>
          </div>
          {/* XP earned */}
          <div className="flex justify-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span>+<strong style={{ color: '#10b981' }}>{xpEarned} XP</strong></span>
            <span>Lv.{levelInfo.level} {t(levelInfo.title, locale)}</span>
          </div>
          <div className="inline-flex flex-col gap-1 text-[11px] px-4 py-3 rounded-xl" style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
            <span>★★★ {locale === 'zh' ? '准确率 ≥ 90%' : 'Accuracy ≥ 90%'}</span>
            <span>★★★★ {locale === 'zh' ? '准确率 ≥ 90% 且 WPM ≥ 30' : 'Accuracy ≥ 90% & WPM ≥ 30'}</span>
            <span>★★★★★ {locale === 'zh' ? '准确率 ≥ 95% 且 WPM ≥ 50' : 'Accuracy ≥ 95% & WPM ≥ 50'}</span>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button onClick={() => { reset(); setShowResult(false); }}>{locale === 'zh' ? '重试' : 'Retry'}</Button>
            {textIndex < lesson.texts.length - 1 ? (
              <Button type="primary" onClick={() => { setTextIndex(textIndex + 1); setShowResult(false); }}>{locale === 'zh' ? '下一段' : 'Next'}</Button>
            ) : (
              <button onClick={() => { navigate(`/lessons/${lessonId + 1}`); setTextIndex(0); }}
                className="px-5 py-2 rounded-xl text-white font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }}>{locale === 'zh' ? '下一课' : 'Next Lesson'}</button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <TypingArea text={text} currentIndex={typingState.currentIndex} errors={typingState.errors} isComplete={typingState.isComplete} />
          {!typingState.startTime && (
            <div className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{
                background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)',
              }}>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />{locale === 'zh' ? '开始输入...' : 'Start typing...'}
              </span>
            </div>
          )}
          {showKeyboard && <VirtualKeyboard activeKey={activeKey} pressedKey={lastPressedKey} isError={lastWasError} showFingers={showFingers} />}
        </div>
      )}
    </div>
  );
}
