// SEO Keywords và Meta Descriptions cho các loại sản phẩm

export const SEO_KEYWORDS = {
  // Game Tools & Hacks
  HACKMAP: [
    'hackmap lmht',
    'hackmap liên minh',
    'hackmap league of legends',
    'tool hackmap lol',
    'hackmap tướng miễn phí',
    'hackmap skin miễn phí',
    'hackmap lol việt nam',
    'key hackmap',
  ].join(', '),
  
  GAME_TOOL: [
    'tool game',
    'game tool hack',
    'tool chơi game',
    'phần mềm hỗ trợ game',
    'tool auto game',
    'tool farm game',
    'game utility',
    'game enhancement tool',
  ].join(', '),
  
  CHEAT_MOD: [
    'cheat game',
    'game cheat',
    'mod game',
    'game mod menu',
    'trainer game',
    'game modifier',
    'cheat engine',
    'game save editor',
  ].join(', '),
  
  // Windows & Software
  WINDOWS: [
    'key windows',
    'windows bản quyền',
    'key win 10',
    'key win 11',
    'active windows',
    'mua key windows',
    'windows license',
  ].join(', '),
  
  OFFICE: [
    'key office',
    'office bản quyền',
    'microsoft office',
    'key office 365',
    'key office 2021',
    'active office',
  ].join(', '),
};

export const SEO_DESCRIPTIONS = {
  HACKMAP: 'Cung cấp key hackmap LMHT, tool hack League of Legends chính hãng. Hackmap skin, tướng miễn phí, script an toàn. Giao key tự động 24/7, hỗ trợ update liên tục.',
  
  GAME_TOOL: 'Bán key tool game, phần mềm hỗ trợ chơi game chuyên nghiệp. Tool auto farm, macro, enhancement tools với giá rẻ. Giao key tức thì, bảo hành uy tín.',
  
  CHEAT_MOD: 'Key cheat game, mod menu, trainer bản quyền giá tốt. Game modifier, cheat engine, save editor an toàn. Hỗ trợ nhiều game phổ biến, update thường xuyên.',
  
  WINDOWS: 'Key Windows bản quyền chính hãng, giá rẻ nhất thị trường. Windows 10, 11 Pro/Home/Enterprise. Giao key tự động, active online trọn đời.',
  
  OFFICE: 'Key Microsoft Office bản quyền, Office 365, 2021, 2019 giá tốt. Active trọn đời, hỗ trợ nhiều thiết bị. Giao key tức thì 24/7.',
};

// Category descriptions cho SEO
export const CATEGORY_SEO = {
  hackmap: {
    title: 'Hackmap LMHT - Tool Hack League of Legends',
    description: SEO_DESCRIPTIONS.HACKMAP,
    keywords: SEO_KEYWORDS.HACKMAP,
  },
  'game-tool': {
    title: 'Tool Game - Phần Mềm Hỗ Trợ Chơi Game',
    description: SEO_DESCRIPTIONS.GAME_TOOL,
    keywords: SEO_KEYWORDS.GAME_TOOL,
  },
  'cheat-mod': {
    title: 'Cheat Game - Mod Menu - Game Trainer',
    description: SEO_DESCRIPTIONS.CHEAT_MOD,
    keywords: SEO_KEYWORDS.CHEAT_MOD,
  },
  windows: {
    title: 'Key Windows Bản Quyền Giá Rẻ',
    description: SEO_DESCRIPTIONS.WINDOWS,
    keywords: SEO_KEYWORDS.WINDOWS,
  },
  office: {
    title: 'Key Microsoft Office Bản Quyền',
    description: SEO_DESCRIPTIONS.OFFICE,
    keywords: SEO_KEYWORDS.OFFICE,
  },
};

// Helper function để lấy SEO data cho category
export const getCategorySEO = (categorySlug: string) => {
  return CATEGORY_SEO[categorySlug as keyof typeof CATEGORY_SEO] || {
    title: 'Sản phẩm',
    description: 'Mua key bản quyền phần mềm, game, tool giá rẻ',
    keywords: 'key bản quyền, phần mềm, game',
  };
};

// Popular search terms cho suggestions
export const POPULAR_SEARCHES = [
  'hackmap lol',
  'tool game',
  'key windows',
  'key office',
  'cheat game',
  'mod game',
  'key phần mềm',
  'tool hack',
  'game trainer',
  'hackmap lmht',
];

// Related keywords cho internal linking
export const RELATED_KEYWORDS = {
  hackmap: ['tool game', 'cheat game', 'mod game', 'script game'],
  tool: ['hackmap', 'auto farm', 'game utility', 'macro game'],
  cheat: ['trainer', 'mod menu', 'save editor', 'hackmap'],
  windows: ['office', 'phần mềm', 'activation', 'license'],
  office: ['windows', 'microsoft', 'productivity', 'word excel'],
};
