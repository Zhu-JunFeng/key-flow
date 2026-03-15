import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Radio } from '@arco-design/web-react';
import TypingArea from '../components/TypingArea';
import VirtualKeyboard from '../components/VirtualKeyboard';
import Stats from '../components/Stats';
import { useTyping } from '../hooks/useTyping';
import { resumeAudioContext } from '../lib/sounds';
import { reportSession } from '../lib/api';
import { t, getEncouragement, calculateXp } from '../lib/i18n';
import { useLocale } from '../lib/hooks';
import { generateWordCountText, generateSymbolText, CLASSIC_PASSAGES, FAMOUS_QUOTES, type SymbolTrainingType } from '../lib/practiceTexts';
import { Link } from 'react-router-dom';

type ModeId = 'wordcount' | 'free' | 'strict' | 'symbols' | 'classics' | 'quotes';

export default function PracticeModes() {
  const locale = useLocale();
  const [mode, setMode] = useState<ModeId | null>(null);

  if (!mode) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/practice"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold" style={{
              background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>{locale === 'zh' ? '更多练习模式' : 'More Practice Modes'}</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {locale === 'zh' ? '选择一种特殊练习模式' : 'Choose a special practice mode'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { id: 'wordcount' as const, icon: '🔢', titleZh: '词数挑战', titleEn: 'Word Count', descZh: '打50/100/200个词，挑战完成时间', descEn: 'Type 50/100/200 words, challenge your time', gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
            { id: 'free' as const, icon: '🌿', titleZh: '自由练习', titleEn: 'Free Practice', descZh: '无计时无分数，放松打字', descEn: 'No timer, no score, just relax and type', gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
            { id: 'strict' as const, icon: '🚫', titleZh: '严格模式', titleEn: 'Strict Mode', descZh: '不允许退格！必须一次打对', descEn: 'No backspace allowed! Get it right first time', gradient: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' },
            { id: 'symbols' as const, icon: '!@#', titleZh: '数字符号', titleEn: 'Numbers & Symbols', descZh: '专练数字、符号和特殊字符', descEn: 'Practice numbers, symbols and special chars', gradient: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)' },
            { id: 'classics' as const, icon: '📖', titleZh: '经典文学', titleEn: 'Classic Literature', descZh: '打名著经典段落', descEn: 'Type classic literature passages', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)' },
            { id: 'quotes' as const, icon: '💬', titleZh: '名人名言', titleEn: 'Famous Quotes', descZh: '打名人经典语录', descEn: 'Type famous quotes from great minds', gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)' },
          ].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className="glass-card group relative block p-6 cursor-pointer text-left w-full"
              style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-md"
                style={{ background: m.gradient }}>
                {m.icon}
              </div>
              <h3 className="font-bold text-sm mb-1.5 group-hover:text-indigo-600 transition-colors" style={{ color: 'var(--text-primary)' }}>
                {locale === 'zh' ? m.titleZh : m.titleEn}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {locale === 'zh' ? m.descZh : m.descEn}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setMode(null)}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-2xl font-extrabold" style={{
          background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          {mode === 'wordcount' && (locale === 'zh' ? '词数挑战' : 'Word Count Challenge')}
          {mode === 'free' && (locale === 'zh' ? '自由练习' : 'Free Practice')}
          {mode === 'strict' && (locale === 'zh' ? '严格模式' : 'Strict Mode')}
          {mode === 'symbols' && (locale === 'zh' ? '数字符号训练' : 'Number & Symbol Training')}
          {mode === 'classics' && (locale === 'zh' ? '经典文学' : 'Classic Literature')}
          {mode === 'quotes' && (locale === 'zh' ? '名人名言' : 'Famous Quotes')}
        </h1>
      </div>

      {mode === 'wordcount' && <WordCountMode onBack={() => setMode(null)} />}
      {mode === 'free' && <FreeMode onBack={() => setMode(null)} />}
      {mode === 'strict' && <StrictMode onBack={() => setMode(null)} />}
      {mode === 'symbols' && <SymbolMode onBack={() => setMode(null)} />}
      {mode === 'classics' && <ClassicsMode onBack={() => setMode(null)} />}
      {mode === 'quotes' && <QuotesMode onBack={() => setMode(null)} />}
    </div>
  );
}

// ============ Word Count Challenge ============
function WordCountMode({ onBack }: { readonly onBack: () => void }) {
  const locale = useLocale();
  const [wordCount, setWordCount] = useState(50);
  const [practiceText, setPracticeText] = useState('');
  const [started, setStarted] = useState(false);

  const startChallenge = () => {
    setPracticeText(generateWordCountText(wordCount));
    setStarted(true);
  };

  if (!started) {
    return (
      <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          {locale === 'zh' ? '选择词数：' : 'Choose word count:'}
        </p>
        <Radio.Group type="button" value={wordCount} onChange={v => setWordCount(v)}
          options={[
            { label: '50', value: 50 },
            { label: '100', value: 100 },
            { label: '200', value: 200 },
          ]} />
        <div>
          <Button type="primary" size="large" onClick={startChallenge}>
            {locale === 'zh' ? '开始' : 'Start'}
          </Button>
        </div>
      </div>
    );
  }

  return <PracticeSession text={practiceText} onBack={onBack} onNew={startChallenge} modeName="wordcount" />;
}

// ============ Free Practice ============
function FreeMode({ onBack }: { readonly onBack: () => void }) {
  const [practiceText] = useState(() => generateWordCountText(30));
  return <PracticeSession text={practiceText} onBack={onBack} onNew={() => window.location.reload()} modeName="free" hiddenStats />;
}

// ============ Strict Mode ============
function StrictMode({ onBack }: { readonly onBack: () => void }) {
  const locale = useLocale();
  const [practiceText, setPracticeText] = useState('');
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
        <div className="text-5xl mb-2">🚫</div>
        <p style={{ color: 'var(--text-secondary)' }}>
          {locale === 'zh'
            ? '退格键被禁用！每个字符必须一次打对。这是对准确性的终极考验。'
            : 'Backspace is disabled! Every character must be typed correctly the first time. The ultimate accuracy test.'}
        </p>
        <Button type="primary" size="large" onClick={() => {
          setPracticeText(generateWordCountText(30));
          setStarted(true);
        }}>
          {locale === 'zh' ? '接受挑战' : 'Accept Challenge'}
        </Button>
      </div>
    );
  }

  return <PracticeSession text={practiceText} onBack={onBack} onNew={() => {
    setPracticeText(generateWordCountText(30));
  }} modeName="strict" strictMode />;
}

// ============ Symbol Training ============
function SymbolMode({ onBack }: { readonly onBack: () => void }) {
  const locale = useLocale();
  const [symbolType, setSymbolType] = useState<SymbolTrainingType>('numbers');
  const [practiceText, setPracticeText] = useState('');
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          {locale === 'zh' ? '选择训练类型：' : 'Choose training type:'}
        </p>
        <Radio.Group type="button" value={symbolType} onChange={v => setSymbolType(v as SymbolTrainingType)}
          options={[
            { label: locale === 'zh' ? '数字' : 'Numbers', value: 'numbers' },
            { label: locale === 'zh' ? '符号' : 'Symbols', value: 'symbols' },
            { label: locale === 'zh' ? '混合' : 'Mixed', value: 'mixed' },
          ]} />
        <div>
          <Button type="primary" size="large" onClick={() => {
            setPracticeText(generateSymbolText(symbolType, 4));
            setStarted(true);
          }}>
            {locale === 'zh' ? '开始训练' : 'Start Training'}
          </Button>
        </div>
      </div>
    );
  }

  return <PracticeSession text={practiceText} onBack={onBack} onNew={() => {
    setPracticeText(generateSymbolText(symbolType, 4));
  }} modeName="symbols" />;
}

