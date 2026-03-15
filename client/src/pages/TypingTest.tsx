import { useState, useEffect, useCallback, useRef } from 'react';
import { Select, Radio, Button } from '@arco-design/web-react';
import TypingArea from '../components/TypingArea';
import VirtualKeyboard from '../components/VirtualKeyboard';
import Stats from '../components/Stats';
import { useTyping } from '../hooks/useTyping';
import { resumeAudioContext } from '../lib/sounds';
import { submitScore } from '../lib/device';

type TestDuration = 30 | 60 | 120 | 300;
const DURATION_OPTIONS = [
  { label: '30秒', value: 30 },
  { label: '1分钟', value: 60 },
  { label: '2分钟', value: 120 },
  { label: '5分钟', value: 300 },
];

const LANGUAGE_OPTIONS = [
  { label: '🇬🇧 English', value: 'en' },
  { label: '🇨🇳 中文拼音', value: 'zh' },
];

const TEST_TEXTS = {
  en: [
    "The ability to type quickly and accurately is an essential skill in the modern digital world. Whether you are writing emails, coding software, chatting with friends, or taking notes in class, your typing speed directly impacts your productivity. Studies have shown that the average person types at about 40 words per minute, while professional typists can reach speeds of 80 to 100 words per minute or more. The key to improving your typing speed is consistent practice and proper technique. Start by learning the correct finger placement on the home row keys. Your left hand fingers should rest on A, S, D, and F, while your right hand fingers rest on J, K, L, and semicolon. From this position, each finger is responsible for reaching specific keys above and below. Avoid looking at the keyboard as you type. Instead, keep your eyes on the screen and trust your muscle memory. Over time, your fingers will learn to find the right keys automatically. Remember, accuracy is more important than speed when you are learning. It is better to type slowly and correctly than to rush and make mistakes. Speed will naturally increase as your accuracy improves.",
    "Technology has transformed every aspect of our daily lives in ways that would have seemed like science fiction just a few decades ago. We carry powerful computers in our pockets, communicate instantly across the globe, and have access to virtually all of human knowledge at our fingertips. The internet connects billions of people, enabling collaboration, education, and entertainment on an unprecedented scale. Artificial intelligence is now capable of writing text, creating art, diagnosing diseases, and even driving cars. Cloud computing allows businesses of all sizes to access powerful computing resources without investing in expensive hardware. Social media platforms have created new forms of communication and community, though they have also raised concerns about privacy, misinformation, and mental health. As we move further into the digital age, the ability to interact effectively with technology becomes increasingly important. This includes not just knowing how to use devices and software, but also understanding concepts like data privacy, cybersecurity, and digital literacy.",
  ],
  zh: [
    "da zi su du shi xian dai she hui zhong yi xiang fei chang zhong yao de ji neng. wu lun shi xie dian zi you jian, bian xie dai ma, yu peng you liao tian, hai shi zai ke tang shang ji bi ji, da zi su du dou hui zhi jie ying xiang ni de gong zuo xiao lu. yan jiu biao ming, pu tong ren de da zi su du da yue wei mei fen zhong si shi ge dan ci, er zhuan ye da zi yuan ke yi da dao mei fen zhong ba shi dao yi bai ge dan ci shen zhi geng duo. ti gao da zi su du de guan jian zai yu chi xu lian xi he zheng que de ji qiao. shou xian yao xue xi zheng que de shou zhi fang zhi. zuo shou de si ge shou zhi ying gai fang zai a s d f jian shang, you shou de si gen shou zhi fang zai j k l he fen hao jian shang. cong zhe ge wei zhi kai shi, mei ge shou zhi fu ze gou dao shang fang he xia fang de te ding jian. da zi shi bu yao kan jian pan, er shi bao chi yan jing zhu shi ping mu, xin ren ji rou ji yi.",
    "ke ji yi jing gai bian le wo men ri chang sheng huo de fang fang mian mian. wo men kou dai li chuang zhe qiang da de ji suan ji, ke yi shi shi tong xin, bing qie ke yi sui shi huo qu ji hu suo you de ren lei zhi shi. hu lian wang lian jie le shu shi yi ren, shi de qian suo wei you de he zuo, jiao yu he yu le cheng wei ke neng. ren gong zhi neng xian zai yi jing neng gou xie wen zhang, chuang zuo yi shu, zhen duan ji bing, shen zhi jia shi qi che. yun ji suan rang ge zhong gui mo de qi ye dou neng gou huo qu qiang da de ji suan zi yuan. she jiao mei ti ping tai chuang zao le xin de jiao liu he she qu xing shi, dan ye yin qi le guan yu yin si, xu jia xin xi he xin li jian kang de dan you. sui zhe wo men jin yi bu mai jin shu zi shi dai, you xiao di yu ji shu hu dong de neng li bian de yue lai yue zhong yao.",
  ],
};

