import { useState, useEffect, useCallback } from 'react';
import { Button, Spin, Message } from '@arco-design/web-react';
import TypingArea from '../components/TypingArea';
import VirtualKeyboard from '../components/VirtualKeyboard';
import Stats from '../components/Stats';
import { useTyping } from '../hooks/useTyping';
import { resumeAudioContext } from '../lib/sounds';
import { fetchDailyChallenge, submitDailyChallengeScore, fetchDailyChallengeLeaderboard } from '../lib/api';
import { reportSession } from '../lib/api';
import { getDeviceId } from '../lib/device';
import { getAvatar } from '../lib/avatars';

export default function DailyChallenge() {
  const [challenge, setChallenge] = useState<{ date: string; textContent: string } | null>(null);
  const [leaderboard, setLeaderboard] = useState<readonly { deviceId: string; nickname: string; avatar: number; wpm: number; accuracy: number; timeMs: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [showKeyboard] = useState(() => localStorage.getItem('showKeyboard') !== 'false');
  const [lastPressedKey, setLastPressedKey] = useState<string | undefined>();
  const [lastWasError, setLastWasError] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchDailyChallenge(),
      fetchDailyChallengeLeaderboard(),
    ]).then(([ch, lb]) => {
      setChallenge(ch);
      setLeaderboard(lb);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const onProgress = useCallback((s: { isComplete: boolean; wpm: number; accuracy: number; correctChars: number; startTime: number | null; endTime: number | null }) => {
    if (s.isComplete && challenge && !submitted) {
      const timeMs = s.startTime && s.endTime ? s.endTime - s.startTime : 0;
      submitDailyChallengeScore({ wpm: s.wpm, accuracy: s.accuracy, timeMs })
        .then(() => {
          setSubmitted(true);
          Message.success('成绩已提交！');
          fetchDailyChallengeLeaderboard().then(setLeaderboard);
        });
      reportSession({ chars: challenge.textContent.length, wpm: s.wpm, accuracy: s.accuracy, timeMs });
    }
  }, [challenge, submitted]);

  const { state, handleKeyDown } = useTyping(challenge?.textContent ?? '', onProgress);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      resumeAudioContext();
      setLastPressedKey(e.key);
      if (challenge) {
        const expected = challenge.textContent[state.currentIndex];
        if (e.key.length === 1 && expected !== undefined) {
          setLastWasError(e.key !== expected);
        } else {
          setLastWasError(false);
        }
      }
      handleKeyDown(e);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyDown, challenge, state.currentIndex]);

  const timeElapsed = state.startTime ? (state.endTime ?? Date.now()) - state.startTime : undefined;
  const myDeviceId = getDeviceId();
  const myRank = leaderboard.findIndex(e => e.deviceId === myDeviceId) + 1;

  if (loading || !challenge) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Spin size={32} /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold" style={{
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>每日挑战</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{challenge.date} - 每天一篇，全球同题</p>
        </div>
        {myRank > 0 && (
          <div className="text-sm px-3 py-1.5 rounded-full" style={{
            background: 'rgba(99,102,241,0.1)',
            color: 'var(--primary-color)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}>
            你的排名: #{myRank} / {leaderboard.length}
          </div>
        )}
      </div>

      <div className="mb-6"><Stats wpm={state.wpm} accuracy={state.accuracy} progress={state.currentIndex} total={challenge.textContent.length} timeElapsed={timeElapsed} /></div>
      <div className="mb-6"><TypingArea text={challenge.textContent} currentIndex={state.currentIndex} errors={state.errors} isComplete={state.isComplete} /></div>

      {state.isComplete ? (
        <div className="space-y-6">
          <div className="glass-card p-6 text-center" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <h2 className="text-2xl font-extrabold text-emerald-500 mb-3">挑战完成！</h2>
            <div className="flex justify-center gap-8 text-lg">
              <span style={{ color: 'var(--text-secondary)' }}>速度: <strong style={{ color: 'var(--primary-color)' }}>{state.wpm} WPM</strong></span>
              <span style={{ color: 'var(--text-secondary)' }}>准确率: <strong className="text-emerald-500">{state.accuracy}%</strong></span>
            </div>
            {!submitted && (
              <Button type="primary" className="mt-4" onClick={() => {
                const timeMs = state.startTime && state.endTime ? state.endTime - state.startTime : 0;
                submitDailyChallengeScore({ wpm: state.wpm, accuracy: state.accuracy, timeMs }).then(() => {
                  setSubmitted(true);
                  fetchDailyChallengeLeaderboard().then(setLeaderboard);
                });
              }}>提交成绩</Button>
            )}
          </div>

          {/* Leaderboard */}
          <div className="glass-card p-6" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>今日排行榜</h3>
            {leaderboard.length === 0 ? (
              <p className="text-center py-4 text-sm" style={{ color: 'var(--text-muted)' }}>暂无数据</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, i) => (
                  <div key={entry.deviceId}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{
                      background: entry.deviceId === myDeviceId ? 'rgba(99,102,241,0.08)' : 'var(--bg-card)',
                      border: `1px solid ${entry.deviceId === myDeviceId ? 'rgba(99,102,241,0.2)' : 'var(--glass-border)'}`,
                    }}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold w-8 text-center" style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : 'var(--text-muted)' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </span>
                      <span className="text-xl">{getAvatar(entry.avatar)}</span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{entry.nickname}</span>
                      {entry.deviceId === myDeviceId && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: 'var(--primary-color)', background: 'rgba(99,102,241,0.1)' }}>(你)</span>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm tabular-nums">
                      <span style={{ color: 'var(--primary-color)' }}>{entry.wpm} <span className="text-xs" style={{ color: 'var(--text-muted)' }}>WPM</span></span>
                      <span style={{ color: 'var(--text-secondary)' }}>{entry.accuracy}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{
              background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)',
            }}>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              {state.startTime ? '继续打字...' : '点击任意键开始挑战'}
            </span>
          </div>
          {showKeyboard && <VirtualKeyboard activeKey={challenge.textContent[state.currentIndex]} pressedKey={lastPressedKey} isError={lastWasError} showFingers />}
        </div>
      )}
    </div>
  );
}
