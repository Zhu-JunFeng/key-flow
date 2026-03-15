// Number and symbol practice text generators

const NUMBER_PATTERNS = [
  '123 456 789 012 345 678 901 234 567 890',
  '11 22 33 44 55 66 77 88 99 00 12 34 56 78 90',
  '100 200 300 400 500 600 700 800 900 1000',
  '3.14 2.71 1.41 1.73 2.23 9.81 6.02 3.00',
  '2024 2025 2026 1990 1985 2000 2010 2015',
  '$100 $250 $500 $1000 $2500 $5000 $10000',
  '10% 25% 50% 75% 100% 33% 66% 99%',
  '(1) (2) (3) (4) (5) (6) (7) (8) (9) (10)',
  '1+2=3 4+5=9 6+7=13 8+9=17 10+11=21',
  '12:30 15:45 08:00 23:59 00:01 06:15 18:30',
];

const SYMBOL_PATTERNS = [
  '!@#$%^&*() !@#$%^&*() !@#$%^&*()',
  '{} [] () <> {} [] () <> {} [] () <>',
  'if (x > 0) { return true; } else { return false; }',
  'const arr = [1, 2, 3]; arr.map(x => x * 2);',
  'user@email.com admin@test.org hello@world.net',
  'https://www.example.com/path?key=value&foo=bar',
  '"hello" \'world\' `template` "string" \'test\'',
  'a && b || c != d == e >= f <= g',
  'function add(a: number, b: number): number {}',
  '#header .class #id .item > span + div ~ p',
  'SELECT * FROM users WHERE age >= 18 AND active = 1;',
  'git commit -m "fix: update" && git push origin main',
];

const MIXED_PATTERNS = [
  'Order #12345 - Total: $99.99 (Tax: $8.50)',
  'IP: 192.168.1.1 Port: 8080 MAC: AA:BB:CC:DD:EE:FF',
  'Password: Abc@123! Confirm: Abc@123!',
  'Version 2.1.0-beta.3 (Build #4567)',
  'Score: 95/100 (95%) - Grade: A+',
  'File: data_2024-01-15.csv Size: 1.2MB',
  'Phone: +1 (555) 123-4567 Ext: 890',
  'RGB(255, 128, 0) #FF8000 hsl(30, 100%, 50%)',
];

export type SymbolTrainingType = 'numbers' | 'symbols' | 'mixed';

export function generateSymbolText(type: SymbolTrainingType, count: number = 3): string {
  const patterns = type === 'numbers' ? NUMBER_PATTERNS
    : type === 'symbols' ? SYMBOL_PATTERNS
    : MIXED_PATTERNS;

  const selected: string[] = [];
  const used = new Set<number>();

  for (let i = 0; i < Math.min(count, patterns.length); i++) {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * patterns.length);
    } while (used.has(idx) && used.size < patterns.length);
    used.add(idx);
    selected.push(patterns[idx]);
  }

  return selected.join(' ');
}

// Word count challenge: generate exactly N words
export function generateWordCountText(count: number): string {
  const words = [
    'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog',
    'pack', 'my', 'box', 'with', 'five', 'dozen', 'liquor', 'jugs',
    'how', 'vexingly', 'swift', 'jab', 'did', 'zap', 'frog',
    'bright', 'vixens', 'jump', 'dozy', 'fowl', 'quack',
    'sphinx', 'of', 'black', 'quartz', 'judge', 'vow',
    'able', 'about', 'above', 'across', 'after', 'again', 'almost',
    'along', 'already', 'also', 'always', 'among', 'another',
    'because', 'become', 'before', 'began', 'begin', 'being', 'below',
    'between', 'both', 'build', 'built', 'came', 'carry', 'children',
    'city', 'close', 'could', 'country', 'course', 'cross', 'different',
    'does', 'done', 'door', 'down', 'draw', 'during', 'each',
    'earth', 'enough', 'even', 'every', 'example', 'eyes', 'face',
    'family', 'father', 'feet', 'find', 'first', 'follow', 'food',
    'form', 'found', 'four', 'from', 'gave', 'girl', 'give',
    'going', 'good', 'great', 'group', 'grow', 'had', 'hand',
    'hard', 'have', 'head', 'hear', 'help', 'here', 'high',
    'home', 'house', 'idea', 'important', 'into', 'just', 'keep',
    'kind', 'know', 'land', 'large', 'last', 'late', 'later',
    'learn', 'leave', 'left', 'letter', 'life', 'light', 'line',
    'list', 'little', 'live', 'long', 'look', 'made', 'make',
  ];
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(words[Math.floor(Math.random() * words.length)]);
  }
  return result.join(' ');
}

