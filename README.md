# ObjEnglish 📸🇬🇧

Kamerayla gördüğün nesneleri anında İngilizce kelimeye çeviren bir mobil dil öğrenme uygulaması. React Native (Expo) ile geliştirildi, nesne tanıma için Google Gemini 2.5 Flash kullanır.

## Nasıl Çalışır

1. Kamerayla bir nesnenin fotoğrafını çek (ya da galeriden seç)
2. Görsel Gemini 2.5 Flash'a gönderilir, nesne İngilizce kelimeyle etiketlenir
3. Kelimenin telaffuzu (IPA), Türkçe karşılığı, örnek cümlesi ve emoji'si ekranda gösterilir
4. "Seslendir" butonuyla kelimenin doğru telaffuzunu dinleyebilirsin (metin-konuşma)
5. Her tarama geçmişe kaydedilir, ilerlemen zamanla takip edilir

## Özellikler

- **Anlık nesne tanıma** — kamera veya galeri görseli üzerinden, Gemini 2.5 Flash ile
- **Sesli telaffuz** — `expo-speech` ile kelimenin İngilizce okunuşu
- **Zengin kelime kartı** — IPA fonetik, Türkçe çeviri, örnek cümle, kategori ve emoji
- **Tarama geçmişi** — daha önce öğrenilen tüm kelimeler saklanır
- **Pratik / Öğrenme modu** — öğrenilen kelimeler üzerinden tekrar
- **İlerleme takibi** — kaç kelime öğrenildiğine dair istatistik
- **Onboarding akışı** — ilk açılışta kullanıcıyı uygulamaya alıştıran tanıtım ekranları
- **Karanlık / Aydınlık tema**
- **Bildirimler** — `expo-notifications` ile hatırlatmalar
- **Sosyal paylaşım** — öğrenilen kelimeyi tek dokunuşla paylaşma
- Ağ/model hatalarına karşı dayanıklı: birden fazla Gemini modeli sırayla denenir, rate-limit'te otomatik bekleyip tekrar dener

## Ekranlar

| Ekran | Açıklama |
|---|---|
| `ScanScreen` | Kamera/galeri ile tarama ve sonuç kartı |
| `LearnScreen` | Öğrenilen kelimelerle pratik |
| `HistoryScreen` | Geçmiş taramalar |
| `ProgressScreen` | İlerleme istatistikleri |
| `OnboardingScreen` | İlk açılış tanıtımı |

## Teknoloji Yığını

- **React Native** + **Expo SDK 54**
- **React Navigation** (bottom tabs)
- **Google Gemini 2.5 Flash** — görselden nesne/kelime çıkarımı
- `expo-image-picker`, `expo-image-manipulator` — görsel seçme ve sıkıştırma
- `expo-speech` — metin-konuşma (telaffuz)
- `expo-haptics` — dokunsal geri bildirim
- `@react-native-async-storage/async-storage` — yerel depolama (geçmiş, ilerleme)
- `expo-notifications` — bildirimler

## Kurulum

```bash
npm install
```

Bir Google Gemini API anahtarı al ([aistudio.google.com](https://aistudio.google.com)) ve proje köküne bir `.env` dosyası ekle:

```
EXPO_PUBLIC_GEMINI_KEY=senin_api_anahtarin
```

> Not: `EXPO_PUBLIC_` ile başlayan değişkenler Expo tarafından uygulamanın içine gömülür. Bu anahtar sadece geliştirme/test amaçlıdır — bir üretim uygulamasında API çağrılarının kendi backend'in üzerinden, anahtarı istemciye hiç göndermeden yapılması gerekir.

## Çalıştırma

```bash
npm start
```

Açılan QR kodu Expo Go uygulamasıyla telefonundan okut, ya da emülatörde `a` (Android) / `i` (iOS) tuşuna bas.
