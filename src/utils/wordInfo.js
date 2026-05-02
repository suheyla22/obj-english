const DB = {
  cat:        { phonetic: '/kæt/',              example: 'The cat is sleeping on the sofa.',          emoji: '🐱', turkish: 'kedi' },
  dog:        { phonetic: '/dɒɡ/',              example: 'My dog loves to play fetch.',               emoji: '🐶', turkish: 'köpek' },
  bird:       { phonetic: '/bɜːrd/',            example: 'A bird is singing in the tree.',            emoji: '🐦', turkish: 'kuş' },
  fish:       { phonetic: '/fɪʃ/',              example: 'The fish swims in the lake.',               emoji: '🐟', turkish: 'balık' },
  horse:      { phonetic: '/hɔːrs/',            example: 'She rides a horse every morning.',          emoji: '🐴', turkish: 'at' },
  cow:        { phonetic: '/kaʊ/',              example: 'The cow grazes in the field.',              emoji: '🐄', turkish: 'inek' },
  elephant:   { phonetic: '/ˈelɪfənt/',        example: 'The elephant has a very long trunk.',       emoji: '🐘', turkish: 'fil' },
  bear:       { phonetic: '/ber/',              example: 'The bear sleeps all winter long.',          emoji: '🐻', turkish: 'ayı' },
  rabbit:     { phonetic: '/ˈræbɪt/',          example: 'The rabbit hops through the garden.',       emoji: '🐰', turkish: 'tavşan' },
  lion:       { phonetic: '/ˈlaɪən/',          example: 'The lion roared loudly.',                   emoji: '🦁', turkish: 'aslan' },
  tiger:      { phonetic: '/ˈtaɪɡər/',        example: 'The tiger ran across the field.',            emoji: '🐯', turkish: 'kaplan' },
  snake:      { phonetic: '/sneɪk/',           example: 'The snake moves silently.',                 emoji: '🐍', turkish: 'yılan' },
  frog:       { phonetic: '/frɒɡ/',            example: 'The frog jumps into the pond.',             emoji: '🐸', turkish: 'kurbağa' },

  car:        { phonetic: '/kɑːr/',            example: 'I drive my car to work every day.',         emoji: '🚗', turkish: 'araba' },
  bus:        { phonetic: '/bʌs/',             example: 'The bus arrives at eight o\'clock.',        emoji: '🚌', turkish: 'otobüs' },
  truck:      { phonetic: '/trʌk/',            example: 'A big truck drove down the highway.',       emoji: '🚛', turkish: 'kamyon' },
  bicycle:    { phonetic: '/ˈbaɪsɪkəl/',      example: 'She rides her bicycle to school.',          emoji: '🚲', turkish: 'bisiklet' },
  motorcycle: { phonetic: '/ˈmoʊtərsaɪkəl/', example: 'He fixed his motorcycle yesterday.',         emoji: '🏍️', turkish: 'motosiklet' },
  airplane:   { phonetic: '/ˈeərpleɪn/',      example: 'The airplane landed safely.',               emoji: '✈️', turkish: 'uçak' },
  boat:       { phonetic: '/boʊt/',            example: 'We went fishing on a small boat.',          emoji: '⛵', turkish: 'tekne' },
  train:      { phonetic: '/treɪn/',           example: 'The train departs at noon.',                emoji: '🚂', turkish: 'tren' },

  laptop:     { phonetic: '/ˈlæptɒp/',        example: 'I use my laptop to write code.',            emoji: '💻', turkish: 'dizüstü bilgisayar' },
  phone:      { phonetic: '/foʊn/',            example: 'Please call me on my phone.',               emoji: '📱', turkish: 'telefon' },
  camera:     { phonetic: '/ˈkæmərə/',        example: 'She took great photos with her camera.',    emoji: '📷', turkish: 'fotoğraf makinesi' },
  television: { phonetic: '/ˈtelɪvɪʒən/',    example: 'We watch the news on television.',           emoji: '📺', turkish: 'televizyon' },
  keyboard:   { phonetic: '/ˈkiːbɔːrd/',      example: 'He types quickly on his keyboard.',         emoji: '⌨️', turkish: 'klavye' },
  mouse:      { phonetic: '/maʊs/',            example: 'Move the cursor with the mouse.',           emoji: '🖱️', turkish: 'fare' },
  speaker:    { phonetic: '/ˈspiːkər/',       example: 'Turn up the speaker, please.',              emoji: '🔊', turkish: 'hoparlör' },
  headphones: { phonetic: '/ˈhedfoʊnz/',      example: 'I listen to music with headphones.',        emoji: '🎧', turkish: 'kulaklık' },
  remote:     { phonetic: '/rɪˈmoʊt/',        example: 'Where is the remote control?',              emoji: '📡', turkish: 'uzaktan kumanda' },
  clock:      { phonetic: '/klɒk/',            example: 'The clock on the wall says three.',         emoji: '🕐', turkish: 'saat' },

  chair:      { phonetic: '/tʃer/',            example: 'Please sit on the chair.',                 emoji: '🪑', turkish: 'sandalye' },
  table:      { phonetic: '/ˈteɪbəl/',        example: 'The books are on the table.',               emoji: '🪞', turkish: 'masa' },
  sofa:       { phonetic: '/ˈsoʊfə/',         example: 'The sofa is very comfortable.',             emoji: '🛋️', turkish: 'kanepe' },
  bed:        { phonetic: '/bed/',             example: 'I go to bed at ten o\'clock.',              emoji: '🛏️', turkish: 'yatak' },
  lamp:       { phonetic: '/læmp/',            example: 'Turn on the lamp, it\'s dark.',             emoji: '💡', turkish: 'lamba' },
  door:       { phonetic: '/dɔːr/',            example: 'Please close the door.',                   emoji: '🚪', turkish: 'kapı' },
  window:     { phonetic: '/ˈwɪndoʊ/',        example: 'Open the window for some fresh air.',       emoji: '🪟', turkish: 'pencere' },

  apple:      { phonetic: '/ˈæpəl/',          example: 'An apple a day keeps the doctor away.',     emoji: '🍎', turkish: 'elma' },
  banana:     { phonetic: '/bəˈnɑːnə/',       example: 'Monkeys love to eat bananas.',              emoji: '🍌', turkish: 'muz' },
  orange:     { phonetic: '/ˈɒrɪndʒ/',       example: 'I drink orange juice every morning.',        emoji: '🍊', turkish: 'portakal' },
  pizza:      { phonetic: '/ˈpiːtsə/',        example: 'We ordered a pizza for dinner.',            emoji: '🍕', turkish: 'pizza' },
  burger:     { phonetic: '/ˈbɜːrɡər/',      example: 'He ordered a burger with fries.',            emoji: '🍔', turkish: 'hamburger' },
  cup:        { phonetic: '/kʌp/',             example: 'Would you like a cup of tea?',              emoji: '☕', turkish: 'fincan' },
  bottle:     { phonetic: '/ˈbɒtəl/',         example: 'Please hand me the water bottle.',          emoji: '🍶', turkish: 'şişe' },
  bowl:       { phonetic: '/boʊl/',            example: 'She ate a bowl of cereal.',                 emoji: '🥣', turkish: 'kase' },

  shoe:       { phonetic: '/ʃuː/',             example: 'Put on your shoes before going out.',       emoji: '👟', turkish: 'ayakkabı' },
  hat:        { phonetic: '/hæt/',             example: 'He wears a hat in the summer.',             emoji: '🎩', turkish: 'şapka' },
  bag:        { phonetic: '/bæɡ/',             example: 'She carries a bag to school.',              emoji: '👜', turkish: 'çanta' },
  watch:      { phonetic: '/wɒtʃ/',            example: 'He checked his watch for the time.',        emoji: '⌚', turkish: 'kol saati' },
  glasses:    { phonetic: '/ˈɡlɑːsɪz/',      example: 'He wears glasses to read.',                 emoji: '👓', turkish: 'gözlük' },
  umbrella:   { phonetic: '/ʌmˈbrelə/',       example: 'Take an umbrella, it might rain.',          emoji: '☂️', turkish: 'şemsiye' },

  flower:     { phonetic: '/ˈflaʊər/',        example: 'The flower smells very sweet.',             emoji: '🌸', turkish: 'çiçek' },
  tree:       { phonetic: '/triː/',            example: 'The tree provides shade in summer.',        emoji: '🌳', turkish: 'ağaç' },
  mountain:   { phonetic: '/ˈmaʊntɪn/',       example: 'We climbed the mountain together.',         emoji: '⛰️', turkish: 'dağ' },
  beach:      { phonetic: '/biːtʃ/',           example: 'We spent a lovely day at the beach.',       emoji: '🏖️', turkish: 'sahil' },
  sun:        { phonetic: '/sʌn/',             example: 'The sun rises in the east.',               emoji: '☀️', turkish: 'güneş' },

  ball:       { phonetic: '/bɔːl/',            example: 'Kick the ball into the goal.',              emoji: '⚽', turkish: 'top' },
  book:       { phonetic: '/bʊk/',             example: 'She reads a book every night.',             emoji: '📚', turkish: 'kitap' },
  pen:        { phonetic: '/pen/',             example: 'Please lend me your pen.',                 emoji: '✒️', turkish: 'kalem' },
  key:        { phonetic: '/kiː/',             example: 'Don\'t forget your key.',                  emoji: '🔑', turkish: 'anahtar' },
  scissors:   { phonetic: '/ˈsɪzərz/',        example: 'Cut the paper with scissors.',             emoji: '✂️', turkish: 'makas' },
  candle:     { phonetic: '/ˈkændəl/',         example: 'Light the candle on the table.',           emoji: '🕯️', turkish: 'mum' },
  guitar:     { phonetic: '/ɡɪˈtɑːr/',        example: 'She plays the guitar beautifully.',         emoji: '🎸', turkish: 'gitar' },
  piano:      { phonetic: '/piˈænoʊ/',         example: 'He practices piano every afternoon.',      emoji: '🎹', turkish: 'piyano' },
};

