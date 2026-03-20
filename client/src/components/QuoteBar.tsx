import { useState, useEffect, useCallback } from 'react';
import { useLocale } from '../lib/hooks';

interface Quote {
  readonly text: string;
  readonly from: string;
  readonly author: string;
}

// c=d 文学, c=k 哲学, c=i 诗词, c=j 网易云热评
const HITOKOTO_CATEGORIES = ['d', 'i', 'j', 'k'];

const FALLBACK_QUOTES: readonly Quote[] = [
  { text: '不积跬步，无以至千里；不积小流，无以成江海。', from: '荀子·劝学', author: '荀子' },
  { text: '千里之行，始于足下。', from: '道德经', author: '老子' },
  { text: '学而不思则罔，思而不学则殆。', from: '论语·为政', author: '孔子' },
  { text: '天行健，君子以自强不息。', from: '周易', author: '' },
  { text: '宝剑锋从磨砺出，梅花香自苦寒来。', from: '警世贤文', author: '' },
  { text: '书山有路勤为径，学海无涯苦作舟。', from: '', author: '韩愈' },
  { text: '业精于勤，荒于嬉；行成于思，毁于随。', from: '进学解', author: '韩愈' },
  { text: '路漫漫其修远兮，吾将上下而求索。', from: '离骚', author: '屈原' },
  { text: '锲而舍之，朽木不折；锲而不舍，金石可镂。', from: '荀子·劝学', author: '荀子' },
  { text: '长风破浪会有时，直挂云帆济沧海。', from: '行路难', author: '李白' },
];

export default function QuoteBar() {
  const locale = useLocale();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [spinning, setSpinning] = useState(false);

  const fetchQuote = useCallback(async () => {
    setSpinning(true);
    try {
      const cat = HITOKOTO_CATEGORIES[Math.floor(Math.random() * HITOKOTO_CATEGORIES.length)];
      const res = await fetch(`https://v1.hitokoto.cn/?c=${cat}&encode=json`);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setQuote({
        text: data.hitokoto,
        from: data.from ?? '',
        author: data.from_who ?? '',
      });
    } catch {
      const idx = Math.floor(Math.random() * FALLBACK_QUOTES.length);
      setQuote(FALLBACK_QUOTES[idx]);
    } finally {
      setTimeout(() => setSpinning(false), 400);
    }
  }, []);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  if (!quote) return null;

  const source = [quote.author, quote.from].filter(Boolean).join('  ·  ');

  return (
    <div className="fixed bottom-2 left-0 right-0 z-30 pointer-events-none">
      <div className="flex items-center justify-center gap-1.5 px-4">
        <p className="text-[11px] leading-none"
          style={{
            color: '#000',
            textShadow: '0 0 8px rgba(255,255,255,0.9), 0 0 16px rgba(255,255,255,0.7), 0 1px 3px rgba(255,255,255,0.8)',
          }}>
          「{quote.text}」{source ? ` —— ${source}` : ''}
        </p>
        <button
          onClick={fetchQuote}
          className="pointer-events-auto flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          style={{
            color: '#334155',
            background: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(226,232,240,0.5)',
          }}
          title={locale === 'zh' ? '换一句' : 'Next quote'}
        >
          <svg
            className={`w-2.5 h-2.5 transition-transform duration-500 ${spinning ? 'animate-spin' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M20.985 4.356v4.992" />
          </svg>
        </button>
      </div>
    </div>
  );
}
