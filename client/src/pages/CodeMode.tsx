import { useState, useEffect, useCallback } from 'react';
import { Button, Spin, Radio } from '@arco-design/web-react';
import Stats from '../components/Stats';
import VirtualKeyboard from '../components/VirtualKeyboard';
import { useElapsedTime } from '../hooks/useElapsedTime';
import { useTyping } from '../hooks/useTyping';
import { resumeAudioContext } from '../lib/sounds';
import { fetchCodeTexts } from '../lib/api';
import { reportSession } from '../lib/api';
import { submitScore } from '../lib/device';
import { tokenizeCode, TOKEN_COLORS } from '../lib/codeTexts';
import { getStoredAvatar, getStoredNickname } from '../lib/userPrefs';

interface CodeText {
  readonly id: string;
  readonly text: string;
  readonly language: string;
  readonly title: string;
  readonly difficulty: string;
}

export default function CodeMode() {
  const [codeTexts, setCodeTexts] = useState<readonly CodeText[]>([]);
  const [language, setLanguage] = useState('javascript');
  const [currentText, setCurrentText] = useState<CodeText | null>(null);
  const [loading, setLoading] = useState(true);
  const [showKeyboard] = useState(() => localStorage.getItem('showKeyboard') !== 'false');
  const [lastPressedKey, setLastPressedKey] = useState<string | undefined>();
  const [lastWasError, setLastWasError] = useState(false);
  const nickname = getStoredNickname();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const texts = await fetchCodeTexts(language);
      if (cancelled) return;

      setCodeTexts(texts);
      if (texts.length > 0) {
        setCurrentText(texts[Math.floor(Math.random() * texts.length)]);
      } else {
        setCurrentText(null);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [language]);

  const onProgress = useCallback((s: { isComplete: boolean; wpm: number; accuracy: number; startTime: number | null; endTime: number | null }) => {
    if (s.isComplete && currentText && nickname) {
      const timeMs = s.startTime && s.endTime ? s.endTime - s.startTime : 0;
      submitScore({
        nickname,
        avatar: getStoredAvatar(),
        wpm: s.wpm,
        accuracy: s.accuracy,
        textLength: currentText.text.length,
        mode: 'practice',
      });
      reportSession({ chars: currentText.text.length, wpm: s.wpm, accuracy: s.accuracy, timeMs });
    }
  }, [currentText, nickname]);

  const { state, handleKeyDown, reset } = useTyping(currentText?.text ?? '', onProgress);

  useEffect(() => { reset(); }, [currentText, reset]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      resumeAudioContext();
      setLastPressedKey(e.key);
      if (currentText) {
        const expected = currentText.text[state.currentIndex];
        if (e.key.length === 1 && expected !== undefined) {
          setLastWasError(e.key !== expected);
        } else { setLastWasError(false); }
      }
      handleKeyDown(e);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyDown, currentText, state.currentIndex]);

  const nextText = () => {
    if (codeTexts.length > 0) {
      const next = codeTexts[Math.floor(Math.random() * codeTexts.length)];
      setCurrentText(next);
    }
  };

  const timeElapsed = useElapsedTime(state.startTime, state.endTime);
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const colorScheme = isDark ? TOKEN_COLORS.dark : TOKEN_COLORS.light;

  if (loading || !currentText) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Spin size={32} /></div>;
  }

  // Tokenize for syntax highlighting
  const tokens = tokenizeCode(currentText.text, currentText.language);

  // Build character-to-token-color mapping
  const charColors: string[] = [];
  for (const token of tokens) {
    for (let i = 0; i < token.text.length; i++) {
      charColors.push(colorScheme[token.type]);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold" style={{
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>代码模式</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>练习编程符号和代码输入</p>
        </div>
      </div>

      <div className="glass-card p-4 mb-6 flex flex-wrap items-center justify-between gap-3" style={{ cursor: 'default' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
        <div className="flex items-center gap-3">
              <Radio.Group type="button" value={language} onChange={v => { setLoading(true); setLanguage(v); reset(); }}
            options={[
              { label: 'JavaScript', value: 'javascript' },
              { label: 'Python', value: 'python' },
              { label: 'Go', value: 'go' },
            ]} size="small" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary-color)' }}>
            {currentText.title}
          </span>
          <span className="text-xs px-2 py-1 rounded" style={{
            background: currentText.difficulty === 'easy' ? 'rgba(16,185,129,0.1)' : currentText.difficulty === 'medium' ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)',
            color: currentText.difficulty === 'easy' ? '#10b981' : currentText.difficulty === 'medium' ? '#f59e0b' : '#ef4444',
          }}>
            {currentText.difficulty === 'easy' ? '简单' : currentText.difficulty === 'medium' ? '中等' : '困难'}
          </span>
        </div>
      </div>

      <div className="mb-6"><Stats wpm={state.wpm} accuracy={state.accuracy} progress={state.currentIndex} total={currentText.text.length} timeElapsed={timeElapsed} /></div>

      {/* Syntax-highlighted typing area */}
      <div className="rounded-3xl overflow-hidden mb-6" style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
      }}>
        <div className="px-6 py-5" style={{ background: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.85)' }}>
          <pre className="text-sm leading-[2] font-mono whitespace-pre-wrap break-all select-none">
            {currentText.text.split('').map((char, i) => {
              let cls = 'transition-colors duration-75 ';
              let color = charColors[i] ?? 'var(--text-primary)';
              if (i < state.currentIndex) {
                if (state.errors.has(i)) {
                  cls += 'bg-red-500/20 rounded-sm';
                  color = '#ef4444';
                }
                // keep original syntax color for correct chars
              } else if (i === state.currentIndex && !state.isComplete) {
                cls += 'bg-indigo-500/20 rounded-sm ring-2 ring-indigo-400 ring-offset-1';
                color = '#6366f1';
              } else {
                // Use dimmed syntax color for untyped
                color = charColors[i] ?? 'var(--text-muted)';
              }
              return (
                <span key={i} className={cls} style={{ color }}>
                  {char === ' ' ? '\u00A0' : char}
                </span>
              );
            })}
          </pre>
        </div>
      </div>

      {state.isComplete ? (
        <div className="text-center space-y-5">
          <div className="glass-card p-6" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <h2 className="text-2xl font-extrabold text-emerald-500 mb-3">完成！</h2>
            <div className="flex justify-center gap-8 text-lg">
              <span style={{ color: 'var(--text-secondary)' }}>速度: <strong style={{ color: 'var(--primary-color)' }}>{state.wpm} WPM</strong></span>
              <span style={{ color: 'var(--text-secondary)' }}>准确率: <strong className="text-emerald-500">{state.accuracy}%</strong></span>
            </div>
          </div>
          <Button type="primary" size="large" onClick={nextText}>下一题</Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{
              background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)',
            }}>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              {state.startTime ? '继续打字...' : '点击任意键开始'}
            </span>
          </div>
          {showKeyboard && <VirtualKeyboard activeKey={currentText.text[state.currentIndex]} pressedKey={lastPressedKey} isError={lastWasError} showFingers />}
        </div>
      )}
    </div>
  );
}
