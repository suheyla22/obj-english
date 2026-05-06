import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

const ROBOFLOW_KEY = process.env.EXPO_PUBLIC_ROBOFLOW_KEY;
const ROBOFLOW_URL = process.env.EXPO_PUBLIC_ROBOFLOW_URL;
const GEMINI_KEY   = process.env.EXPO_PUBLIC_GEMINI_KEY;

// All 80 COCO classes — static lookup, no API call needed for these
const COCO_VOCAB = {
  'person':         { turkish: 'kişi',                        phonetic: '/ˈpɜːrsən/',          example: 'A person is walking down the street.',               emoji: '🧍' },
  'bicycle':        { turkish: 'bisiklet',                    phonetic: '/ˈbaɪsɪkəl/',          example: 'She rides her bicycle to school every day.',         emoji: '🚲' },
  'car':            { turkish: 'araba',                       phonetic: '/kɑːr/',               example: 'He parked his car in the garage.',                   emoji: '🚗' },
  'motorcycle':     { turkish: 'motosiklet',                  phonetic: '/ˈmoʊtərsaɪkəl/',      example: 'The motorcycle zoomed past the traffic.',            emoji: '🏍️' },
  'airplane':       { turkish: 'uçak',                        phonetic: '/ˈeərpleɪn/',          example: 'The airplane landed safely at the airport.',         emoji: '✈️' },
  'bus':            { turkish: 'otobüs',                      phonetic: '/bʌs/',                example: 'We took the bus to the city center.',                emoji: '🚌' },
  'train':          { turkish: 'tren',                        phonetic: '/treɪn/',              example: "The train arrives at eight o'clock.",                emoji: '🚂' },
  'truck':          { turkish: 'kamyon',                      phonetic: '/trʌk/',               example: 'The truck delivered boxes to the warehouse.',        emoji: '🚚' },
  'boat':           { turkish: 'tekne',                       phonetic: '/boʊt/',               example: 'They sailed the boat across the lake.',              emoji: '⛵' },
  'traffic light':  { turkish: 'trafik ışığı',               phonetic: '/ˈtræfɪk laɪt/',       example: 'Stop when the traffic light turns red.',             emoji: '🚦' },
  'fire hydrant':   { turkish: 'yangın musluğu',              phonetic: '/faɪər ˈhaɪdrənt/',    example: 'The fire hydrant stands on the corner.',             emoji: '🚒' },
  'stop sign':      { turkish: 'dur işareti',                 phonetic: '/stɒp saɪn/',          example: 'Always stop completely at a stop sign.',             emoji: '🛑' },
  'parking meter':  { turkish: 'park saati',                  phonetic: '/ˈpɑːrkɪŋ ˌmiːtər/',   example: 'Put a coin in the parking meter.',                   emoji: '⏱️' },
  'bench':          { turkish: 'bank',                        phonetic: '/bentʃ/',              example: 'We sat on the bench in the park.',                   emoji: '🪑' },
  'bird':           { turkish: 'kuş',                         phonetic: '/bɜːrd/',              example: 'A small bird sat on the branch.',                    emoji: '🐦' },
  'cat':            { turkish: 'kedi',                        phonetic: '/kæt/',                example: 'The cat curled up on the warm blanket.',             emoji: '🐱' },
  'dog':            { turkish: 'köpek',                       phonetic: '/dɒɡ/',                example: 'The dog wagged its tail happily.',                   emoji: '🐶' },
  'horse':          { turkish: 'at',                          phonetic: '/hɔːrs/',              example: 'The horse galloped across the field.',               emoji: '🐴' },
  'sheep':          { turkish: 'koyun',                       phonetic: '/ʃiːp/',               example: 'The sheep grazed on the green hillside.',            emoji: '🐑' },
  'cow':            { turkish: 'inek',                        phonetic: '/kaʊ/',                example: 'The cow gave milk every morning.',                   emoji: '🐄' },
  'elephant':       { turkish: 'fil',                         phonetic: '/ˈelɪfənt/',           example: 'The elephant splashed water with its trunk.',        emoji: '🐘' },
  'bear':           { turkish: 'ayı',                         phonetic: '/ber/',                example: 'The bear searched for honey in the forest.',         emoji: '🐻' },
  'zebra':          { turkish: 'zebra',                       phonetic: '/ˈziːbrə/',            example: 'The zebra has black and white stripes.',             emoji: '🦓' },
  'giraffe':        { turkish: 'zürafa',                      phonetic: '/dʒɪˈræf/',            example: 'The giraffe ate leaves from the tall tree.',         emoji: '🦒' },
  'backpack':       { turkish: 'sırt çantası',               phonetic: '/ˈbækpæk/',            example: 'She carried her books in a backpack.',               emoji: '🎒' },
  'umbrella':       { turkish: 'şemsiye',                    phonetic: '/ʌmˈbrelə/',           example: 'He opened his umbrella when it started raining.',    emoji: '☂️' },
  'handbag':        { turkish: 'el çantası',                 phonetic: '/ˈhændbæɡ/',           example: 'She put her keys in her handbag.',                   emoji: '👜' },
  'tie':            { turkish: 'kravat',                      phonetic: '/taɪ/',                example: 'He wore a blue tie to the interview.',               emoji: '👔' },
  'suitcase':       { turkish: 'valiz',                       phonetic: '/ˈsuːtkeɪs/',          example: 'She packed her suitcase for the trip.',              emoji: '🧳' },
  'frisbee':        { turkish: 'frizbi',                      phonetic: '/ˈfrɪzbiː/',           example: 'They threw the frisbee in the park.',                emoji: '🥏' },
  'skis':           { turkish: 'kayak',                       phonetic: '/skiːz/',              example: 'He put on his skis at the top of the slope.',        emoji: '🎿' },
  'snowboard':      { turkish: 'snowboard',                   phonetic: '/ˈsnoʊbɔːrd/',         example: 'She learned to ride a snowboard last winter.',       emoji: '🏂' },
  'sports ball':    { turkish: 'spor topu',                   phonetic: '/spɔːrts bɔːl/',       example: 'They kicked the sports ball across the field.',      emoji: '⚽' },
  'kite':           { turkish: 'uçurtma',                     phonetic: '/kaɪt/',               example: 'The kite flew high in the windy sky.',               emoji: '🪁' },
  'baseball bat':   { turkish: 'beyzbol sopası',             phonetic: '/ˈbeɪsbɔːl bæt/',      example: 'He swung the baseball bat at the pitch.',            emoji: '⚾' },
  'baseball glove': { turkish: 'beyzbol eldiveni',           phonetic: '/ˈbeɪsbɔːl ɡlʌv/',     example: 'She caught the ball with her baseball glove.',       emoji: '🥊' },
  'skateboard':     { turkish: 'kaykay',                      phonetic: '/ˈskeɪtbɔːrd/',        example: 'He practiced tricks on his skateboard.',             emoji: '🛹' },
  'surfboard':      { turkish: 'sörf tahtası',               phonetic: '/ˈsɜːrfbɔːrd/',        example: 'She carried her surfboard to the beach.',            emoji: '🏄' },
  'tennis racket':  { turkish: 'tenis raketi',               phonetic: '/ˈtenɪs ˈrækɪt/',      example: 'He bought a new tennis racket for the tournament.',  emoji: '🎾' },
  'bottle':         { turkish: 'şişe',                       phonetic: '/ˈbɒtəl/',             example: 'She filled the bottle with cold water.',             emoji: '🍶' },
  'wine glass':     { turkish: 'şarap kadehi',               phonetic: '/waɪn ɡlɑːs/',         example: 'He raised his wine glass for a toast.',              emoji: '🍷' },
  'cup':            { turkish: 'bardak',                      phonetic: '/kʌp/',                example: 'She drank coffee from a ceramic cup.',               emoji: '☕' },
  'fork':           { turkish: 'çatal',                      phonetic: '/fɔːrk/',              example: 'Use a fork to eat your salad.',                      emoji: '🍴' },
  'knife':          { turkish: 'bıçak',                      phonetic: '/naɪf/',               example: 'He used a knife to cut the bread.',                  emoji: '🔪' },
  'spoon':          { turkish: 'kaşık',                      phonetic: '/spuːn/',              example: 'She stirred her soup with a spoon.',                 emoji: '🥄' },
  'bowl':           { turkish: 'kase',                        phonetic: '/boʊl/',               example: 'He poured cereal into a bowl.',                      emoji: '🥣' },
  'banana':         { turkish: 'muz',                         phonetic: '/bəˈnɑːnə/',           example: 'She peeled the banana before eating it.',            emoji: '🍌' },
  'apple':          { turkish: 'elma',                        phonetic: '/ˈæpəl/',              example: 'He bit into a crisp red apple.',                     emoji: '🍎' },
  'sandwich':       { turkish: 'sandviç',                    phonetic: '/ˈsænwɪtʃ/',           example: 'She made a sandwich with cheese and tomato.',        emoji: '🥪' },
  'orange':         { turkish: 'portakal',                    phonetic: '/ˈɒrɪndʒ/',            example: 'He squeezed juice from a fresh orange.',             emoji: '🍊' },
  'broccoli':       { turkish: 'brokoli',                     phonetic: '/ˈbrɒkəli/',           example: 'Broccoli is a healthy green vegetable.',             emoji: '🥦' },
  'carrot':         { turkish: 'havuç',                       phonetic: '/ˈkærət/',             example: 'The rabbit ate the orange carrot.',                  emoji: '🥕' },
  'hot dog':        { turkish: 'sosisli sandviç',            phonetic: '/hɒt dɒɡ/',            example: 'He ate a hot dog at the baseball game.',             emoji: '🌭' },
  'pizza':          { turkish: 'pizza',                       phonetic: '/ˈpiːtsə/',            example: 'They ordered a large pizza for dinner.',             emoji: '🍕' },
  'donut':          { turkish: 'çörek',                      phonetic: '/ˈdoʊnʌt/',            example: 'She chose a chocolate donut from the bakery.',       emoji: '🍩' },
  'cake':           { turkish: 'pasta',                       phonetic: '/keɪk/',               example: 'They baked a birthday cake for her.',                emoji: '🎂' },
  'chair':          { turkish: 'sandalye',                    phonetic: '/tʃer/',               example: 'He sat down on the wooden chair.',                   emoji: '🪑' },
  'couch':          { turkish: 'kanepe',                      phonetic: '/kaʊtʃ/',              example: 'The cat slept on the soft couch.',                   emoji: '🛋️' },
  'potted plant':   { turkish: 'saksı bitkisi',              phonetic: '/ˈpɒtɪd plɑːnt/',      example: 'She watered the potted plant every morning.',        emoji: '🪴' },
  'bed':            { turkish: 'yatak',                       phonetic: '/bed/',                example: 'He made his bed before leaving for work.',           emoji: '🛏️' },
  'dining table':   { turkish: 'yemek masası',               phonetic: '/ˈdaɪnɪŋ ˈteɪbəl/',    example: 'The family ate dinner at the dining table.',         emoji: '🍽️' },
  'toilet':         { turkish: 'tuvalet',                     phonetic: '/ˈtɔɪlɪt/',            example: 'He fixed the leaking toilet in the bathroom.',       emoji: '🚽' },
  'tv':             { turkish: 'televizyon',                  phonetic: '/ˌtiːˈviː/',           example: 'They watched the movie on the tv.',                  emoji: '📺' },
  'laptop':         { turkish: 'dizüstü bilgisayar',         phonetic: '/ˈlæptɒp/',            example: 'She typed her essay on the laptop.',                 emoji: '💻' },
  'mouse':          { turkish: 'fare (bilgisayar)',           phonetic: '/maʊs/',               example: 'He clicked the mouse to open the file.',             emoji: '🖱️' },
  'remote':         { turkish: 'uzaktan kumanda',             phonetic: '/rɪˈmoʊt/',            example: 'She changed the channel with the remote.',           emoji: '📺' },
  'keyboard':       { turkish: 'klavye',                      phonetic: '/ˈkiːbɔːrd/',          example: 'He typed quickly on the keyboard.',                  emoji: '⌨️' },
  'cell phone':     { turkish: 'cep telefonu',               phonetic: '/sel foʊn/',           example: 'She checked her messages on her cell phone.',        emoji: '📱' },
  'microwave':      { turkish: 'mikrodalga fırın',           phonetic: '/ˈmaɪkroʊweɪv/',       example: 'He heated the soup in the microwave.',               emoji: '📡' },
  'oven':           { turkish: 'fırın',                      phonetic: '/ˈʌvən/',              example: 'She baked cookies in the oven.',                     emoji: '🍳' },
  'toaster':        { turkish: 'ekmek kızartma makinesi',    phonetic: '/ˈtoʊstər/',           example: 'He made toast in the toaster each morning.',         emoji: '🍞' },
  'sink':           { turkish: 'lavabo',                      phonetic: '/sɪŋk/',               example: 'She washed the dishes in the sink.',                 emoji: '🚿' },
  'refrigerator':   { turkish: 'buzdolabı',                  phonetic: '/rɪˈfrɪdʒəreɪtər/',    example: 'He got a cold drink from the refrigerator.',         emoji: '🧊' },
  'book':           { turkish: 'kitap',                       phonetic: '/bʊk/',                example: 'She read a book before going to sleep.',             emoji: '📚' },
  'clock':          { turkish: 'saat',                        phonetic: '/klɒk/',               example: "The clock on the wall showed three o'clock.",        emoji: '🕐' },
  'vase':           { turkish: 'vazo',                        phonetic: '/vɑːz/',               example: 'She put fresh flowers in the vase.',                 emoji: '💐' },
  'scissors':       { turkish: 'makas',                       phonetic: '/ˈsɪzərz/',            example: 'He used scissors to cut the wrapping paper.',        emoji: '✂️' },
  'teddy bear':     { turkish: 'oyuncak ayı',                phonetic: '/ˈtedi ber/',          example: 'The child slept with her teddy bear every night.',   emoji: '🧸' },
  'hair drier':     { turkish: 'saç kurutma makinesi',       phonetic: '/her ˈdraɪər/',        example: 'She dried her hair with the hair drier.',            emoji: '💇' },
  'toothbrush':     { turkish: 'diş fırçası',                phonetic: '/ˈtuːθbrʌʃ/',          example: 'Brush your teeth with a toothbrush twice a day.',    emoji: '🪥' },
};