// ============ Classics Mode ============
function ClassicsMode({ onBack: _onBack }: { readonly onBack: () => void }) {
  const locale = useLocale();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const passages = locale === 'zh' ? CLASSIC_PASSAGES.zh : CLASSIC_PASSAGES.en;

  if (selectedIdx === null) {
    return (
      <div className="space-y-3">
        {passages.map((p, i) => (
          <button key={i} onClick={() => setSelectedIdx(i)}
            className="glass-card p-4 w-full text-left block"
            style={{ cursor: 'pointer' }}>
            <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{p.title}</h3>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{p.text.slice(0, 100)}...</p>
          </button>
        ))}
      </div>
    );
  }

  return <PracticeSession text={passages[selectedIdx].text} displayText={(passages[selectedIdx] as { display?: string }).display} onBack={() => setSelectedIdx(null)} onNew={() => {
    const next = (selectedIdx + 1) % passages.length;
    setSelectedIdx(next);
  }} modeName="classics" />;
}

// ============ Quotes Mode ============
function QuotesMode({ onBack }: { readonly onBack: () => void }) {
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * FAMOUS_QUOTES.length));
  const quote = FAMOUS_QUOTES[quoteIdx];

  return (
    <div>
      <div className="text-center mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        — {quote.author}
      </div>
      <PracticeSession text={quote.text} onBack={onBack} onNew={() => {
        setQuoteIdx((quoteIdx + 1) % FAMOUS_QUOTES.length);
      }} modeName="quotes" />
    </div>
  );
}