export default function TypingTest() {
  const [duration, setDuration] = useState<TestDuration>(60);
  const [language, setLanguage] = useState<'en' | 'zh'>(() => (localStorage.getItem('typingLanguage') as 'en' | 'zh') || 'en');
  const [phase, setPhase] = useState<'setup' | 'typing' | 'result'>('setup');
  const [timeLeft, setTimeLeft] = useState(0);
  const [text, setText] = useState('');
  const [lastPressedKey, setLastPressedKey] = useState<string | undefined>();
  const [lastWasError, setLastWasError] = useState(false);
  const showKeyboard = localStorage.getItem('showKeyboard') !== 'false';
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const onProgress = useCallback(() => {}, []);
  const { state, handleKeyDown, reset } = useTyping(text, onProgress);

  useEffect(() => {
    if (phase === 'typing' && state.startTime && !timerRef.current) {
      startTimeRef.current = Date.now(); setTimeLeft(duration);
      timerRef.current = setInterval(() => {
        const remaining = duration - Math.floor((Date.now() - startTimeRef.current) / 1000);
        setTimeLeft(Math.max(0, remaining));
        if (remaining <= 0) setPhase('result');
      }, 200);
    }
    return () => { if (timerRef.current && phase !== 'typing') { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [phase, state.startTime, duration]);

  useEffect(() => {
    if (phase === 'result' && timerRef.current) {
      clearInterval(timerRef.current); timerRef.current = null;
      const nickname = localStorage.getItem('nickname') || 'Anonymous';
      const avatar = parseInt(localStorage.getItem('avatar') || '0');
      if (state.wpm > 0) submitScore({ nickname, avatar, wpm: state.wpm, accuracy: state.accuracy, textLength: state.currentIndex, mode: 'test', language });
    }
  }, [phase, state.wpm, state.accuracy, state.currentIndex, language]);

  useEffect(() => { if (state.isComplete && phase === 'typing') setPhase('result'); }, [state.isComplete, phase]);

  useEffect(() => {
    if (phase !== 'typing') return;
    const handler = (e: KeyboardEvent) => { resumeAudioContext(); setLastPressedKey(e.key); const expected = text[state.currentIndex]; if (e.key.length === 1 && expected !== undefined) setLastWasError(e.key !== expected); handleKeyDown(e); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, handleKeyDown, text, state.currentIndex]);

  const startTest = () => { const pool = TEST_TEXTS[language]; setText(pool[Math.floor(Math.random() * pool.length)]); reset(); setPhase('typing'); setTimeLeft(duration); };
  const retry = () => { reset(); setPhase('setup'); setTimeLeft(0); };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {phase === 'setup' && (
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4"
              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />限时挑战
            </div>
            <h1 className="text-3xl font-extrabold mb-2" style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #6366f1 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>计时测试</h1>
            <p className="text-slate-700">在限定时间内尽可能快速准确地打字</p>
          </div>
          <div className="glass-card p-6 space-y-6" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <div>
              <label className="block text-xs text-slate-600 uppercase tracking-wider font-semibold mb-3">选择时长</label>
              <Radio.Group type="button" value={duration} onChange={v => setDuration(v as TestDuration)} options={DURATION_OPTIONS}
                style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }} />
            </div>
            <div>
              <label className="block text-xs text-slate-600 uppercase tracking-wider font-semibold mb-3">语言</label>
              <Select value={language} onChange={v => setLanguage(v as 'en' | 'zh')} options={LANGUAGE_OPTIONS} size="large" style={{ width: '100%' }} />
            </div>
            <Button type="primary" long size="large" onClick={startTest} style={{ height: '48px', fontSize: '16px', fontWeight: 700 }}>
              开始测试
            </Button>
          </div>
        </div>
      )}

      {phase === 'typing' && (
        <div className="space-y-5">
          <div className="glass-card p-5" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-600 uppercase tracking-wider font-semibold">剩余时间</span>
              <span className={`text-3xl font-extrabold font-mono tabular-nums ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : timeLeft <= 30 ? 'text-orange-500' : 'text-slate-800'}`}>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.7)' }}>
              <div className={`h-full rounded-full transition-all duration-300`}
                style={{ width: `${(timeLeft / duration) * 100}%`, background: timeLeft <= 10 ? '#ef4444' : timeLeft <= 30 ? '#f97316' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
            </div>
          </div>
          <Stats wpm={state.wpm} accuracy={state.accuracy} progress={state.currentIndex} total={text.length} />
          <TypingArea text={text} currentIndex={state.currentIndex} errors={state.errors} isComplete={state.isComplete} />
          {showKeyboard && <VirtualKeyboard activeKey={text[state.currentIndex]} pressedKey={lastPressedKey} isError={lastWasError} showFingers />}
        </div>
      )}

      {phase === 'result' && (
        <div className="max-w-lg mx-auto">
          <div className="glass-card p-8 text-center space-y-6" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <div className="text-5xl">{state.wpm >= 80 ? '🏆' : state.wpm >= 50 ? '🎉' : state.wpm >= 30 ? '👍' : '💪'}</div>
            <h2 className="text-2xl font-extrabold text-slate-800">测试完成！</h2>
            <div className="grid grid-cols-2 gap-3">
              <ResultBox label="打字速度" value={`${state.wpm}`} unit="WPM" color="var(--primary-color)" />
              <ResultBox label="准确率" value={`${state.accuracy}`} unit="%" color="#10b981" />
              <ResultBox label="输入字符" value={`${state.currentIndex}`} unit="个" color="#f59e0b" />
              <ResultBox label="测试时长" value={`${duration}`} unit="秒" color="#8b5cf6" />
            </div>
            <div className="text-sm font-semibold px-5 py-2 rounded-full inline-block" style={{
              background: state.wpm >= 80 ? 'rgba(245,158,11,0.1)' : state.wpm >= 60 ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
              color: state.wpm >= 80 ? '#f59e0b' : state.wpm >= 60 ? '#10b981' : 'var(--primary-color)',
              border: `1px solid ${state.wpm >= 80 ? 'rgba(245,158,11,0.3)' : state.wpm >= 60 ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`,
            }}>{state.wpm >= 80 ? '专业水平' : state.wpm >= 60 ? '优秀' : state.wpm >= 40 ? '良好' : state.wpm >= 20 ? '继续加油' : '初学者'}</div>
            <div className="flex justify-center gap-3 pt-2">
              <Button onClick={retry}>返回</Button>
              <Button type="primary" onClick={startTest}>再测一次</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultBox({ label, value, unit, color }: { readonly label: string; readonly value: string; readonly unit: string; readonly color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid var(--glass-border)' }}>
      <div className="text-[11px] text-slate-600 mb-1.5 uppercase tracking-wider">{label}</div>
      <div className="text-3xl font-extrabold tabular-nums" style={{ color }}>{value}<span className="text-sm ml-1 text-slate-600">{unit}</span></div>
    </div>
  );
}