// Classic literature passages
export const CLASSIC_PASSAGES = {
  en: [
    { title: 'Romeo and Juliet', text: 'But soft, what light through yonder window breaks? It is the east, and Juliet is the sun. Arise, fair sun, and kill the envious moon, who is already sick and pale with grief.' },
    { title: 'A Tale of Two Cities', text: 'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity.' },
    { title: 'Pride and Prejudice', text: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be.' },
    { title: 'The Great Gatsby', text: 'In my younger and more vulnerable years my father gave me some advice that I have been turning over in my mind ever since. Whenever you feel like criticizing anyone, he told me, just remember that all the people in this world have not had the advantages that you have had.' },
    { title: 'To Kill a Mockingbird', text: 'When he was nearly thirteen, my brother Jem got his arm badly broken at the elbow. When it healed, and his fears of never being able to play football were asided, he was seldom self-conscious about his injury.' },
    { title: 'Hamlet', text: 'To be or not to be, that is the question. Whether it is nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles, and by opposing end them.' },
    { title: '1984', text: 'It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors of Victory Mansions.' },
    { title: 'Moby Dick', text: 'Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.' },
  ],
  zh: [
    { title: '论语', text: 'xue er shi xi zhi bu yi yue hu you peng zi yuan fang lai bu yi le hu ren bu zhi er bu yun bu yi jun zi hu', display: '学而时习之不亦说乎有朋自远方来不亦乐乎人不知而不愠不亦君子乎' },
    { title: '道德经', text: 'dao ke dao fei chang dao ming ke ming fei chang ming wu ming tian di zhi shi you ming wan wu zhi mu', display: '道可道非常道名可名非常名无名天地之始有名万物之母' },
    { title: '三字经', text: 'ren zhi chu xing ben shan xing xiang jin xi xiang yuan gou bu jiao xing nai qian jiao zhi dao gui yi zhuan', display: '人之初性本善性相近习相远苟不教性乃迁教之道贵以专' },
    { title: '静夜思', text: 'chuang qian ming yue guang yi shi di shang shuang ju tou wang ming yue di tou si gu xiang', display: '床前明月光疑是地上霜举头望明月低头思故乡' },
    { title: '滕王阁序', text: 'yu zhang gu jun hong du xin fu xing fen yi yi wang jie heng lu zhi zhi dian ya ji er san jiang liu dai jing yi', display: '豫章故郡洪都新府星分翼轸地接衡庐襟三江而带五湖控蛮荆而引瓯越' },
  ],
};

// Quotes
export const FAMOUS_QUOTES = [
  { author: 'Albert Einstein', text: 'Imagination is more important than knowledge. Knowledge is limited. Imagination encircles the world.' },
  { author: 'Steve Jobs', text: 'Stay hungry, stay foolish. The people who are crazy enough to think they can change the world are the ones who do.' },
  { author: 'Martin Luther King Jr.', text: 'Darkness cannot drive out darkness; only light can do that. Hate cannot drive out hate; only love can do that.' },
  { author: 'Winston Churchill', text: 'Success is not final, failure is not fatal; it is the courage to continue that counts.' },
  { author: 'Mahatma Gandhi', text: 'Be the change that you wish to see in the world. An ounce of practice is worth more than tons of preaching.' },
  { author: 'Oscar Wilde', text: 'Be yourself; everyone else is already taken. To live is the rarest thing in the world. Most people exist, that is all.' },
  { author: 'Mark Twain', text: 'The secret of getting ahead is getting started. Twenty years from now you will be more disappointed by the things that you did not do.' },
  { author: 'Nelson Mandela', text: 'It always seems impossible until it is done. Education is the most powerful weapon which you can use to change the world.' },
  { author: 'Confucius', text: 'It does not matter how slowly you go as long as you do not stop. The man who moves a mountain begins by carrying away small stones.' },
  { author: 'Lao Tzu', text: 'A journey of a thousand miles begins with a single step. The wise man does not lay up his own treasures. The more he gives to others, the more he has for his own.' },
];