const LABEL_MAP = {
  'egyptian cat': 'cat', 'tabby': 'cat', 'tiger cat': 'cat',
  'persian cat': 'cat', 'siamese cat': 'cat', 'angora': 'cat',
  'golden retriever': 'dog', 'labrador retriever': 'dog',
  'german shepherd': 'dog', 'poodle': 'dog', 'beagle': 'dog',
  'bullfrog': 'frog', 'toad': 'frog',
  'laptop computer': 'laptop', 'notebook computer': 'laptop',
  'cellular telephone': 'phone', 'cell phone': 'phone', 'mobile phone': 'phone',
  'computer keyboard': 'keyboard', 'space bar': 'keyboard',
  'computer mouse': 'mouse',
  'digital clock': 'clock', 'wall clock': 'clock', 'analog clock': 'clock', 'stopwatch': 'clock',
  'sports car': 'car', 'convertible': 'car', 'minivan': 'car', 'limousine': 'car',
  'motor scooter': 'motorcycle', 'moped': 'motorcycle',
  'school bus': 'bus', 'trolleybus': 'bus',
  'pickup': 'truck', 'moving van': 'truck',
  'warplane': 'airplane', 'airliner': 'airplane', 'biplane': 'airplane',
  'speedboat': 'boat', 'sailboat': 'boat', 'canoe': 'boat', 'gondola': 'boat',
  'steam locomotive': 'train', 'electric locomotive': 'train',
  'acoustic guitar': 'guitar', 'electric guitar': 'guitar', 'banjo': 'guitar',
  'grand piano': 'piano', 'upright piano': 'piano',
  'running shoe': 'shoe', 'sandal': 'shoe', 'loafer': 'shoe', 'clog': 'shoe',
  'water bottle': 'bottle', 'wine bottle': 'bottle', 'beer bottle': 'bottle',
  'plastic bag': 'bag', 'backpack': 'bag', 'handbag': 'bag', 'purse': 'bag',
  'coffee mug': 'cup', 'teacup': 'cup', 'espresso': 'cup',
  'sunglasses': 'glasses',
  'ballpoint': 'pen', 'fountain pen': 'pen',
  'basketball': 'ball', 'volleyball': 'ball', 'soccer ball': 'ball',
  'football helmet': 'ball', 'tennis ball': 'ball',
  'daisy': 'flower', 'sunflower': 'flower', 'rose': 'flower',
  'cliff': 'mountain', 'alp': 'mountain', 'volcano': 'mountain',
  'seashore': 'beach', 'lakeside': 'beach',
  'book jacket': 'book',
  'remote control': 'remote',
};

export function getWordInfo(rawLabel, geminiTurkish = null) {
  const normalized = rawLabel.toLowerCase().trim();

  if (DB[normalized]) {
    return { word: titleCase(normalized), ...DB[normalized] };
  }

  for (const [key, dbKey] of Object.entries(LABEL_MAP)) {
    if (normalized.includes(key)) {
      return { word: titleCase(dbKey), ...DB[dbKey] };
    }
  }

  const cleaned = normalized
    .split(',')[0]
    .split('(')[0]
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    word: cleaned,
    phonetic: null,
    example: `This is a ${cleaned.toLowerCase()}.`,
    emoji: '🔍',
    turkish: geminiTurkish || null,
  };
}

function titleCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
