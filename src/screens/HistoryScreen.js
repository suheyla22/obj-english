import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet,
  TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { getHistory, clearHistory, deleteFromHistory } from '../utils/storage';
import { COLORS, SHADOWS } from '../constants/theme';

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setHistory);
    }, [])
  );

  function handleClear() {
    Alert.alert('Geçmişi Temizle', 'Tüm taramalar silinecek. Emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Temizle',
        style: 'destructive',
        onPress: async () => {
          await clearHistory();
          setHistory([]);
        },
      },
    ]);
  }

  if (history.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="time-outline" size={64} color={COLORS.border} />
        <Text style={styles.emptyTitle}>Henüz tarama yok</Text>
        <Text style={styles.emptySubtitle}>Tara sekmesinden nesne tarayın</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.count}>{history.length} kayıt</Text>
        <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
          <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
          <Text style={styles.clearText}>Temizle</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <HistoryCard
            item={item}
            onDelete={async () => {
              await deleteFromHistory(item.id);
              setHistory(h => h.filter(i => i.id !== item.id));
            }}
          />
        )}
      />
    </View>
  );
}

function HistoryCard({ item, onDelete }) {
  function handleLongPress() {
    Alert.alert(item.word, 'Bu kaydı silmek istiyor musun?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: onDelete },
    ]);
  }
  const date = new Date(item.timestamp);
  const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

  return (
    <TouchableOpacity style={styles.card} onLongPress={handleLongPress} activeOpacity={0.9} delayLongPress={400}>
      <Image source={{ uri: item.imageUri }} style={styles.thumb} />
      <View style={styles.info}>
        <View style={styles.cardTop}>
          <Text style={styles.cardEmoji}>{item.emoji || '🔍'}</Text>
          <Text style={styles.cardWord}>{item.word}</Text>
          <TouchableOpacity onPress={() => Speech.speak(item.word, { language: 'en-US', pitch: 1.0, rate: 0.9 })} style={styles.speakBtn}>
            <Ionicons name="volume-high-outline" size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={[styles.badge, { backgroundColor: confColor(item.confidence) }]}>
            <Text style={styles.badgeText}>{item.confidence}%</Text>
          </View>
        </View>
        {item.phonetic
          ? <Text style={styles.phonetic}>{item.phonetic}</Text>
          : <Text style={styles.phonetic} numberOfLines={1}>{item.label}</Text>
        }
        {item.turkish && <Text style={styles.turkish}>🇹🇷 {item.turkish}</Text>}
        <Text style={styles.timestamp}>{dateStr} · {timeStr} · Silmek için basılı tut</Text>
      </View>
    </TouchableOpacity>
  );
}

function confColor(c) {
  if (c >= 70) return '#10B981';
  if (c >= 40) return '#F59E0B';
  return '#EF4444';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  emptyTitle:    { fontSize: 20, fontWeight: '700', color: '#9CA3AF' },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF' },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  count:    { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clearText:{ fontSize: 13, color: COLORS.danger, fontWeight: '600' },

  list: { padding: 12, gap: 10 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 18,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  thumb: { width: 84, height: 84 },
  info:  { flex: 1, padding: 12, justifyContent: 'space-between' },

  cardTop:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardEmoji:{ fontSize: 20 },
  cardWord: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.text },
  speakBtn: { padding: 4 },
  badge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText:{ color: '#FFF', fontSize: 11, fontWeight: '700' },

  phonetic: { fontSize: 13, color: COLORS.textSecondary },
  turkish:  { fontSize: 12, color: '#92400E', fontWeight: '600' },
  timestamp: { fontSize: 11, color: '#9CA3AF' },
});