// ============ Shared Practice Session Component ============
function PracticeSession({
  text,
  displayText,
  onBack,
  onNew,
  modeName: _modeName,
  strictMode = false,
  hiddenStats = false,
}: {
  readonly text: string;
  readonly displayText?: string;
  readonly onBack: () => void;
  readonly onNew: () => void;
  readonly modeName: string;
  readonly strictMode?: boolean;
  readonly hiddenStats?: boolean;
}) {
  const locale = useLocale();
  const [showKeyboard] = useState(() => localStorage.getItem('showKeyboard') !== 'false');
  const [lastPressedKey, setLastPressedKey] = useState<string | undefined>();
  const [lastWasError, setLastWasError] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  const typingOptions = useMemo(() => ({ strictMode }), [strictMode]);
  const onProgress = useCallback((s: { isComplete: boolean; wpm: number; accuracy: number; startTime: number | null; endTime: number | null }) => {
    if (s.isComplete && text) {
      const timeMs = s.startTime && s.endTime ? s.endTime - s.startTime : 0;
      reportSession({ chars: text.length, wpm: s.wpm, accuracy: s.accuracy, timeMs });
      const xp = calculateXp(s.wpm, s.accuracy, text.length, maxCombo);
      const currentXp = parseInt(localStorage.getItem('typerace_xp') || '0');
      localStorage.setItem('typerace_xp', String(currentXp + xp));
    }
  }, [text, maxCombo]);

  const { state, handleKeyDown, reset } = useTyping(text, onProgress, typingOptions);

  useEffect(() => { reset(); setCombo(0); setMaxCombo(0); }, [text, reset]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      resumeAudioContext();
      setLastPressedKey(e.key);
      const expectedChar = text[state.currentIndex];
      if (e.key.length === 1 && expectedChar !== undefined) {
        const isCorrect = e.key === expectedChar;
        setLastWasError(!isCorrect);
        if (isCorrect) {
          setCombo(prev => {
            const newCombo = prev + 1;
            setMaxCombo(mc => Math.max(mc, newCombo));
            return newCombo;
          });
        } else {
          setCombo(0);
        }
      } else {
        setLastWasError(false);
      }
      handleKeyDown(e);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyDown, text, state.currentIndex]);

  const timeElapsed = state.startTime ? (state.endTime ?? Date.now()) - state.startTime : undefined;

  return (
    <div>
      {/* Strict mode warning */}
      {strictMode && !state.isComplete && (
        <div className="text-center text-xs mb-3 px-3 py-1.5 rounded-full inline-flex items-center gap-1 mx-auto" style={{
          background: 'rgba(239,68,68,0.08)',
          color: '#ef4444',
          border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex',
          justifyContent: 'center',
        }}>
          🚫 {locale === 'zh' ? '退格键已禁用' : 'Backspace disabled'}
        </div>
      )}

      {!hiddenStats && (
        <div className="mb-6"><Stats wpm={state.wpm} accuracy={state.accuracy} progress={state.currentIndex} total={text.length} timeElapsed={timeElapsed} /></div>
      )}

      <div className="mb-6"><TypingArea text={text} displayText={displayText} currentIndex={state.currentIndex} errors={state.errors} isComplete={state.isComplete} /></div>

      {state.isComplete ? (
        <div className="text-center space-y-5">
          <div className="glass-card p-6" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <h2 className="text-2xl font-extrabold text-emerald-600 mb-2">{t('practice.done', locale)}</h2>
            <p className="text-lg font-semibold mb-3" style={{ color: 'var(--primary-color)' }}>
              {getEncouragement(state.accuracy, state.wpm, false, locale)}
            </p>
            <div className="flex justify-center gap-8 text-lg flex-wrap">
              <span style={{ color: 'var(--text-secondary)' }}>{state.wpm} WPM</span>
              <span style={{ color: 'var(--text-secondary)' }}>{state.accuracy}%</span>
              <span style={{ color: 'var(--text-secondary)' }}>{timeElapsed ? Math.round(timeElapsed / 1000) : 0}s</span>
              <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '连击' : 'Combo'}: {maxCombo}x</span>
            </div>
          </div>
          <div className="flex justify-center gap-3">
            <Button type="primary" size="large" onClick={onNew}>{locale === 'zh' ? '下一个' : 'Next'}</Button>
            <Button size="large" onClick={onBack}>{locale === 'zh' ? '返回' : 'Back'}</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {combo > 0 && (
            <div className="text-center">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold" style={{
                background: combo >= 20 ? 'rgba(239,68,68,0.15)' : combo >= 10 ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.1)',
                color: combo >= 20 ? '#ef4444' : combo >= 10 ? '#f59e0b' : 'var(--primary-color)',
              }}>
                {locale === 'zh' ? '连击' : 'Combo'} x{combo}
              </span>
            </div>
          )}
          <div className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            }}>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              {state.startTime ? (locale === 'zh' ? '继续打字...' : 'Keep typing...') : (locale === 'zh' ? '开始打字' : 'Start typing')}
            </span>
          </div>
          {showKeyboard && <VirtualKeyboard activeKey={text[state.currentIndex]} pressedKey={lastPressedKey} isError={lastWasError} showFingers />}
        </div>
      )}
    </div>
  );
}
