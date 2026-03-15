import { useMemo } from 'react';

// Finger: 1=左小指 2=左无名指 3=左中指 4=左食指 5=右食指 6=右中指 7=右无名指 8=右小指 9=拇指
const FINGER_NAMES: Record<number, string> = {
  1: '左小指', 2: '左无名指', 3: '左中指', 4: '左食指',
  5: '右食指', 6: '右中指', 7: '右无名指', 8: '右小指', 9: '拇指',
};

interface KeyDef {
  readonly key: string;
  readonly display?: string;
  readonly secondary?: string;
  readonly finger: number;
  readonly width?: number;
}

const KEYBOARD_ROWS: readonly (readonly KeyDef[])[] = [
  [
    { key: '`', display: '`', secondary: '~', finger: 1, width: 3 },
    { key: '1', secondary: '!', finger: 1 }, { key: '2', secondary: '@', finger: 2 },
    { key: '3', secondary: '#', finger: 3 }, { key: '4', secondary: '¥', finger: 4 },
    { key: '5', secondary: '%', finger: 4 }, { key: '6', secondary: '…', finger: 5 },
    { key: '7', secondary: '&', finger: 5 }, { key: '8', secondary: '*', finger: 6 },
    { key: '9', secondary: '(', finger: 7 }, { key: '0', secondary: ')', finger: 8 },
    { key: '-', secondary: '—', finger: 8 }, { key: '=', secondary: '+', finger: 8 },
    { key: 'Backspace', display: '⇦ 退格', finger: 8, width: 5 },
  ],
  [
    { key: 'Tab', display: '→首行缩进', finger: 1, width: 4.3 },
    { key: 'q', finger: 1 }, { key: 'w', finger: 2 }, { key: 'e', finger: 3 },
    { key: 'r', finger: 4 }, { key: 't', finger: 4 }, { key: 'y', finger: 5 },
    { key: 'u', finger: 5 }, { key: 'i', finger: 6 }, { key: 'o', finger: 7 },
    { key: 'p', finger: 8 },
    { key: '[', secondary: '{', finger: 8 }, { key: ']', secondary: '}', finger: 8 },
    { key: '\\', display: '\\', secondary: '|', finger: 8, width: 3.7 },
  ],
  [
    { key: 'CapsLock', display: '⇪ 大写锁定', finger: 1, width: 5 },
    { key: 'a', finger: 1 }, { key: 's', finger: 2 }, { key: 'd', finger: 3 },
    { key: 'f', finger: 4 }, { key: 'g', finger: 4 }, { key: 'h', finger: 5 },
    { key: 'j', finger: 5 }, { key: 'k', finger: 6 }, { key: 'l', finger: 7 },
    { key: ';', secondary: ':', finger: 8 }, { key: "'", secondary: '"', finger: 8 },
    { key: 'Enter', display: 'Enter 回车', finger: 8, width: 5.8 },
  ],
  [
    { key: 'ShiftLeft', display: 'Shift', finger: 1, width: 6.5 },
    { key: 'z', finger: 1 }, { key: 'x', finger: 2 }, { key: 'c', finger: 3 },
    { key: 'v', finger: 4 }, { key: 'b', finger: 4 }, { key: 'n', finger: 5 },
    { key: 'm', finger: 5 },
    { key: ',', secondary: '<', finger: 6 }, { key: '.', secondary: '>', finger: 7 },
    { key: '/', secondary: '?', finger: 8 },
    { key: 'ShiftRight', display: 'Shift', finger: 8, width: 7.8 },
  ],
  [
    { key: 'Ctrl', display: 'Ctrl', finger: 1, width: 3.5 },
    { key: 'Alt', display: 'Alt', finger: 1, width: 4 },
    { key: 'Space', display: 'Space 空格', finger: 9, width: 22 },
    { key: 'AltRight', display: 'Alt', finger: 8, width: 4 },
  ],
];

// Finger colors for hand SVG highlight
const FINGER_FILL: Record<number, string> = {
  1: '#f43f5e', 2: '#f59e0b', 3: '#eab308', 4: '#10b981',
  5: '#06b6d4', 6: '#3b82f6', 7: '#8b5cf6', 8: '#ec4899', 9: '#64748b',
};

function charToKey(char: string): string {
  if (char === ' ') return 'Space';
  return char.toLowerCase();
}

function needsShift(char: string): boolean {
  if (char >= 'A' && char <= 'Z') return true;
  return '~!@#$%^&*()_+{}|:"<>?'.includes(char);
}

