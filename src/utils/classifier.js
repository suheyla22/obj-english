import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;

// Sırayla denenecek modeller — ilk çalışan kullanılır
const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-preview-04-17',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

const PROMPT = `You are an English vocabulary assistant.
Look at this image and identify ALL visible objects.
Return ONLY a valid JSON array of the top 5 objects, most prominent first:
[{"label":"laptop","score":0.97,"turkish":"dizüstü bilgisayar","phonetic":"/ˈlæptɒp/","example":"I use my laptop to write code.","emoji":"💻"},{"label":"coffee mug","score":0.85,"turkish":"kahve kupası","phonetic":"/ˈkɒfi mʌɡ/","example":"She sipped from her coffee mug.","emoji":"☕"}]
Rules:
- label: simple English noun (1-3 words)
- score: confidence 0.0 to 1.0
- turkish: Turkish translation
- phonetic: IPA pronunciation
- example: one simple English sentence using the word
- emoji: single most relevant emoji
- No markdown, no explanation, only the JSON array`;

export async function classifyImage(imageUri) {
  const comp = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 512 } }],
    { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
  );

  const base64 = await FileSystem.readAsStringAsync(comp.uri, { encoding: 'base64' });

  let lastErr;
  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;

    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await wait(10000);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType: 'image/jpeg', data: base64 } },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
      }),
    });

      if (res.status === 429) { lastErr = new Error('rate_limit'); continue; }
      if (res.status === 400) throw new Error('API key geçersiz. aistudio.google.com adresini kontrol et.');
      if (res.status === 404) { lastErr = new Error(`model_not_found:${model}`); break; } // sonraki modeli dene
      if (!res.ok) { lastErr = new Error(`Gemini hatası: ${res.status}`); break; }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

      // Try complete JSON array first
      const arrMatch = text.match(/\[[\s\S]*\]/);
      if (arrMatch) {
        try {
          const parsed = JSON.parse(arrMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map(i => toResult(i));
          }
        } catch {}
      }

      // Fallback: extract individual complete objects (handles truncated responses)
      const recovered = [];
      const objPat = /\{[^{}]+\}/g;
      let om;
      while ((om = objPat.exec(text)) !== null) {
        try {
          const obj = JSON.parse(om[0]);
          if (typeof obj.label === 'string' && typeof obj.score === 'number') recovered.push(obj);

        } catch {}
      }
      if (recovered.length > 0) {
        return recovered.map(i => toResult(i));
      }

      throw new Error('Yanıt ayrıştırılamadı: ' + text.slice(0, 80));
    }
  }

  throw lastErr?.message?.startsWith('rate_limit')
    ? new Error('Çok sık istek. 15 saniye bekleyip tekrar dene.')
    : lastErr || new Error('Tüm modeller başarısız.');
}

function toResult(i) {
  return {
    label:      i.label,
    confidence: Math.round((i.score ?? 0.8) * 100),
    turkish:    i.turkish  || null,
    phonetic:   i.phonetic || null,
    example:    i.example  || null,
    emoji:      i.emoji    || '🔍',
  };
}

const wait = ms => new Promise(r => setTimeout(r, ms));
