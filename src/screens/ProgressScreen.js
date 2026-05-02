import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getStats, getWordMastery, getHistory } from '../utils/storage';
import { COLORS, SHADOWS } from '../constants/theme';

const XP_LEVELS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const LEVEL_NAMES = ['Başlangıç', 'Temel', 'Orta-Alt', 'Orta', 'Orta-Üst', 'İleri', 'Yetkin', 'Uzman', 'Usta', 'Efsane'];

function getLevel(xp) {
  let lv = 0;
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (xp >= XP_LEVELS[i]) lv = i;
    else break;
  }
  return lv;
}

function getLevelProgress(xp) {
  const lv = getLevel(xp);
  if (lv >= XP_LEVELS.length - 1) return 1;
  return (xp - XP_LEVELS[lv]) / (XP_LEVELS[lv + 1] - XP_LEVELS[lv]);
}

export default function ProgressScreen() {
  const [stats, setStats]     = useState(null);
  const [mastery, setMastery] = useState({});
  const [words, setWords]     = useState([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getStats(), getWordMastery(), getHistory()]).then(([s, m, h]) => {
        setStats(s);
        setMastery(m);
        const seen = new Set();
        setWords(h.filter(item => {
          if (seen.has(item.word)) return false;
          seen.add(item.word);
          return true;
        }));
      });
    }, [])
  );

  if (!stats) return null;

  const level    = getLevel(stats.totalXP);
  const progress = getLevelProgress(stats.totalXP);
  const total    = stats.totalCorrect + stats.totalWrong;
  const accuracy = total > 0 ? Math.round((stats.totalCorrect / total) * 100) : 0;
  const nextXP   = XP_LEVELS[Math.min(level + 1, XP_LEVELS.length - 1)];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.hero}>
        <View style={styles.heroRow}>
          <HeroStat icon="🔥" value={stats.streak}        label="Gün Serisi" />
          <View style={styles.heroDivider} />
          <HeroStat icon="⭐" value={stats.totalXP}       label="Toplam XP"  />
          <View style={styles.heroDivider} />
          <HeroStat icon="🏆" value={stats.longestStreak} label="En Uzun"    />
        </View>

        <View style={styles.levelBox}>
          <View style={styles.levelRow}>
            <Text style={styles.levelLabel}>Seviye {level + 1} — {LEVEL_NAMES[level]}</Text>
            <Text style={styles.levelXp}>{stats.totalXP} XP</Text>
          </View>
          <View style={styles.levelTrack}>
            <View style={[styles.levelFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          {level < XP_LEVELS.length - 1 && (
            <Text style={styles.levelNext}>Sonraki seviye: {nextXP} XP</Text>
          )}
        </View>
      </LinearGradient>

      <View style={styles.grid}>
        <StatCard icon="scan-outline"          value={stats.totalScanned} label="Tarama"   color={COLORS.primary} />
        <StatCard icon="checkmark-circle-outline" value={stats.totalCorrect} label="Doğru" color={COLORS.accent}  />
        <StatCard icon="close-circle-outline"  value={stats.totalWrong}   label="Yanlış"   color={COLORS.danger}  />
        <StatCard icon="analytics-outline"     value={`${accuracy}%`}     label="Başarı"   color={COLORS.warning} />
      </View>

      {words.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kelime Ustalığı</Text>
          {words.slice(0, 25).map(item => {
            const m = mastery[item.word] || { level: 0 };
            return (
              <View key={item.word} style={styles.masteryRow}>
                <Text style={styles.masteryEmoji}>{item.emoji || '🔍'}</Text>
                <Text style={styles.masteryWord}>{item.word}</Text>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Ionicons
                      key={s}
                      name={s <= m.level ? 'star' : 'star-outline'}
                      size={15}
                      color={s <= m.level ? '#F59E0B' : COLORS.border}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function HeroStat({ icon, value, label }) {
  return (
    <View style={styles.heroCard}>
      <Text style={styles.heroIcon}>{icon}</Text>
      <Text style={styles.heroValue}>{value}</Text>
      <Text style={styles.heroLabel}>{label}</Text>
    </View>
  );
}

function StatCard({ icon, value, label, color }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={26} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { paddingBottom: 32 },

  hero:    { padding: 24, paddingTop: 28 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  heroCard:    { alignItems: 'center', gap: 4 },
  heroIcon:    { fontSize: 28 },
  heroValue:   { fontSize: 28, fontWeight: '800', color: '#FFF' },
  heroLabel:   { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 0.4 },
  heroDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  levelBox:  { gap: 8 },
  levelRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  levelLabel:{ color: '#FFF', fontWeight: '700', fontSize: 14 },
  levelXp:   { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  levelTrack:{ height: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 5, overflow: 'hidden' },
  levelFill: { height: '100%', backgroundColor: '#FCD34D', borderRadius: 5 },
  levelNext: { color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'right' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  statCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: '#FFF',
    borderRadius: 20, padding: 18,
    alignItems: 'center', gap: 6,
    ...SHADOWS.small,
  },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },

  section:      { paddingHorizontal: 16, paddingTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 12, letterSpacing: -0.3 },

  masteryRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 16,
    padding: 12, marginBottom: 8, gap: 10,
    ...SHADOWS.small,
  },
  masteryEmoji: { fontSize: 22 },
  masteryWord:  { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  stars:        { flexDirection: 'row', gap: 2 },
});