interface VirtualKeyboardProps {
  readonly activeKey?: string;
  readonly pressedKey?: string;
  readonly isError?: boolean;
  readonly showFingers?: boolean;
}

export default function VirtualKeyboard({
  activeKey,
  isError,
  showFingers = true,
}: VirtualKeyboardProps) {
  const targetKey = activeKey ? charToKey(activeKey) : null;
  const shiftNeeded = activeKey ? needsShift(activeKey) : false;
  const targetFinger = useMemo(() => {
    if (!targetKey) return null;
    for (const row of KEYBOARD_ROWS) {
      for (const k of row) {
        if (k.key.toLowerCase() === targetKey) return k.finger;
      }
    }
    return null;
  }, [targetKey]);

  return (
    <div className="relative">
      {/* Finger hint */}
      {showFingers && targetFinger && (
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: FINGER_FILL[targetFinger] }} />
            <span className="text-slate-600 text-sm font-medium">{FINGER_NAMES[targetFinger]}</span>
          </div>
        </div>
      )}

      {/* Keyboard container - redesigned with dark blue-gray gradient */}
      <div className="relative bg-gradient-to-b from-[#4a5568] to-[#2d3748] rounded-2xl p-2 sm:p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-x-auto">
        {/* Keys */}
        <div className="flex flex-col items-center gap-[2px] sm:gap-[3px] min-w-[320px]">
          {KEYBOARD_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-[2px] sm:gap-[3px] justify-center">
              {row.map((keyDef) => {
                const isTarget = targetKey === keyDef.key.toLowerCase() ||
                  (shiftNeeded && (keyDef.key === 'ShiftLeft' || keyDef.key === 'ShiftRight'));
                const isHomeKey = ['f', 'j'].includes(keyDef.key);
                const isLetter = keyDef.key.length === 1 && keyDef.key >= 'a' && keyDef.key <= 'z';
                const hasDual = !!keyDef.secondary;
                const isSpecial = !isLetter && !hasDual && keyDef.key.length > 1;
                const baseWidth = keyDef.width ?? 2.6;
                // Scale down on mobile
                const mobileScale = 0.72;

                // Key styling - redesigned
                let keyCls = 'relative rounded-lg flex transition-all duration-100 select-none ';
                if (isTarget) {
                  if (isError) {
                    keyCls += 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] scale-[0.97] ';
                  } else {
                    keyCls += 'bg-cyan-500 text-white shadow-[0_0_16px_rgba(6,182,212,0.5)] scale-[1.04] ';
                  }
                } else {
                  keyCls += 'bg-[#3d4a5c] text-gray-300 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-[#4a5a6e] ';
                }

                return (
                  <div
                    key={keyDef.key}
                    className={keyCls}
                    style={{
                      width: `clamp(${baseWidth * mobileScale}rem, ${baseWidth * 0.85}vw, ${baseWidth}rem)`,
                      height: 'clamp(1.8rem, 2.2vw, 2.5rem)',
                    }}
                  >
                    {/* Dual character display (number row, brackets, etc.) */}
                    {hasDual ? (
                      <div className="flex flex-col justify-between w-full px-1 sm:px-1.5 py-0.5">
                        <span className="text-[7px] sm:text-[9px] leading-none opacity-50 text-left">{keyDef.secondary}</span>
                        <span className="text-[9px] sm:text-[11px] leading-none font-medium text-right">{keyDef.display ?? keyDef.key}</span>
                      </div>
                    ) : isSpecial ? (
                      <div className="flex items-center justify-center w-full">
                        <span className="text-[8px] sm:text-[10px] font-medium">{keyDef.display ?? keyDef.key}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <span className="text-[11px] sm:text-[13px] font-medium">{keyDef.display ?? keyDef.key}</span>
                      </div>
                    )}

                    {/* Home key bump */}
                    {isHomeKey && (
                      <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-3 h-[2px] rounded-full bg-white/40" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Hand overlays - redesigned with continuous path outlines */}
        {showFingers && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none" style={{ height: '55%' }}>
            <div className="relative w-full max-w-[36rem] h-full">
              {/* Left hand */}
              <svg
                viewBox="0 0 220 280"
                className="absolute left-[5%] bottom-0 h-full"
                style={{ width: '40%' }}
              >
                {/* Hand outline - continuous path */}
                <path
                  d="M12,170 L12,102 Q12,88 24,88 L36,88 Q36,88 36,102 L36,170
                     M42,170 L42,68 Q42,53 55,53 L55,53 Q68,53 68,68 L68,170
                     M74,170 L74,44 Q74,28 88,28 L88,28 Q102,28 102,44 L102,170
                     M108,170 L108,64 Q108,48 121,48 L121,48 Q134,48 134,64 L134,170
                     M134,150 L148,130 Q158,115 162,130 L176,165 Q178,175 168,178 L148,170"
                  fill="none"
                  stroke={targetFinger && targetFinger <= 4 ? FINGER_FILL[targetFinger] : '#fff'}
                  strokeWidth="1.5"
                  opacity={targetFinger && targetFinger <= 4 ? 0.2 : 0.06}
                />
                {/* Palm outline */}
                <path
                  d="M8,170 Q8,142 36,142 L134,142 Q148,142 148,170 L148,215 Q148,245 78,245 L78,245 Q8,245 8,215 Z"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="1.5"
                  opacity="0.04"
                />
                {/* Individual finger highlights */}
                {targetFinger === 1 && <path d="M12,102 L12,170 L36,170 L36,102 Q36,88 24,88 Q12,88 12,102 Z" fill={FINGER_FILL[1]} opacity="0.15" />}
                {targetFinger === 2 && <path d="M42,68 L42,170 L68,170 L68,68 Q68,53 55,53 Q42,53 42,68 Z" fill={FINGER_FILL[2]} opacity="0.15" />}
                {targetFinger === 3 && <path d="M74,44 L74,170 L102,170 L102,44 Q102,28 88,28 Q74,28 74,44 Z" fill={FINGER_FILL[3]} opacity="0.15" />}
                {targetFinger === 4 && <path d="M108,64 L108,170 L134,170 L134,64 Q134,48 121,48 Q108,48 108,64 Z" fill={FINGER_FILL[4]} opacity="0.15" />}
                {targetFinger === 9 && <path d="M134,150 L148,130 Q158,115 162,130 L176,165 Q178,175 168,178 L148,170 Z" fill={FINGER_FILL[9]} opacity="0.15" />}
              </svg>

              {/* Right hand */}
              <svg
                viewBox="0 0 220 280"
                className="absolute right-[5%] bottom-0 h-full"
                style={{ width: '40%' }}
              >
                {/* Hand outline - continuous path (mirrored) */}
                <path
                  d="M66,170 L66,64 Q66,48 79,48 L79,48 Q92,48 92,64 L92,170
                     M98,170 L98,44 Q98,28 112,28 L112,28 Q126,28 126,44 L126,170
                     M132,170 L132,68 Q132,53 145,53 L145,53 Q158,53 158,68 L158,170
                     M164,170 L164,102 Q164,88 176,88 L188,88 Q188,88 188,102 L188,170
                     M66,150 L52,130 Q42,115 38,130 L24,165 Q22,175 32,178 L52,170"
                  fill="none"
                  stroke={targetFinger && targetFinger >= 5 && targetFinger <= 8 ? FINGER_FILL[targetFinger] : '#fff'}
                  strokeWidth="1.5"
                  opacity={targetFinger && targetFinger >= 5 && targetFinger <= 8 ? 0.2 : 0.06}
                />
                {/* Palm outline */}
                <path
                  d="M52,170 Q52,142 66,142 L188,142 Q212,142 212,170 L212,215 Q212,245 142,245 L142,245 Q52,245 52,215 Z"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="1.5"
                  opacity="0.04"
                />
                {/* Individual finger highlights */}
                {targetFinger === 5 && <path d="M66,64 L66,170 L92,170 L92,64 Q92,48 79,48 Q66,48 66,64 Z" fill={FINGER_FILL[5]} opacity="0.15" />}
                {targetFinger === 6 && <path d="M98,44 L98,170 L126,170 L126,44 Q126,28 112,28 Q98,28 98,44 Z" fill={FINGER_FILL[6]} opacity="0.15" />}
                {targetFinger === 7 && <path d="M132,68 L132,170 L158,170 L158,68 Q158,53 145,53 Q132,53 132,68 Z" fill={FINGER_FILL[7]} opacity="0.15" />}
                {targetFinger === 8 && <path d="M164,102 L164,170 L188,170 L188,102 Q188,88 176,88 Q164,88 164,102 Z" fill={FINGER_FILL[8]} opacity="0.15" />}
                {targetFinger === 9 && <path d="M66,150 L52,130 Q42,115 38,130 L24,165 Q22,175 32,178 L52,170 Z" fill={FINGER_FILL[9]} opacity="0.15" />}
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
