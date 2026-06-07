import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet,
  TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { getHistory, clearHistory, deleteFromHistory, getFavorites, toggleFavorite } from '../utils/storage';
import { SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { CATEGORIES } from '../utils/wordInfo';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [history, setHistory]   = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [filter, setFilter]     = useState('all'); // 'all' | 'favorites'

  useFocusEffect(
    useCallback(() => {
      Promise.all([getHistory(), getFavorites()]).then(([h, favs]) => {
        setHistory(h);
        setFavorites(favs);
      });
    }, [])
  );

  const displayed = filter === 'favorites'
    ? history.filter(item => favorites.has(item.id))
    : history;

  async function handleClear() {
    Alert.alert('Geçmişi Temizle', 'Tüm taramalar silinecek. Emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Temizle', style: 'destructive',
        onPress: async () => { await clearHistory(); setHistory([]); },
      },
    ]);
  }

  async function handleToggleFavorite(id) {
    const isFav = await toggleFavorite(id);
    setFavorites(prev => {
      const next = new Set(prev);
      if (isFav) next.add(id); else next.delete(id);
      return next;
    });
  }

  if (history.length === 0) {
    return (
      <View style={s.empty}>
        <Ionicons name="time-outline" size={64} color={colors.border} />
        <Text style={s.emptyTitle}>Henüz tarama yok</Text>
        <Text style={s.emptySubtitle}>Tara sekmesinden nesne tarayın</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <View style={s.filterRow}>
          <TouchableOpacity
            style={[s.filterBtn, filter === 'all' && s.filterBtnActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[s.filterTxt, filter === 'all' && s.filterTxtActive]}>Tümü ({history.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.filterBtn, filter === 'favorites' && s.filterBtnActive]}
            onPress={() => setFilter('favorites')}
          >
            <Ionicons name="star" size={13} color={filter === 'favorites' ? '#FFF' : '#F59E0B'} />
            <Text style={[s.filterTxt, filter === 'favorites' && s.filterTxtActive]}>Favoriler ({favorites.size})</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleClear} style={s.clearBtn}>
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
        </TouchableOpacity>
      </View>

      {displayed.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 40 }}>⭐</Text>
          <Text style={s.emptyTitle}>Favori yok</Text>
          <Text style={s.emptySubtitle}>Kayıtlarda yıldıza basarak favori ekle</Text>
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <HistoryCard
              item={item}
              isFavorite={favorites.has(item.id)}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
              onDelete={async () => {
                await deleteFromHistory(item.id);
                setHistory(h => h.filter(i => i.id !== item.id));
              }}
              colors={colors}
              s={s}
            />
          )}
        />
      )}
    </View>
  );
}

function HistoryCard({ item, isFavorite, onToggleFavorite, onDelete, colors, s }) {
  function handleLongPress() {
    Alert.alert(item.word, 'Bu kaydı silmek istiyor musun?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: onDelete },
    ]);
  }
  const date    = new Date(item.timestamp);
  const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  const cat     = item.category && CATEGORIES[item.category];

  return (
    <TouchableOpacity style={s.card} onLongPress={handleLongPress} activeOpacity={0.9} delayLongPress={400}>
      <Image source={{ uri: item.imageUri }} style={s.thumb} />
      <View style={s.info}>
        <View style={s.cardTop}>
          <Text style={s.cardEmoji}>{item.emoji || '🔍'}</Text>
          <Text style={s.cardWord} numberOfLines={1}>{item.word}</Text>
          <TouchableOpacity onPress={() => Speech.speak(item.word, { language: 'en-US', pitch: 1.0, rate: 0.9 })} style={s.speakBtn}>
            <Ionicons name="volume-high-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onToggleFavorite} style={s.favBtn}>
            <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={16} color={isFavorite ? '#F59E0B' : colors.textSecondary} />
          </TouchableOpacity>
          <View style={[s.badge, { backgroundColor: confColor(item.confidence) }]}>
            <Text style={s.badgeText}>{item.confidence}%</Text>
          </View>
        </View>
        {item.phonetic
          ? <Text style={s.phonetic}>{item.phonetic}</Text>
          : <Text style={s.phonetic} numberOfLines={1}>{item.label}</Text>
        }
        <View style={s.bottomRow}>
          {item.turkish && <Text style={s.turkish}>🇹🇷 {item.turkish}</Text>}
          {cat && (
            <View style={[s.catPill, { backgroundColor: cat.color + '22' }]}>
              <Text style={[s.catTxt, { color: cat.color }]}>{cat.icon} {cat.label}</Text>
            </View>
          )}
        </View>
        <Text style={s.timestamp}>{dateStr} · {timeStr}</Text>
      </View>
    </TouchableOpacity>
  );
}

function confColor(c) {
  if (c >= 70) return '#10B981';
  if (c >= 40) return '#F59E0B';
  return '#EF4444';
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },

    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
    emptyTitle:    { fontSize: 20, fontWeight: '700', color: c.textSecondary },
    emptySubtitle: { fontSize: 14, color: c.textSecondary },

    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 12, paddingVertical: 10,
      backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    filterRow:      { flexDirection: 'row', gap: 8 },
    filterBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: c.overlay },
    filterBtnActive:{ backgroundColor: c.primary },
    filterTxt:      { fontSize: 13, fontWeight: '600', color: c.text },
    filterTxtActive:{ color: '#FFF' },
    clearBtn:       { padding: 6 },

    list: { padding: 12, gap: 10 },
    card: { flexDirection: 'row', backgroundColor: c.surface, borderRadius: 18, overflow: 'hidden', ...SHADOWS.small },
    thumb: { width: 84, height: 84 },
    info:  { flex: 1, padding: 10, justifyContent: 'space-between' },

    cardTop:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
    cardEmoji:{ fontSize: 18 },
    cardWord: { flex: 1, fontSize: 16, fontWeight: '700', color: c.text },
    speakBtn: { padding: 3 },
    favBtn:   { padding: 3 },
    badge:    { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 12 },
    badgeText:{ color: '#FFF', fontSize: 11, fontWeight: '700' },

    phonetic:  { fontSize: 13, color: c.textSecondary },
    bottomRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
    turkish:   { fontSize: 12, color: '#92400E', fontWeight: '600' },
    catPill:   { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    catTxt:    { fontSize: 11, fontWeight: '600' },
    timestamp: { fontSize: 11, color: c.textSecondary, marginTop: 2 },
  });
}
