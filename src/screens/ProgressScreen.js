import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getStats, getWordMastery, getHistory, getSettings, saveSettings } from '../utils/storage';
import { SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { CATEGORIES } from '../utils/wordInfo';
import { requestNotificationPermission, scheduleDailyReminder, cancelReminders } from '../utils/notifications';

const XP_LEVELS   = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const LEVEL_NAMES = ['Başlangıç', 'Temel', 'Orta-Alt', 'Orta', 'Orta-Üst', 'İleri', 'Yetkin', 'Uzman', 'Usta', 'Efsane'];

function getLevel(xp) {
  let lv = 0;
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (xp >= XP_LEVELS[i]) lv = i; else break;
  }
  return lv;
}

function getLevelProgress(xp) {
  const lv = getLevel(xp);
  if (lv >= XP_LEVELS.length - 1) return 1;
  return (xp - XP_LEVELS[lv]) / (XP_LEVELS[lv + 1] - XP_LEVELS[lv]);
}

export default function ProgressScreen() {
  const { isDark, toggleTheme, colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [stats, setStats]       = useState(null);
  const [mastery, setMastery]   = useState({});
  const [words, setWords]       = useState([]);
  const [settings, setSettings] = useState(null);
  const [catCounts, setCatCounts] = useState({});

  useFocusEffect(
    useCallback(() => {
      Promise.all([getStats(), getWordMastery(), getHistory(), getSettings()]).then(([st, m, h, cfg]) => {
        setStats(st);
        setMastery(m);
        setSettings(cfg);
        const seen = new Set();
        const unique = h.filter(item => {
          if (seen.has(item.word)) return false;
          seen.add(item.word);
          return true;
        });
        setWords(unique);

        const counts = {};
        h.forEach(item => {
          const cat = item.category || 'other';
          counts[cat] = (counts[cat] || 0) + 1;
        });
        setCatCounts(counts);
      });
    }, [])
  );

  async function handleNotificationToggle(val) {
    if (val) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('İzin Gerekli', 'Bildirim izni verilmedi. Ayarlardan açabilirsin.');
        return;
      }
      await scheduleDailyReminder(settings.notificationHour, settings.notificationMinute);
    } else {
      await cancelReminders();
    }
    const updated = { ...settings, notificationsEnabled: val };
    await saveSettings(updated);
    setSettings(updated);
  }

  async function handleGoalChange(delta) {
    const newGoal = Math.max(1, Math.min(20, (settings.dailyGoal || 5) + delta));
    const updated = { ...settings, dailyGoal: newGoal };
    await saveSettings(updated);
    setSettings(updated);
  }

  if (!stats || !settings) return null;

  const level    = getLevel(stats.totalXP);
  const progress = getLevelProgress(stats.totalXP);
  const total    = stats.totalCorrect + stats.totalWrong;
  const accuracy = total > 0 ? Math.round((stats.totalCorrect / total) * 100) : 0;
  const nextXP   = XP_LEVELS[Math.min(level + 1, XP_LEVELS.length - 1)];
  const todayPct = Math.min(1, (stats.todayScans || 0) / settings.dailyGoal);
  const goalDone = (stats.todayScans || 0) >= settings.dailyGoal;

  const topCats = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* Hero */}
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={s.hero}>
        <View style={s.heroRow}>
          <HeroStat icon="🔥" value={stats.streak}        label="Gün Serisi" />
          <View style={s.heroDivider} />
          <HeroStat icon="⭐" value={stats.totalXP}       label="Toplam XP"  />
          <View style={s.heroDivider} />
          <HeroStat icon="🏆" value={stats.longestStreak} label="En Uzun"    />
        </View>
        <View style={s.levelBox}>
          <View style={s.levelRow}>
            <Text style={s.levelLabel}>Seviye {level + 1} — {LEVEL_NAMES[level]}</Text>
            <Text style={s.levelXp}>{stats.totalXP} XP</Text>
          </View>
          <View style={s.levelTrack}>
            <View style={[s.levelFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          {level < XP_LEVELS.length - 1 && (
            <Text style={s.levelNext}>Sonraki seviye: {nextXP} XP</Text>
          )}
        </View>
      </LinearGradient>

      {/* Günlük Hedef */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Günlük Hedef</Text>
        <View style={s.goalCard}>
          <View style={s.goalHeader}>
            <Text style={s.goalEmoji}>{goalDone ? '✅' : '🎯'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.goalText}>
                {stats.todayScans || 0} / {settings.dailyGoal} tarama
              </Text>
              <Text style={s.goalSub}>
                {goalDone ? 'Günlük hedef tamamlandı! 🎉' : `${settings.dailyGoal - (stats.todayScans || 0)} tarama kaldı`}
              </Text>
            </View>
            <View style={s.goalBtns}>
              <TouchableOpacity onPress={() => handleGoalChange(-1)} style={s.goalBtn}>
                <Ionicons name="remove" size={18} color={colors.primary} />
              </TouchableOpacity>
              <Text style={s.goalNum}>{settings.dailyGoal}</Text>
              <TouchableOpacity onPress={() => handleGoalChange(1)} style={s.goalBtn}>
                <Ionicons name="add" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.goalTrack}>
            <View style={[s.goalFill, { width: `${Math.round(todayPct * 100)}%`, backgroundColor: goalDone ? colors.accent : colors.primary }]} />
          </View>
        </View>
      </View>

      {/* İstatistik */}
      <View style={s.grid}>
        <StatCard icon="scan-outline"             value={stats.totalScanned} label="Tarama"   color={colors.primary} s={s} />
        <StatCard icon="checkmark-circle-outline" value={stats.totalCorrect} label="Doğru"    color={colors.accent}  s={s} />
        <StatCard icon="close-circle-outline"     value={stats.totalWrong}   label="Yanlış"   color={colors.danger}  s={s} />
        <StatCard icon="analytics-outline"        value={`${accuracy}%`}     label="Başarı"   color={colors.warning} s={s} />
      </View>

      {/* Kategori Dağılımı */}
      {topCats.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Kategori Dağılımı</Text>
          <View style={s.catGrid}>
            {topCats.map(([cat, count]) => {
              const info = CATEGORIES[cat] || CATEGORIES.other;
              return (
                <View key={cat} style={[s.catCard, { borderLeftColor: info.color }]}>
                  <Text style={s.catIcon}>{info.icon}</Text>
                  <Text style={s.catName}>{info.label}</Text>
                  <Text style={[s.catCount, { color: info.color }]}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Kelime Ustalığı */}
      {words.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Kelime Ustalığı</Text>
          {words.slice(0, 25).map(item => {
            const m = mastery[item.word] || { level: 0 };
            return (
              <View key={item.word} style={s.masteryRow}>
                <Text style={s.masteryEmoji}>{item.emoji || '🔍'}</Text>
                <Text style={s.masteryWord}>{item.word}</Text>
                <View style={s.stars}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Ionicons key={star} name={star <= m.level ? 'star' : 'star-outline'} size={15}
                      color={star <= m.level ? '#F59E0B' : colors.border} />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Ayarlar */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Ayarlar</Text>

        <View style={s.settingRow}>
          <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={22} color={colors.primary} />
          <Text style={s.settingLabel}>Karanlık Mod</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={isDark ? colors.primary : '#FFF'}
          />
        </View>

        <View style={s.settingRow}>
          <Ionicons name="notifications-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s.settingLabel}>Günlük Hatırlatma</Text>
            <Text style={s.settingSubLabel}>Her gün 20:00'de bildirim al</Text>
          </View>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={settings.notificationsEnabled ? colors.primary : '#FFF'}
          />
        </View>
      </View>

    </ScrollView>
  );
}

function HeroStat({ icon, value, label }) {
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Text style={{ fontSize: 28 }}>{icon}</Text>
      <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFF' }}>{value}</Text>
      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
}

function StatCard({ icon, value, label, color, s }) {
  return (
    <View style={s.statCard}>
      <Ionicons name={icon} size={26} color={color} />
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content:   { paddingBottom: 32 },

    hero:    { padding: 24, paddingTop: 28 },
    heroRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
    heroDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

    levelBox:  { gap: 8 },
    levelRow:  { flexDirection: 'row', justifyContent: 'space-between' },
    levelLabel:{ color: '#FFF', fontWeight: '700', fontSize: 14 },
    levelXp:   { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
    levelTrack:{ height: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 5, overflow: 'hidden' },
    levelFill: { height: '100%', backgroundColor: '#FCD34D', borderRadius: 5 },
    levelNext: { color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'right' },

    section:      { paddingHorizontal: 16, paddingTop: 20 },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: c.text, marginBottom: 12, letterSpacing: -0.3 },

    goalCard:   { backgroundColor: c.surface, borderRadius: 20, padding: 16, gap: 12, ...SHADOWS.small },
    goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    goalEmoji:  { fontSize: 28 },
    goalText:   { fontSize: 18, fontWeight: '800', color: c.text },
    goalSub:    { fontSize: 13, color: c.textSecondary, marginTop: 2 },
    goalBtns:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
    goalBtn:    { width: 30, height: 30, borderRadius: 15, backgroundColor: c.overlay, justifyContent: 'center', alignItems: 'center' },
    goalNum:    { fontSize: 18, fontWeight: '800', color: c.text, minWidth: 24, textAlign: 'center' },
    goalTrack:  { height: 8, backgroundColor: c.border, borderRadius: 4, overflow: 'hidden' },
    goalFill:   { height: '100%', borderRadius: 4 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, paddingTop: 20, gap: 10 },
    statCard: {
      flex: 1, minWidth: '45%',
      backgroundColor: c.surface, borderRadius: 20, padding: 18,
      alignItems: 'center', gap: 6, ...SHADOWS.small,
    },
    statValue: { fontSize: 28, fontWeight: '800' },
    statLabel: { fontSize: 12, color: c.textSecondary, fontWeight: '600' },

    catGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    catCard:  {
      flex: 1, minWidth: '45%',
      backgroundColor: c.surface, borderRadius: 14, padding: 14,
      borderLeftWidth: 4, ...SHADOWS.small,
    },
    catIcon:  { fontSize: 24, marginBottom: 4 },
    catName:  { fontSize: 13, fontWeight: '700', color: c.text },
    catCount: { fontSize: 22, fontWeight: '800', marginTop: 2 },

    masteryRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.surface, borderRadius: 16,
      padding: 12, marginBottom: 8, gap: 10, ...SHADOWS.small,
    },
    masteryEmoji: { fontSize: 22 },
    masteryWord:  { flex: 1, fontSize: 15, fontWeight: '600', color: c.text },
    stars:        { flexDirection: 'row', gap: 2 },

    settingRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: c.surface, borderRadius: 16,
      padding: 16, marginBottom: 10, ...SHADOWS.small,
    },
    settingLabel:    { flex: 1, fontSize: 15, fontWeight: '600', color: c.text },
    settingSubLabel: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
  });
}
