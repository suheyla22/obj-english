import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY    = '@obj_english_history';
const STATS_KEY      = '@obj_english_stats';
const MASTERY_KEY    = '@obj_english_mastery';
const ONBOARDING_KEY = '@obj_english_onboarding';
const MAX_HISTORY    = 100;

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
};

// ─── History ─────────────────────────────────────────────────────────────────

export async function saveToHistory(item) {
  try {
    const existing = await getHistory();
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

  if (stats.lastActiveDate !== today) {
    stats.streak = stats.lastActiveDate === yesterday ? stats.streak + 1 : 1;
    stats.longestStreak = Math.max(stats.longestStreak, stats.streak);
    stats.lastActiveDate = today;
  }
  stats.totalScanned += 1;
  stats.totalXP += 10;
  await saveStats(stats);
  return stats;
}

export async function recordQuizAnswer(word, correct) {
  const [stats, mastery] = await Promise.all([getStats(), getWordMastery()]);

  if (correct) {
    stats.totalCorrect += 1;
    stats.totalXP += 20;
  } else {
    stats.totalWrong += 1;
  }

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

// ─── Word Mastery ─────────────────────────────────────────────────────────────

export async function getWordMastery() {
  try {
    const data = await AsyncStorage.getItem(MASTERY_KEY);
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}
