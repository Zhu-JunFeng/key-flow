export interface TextPassage {
  readonly id: number;
  readonly text: string;
  readonly display?: string;  // Chinese characters shown above pinyin
  readonly difficulty: 'easy' | 'medium' | 'hard';
  readonly language: 'en' | 'zh';
}

const passages: readonly TextPassage[] = [
  // ===== ENGLISH =====
  // Easy
  {
    id: 1,
    text: "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet and is commonly used for typing practice.",
    difficulty: 'easy',
    language: 'en',
  },
  {
    id: 2,
    text: "A journey of a thousand miles begins with a single step. Every great achievement starts with the decision to try something new.",
    difficulty: 'easy',
    language: 'en',
  },
  {
    id: 3,
    text: "The sun was setting behind the mountains, painting the sky in shades of orange and pink. A gentle breeze carried the scent of wildflowers.",
    difficulty: 'easy',
    language: 'en',
  },
  {
    id: 4,
    text: "Good morning! Today is a beautiful day to learn something new. Open your mind and let the world surprise you with its wonders.",
    difficulty: 'easy',
    language: 'en',
  },
  {
    id: 5,
    text: "Music is the universal language of mankind. It can express emotions that words cannot capture, bringing people together across cultures.",
    difficulty: 'easy',
    language: 'en',
  },
  // Medium
  {
    id: 6,
    text: "Programming is not about typing fast; it is about thinking clearly and solving problems efficiently. The best code is simple, readable, and maintainable.",
    difficulty: 'medium',
    language: 'en',
  },
  {
    id: 7,
    text: "The Internet has revolutionized the way we communicate, work, and learn. It connects billions of people worldwide, enabling instant access to information.",
    difficulty: 'medium',
    language: 'en',
  },
  {
    id: 8,
    text: "Artificial intelligence is transforming industries from healthcare to transportation. Machine learning algorithms can now recognize patterns and make predictions with remarkable accuracy.",
    difficulty: 'medium',
    language: 'en',
  },
  {
    id: 9,
    text: "The greatest glory in living lies not in never falling, but in rising every time we fall. Challenges are what make life interesting; overcoming them is what makes life meaningful.",
    difficulty: 'medium',
    language: 'en',
  },
  {
    id: 10,
    text: "Climate change represents one of the most significant challenges facing humanity today. Rising temperatures, melting ice caps, and extreme weather events demand urgent collective action.",
    difficulty: 'medium',
    language: 'en',
  },
  // Hard
  {
    id: 11,
    text: "Quantum computing leverages the principles of quantum mechanics to process information in fundamentally different ways than classical computers. Qubits can exist in superposition, enabling parallel computation at an unprecedented scale.",
    difficulty: 'hard',
    language: 'en',
  },
  {
    id: 12,
    text: "The philosophical implications of consciousness remain one of the most debated topics in neuroscience. Despite significant advances in brain imaging technology, the subjective experience of awareness continues to elude scientific explanation.",
    difficulty: 'hard',
    language: 'en',
  },
  {
    id: 13,
    text: "Blockchain technology introduces a decentralized, immutable ledger that eliminates the need for intermediaries in financial transactions. Its cryptographic foundations ensure transparency and security across distributed networks.",
    difficulty: 'hard',
    language: 'en',
  },
  {
    id: 14,
    text: "The Renaissance period witnessed an extraordinary flourishing of art, architecture, science, and literature. Visionaries like Leonardo da Vinci and Michelangelo redefined creative expression and pushed the boundaries of human achievement.",
    difficulty: 'hard',
    language: 'en',
  },
  {
    id: 15,
    text: "Epigenetics challenges the traditional understanding of heredity by demonstrating that environmental factors can modify gene expression without altering the underlying DNA sequence, suggesting that our experiences may influence future generations.",
    difficulty: 'hard',
    language: 'en',
  },

  // ===== CHINESE (Pinyin-based typing) =====
  // Easy
  {
    id: 101,
    text: "jin tian tian qi hen hao, yang guang ming mei, wei feng fu mian, shi yi ge shi he chu qu san bu de hao ri zi.",
    display: "今天天气很好，阳光明媚，微风拂面，是一个适合出去散步的好日子。",
    difficulty: 'easy',
    language: 'zh',
  },
  {
    id: 102,
    text: "xue xi shi yi jian kuai le de shi qing. mei tian jin bu yi dian dian, jiu neng cheng wei geng hao de zi ji.",
    display: "学习是一件快乐的事情。每天进步一点点，就能成为更好的自己。",
    difficulty: 'easy',
    language: 'zh',
  },
  {
    id: 103,
    text: "chun tian lai le, hua er kai le, xiao niao zai zhi tou chang ge. da zi ran chong man le sheng ji yu huo li.",
    display: "春天来了，花儿开了，小鸟在枝头唱歌。大自然充满了生机与活力。",
    difficulty: 'easy',
    language: 'zh',
  },
  {
    id: 104,
    text: "wo xi huan du shu, yin wei shu zhong you hen duo you qu de gu shi. mei yi ben shu dou shi yi ge xin shi jie.",
    display: "我喜欢读书，因为书中有很多有趣的故事。每一本书都是一个新世界。",
    difficulty: 'easy',
    language: 'zh',
  },
  {
    id: 105,
    text: "peng you shi ren sheng zhong zui bao gui de cai fu. zhen cheng de you yi ke yi rang wo men de sheng huo geng jia mei hao.",
    display: "朋友是人生中最宝贵的财富。真诚的友谊可以让我们的生活更加美好。",
    difficulty: 'easy',
    language: 'zh',
  },
  // Medium
  {
    id: 106,
    text: "ke ji de fa zhan zheng zai gai bian wo men de sheng huo fang shi. ren gong zhi neng, da shu ju he yun ji suan yi jing shen ru dao ge ge ling yu.",
    display: "科技的发展正在改变我们的生活方式。人工智能、大数据和云计算已经深入到各个领域。",
    difficulty: 'medium',
    language: 'zh',
  },
  {
    id: 107,
    text: "jian chi shi cheng gong de guan jian. wu lun yu dao duo da de kun nan, zhi yao bu fang qi, zong hui zhao dao jie jue wen ti de ban fa.",
    display: "坚持是成功的关键。无论遇到多大的困难，只要不放弃，总会找到解决问题的办法。",
    difficulty: 'medium',
    language: 'zh',
  },
  {
    id: 108,
    text: "jiao yu shi guo jia fa zhan de ji shi. tong guo jiao yu, wo men ke yi pei yang chu geng duo you xiu de ren cai, tui dong she hui jin bu.",
    display: "教育是国家发展的基石。通过教育，我们可以培养出更多优秀的人才，推动社会进步。",
    difficulty: 'medium',
    language: 'zh',
  },
  {
    id: 109,
    text: "huan jing bao hu shi mei ge ren de ze ren. jie yue neng yuan, jian shao wu ran, cong xiao shi zuo qi, gong tong shou hu wo men de di qiu jia yuan.",
    display: "环境保护是每个人的责任。节约能源，减少污染，从小事做起，共同守护我们的地球家园。",
    difficulty: 'medium',
    language: 'zh',
  },
  {
    id: 110,
    text: "yin yue you zhe shen qi de li liang, ta neng rang ren fang song xin qing, huan jie ya li, ye neng ji li ren men yong gan di mian dui sheng huo de tiao zhan.",
    display: "音乐有着神奇的力量，它能让人放松心情，缓解压力，也能激励人们勇敢地面对生活的挑战。",
    difficulty: 'medium',
    language: 'zh',
  },
  // Hard
  {
    id: 111,
    text: "zai zhe ge xin xi bao zha de shi dai, pi pan xing si wei xian de you wei zhong yao. wo men xu yao xue hui fen bian zhen jia xin xi, du li si kao, zuo chu ming zhi de pan duan.",
    display: "在这个信息爆炸的时代，批判性思维显得尤为重要。我们需要学会分辨真假信息，独立思考，做出明智的判断。",
    difficulty: 'hard',
    language: 'zh',
  },
  {
    id: 112,
    text: "zhong hua wen ming yuan yuan liu chang, bo da jing shen. cong gu dai de si da fa ming dao xian dai de ke ji chuang xin, zhong guo ren min shi zhong zai wei shi jie wen ming zuo chu gong xian.",
    display: "中华文明源远流长，博大精深。从古代的四大发明到现代的科技创新，中国人民始终在为世界文明做出贡献。",
    difficulty: 'hard',
    language: 'zh',
  },
  {
    id: 113,
    text: "liang zi ji suan ji li yong liang zi li xue yuan li, neng gou yi chuan tong ji suan ji wu fa bi ni de su du chu li fu za wen ti, zhe jiang dui mi ma xue he yao wu yan fa chan sheng shen yuan ying xiang.",
    display: "量子计算机利用量子力学原理，能够以传统计算机无法比拟的速度处理复杂问题，这将对密码学和药物研发产生深远影响。",
    difficulty: 'hard',
    language: 'zh',
  },
  {
    id: 114,
    text: "chuang xin shi yi ge min zu jin bu de ling hun, shi yi ge guo jia xing wang fa da de bu jie dong li. zai quan qiu hua de bei jing xia, ke ji chuang xin yi cheng wei guo ji jing zheng de he xin yao su.",
    display: "创新是一个民族进步的灵魂，是一个国家兴旺发达的不竭动力。在全球化的背景下，科技创新已成为国际竞争的核心要素。",
    difficulty: 'hard',
    language: 'zh',
  },
  {
    id: 115,
    text: "tan suo yu zhou de ao mi shi ren lei yong heng de zhui qiu. cong di yi ke ren zao wei xing sheng kong, dao huo xing tan ce qi cheng gong zhuo lu, mei yi bu dou biao zhi zhe ren lei ke ji de ju da fei yue.",
    display: "探索宇宙的奥秘是人类永恒的追求。从第一颗人造卫星升空，到火星探测器成功着陆，每一步都标志着人类科技的巨大飞跃。",
    difficulty: 'hard',
    language: 'zh',
  },
];

export function getRandomPassage(
  difficulty?: 'easy' | 'medium' | 'hard',
  language?: 'en' | 'zh'
): TextPassage {
  let filtered = passages;
  if (difficulty) filtered = filtered.filter(p => p.difficulty === difficulty);
  if (language) filtered = filtered.filter(p => p.language === language);
  if (filtered.length === 0) filtered = passages;
  const index = Math.floor(Math.random() * filtered.length);
  return filtered[index];
}

export function getPassageById(id: number): TextPassage | undefined {
  return passages.find(p => p.id === id);
}

export function getPassagesByLanguage(language: 'en' | 'zh'): readonly TextPassage[] {
  return passages.filter(p => p.language === language);
}

export { passages };
