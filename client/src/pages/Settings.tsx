import { useState, useRef, useEffect } from 'react';
import { Select, Switch, Slider, Button, Message, Radio } from '@arco-design/web-react';
import { SOUND_THEMES, setTheme as setSoundTheme, getTheme, setVolume, getVolume, playKeySound, resumeAudioContext, type SoundTheme } from '../lib/sounds';
import { syncProfile } from '../lib/device';
import { KEYBOARD_LAYOUTS } from '../lib/keyboard-layouts';
import { getStoredTheme, setStoredTheme, type Theme } from '../lib/theme';
import { startBgMusic, stopBgMusic, type BgMusicType } from '../lib/bgMusic';

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: '中文拼音', value: 'zh' },
];

export default function Settings() {
  const [soundTheme, setSoundThemeState] = useState<SoundTheme>(getTheme());
  const [soundVolume, setSoundVolume] = useState(getVolume());
  const [language, setLanguage] = useState<'en' | 'zh'>(() => (localStorage.getItem('typingLanguage') as 'en' | 'zh') || 'en');
  const [showKeyboard, setShowKeyboard] = useState(() => localStorage.getItem('showKeyboard') !== 'false');
  const [showFingers, setShowFingers] = useState(() => localStorage.getItem('showFingers') !== 'false');
  const [keyboardLayout, setKeyboardLayout] = useState(() => localStorage.getItem('keyboardLayout') || 'qwerty');
  const [colorTheme, setColorTheme] = useState<Theme>(getStoredTheme);

  // Custom sounds
  const [customKeySound, setCustomKeySound] = useState(() => localStorage.getItem('customKeySound') || '');
  const [customErrorSound, setCustomErrorSound] = useState(() => localStorage.getItem('customErrorSound') || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorFileInputRef = useRef<HTMLInputElement>(null);

  // Rest reminder
  const [restReminder, setRestReminder] = useState(() => localStorage.getItem('restReminder') === 'true');
  const [restInterval, setRestInterval] = useState(() => parseInt(localStorage.getItem('restInterval') || '25'));

  // Eye protection
  const [eyeProtection, setEyeProtection] = useState(() => localStorage.getItem('eyeProtection') === 'true');
  const [eyeWarmth, setEyeWarmth] = useState(() => parseInt(localStorage.getItem('eyeWarmth') || '30'));

  // Background music
  const [bgMusic, setBgMusic] = useState(() => localStorage.getItem('bgMusic') || 'none');
  const [bgMusicVolume, setBgMusicVolume] = useState(() => parseFloat(localStorage.getItem('bgMusicVolume') || '0.3'));

  // Start/stop bg music when selection changes
  useEffect(() => {
    if (bgMusic === 'none') {
      stopBgMusic();
    } else {
      startBgMusic(bgMusic as BgMusicType, bgMusicVolume);
    }
    return () => { stopBgMusic(); };
  }, [bgMusic, bgMusicVolume]);

  // Rest reminder timer
  useEffect(() => {
    if (!restReminder) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const notification = document.createElement('div');
        notification.className = 'rest-reminder-popup';
        notification.innerHTML = `
          <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;background:var(--glass-bg);backdrop-filter:blur(20px);border:1px solid var(--glass-border);border-radius:1.5rem;padding:2rem 3rem;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
            <div style="font-size:3rem;margin-bottom:0.5rem;">☕</div>
            <div style="font-size:1.2rem;font-weight:700;color:var(--text-primary);margin-bottom:0.5rem;">该休息啦！</div>
            <div style="font-size:0.85rem;color:var(--text-secondary);">你已经打字 ${restInterval} 分钟了，休息一下眼睛和手指吧</div>
            <button onclick="this.parentElement.parentElement.remove()" style="margin-top:1rem;padding:0.5rem 1.5rem;border-radius:0.75rem;background:var(--primary-color);color:white;border:none;cursor:pointer;font-weight:600;">知道了</button>
          </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 30000);
      }
    }, restInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [restReminder, restInterval]);

  // Eye protection filter
  useEffect(() => {
    const filter = document.getElementById('eye-protection-filter');
    if (eyeProtection) {
      if (!filter) {
        const el = document.createElement('div');
        el.id = 'eye-protection-filter';
        el.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;background:rgba(255,180,50,${eyeWarmth / 200});mix-blend-mode:multiply;transition:opacity 0.5s;`;
        document.body.appendChild(el);
      } else {
        filter.style.background = `rgba(255,180,50,${eyeWarmth / 200})`;
      }
    } else if (filter) {
      filter.remove();
    }
    return () => {
      const el = document.getElementById('eye-protection-filter');
      if (el && !eyeProtection) el.remove();
    };
  }, [eyeProtection, eyeWarmth]);

  const handleFileUpload = (type: 'key' | 'error') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024) {
      Message.error('文件大小不能超过 100KB');
      return;
    }
    if (!file.type.startsWith('audio/')) {
      Message.error('请上传音频文件 (.mp3 / .wav)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (type === 'key') {
        setCustomKeySound(base64);
        localStorage.setItem('customKeySound', base64);
      } else {
        setCustomErrorSound(base64);
        localStorage.setItem('customErrorSound', base64);
      }
      Message.success(`${type === 'key' ? '按键' : '错误'}音效已设置`);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    localStorage.setItem('typingLanguage', language);
    localStorage.setItem('showKeyboard', String(showKeyboard));
    localStorage.setItem('showFingers', String(showFingers));
    localStorage.setItem('keyboardLayout', keyboardLayout);
    localStorage.setItem('restReminder', String(restReminder));
    localStorage.setItem('restInterval', String(restInterval));
    localStorage.setItem('eyeProtection', String(eyeProtection));
    localStorage.setItem('eyeWarmth', String(eyeWarmth));
    localStorage.setItem('bgMusic', bgMusic);
    localStorage.setItem('bgMusicVolume', String(bgMusicVolume));
    setSoundTheme(soundTheme);
    setVolume(soundVolume);
    setStoredTheme(colorTheme);
    try {
      await syncProfile({
        settings: { soundTheme, soundVolume, language, showKeyboard, showFingers },
        theme: colorTheme,
        keyboardLayout,
        customSounds: { keySound: customKeySound ? 'custom' : '', errorSound: customErrorSound ? 'custom' : '' },
      });
    } catch (err) {
      console.warn('syncProfile failed, local settings saved:', err);
    }
    Message.success('设置已保存');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2" style={{
          background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>设置</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>自定义你的打字体验</p>
      </div>

      <div className="space-y-5">
        <Section title="主题" icon="🎨">
          <Radio.Group type="button" value={colorTheme} onChange={v => { setColorTheme(v as Theme); setStoredTheme(v as Theme); }}
            options={[
              { label: '亮色', value: 'light' },
              { label: '暗色', value: 'dark' },
            ]} />
        </Section>

        <Section title="打字语言" icon="🌐">
          <Select value={language} onChange={v => setLanguage(v as 'en' | 'zh')} options={LANGUAGE_OPTIONS} size="large" style={{ width: '100%' }} />
        </Section>

        <Section title="音效设置" icon="🔊">
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SOUND_THEMES.map(theme => (
                <button key={theme.id} onClick={() => { setSoundThemeState(theme.id); setSoundTheme(theme.id); resumeAudioContext(); setTimeout(playKeySound, 50); }}
                  className="flex items-center gap-2.5 p-3 rounded-xl transition-all duration-300 text-sm"
                  style={{
                    background: soundTheme === theme.id ? 'rgba(99,102,241,0.12)' : 'var(--bg-card)',
                    border: soundTheme === theme.id ? '1px solid rgba(99,102,241,0.4)' : '1px solid var(--glass-border)',
                    color: soundTheme === theme.id ? 'var(--primary-color)' : 'var(--text-secondary)',
                    fontWeight: soundTheme === theme.id ? 600 : 500,
                  }}>
                  <span className="text-lg">{theme.icon}</span><span>{theme.name}</span>
                </button>
              ))}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>音量</label>
                <span className="text-xs tabular-nums px-2 py-0.5 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>{Math.round(soundVolume * 100)}%</span>
              </div>
              <Slider value={soundVolume * 100} onChange={v => { const val = (v as number) / 100; setSoundVolume(val); setVolume(val); }} min={0} max={100} step={5} />
            </div>
            <Button onClick={() => { resumeAudioContext(); setSoundTheme(soundTheme); setVolume(soundVolume); playKeySound(); }}>测试音效</Button>
          </div>
        </Section>

        <Section title="自定义音效" icon="🎵">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
              <div>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>按键音效</span>
                {customKeySound && <span className="ml-2 text-xs text-emerald-500">已设置</span>}
              </div>
              <div className="flex gap-2">
                <Button size="small" onClick={() => fileInputRef.current?.click()}>
                  上传 (≤100KB)
                </Button>
                {customKeySound && (
                  <Button size="small" onClick={() => { setCustomKeySound(''); localStorage.removeItem('customKeySound'); }}>清除</Button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload('key')} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
              <div>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>错误音效</span>
                {customErrorSound && <span className="ml-2 text-xs text-emerald-500">已设置</span>}
              </div>
              <div className="flex gap-2">
                <Button size="small" onClick={() => errorFileInputRef.current?.click()}>
                  上传 (≤100KB)
                </Button>
                {customErrorSound && (
                  <Button size="small" onClick={() => { setCustomErrorSound(''); localStorage.removeItem('customErrorSound'); }}>清除</Button>
                )}
              </div>
              <input ref={errorFileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload('error')} />
            </div>
          </div>
        </Section>

        <Section title="键盘设置" icon="⌨️">
          <div className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>键盘布局</label>
              <Radio.Group type="button" value={keyboardLayout} onChange={v => setKeyboardLayout(v)}
                options={KEYBOARD_LAYOUTS.map(l => ({ label: l.name, value: l.id }))} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>显示虚拟键盘</span>
              <Switch checked={showKeyboard} onChange={setShowKeyboard} />
            </div>
            <div className={`flex items-center justify-between p-3 rounded-xl ${!showKeyboard ? 'opacity-40' : ''}`} style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>显示手指指引</span>
              <Switch checked={showFingers} onChange={setShowFingers} disabled={!showKeyboard} />
            </div>
          </div>
        </Section>

        <Section title="休息提醒" icon="☕">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>启用休息提醒</span>
              <Switch checked={restReminder} onChange={setRestReminder} />
            </div>
            {restReminder && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>提醒间隔</label>
                  <span className="text-xs tabular-nums px-2 py-0.5 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>{restInterval} 分钟</span>
                </div>
                <Slider value={restInterval} onChange={v => setRestInterval(v as number)} min={10} max={60} step={5} />
              </div>
            )}
          </div>
        </Section>

        <Section title="护眼模式" icon="👁️">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>启用暖色护眼滤镜</span>
              <Switch checked={eyeProtection} onChange={v => { setEyeProtection(v); localStorage.setItem('eyeProtection', String(v)); }} />
            </div>
            {eyeProtection && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>暖色强度</label>
                  <span className="text-xs tabular-nums px-2 py-0.5 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>{eyeWarmth}%</span>
                </div>
                <Slider value={eyeWarmth} onChange={v => { setEyeWarmth(v as number); localStorage.setItem('eyeWarmth', String(v)); }} min={10} max={60} step={5} />
              </div>
            )}
          </div>
        </Section>

        <Section title="背景音乐" icon="🎵">
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'none', name: '关闭', icon: '🔇' },
                { id: 'lofi', name: 'Lo-Fi', icon: '🎧' },
                { id: 'nature', name: '自然', icon: '🌿' },
                { id: 'rain', name: '雨声', icon: '🌧️' },
                { id: 'whitenoise', name: '白噪音', icon: '📻' },
                { id: 'cafe', name: '咖啡厅', icon: '☕' },
              ].map(m => (
                <button key={m.id} onClick={() => { setBgMusic(m.id); localStorage.setItem('bgMusic', m.id); }}
                  className="flex items-center gap-2.5 p-3 rounded-xl transition-all duration-300 text-sm"
                  style={{
                    background: bgMusic === m.id ? 'rgba(99,102,241,0.12)' : 'var(--bg-card)',
                    border: bgMusic === m.id ? '1px solid rgba(99,102,241,0.4)' : '1px solid var(--glass-border)',
                    color: bgMusic === m.id ? 'var(--primary-color)' : 'var(--text-secondary)',
                    fontWeight: bgMusic === m.id ? 600 : 500,
                  }}>
                  <span className="text-lg">{m.icon}</span><span>{m.name}</span>
                </button>
              ))}
            </div>
            {bgMusic !== 'none' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>音乐音量</label>
                  <span className="text-xs tabular-nums px-2 py-0.5 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>{Math.round(bgMusicVolume * 100)}%</span>
                </div>
                <Slider value={bgMusicVolume * 100} onChange={v => { const val = (v as number) / 100; setBgMusicVolume(val); localStorage.setItem('bgMusicVolume', String(val)); }} min={0} max={100} step={5} />
              </div>
            )}
          </div>
        </Section>

        <Button type="primary" long size="large" onClick={handleSave} style={{ height: '48px', fontSize: '16px', fontWeight: 700 }}>
          保存设置
        </Button>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { readonly title: string; readonly icon: string; readonly children: React.ReactNode }) {
  return (
    <div className="glass-card p-4 sm:p-6" style={{ cursor: 'default' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
      <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><span>{icon}</span>{title}</h2>
      {children}
    </div>
  );
}
