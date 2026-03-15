import { useState, useEffect, useCallback, useRef } from 'react';
import { Select, Radio, Button, Spin, Input, Message } from '@arco-design/web-react';
import { Link } from 'react-router-dom';
import TypingArea from '../components/TypingArea';
import VirtualKeyboard from '../components/VirtualKeyboard';
import Stats from '../components/Stats';
import { useTyping } from '../hooks/useTyping';
import { resumeAudioContext } from '../lib/sounds';
import { submitScore } from '../lib/device';
import { fetchCustomTexts, createCustomText, deleteCustomText, reportSession } from '../lib/api';
import { saveReplay } from '../lib/api';
import { t, getEncouragement, calculateXp, getLevelInfo } from '../lib/i18n';
import { useLocale } from '../lib/hooks';
import type { TextPassage } from '../types';

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: '中文拼音', value: 'zh' },
];

type PracticeTab = 'random' | 'custom';

export default function Practice() {
  const locale = useLocale();
  const [tab, setTab] = useState<PracticeTab>('random');
  const [text, setText] = useState<TextPassage | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [language, setLanguage] = useState<'en' | 'zh'>(() => (localStorage.getItem('typingLanguage') as 'en' | 'zh') || 'en');
  const [nickname, setNickname] = useState(() => localStorage.getItem('nickname') || '');
  const [showNicknameInput, setShowNicknameInput] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(() => localStorage.getItem('showKeyboard') !== 'false');
  const [lastPressedKey, setLastPressedKey] = useState<string | undefined>();
  const [lastWasError, setLastWasError] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [encourageMsg, setEncourageMsg] = useState('');

  // Custom text state
  const [customTexts, setCustomTexts] = useState<readonly { id: number; title: string; content: string }[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedCustom, setSelectedCustom] = useState<{ title: string; content: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const prevBestWpm = useRef(parseInt(localStorage.getItem('typerace_best_wpm') || '0'));

  const fetchText = useCallback(async (diff: string, lang: string) => {
    const res = await fetch(`/api/texts/random?difficulty=${diff}&language=${lang}`);
    const data = await res.json();
    setText(data);
  }, []);

  useEffect(() => {
    if (tab === 'random') fetchText(difficulty, language);
  }, [difficulty, language, fetchText, tab]);

  useEffect(() => {
    if (tab === 'custom') {
      fetchCustomTexts().then(setCustomTexts);
    }
  }, [tab]);

  const practiceText = tab === 'custom' && selectedCustom
    ? selectedCustom.content
    : text?.text ?? '';

  const onProgress = useCallback((state: { isComplete: boolean; wpm: number; accuracy: number; startTime: number | null; endTime: number | null }) => {
    if (state.isComplete && practiceText && nickname) {
      const timeMs = state.startTime && state.endTime ? state.endTime - state.startTime : 0;
      submitScore({ nickname, avatar: parseInt(localStorage.getItem('avatar') || '0'), wpm: state.wpm, accuracy: state.accuracy, textLength: practiceText.length, mode: 'practice', language });
      reportSession({ chars: practiceText.length, wpm: state.wpm, accuracy: state.accuracy, timeMs });

      // Calculate and store XP
      const currentXp = parseInt(localStorage.getItem('typerace_xp') || '0');
      const earnedXp = calculateXp(state.wpm, state.accuracy, practiceText.length, maxCombo);
      const newTotalXp = currentXp + earnedXp;
      localStorage.setItem('typerace_xp', String(newTotalXp));
      setXpEarned(earnedXp);

      // Check if new record
      const isNewRecord = state.wpm > prevBestWpm.current;
      if (isNewRecord) {
        localStorage.setItem('typerace_best_wpm', String(state.wpm));
        prevBestWpm.current = state.wpm;
      }

      // Set encouragement message
      setEncourageMsg(getEncouragement(state.accuracy, state.wpm, isNewRecord, locale));
    }
  }, [practiceText, nickname, language, maxCombo, locale]);

  const { state, handleKeyDown, reset, getReplayData } = useTyping(practiceText, onProgress);
  useEffect(() => { reset(); setCombo(0); setMaxCombo(0); setXpEarned(0); setEncourageMsg(''); }, [text, selectedCustom, reset]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      resumeAudioContext();
      setLastPressedKey(e.key);
      const expectedChar = practiceText[state.currentIndex];
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
  }, [handleKeyDown, practiceText, state.currentIndex]);

  const handleNewText = () => { fetchText(difficulty, language); };
  const handleSaveNickname = () => { if (nickname.trim()) { localStorage.setItem('nickname', nickname.trim()); setShowNicknameInput(false); } };

  const handleSaveReplay = async () => {
    const replayData = getReplayData();
    if (replayData.length === 0) return;
    const timeMs = state.startTime && state.endTime ? state.endTime - state.startTime : 0;
    await saveReplay({
      textContent: practiceText,
      replayData,
      wpm: state.wpm,
      accuracy: state.accuracy,
      durationMs: timeMs,
    });
    Message.success(t('practice.replaySaved', locale));
  };

  const handleAddCustomText = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Message.warning(t('practice.inputWarning', locale));
      return;
    }
    await createCustomText({ title: newTitle.trim(), content: newContent.trim() });
    setNewTitle('');
    setNewContent('');
    const texts = await fetchCustomTexts();
    setCustomTexts(texts);
    Message.success(t('practice.customAdded', locale));
  };

  const handleDeleteCustomText = async (id: number) => {
    await deleteCustomText(id);
    const texts = await fetchCustomTexts();
    setCustomTexts(texts);
    if (selectedCustom) setSelectedCustom(null);
  };

  const timeElapsed = state.startTime ? (state.endTime ?? Date.now()) - state.startTime : undefined;
  const totalXp = parseInt(localStorage.getItem('typerace_xp') || '0');
  const levelInfo = getLevelInfo(totalXp);

  if (tab === 'random' && !text) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Spin size={32} /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" ref={containerRef}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold" style={{
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>{t('practice.title', locale)}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('practice.subtitle', locale)}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Level badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: `${levelInfo.color}15`, border: `1px solid ${levelInfo.color}40`, color: levelInfo.color }}>
            Lv.{levelInfo.level} {t(levelInfo.title, locale)}
          </div>
          {!showNicknameInput && nickname && (
            <Button size="small" onClick={() => setShowNicknameInput(true)}>{nickname}</Button>
          )}
          {(showNicknameInput || !nickname) && (
            <div className="flex gap-2">
              <Input value={nickname} onChange={v => setNickname(v)} placeholder={t('practice.nicknamePlaceholder', locale)} size="small" style={{ width: 160 }}
                onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') handleSaveNickname(); }} />
              <Button type="primary" size="small" onClick={handleSaveNickname}>{t('practice.save', locale)}</Button>
            </div>
          )}
        </div>
      </div>

      {/* Tab selector */}
      <div className="glass-card p-4 mb-6" style={{ cursor: 'default' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Radio.Group type="button" value={tab} onChange={v => { setTab(v as PracticeTab); reset(); }}
              options={[{ label: t('practice.random', locale), value: 'random' }, { label: t('practice.custom', locale), value: 'custom' }]} size="small" />
            {tab === 'random' && (
              <>
                <Select value={language} onChange={v => setLanguage(v as 'en' | 'zh')} options={LANGUAGE_OPTIONS} size="small" style={{ width: 140 }} />
                <Radio.Group type="button" value={difficulty} onChange={v => setDifficulty(v)}
                  options={[{ label: t('practice.easy', locale), value: 'easy' }, { label: t('practice.medium', locale), value: 'medium' }, { label: t('practice.hard', locale), value: 'hard' }]} size="small" />
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Combo counter */}
            {combo > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse"
                style={{
                  background: combo >= 20 ? 'rgba(239,68,68,0.15)' : combo >= 10 ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.1)',
                  color: combo >= 20 ? '#ef4444' : combo >= 10 ? '#f59e0b' : 'var(--primary-color)',
                  border: `1px solid ${combo >= 20 ? 'rgba(239,68,68,0.3)' : combo >= 10 ? 'rgba(245,158,11,0.3)' : 'rgba(99,102,241,0.2)'}`,
                }}>
                {t('common.combo', locale)} x{combo}
              </div>
            )}
            <Button size="small" type={showKeyboard ? 'primary' : 'secondary'} onClick={() => setShowKeyboard(!showKeyboard)}>
              {t('practice.keyboard', locale)} {showKeyboard ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>
      </div>

      {/* Mode links */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link to="/practice/modes"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all hover:scale-105"
          style={{ color: 'var(--text-secondary)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
          🔢 {locale === 'zh' ? '词数挑战' : 'Word Count'}
        </Link>
        <Link to="/practice/modes"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all hover:scale-105"
          style={{ color: 'var(--text-secondary)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
          🚫 {locale === 'zh' ? '严格模式' : 'Strict Mode'}
        </Link>
        <Link to="/practice/modes"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all hover:scale-105"
          style={{ color: 'var(--text-secondary)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
          📖 {locale === 'zh' ? '经典文学' : 'Classics'}
        </Link>
        <Link to="/practice/modes"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all hover:scale-105"
          style={{ color: 'var(--text-secondary)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
          !@# {locale === 'zh' ? '符号训练' : 'Symbols'}
        </Link>
        <Link to="/practice/code"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all hover:scale-105"
          style={{ color: 'var(--text-secondary)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
          💻 {locale === 'zh' ? '代码模式' : 'Code Mode'}
        </Link>
      </div>

      {/* Custom text management */}
      {tab === 'custom' && !selectedCustom && (
        <div className="space-y-4 mb-6">
          <div className="glass-card p-5" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{t('practice.addCustomTitle', locale)}</h3>
            <div className="space-y-2">
              <Input value={newTitle} onChange={v => setNewTitle(v)} placeholder={t('practice.titlePlaceholder', locale)} size="small"
                onKeyDown={e => e.stopPropagation()} />
              <Input.TextArea value={newContent} onChange={v => setNewContent(v)} placeholder={t('practice.contentPlaceholder', locale)} autoSize={{ minRows: 3, maxRows: 6 }}
                onKeyDown={e => e.stopPropagation()} />
              <Button type="primary" size="small" onClick={handleAddCustomText}>{t('practice.add', locale)}</Button>
            </div>
          </div>

          {customTexts.length > 0 && (
            <div className="space-y-2">
              {customTexts.map(ct => (
                <div key={ct.id} className="glass-card p-4 flex items-center justify-between"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedCustom({ title: ct.title, content: ct.content })}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{ct.title}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>{ct.content.slice(0, 80)}...</p>
                  </div>
                  <Button size="small" status="danger" onClick={e => { e.stopPropagation(); handleDeleteCustomText(ct.id); }}>{t('practice.delete', locale)}</Button>
                </div>
              ))}
            </div>
          )}
          {customTexts.length === 0 && (
            <p className="text-center py-4 text-sm" style={{ color: 'var(--text-muted)' }}>{t('practice.noCustom', locale)}</p>
          )}
        </div>
      )}

      {/* Practice area */}
      {(tab === 'random' || selectedCustom) && (
        <>
          <div className="mb-6"><Stats wpm={state.wpm} accuracy={state.accuracy} progress={state.currentIndex} total={practiceText.length} timeElapsed={timeElapsed} /></div>
          <div className="mb-6"><TypingArea text={practiceText} displayText={tab === 'random' ? text?.display : undefined} currentIndex={state.currentIndex} errors={state.errors} isComplete={state.isComplete} /></div>

          {state.isComplete ? (
            <div className="text-center space-y-5">
              <div className="glass-card p-6" style={{ cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
                <h2 className="text-2xl font-extrabold text-emerald-600 mb-2">{t('practice.done', locale)}</h2>
                {encourageMsg && (
                  <p className="text-lg font-semibold mb-3" style={{ color: 'var(--primary-color)' }}>{encourageMsg}</p>
                )}
                <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-base sm:text-lg">
                  <span style={{ color: 'var(--text-secondary)' }}>{t('practice.speed', locale)}: <strong style={{ color: 'var(--primary-color)' }}>{state.wpm} WPM</strong></span>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('practice.accuracy', locale)}: <strong className="text-emerald-500">{state.accuracy}%</strong></span>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('practice.time', locale)}: <strong className="text-purple-500">{timeElapsed ? Math.round(timeElapsed / 1000) : 0}{t('practice.seconds', locale)}</strong></span>
                </div>
                <div className="flex justify-center gap-6 mt-3 text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>{t('common.combo', locale)}: <strong style={{ color: '#f59e0b' }}>x{maxCombo}</strong></span>
                  <span style={{ color: 'var(--text-muted)' }}>+<strong style={{ color: '#10b981' }}>{xpEarned} XP</strong></span>
                </div>
                {/* XP bar */}
                <div className="mt-4 max-w-xs mx-auto">
                  <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    <span>Lv.{levelInfo.level} {t(levelInfo.title, locale)}</span>
                    <span>{levelInfo.xp}/{levelInfo.xpToNext} XP</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--glass-border)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (levelInfo.xp / levelInfo.xpToNext) * 100)}%`, background: `linear-gradient(135deg, ${levelInfo.color}, var(--primary-color))` }} />
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-3">
                <Button type="primary" size="large" onClick={tab === 'random' ? handleNewText : () => setSelectedCustom(null)}>
                  {tab === 'random' ? t('practice.next', locale) : t('practice.backToList', locale)}
                </Button>
                <Button size="large" onClick={handleSaveReplay}>{t('practice.saveReplay', locale)}</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {tab === 'custom' && selectedCustom && (
                <div className="text-center">
                  <Button size="small" onClick={() => { setSelectedCustom(null); reset(); }}>{t('practice.backCustomList', locale)}</Button>
                </div>
              )}
              <div className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{
                  background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)',
                }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  {state.startTime ? t('practice.continueTyping', locale) : t('practice.startTyping', locale)}
                </span>
              </div>
              {showKeyboard && <VirtualKeyboard activeKey={practiceText[state.currentIndex]} pressedKey={lastPressedKey} isError={lastWasError} showFingers />}
            </div>
          )}
        </>
      )}
    </div>
  );
}
