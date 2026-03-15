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

  // Medium - Advanced (ID 16-20)
  {
    id: 16,
    text: "Neuroplasticity reveals that the human brain is not a static organ but a dynamic, constantly reorganizing structure. Throughout our lives, neural pathways strengthen or weaken in response to learning, experience, and environmental stimulation, fundamentally challenging earlier assumptions about cognitive development.",
    difficulty: 'medium',
    language: 'en',
  },
  {
    id: 17,
    text: "Darwin's theory of evolution by natural selection posits that organisms possessing advantageous heritable traits are more likely to survive and reproduce. Over successive generations, these adaptive characteristics become prevalent within a population, driving the remarkable diversity of life on Earth.",
    difficulty: 'medium',
    language: 'en',
  },
  {
    id: 18,
    text: "Epistemology, the branch of philosophy concerned with the nature and scope of knowledge, grapples with fundamental questions: What constitutes justified belief? How do we distinguish genuine knowledge from mere opinion? These inquiries remain as pertinent today as they were in ancient Greece.",
    difficulty: 'medium',
    language: 'en',
  },
  {
    id: 19,
    text: "Game theory, a mathematical framework for analyzing strategic interactions, has profound implications for economics, political science, and evolutionary biology. The Nash equilibrium demonstrates that rational agents may reach stable outcomes even when cooperation would yield superior collective results.",
    difficulty: 'medium',
    language: 'en',
  },
  {
    id: 20,
    text: "Astrophysics seeks to comprehend the fundamental mechanisms governing celestial phenomena. From the thermonuclear fusion powering stellar cores to the gravitational collapse forming black holes, each discovery illuminates the extraordinary processes shaping our universe across billions of years.",
    difficulty: 'medium',
    language: 'en',
  },

  // Hard - Advanced (ID 21-30)
  {
    id: 21,
    text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families.",
    difficulty: 'hard',
    language: 'en',
  },
  {
    id: 22,
    text: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair.",
    difficulty: 'hard',
    language: 'en',
  },
  {
    id: 23,
    text: "To be, or not to be, that is the question: whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles, and by opposing end them. To die, to sleep; no more; and by a sleep to say we end the heartache.",
    difficulty: 'hard',
    language: 'en',
  },
  {
    id: 24,
    text: "Quantum entanglement, a phenomenon Einstein famously derided as spooky action at a distance, describes the instantaneous correlation between spatially separated particles. This quintessential feature of quantum mechanics has profound ramifications for cryptography, teleportation protocols, and our philosophical understanding of locality.",
    difficulty: 'hard',
    language: 'en',
  },
  {
    id: 25,
    text: "The CRISPR-Cas9 gene editing system has revolutionized molecular biology by enabling precise, programmable modifications to genomic sequences. This unprecedented capability raises profound ethical questions about germline editing, designer organisms, and the amelioration of hereditary diseases through targeted genetic intervention.",
    difficulty: 'hard',
    language: 'en',
  },
  {
    id: 26,
    text: "Cognitive neuroscience endeavours to elucidate the neural substrates underlying higher-order mental processes: perception, attention, memory consolidation, and executive function. The ephemeral nature of consciousness remains the discipline's most recalcitrant puzzle, resisting reductionist explanations despite sophisticated neuroimaging methodologies.",
    difficulty: 'hard',
    language: 'en',
  },
  {
    id: 27,
    text: "Macroeconomic theory attempts to reconcile the paradoxical relationship between aggregate demand, monetary policy, and inflationary pressures. Keynesian economists advocate countercyclical fiscal intervention, while monetarists emphasize the pernicious consequences of excessive liquidity, rendering consensus perpetually elusive among practitioners.",
    difficulty: 'hard',
    language: 'en',
  },
  {
    id: 28,
    text: "The Renaissance polymath Leonardo da Vinci exemplified the quintessential fusion of artistic virtuosity and scientific inquiry. His meticulous anatomical dissections, aeronautical conceptualizations, and hydraulic engineering schemata presaged discoveries that would not materialize for centuries, transcending the intellectual boundaries of his epoch.",
    difficulty: 'hard',
    language: 'en',
  },
  {
    id: 29,
    text: "Existentialist philosophy, as articulated by Kierkegaard, Nietzsche, and Sartre, confronts the fundamental absurdity of human existence. In a universe devoid of inherent meaning, individuals must forge their own purpose through authentic engagement with the world, embracing radical freedom and its concomitant responsibility.",
    difficulty: 'hard',
    language: 'en',
  },
  {
    id: 30,
    text: "The thermodynamic arrow of time, inextricably linked to entropy's inexorable increase, distinguishes the irreversible macroscopic world from the time-symmetric equations governing microscopic phenomena. This asymmetry underpins our perception of causality, memory formation, and the cosmological trajectory from primordial order to eventual heat death.",
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

  // ===== CHINESE CLASSICS (Pinyin-based) =====
  {
    id: 116,
    text: "xian tian xia zhi you er you, hou tian xia zhi le er le. ju miao tang zhi gao ze you qi min, chu jiang hu zhi yuan ze you qi jun. shi jin yi you, tui yi you you. ran ze he shi er le ye? qi bi yue: xian tian xia zhi you er you, hou tian xia zhi le er le hu!",
    display: "先天下之忧而忧，后天下之乐而乐。居庙堂之高则忧其民，处江湖之远则忧其君。是进亦忧，退亦忧。然则何时而乐耶？其必曰：先天下之忧而忧，后天下之乐而乐乎！",
    difficulty: 'hard',
    language: 'zh',
  },
  {
    id: 117,
    text: "chen liang ji bu min, jin you fu chen yi ai. xian di bu yi chen bei bi, wei zi qu qu, san gu chen yu cao lu zhi zhong, zi shi chen yi dang shi zhi shi. hou zhi qing fu, shou ren yu bai jun zhi ji, feng ming yu wei nan zhi jian.",
    display: "臣亮既不敏，今又负丞以哀。先帝不以臣卑鄙，猥自枉屈，三顾臣于草庐之中，咨臣以当世之事。后值倾覆，受任于败军之际，奉命于危难之间。",
    difficulty: 'hard',
    language: 'zh',
  },
  {
    id: 118,
    text: "yu zhang gu jun, hong du xin fu. xing fen yi zhen, di jie heng lu. san jiang wu hu, kong man jing chu. wu hua tian bao, long guang she niu dou zhi xu; ren jie di ling, xu ru xia chen fan zhi ta.",
    display: "豫章故郡，洪都新府。星分翼轸，地接衡庐。三江五湖，控蛮荆楚。物华天宝，龙光射牛斗之墟；人杰地灵，徐孺下陈蕃之榻。",
    difficulty: 'hard',
    language: 'zh',
  },
  {
    id: 119,
    text: "shan bu zai gao, you xian ze ming. shui bu zai shen, you long ze ling. si shi lou shi, wei wu de xin. tai hen shang jie lv, cao se ru lian qing. tan xiao you hong ru, wang lai wu bai ding. ke yi tiao su qin, yue jin jing. wu si zhu zhi luan er, wu an du zhi lao xing.",
    display: "山不在高，有仙则名。水不在深，有龙则灵。斯是陋室，惟吾德馨。苔痕上阶绿，草色入帘青。谈笑有鸿儒，往来无白丁。可以调素琴，阅金经。无丝竹之乱耳，无案牍之劳形。",
    difficulty: 'hard',
    language: 'zh',
  },
  {
    id: 120,
    text: "shui lu cao mu zhi hua, ke ai zhe shen fan. jin tao yuan ming du ai ju. zi li tang lai, shi ren shen ai mu dan. yu du ai lian zhi chu yu ni er bu ran, zhuo qing lian er bu yao, zhong tong wai zhi, bu man bu zhi, xiang yuan yi qing, ting ting jing zhi.",
    display: "水陆草木之花，可爱者甚蕃。晋陶渊明独爱菊。自李唐来，世人甚爱牡丹。予独爱莲之出淤泥而不染，濯清涟而不妖，中通外直，不蔓不枝，香远益清，亭亭净植。",
    difficulty: 'hard',
    language: 'zh',
  },
  {
    id: 121,
    text: "huan di zhi zui weng ye, zui weng zhi yi bu zai jiu, zai hu shan shui zhi jian ye. shan shui zhi le, de zhi xin er yu zhi jiu ye. ruo fu ri chu er lin fei kai, yun gui er yan xue ming, hui an ming bian, shan jian zhi chao mu ye.",
    display: "环滁皆山也。醉翁之意不在酒，在乎山水之间也。山水之乐，得之心而寓之酒也。若夫日出而林霏开，云归而岩穴暝，晦明变化者，山间之朝暮也。",
    difficulty: 'hard',
    language: 'zh',
  },
  {
    id: 122,
    text: "jin wu ling ren bu yu wei ye, yuan xi zhong, bian de yi shan, shan you xiao kou, fang fo ruo you guang. bian she chuan, cong kou ru. chu ji xia zhai, cai tong ren. fu xing shu shi bu, huo ran kai lang. tu di ping kuang, wu she yan ran, you liang tian mei chi sang zhu zhi shu.",
    display: "晋武陵人捕鱼为业，缘溪行，忘路之远近。忽逢桃花林，便得一山，山有小口，仿佛若有光。便舍船，从口入。初极狭，才通人。复行数十步，豁然开朗。土地平旷，屋舍俨然，有良田美池桑竹之属。",
    difficulty: 'hard',
    language: 'zh',
  },
  {
    id: 123,
    text: "xue er shi xi zhi, bu yi yue hu? you peng zi yuan fang lai, bu yi le hu? ren bu zhi er bu yun, bu yi jun zi hu? wen gu er zhi xin, ke yi wei shi yi. xue er bu si ze wang, si er bu xue ze dai. zhi zhi wei zhi zhi, bu zhi wei bu zhi, shi zhi ye.",
    display: "学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？温故而知新，可以为师矣。学而不思则罔，思而不学则殆。知之为知之，不知为不知，是知也。",
    difficulty: 'hard',
    language: 'zh',
  },
  {
    id: 124,
    text: "dao ke dao, fei chang dao. ming ke ming, fei chang ming. wu ming tian di zhi shi, you ming wan wu zhi mu. gu chang wu yu, yi guan qi miao; chang you yu, yi guan qi jiao. ci liang zhe tong chu er yi ming, tong wei zhi xuan. xuan zhi you xuan, zhong miao zhi men.",
    display: "道可道，非常道。名可名，非常名。无名天地之始，有名万物之母。故常无欲，以观其妙；常有欲，以观其徼。此两者同出而异名，同谓之玄。玄之又玄，众妙之门。",
    difficulty: 'hard',
    language: 'zh',
  },
  {
    id: 125,
    text: "jun bu jian huang he zhi shui tian shang lai, ben liu dao hai bu fu hui. jun bu jian gao tang ming jing bei bai fa, chao ru qing si mu cheng xue. ren sheng de yi xu jin huan, mo shi jin zun kong dui yue. tian sheng wo cai bi you yong, qian jin san jin huan fu lai.",
    display: "君不见黄河之水天上来，奔流到海不复回。君不见高堂明镜悲白发，朝如青丝暮成雪。人生得意须尽欢，莫使金樽空对月。天生我材必有用，千金散尽还复来。",
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
