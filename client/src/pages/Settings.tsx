import { useState, useRef, useEffect } from 'react';
import { Select, Switch, Slider, Button, Message, Radio } from '@arco-design/web-react';
import { SOUND_THEMES, setTheme as setSoundTheme, getTheme, setVolume, getVolume, playKeySound, resumeAudioContext, type SoundTheme } from '../lib/sounds';
import { syncProfile } from '../lib/device';
import { KEYBOARD_LAYOUTS } from '../lib/keyboard-layouts';
import { getStoredTheme, setStoredTheme, type Theme } from '../lib/theme';
import { startBgMusic, stopBgMusic, type BgMusicType } from '../lib/bgMusic';
import { useLocale } from '../lib/hooks';

export default function Settings() {
  const locale = useLocale();
  const [soundTheme, setSoundThemeState] = useState<SoundTheme>(getTheme());
  const [soundVolume, setSoundVolume] = useState(getVolume());
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
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
  const languageOptions = [
    { label: 'English', value: 'en' },
    { label: locale === 'zh' ? '中文拼音' : 'Chinese Pinyin', value: 'zh' },
  ];

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
            <div style="font-size:1.2rem;font-weight:700;color:var(--text-primary);margin-bottom:0.5rem;">${locale === 'zh' ? '该休息啦！' : 'Time for a break!'}</div>
            <div style="font-size:0.85rem;color:var(--text-secondary);">${locale === 'zh' ? `你已经打字 ${restInterval} 分钟了，休息一下眼睛和手指吧` : `You have been typing for ${restInterval} minutes. Give your eyes and fingers a short break.`}</div>
            <button onclick="this.parentElement.parentElement.remove()" style="margin-top:1rem;padding:0.5rem 1.5rem;border-radius:0.75rem;background:var(--primary-color);color:white;border:none;cursor:pointer;font-weight:600;">${locale === 'zh' ? '知道了' : 'Got it'}</button>
          </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 30000);
      }
    }, restInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [locale, restReminder, restInterval]);

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
      Message.error(locale === 'zh' ? '文件大小不能超过 100KB' : 'File size must be under 100KB');
      return;
    }
    if (!file.type.startsWith('audio/')) {
      Message.error(locale === 'zh' ? '请上传音频文件 (.mp3 / .wav)' : 'Please upload an audio file (.mp3 / .wav)');
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
      Message.success(locale === 'zh'
        ? `${type === 'key' ? '按键' : '错误'}音效已设置`
        : `${type === 'key' ? 'Key' : 'Error'} sound updated`);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    setSaveFeedback(locale === 'zh' ? '正在保存设置...' : 'Saving settings...');
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
      setSaveFeedback(locale === 'zh' ? '设置已保存到本地和服务器' : 'Settings saved locally and synced');
      Message.success(locale === 'zh' ? '保存成功' : 'Saved successfully');
    } catch (err) {
      console.warn('syncProfile failed, local settings saved:', err);
      setSaveFeedback(locale === 'zh' ? '本地设置已保存，服务器同步失败' : 'Settings saved locally, but server sync failed');
      Message.warning(locale === 'zh' ? '本地设置已保存，服务器同步失败' : 'Saved locally, but server sync failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2" style={{
          background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>{locale === 'zh' ? '设置' : 'Settings'}</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '自定义你的打字体验' : 'Customize your typing experience'}</p>
      </div>

      <div className="space-y-5">
        <Section title={locale === 'zh' ? '主题' : 'Theme'} icon="🎨">
          <Radio.Group type="button" value={colorTheme} onChange={v => { setColorTheme(v as Theme); setStoredTheme(v as Theme); }}
            options={[
              { label: locale === 'zh' ? '亮色' : 'Light', value: 'light' },
              { label: locale === 'zh' ? '暗色' : 'Dark', value: 'dark' },
            ]} />
        </Section>

        <Section title={locale === 'zh' ? '打字语言' : 'Typing Language'} icon="🌐">
          <Select value={language} onChange={v => setLanguage(v as 'en' | 'zh')} options={languageOptions} size="large" style={{ width: '100%' }} />
        </Section>

        <Section title={locale === 'zh' ? '音效设置' : 'Sound Settings'} icon="🔊">
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
                  <span className="text-lg">{theme.icon}</span><span>{getSoundThemeLabel(theme.id, locale)}</span>
                </button>
              ))}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{locale === 'zh' ? '音量' : 'Volume'}</label>
                <span className="text-xs tabular-nums px-2 py-0.5 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>{Math.round(soundVolume * 100)}%</span>
              </div>
              <Slider value={soundVolume * 100} onChange={v => { const val = (v as number) / 100; setSoundVolume(val); setVolume(val); }} min={0} max={100} step={5} />
            </div>
            <Button onClick={() => { resumeAudioContext(); setSoundTheme(soundTheme); setVolume(soundVolume); playKeySound(); }}>{locale === 'zh' ? '测试音效' : 'Test Sound'}</Button>
          </div>
        </Section>

        <Section title={locale === 'zh' ? '自定义音效' : 'Custom Sounds'} icon="🎵">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
              <div>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '按键音效' : 'Key Sound'}</span>
                {customKeySound && <span className="ml-2 text-xs text-emerald-500">{locale === 'zh' ? '已设置' : 'Set'}</span>}
              </div>
              <div className="flex gap-2">
                <Button size="small" onClick={() => fileInputRef.current?.click()}>
                  {locale === 'zh' ? '上传 (≤100KB)' : 'Upload (≤100KB)'}
                </Button>
                {customKeySound && (
                  <Button size="small" onClick={() => { setCustomKeySound(''); localStorage.removeItem('customKeySound'); }}>{locale === 'zh' ? '清除' : 'Clear'}</Button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload('key')} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
              <div>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '错误音效' : 'Error Sound'}</span>
                {customErrorSound && <span className="ml-2 text-xs text-emerald-500">{locale === 'zh' ? '已设置' : 'Set'}</span>}
              </div>
              <div className="flex gap-2">
                <Button size="small" onClick={() => errorFileInputRef.current?.click()}>
                  {locale === 'zh' ? '上传 (≤100KB)' : 'Upload (≤100KB)'}
                </Button>
                {customErrorSound && (
                  <Button size="small" onClick={() => { setCustomErrorSound(''); localStorage.removeItem('customErrorSound'); }}>{locale === 'zh' ? '清除' : 'Clear'}</Button>
                )}
              </div>
              <input ref={errorFileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload('error')} />
            </div>
          </div>
        </Section>

        <Section title={locale === 'zh' ? '键盘设置' : 'Keyboard'} icon="⌨️">
          <div className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>{locale === 'zh' ? '键盘布局' : 'Keyboard Layout'}</label>
              <Radio.Group type="button" value={keyboardLayout} onChange={v => setKeyboardLayout(v)}
                options={KEYBOARD_LAYOUTS.map(l => ({ label: l.name, value: l.id }))} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '显示虚拟键盘' : 'Show Virtual Keyboard'}</span>
              <Switch checked={showKeyboard} onChange={setShowKeyboard} />
            </div>
            <div className={`flex items-center justify-between p-3 rounded-xl ${!showKeyboard ? 'opacity-40' : ''}`} style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '显示手指指引' : 'Show Finger Guide'}</span>
              <Switch checked={showFingers} onChange={setShowFingers} disabled={!showKeyboard} />
            </div>
          </div>
        </Section>

        <Section title={locale === 'zh' ? '休息提醒' : 'Break Reminder'} icon="☕">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '启用休息提醒' : 'Enable break reminders'}</span>
              <Switch checked={restReminder} onChange={setRestReminder} />
            </div>
            {restReminder && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{locale === 'zh' ? '提醒间隔' : 'Interval'}</label>
                  <span className="text-xs tabular-nums px-2 py-0.5 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>{restInterval} {locale === 'zh' ? '分钟' : 'min'}</span>
                </div>
                <Slider value={restInterval} onChange={v => setRestInterval(v as number)} min={10} max={60} step={5} />
              </div>
            )}
          </div>
        </Section>

        <Section title={locale === 'zh' ? '护眼模式' : 'Eye Comfort'} icon="👁️">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '启用暖色护眼滤镜' : 'Enable warm eye-comfort filter'}</span>
              <Switch checked={eyeProtection} onChange={v => { setEyeProtection(v); localStorage.setItem('eyeProtection', String(v)); }} />
            </div>
            {eyeProtection && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{locale === 'zh' ? '暖色强度' : 'Warmth'}</label>
                  <span className="text-xs tabular-nums px-2 py-0.5 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>{eyeWarmth}%</span>
                </div>
                <Slider value={eyeWarmth} onChange={v => { setEyeWarmth(v as number); localStorage.setItem('eyeWarmth', String(v)); }} min={10} max={60} step={5} />
              </div>
            )}
          </div>
        </Section>

        <Section title={locale === 'zh' ? '背景音乐' : 'Background Music'} icon="🎵">
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'none', name: locale === 'zh' ? '关闭' : 'Off', icon: '🔇' },
                { id: 'lofi', name: 'Lo-Fi', icon: '🎧' },
                { id: 'nature', name: locale === 'zh' ? '自然' : 'Nature', icon: '🌿' },
                { id: 'rain', name: locale === 'zh' ? '雨声' : 'Rain', icon: '🌧️' },
                { id: 'whitenoise', name: locale === 'zh' ? '白噪音' : 'White Noise', icon: '📻' },
                { id: 'cafe', name: locale === 'zh' ? '咖啡厅' : 'Cafe', icon: '☕' },
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
                  <label className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{locale === 'zh' ? '音乐音量' : 'Music Volume'}</label>
                  <span className="text-xs tabular-nums px-2 py-0.5 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>{Math.round(bgMusicVolume * 100)}%</span>
                </div>
                <Slider value={bgMusicVolume * 100} onChange={v => { const val = (v as number) / 100; setBgMusicVolume(val); localStorage.setItem('bgMusicVolume', String(val)); }} min={0} max={100} step={5} />
              </div>
            )}
          </div>
        </Section>

        <div className="space-y-2">
          <Button type="primary" long size="large" onClick={handleSave} loading={isSaving} style={{ height: '48px', fontSize: '16px', fontWeight: 700 }}>
            {isSaving ? (locale === 'zh' ? '保存中...' : 'Saving...') : (locale === 'zh' ? '保存设置' : 'Save Settings')}
          </Button>
          {saveFeedback && (
            <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
              {saveFeedback}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function getSoundThemeLabel(themeId: SoundTheme, locale: 'zh' | 'en'): string {
  const labels: Record<SoundTheme, { zh: string; en: string }> = {
    mechanical: { zh: '机械键盘', en: 'Mechanical' },
    typewriter: { zh: '打字机', en: 'Typewriter' },
    bubble: { zh: '气泡', en: 'Bubble' },
    piano: { zh: '钢琴', en: 'Piano' },
    arcade: { zh: '街机', en: 'Arcade' },
    none: { zh: '静音', en: 'Mute' },
  };
  return labels[themeId][locale];
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