const GEMINI_TEXT_MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];

export async function classifyImage(imageUri) {
  const comp = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 512 } }],
    { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
  );
  const base64 = await FileSystem.readAsStringAsync(comp.uri, { encoding: 'base64' });

  const url = `${ROBOFLOW_URL}?api_key=${ROBOFLOW_KEY}&name=image.jpg`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `image=${encodeURIComponent(base64)}`,
  });

  if (res.status === 401) throw new Error('Roboflow API anahtarı geçersiz. .env dosyasını kontrol et.');
  if (res.status === 404) throw new Error('Model bulunamadı. EXPO_PUBLIC_ROBOFLOW_URL adresini kontrol et.');
  if (!res.ok) throw new Error(`Roboflow hatası: ${res.status}`);

  const data = await res.json();
  const predictions = data.predictions ?? [];

  if (predictions.length === 0) {
    throw new Error('Nesne bulunamadı. Farklı bir açıdan veya daha iyi ışıkta deneyin.');
  }

  // Deduplicate by class, sort by confidence, take top 5
  const seen = new Set();
  const top = predictions
    .sort((a, b) => b.confidence - a.confidence)
    .filter(p => { if (seen.has(p.class)) return false; seen.add(p.class); return true; })
    .slice(0, 5);

  return Promise.all(top.map(p => buildResult(p.class, p.confidence)));
}

async function buildResult(label, confidence) {
  const vocab = COCO_VOCAB[label.toLowerCase()];
  if (vocab) {
    return { label, confidence: Math.round(confidence * 100), ...vocab };
  }
  // Label not in COCO dict — ask Gemini text API (text-only, much cheaper than vision)
  const lang = await fetchLangData(label);
  return { label, confidence: Math.round(confidence * 100), ...lang };
}

async function fetchLangData(label) {
  if (!GEMINI_KEY) return { turkish: null, phonetic: null, example: null, emoji: '🔍' };

  const prompt = `For the English word or phrase "${label}", return ONLY this JSON (no markdown, no explanation):\n{"turkish":"Türkçe anlam","phonetic":"/IPA/","example":"One simple English sentence.","emoji":"single emoji"}`;

  for (const model of GEMINI_TEXT_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 150 },
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const match = text.match(/\{[\s\S]*?\}/);
      if (match) return JSON.parse(match[0]);
    } catch {}
  }
  return { turkish: null, phonetic: null, example: null, emoji: '🔍' };
}
