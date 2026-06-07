// Yerel veri saklama — AsyncStorage kullandım (cihaz hafızasına kaydediyor)
// Geçmiş, istatistik, kelime ustalığı ve onboarding durumu burada tutuluyor

import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY    = '@obj_english_history';
const STATS_KEY      = '@obj_english_stats';
const MASTERY_KEY    = '@obj_english_mastery';
const ONBOARDING_KEY = '@obj_english_onboarding';
const FAVORITES_KEY  = '@obj_english_favorites';
const SETTINGS_KEY   = '@obj_english_settings';

// En fazla 100 tarama kaydı tutuyorum, üstüne çıkınca eskiyi siliyorum
const MAX_HISTORY = 100;

// ─── Onboarding ───────────────────────────────────────────────────────────────

export async function hasSeenOnboarding() {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true';
  } catch { return false; }
}

export async function setOnboardingSeen() {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

const DEFAULT_STATS = {
  streak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  totalXP: 0,
  totalScanned: 0,
  totalCorrect: 0,
  totalWrong: 0,
  todayScans: 0,
};

const DEFAULT_SETTINGS = {
  dailyGoal: 5,
  notificationsEnabled: false,
  notificationHour: 20,
  notificationMinute: 0,
};

// ─── History ─────────────────────────────────────────────────────────────────

export async function saveToHistory(item) {
  try {
    const existing = await getHistory();
    // Yeni kayıt en üste ekleniyor, toplam 100 ile sınırlandırıyorum
    const updated = [item, ...existing].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Kayıt hatası:', err);
  }
}

export async function getHistory() {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export async function clearHistory() {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

// Tekil silme: id'ye göre filtreleyip geri kaydediyorum
export async function deleteFromHistory(id) {
  const existing = await getHistory();
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(existing.filter(i => i.id !== id)));
}

// ─── Stats & Streak ───────────────────────────────────────────────────────────

export async function getStats() {
  try {
    const data = await AsyncStorage.getItem(STATS_KEY);
    return data ? { ...DEFAULT_STATS, ...JSON.parse(data) } : { ...DEFAULT_STATS };
  } catch { return { ...DEFAULT_STATS }; }
}

async function saveStats(stats) {
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export async function recordScan() {
  const stats = await getStats();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  // Günlük seri takibi: dün aktifse +1, değilse 1'den başlıyor
  if (stats.lastActiveDate !== today) {
    stats.streak = stats.lastActiveDate === yesterday ? stats.streak + 1 : 1;
    stats.longestStreak = Math.max(stats.longestStreak, stats.streak);
    stats.lastActiveDate = today;
    stats.todayScans = 0;
  }
  stats.totalScanned += 1;
  stats.todayScans = (stats.todayScans || 0) + 1;
  stats.totalXP += 10;
  await saveStats(stats);
  return stats;
}

export async function recordQuizAnswer(word, correct) {
  const [stats, mastery] = await Promise.all([getStats(), getWordMastery()]);

  if (correct) {
    stats.totalCorrect += 1;
    stats.totalXP += 20; // Doğru cevap 20 XP kazandırıyor
  } else {
    stats.totalWrong += 1;
  }

  // Kelime ustalığı: her 3 doğruda 1 seviye artıyor, yanlışta geri düşüyor
  if (!mastery[word]) mastery[word] = { correct: 0, wrong: 0, level: 0 };
  if (correct) {
    mastery[word].correct += 1;
    mastery[word].level = Math.min(5, Math.floor(mastery[word].correct / 3));
  } else {
    mastery[word].wrong += 1;
    mastery[word].level = Math.max(0, mastery[word].level - 1);
  }

  await Promise.all([
    saveStats(stats),
    AsyncStorage.setItem(MASTERY_KEY, JSON.stringify(mastery)),
  ]);
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export async function getFavorites() {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    return new Set(data ? JSON.parse(data) : []);
  } catch { return new Set(); }
}

export async function toggleFavorite(id) {
  const favs = await getFavorites();
  if (favs.has(id)) favs.delete(id);
  else favs.add(id);
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs]));
  return favs.has(id);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings() {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

export async function saveSettings(settings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ─── Word Mastery ─────────────────────────────────────────────────────────────

export async function getWordMastery() {
  try {
    const data = await AsyncStorage.getItem(MASTERY_KEY);
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}
