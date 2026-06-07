import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, ScrollView, Animated, Alert, Share,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { classifyImage } from '../utils/classifier';
import { saveToHistory, recordScan } from '../utils/storage';
import { SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { CATEGORIES } from '../utils/wordInfo';
import ConfidenceBar from '../components/ConfidenceBar';

const COOLDOWN = 5;

export default function ScanScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [image, setImage]       = useState(null);
  const [results, setResults]   = useState(null);
  const [wordInfo, setWordInfo] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const timerRef  = useRef(null);

  function startCooldown() {
    setCooldown(COOLDOWN);
    let n = COOLDOWN;
    timerRef.current = setInterval(() => {
      n -= 1;
      setCooldown(n);
      if (n <= 0) clearInterval(timerRef.current);
    }, 1000);
  }

  async function processImage(uri) {
    setLoading(true);
    setResults(null);
    setWordInfo(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const predictions = await classifyImage(uri);
      const top = predictions[0];
      const info = {
        word:     top.label.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        phonetic: top.phonetic,
        example:  top.example,
        emoji:    top.emoji,
        turkish:  top.turkish,
        category: top.category || 'other',
      };

      setResults(predictions);
      setWordInfo(info);
      startCooldown();
      await recordScan();

      await saveToHistory({
        id: Date.now(), imageUri: uri,
        word: info.word, label: top.label,
        confidence: top.confidence,
        phonetic: info.phonetic, example: info.example,
        emoji: info.emoji, turkish: info.turkish,
        category: info.category,
        timestamp: new Date().toISOString(),
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fadeAnim.setValue(0); slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8,   useNativeDriver: true }),
      ]).start();
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Hata', err.message || 'Bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    if (!wordInfo) return;
    try {
      await Share.share({
        message:
          `${wordInfo.emoji} ${wordInfo.word}\n` +
          (wordInfo.phonetic ? `${wordInfo.phonetic}\n` : '') +
          (wordInfo.turkish  ? `🇹🇷 ${wordInfo.turkish}\n` : '') +
          (wordInfo.example  ? `💬 "${wordInfo.example}"` : '') +
          `\n\n#ObjEnglish #İngilizceÖğren`,
        title: `ObjEnglish — ${wordInfo.word}`,
      });
    } catch {}
  }

  const busy = loading || cooldown > 0;
  const btnLabel = (text) => cooldown > 0 ? `${cooldown}s` : loading ? '…' : text;

  return (
    <ScrollView style={[s.container]} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      <View style={s.imageBox}>
        {image ? (
          <Image source={{ uri: image }} style={s.image} resizeMode="cover" />
        ) : (
          <LinearGradient colors={colors.background === '#0F172A' ? ['#1E293B', '#0F172A'] : ['#EEF2FF', '#E0E7FF']} style={s.placeholder}>
            <Ionicons name="scan-outline" size={72} color={colors.primaryLight} />
            <Text style={s.phTitle}>Nesneyi Tara</Text>
            <Text style={s.phSub}>Gemini 2.5 Flash ile tanı</Text>
          </LinearGradient>
        )}
        {loading && (
          <View style={s.overlay}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={s.overlayText}>Gemini 2.5 analiz ediyor…</Text>
          </View>
        )}
      </View>

      {results && wordInfo && (
        <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={s.cardHeader}>
            <Text style={s.emoji}>{wordInfo.emoji}</Text>
            <View style={s.wordBlock}>
              <View style={s.wordRow}>
                <Text style={s.wordText}>{wordInfo.word}</Text>
                <TouchableOpacity
                  onPress={() => Speech.speak(wordInfo.word, { language: 'en-US', pitch: 1.0, rate: 0.9 })}
                  style={s.speakIcon}
                >
                  <Ionicons name="volume-high-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              {wordInfo.phonetic && <Text style={s.phonetic}>{wordInfo.phonetic}</Text>}
              {wordInfo.turkish && (
                <View style={s.turkishPill}>
                  <Text style={s.turkishTxt}>🇹🇷 {wordInfo.turkish}</Text>
                </View>
              )}
              {wordInfo.category && CATEGORIES[wordInfo.category] && (
                <View style={[s.categoryPill, { backgroundColor: CATEGORIES[wordInfo.category].color + '22' }]}>
                  <Text style={[s.categoryTxt, { color: CATEGORIES[wordInfo.category].color }]}>
                    {CATEGORIES[wordInfo.category].icon} {CATEGORIES[wordInfo.category].label}
                  </Text>
                </View>
              )}
            </View>
            <View style={s.rightCol}>
              <View style={[s.badge, { backgroundColor: confColor(results[0].confidence) }]}>
                <Text style={s.badgeText}>{results[0].confidence}%</Text>
              </View>
              <TouchableOpacity onPress={handleShare} style={s.shareBtn}>
                <Ionicons name="share-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {wordInfo.example && (
            <View style={s.exBox}>
              <Text style={s.exLabel}>ÖRNEK CÜMLE</Text>
              <Text style={s.exText}>"{wordInfo.example}"</Text>
            </View>
          )}

          {results.length > 1 && (
            <View style={s.predsBox}>
              <Text style={s.predsLabel}>GÖRSELDEKİ DİĞER NESNELER</Text>
              {results.slice(1, 5).map((p, i) => (
                <ConfidenceBar key={i} label={p.label} confidence={p.confidence} delay={i * 80} />
              ))}
            </View>
          )}
        </Animated.View>
      )}

      <View style={s.btnRow}>
        <TouchableOpacity
          style={[s.btn, s.btnPrimary, busy && s.btnOff]}
          onPress={async () => {
            if (busy) return;
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') { Alert.alert('İzin Gerekli', 'Kamera için izin gerekiyor.'); return; }
            const r = await ImagePicker.launchCameraAsync({ quality: 0.85 });
            if (!r.canceled) { setImage(r.assets[0].uri); processImage(r.assets[0].uri); }
          }}
          disabled={busy} activeOpacity={0.85}
        >
          <Ionicons name="camera" size={22} color="#FFF" />
          <Text style={s.btnWhite}>{btnLabel('Kamera')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btn, s.btnOutline, busy && s.btnOff]}
          onPress={async () => {
            if (busy) return;
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') { Alert.alert('İzin Gerekli', 'Galeri için izin gerekiyor.'); return; }
            const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
            if (!r.canceled) { setImage(r.assets[0].uri); processImage(r.assets[0].uri); }
          }}
          disabled={busy} activeOpacity={0.85}
        >
          <Ionicons name="images" size={22} color={busy ? colors.textSecondary : colors.primary} />
          <Text style={[s.btnPrimaryTxt, busy && { color: colors.textSecondary }]}>{btnLabel('Galeri')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function confColor(c) {
  if (c >= 70) return '#10B981';
  if (c >= 40) return '#F59E0B';
  return '#EF4444';
}

function makeStyles(c) {
  return StyleSheet.create({
    container:    { flex: 1, backgroundColor: c.background },
    content:      { padding: 16, paddingBottom: 32 },
    imageBox:     { width: '100%', height: 290, borderRadius: 24, overflow: 'hidden', marginBottom: 16, ...SHADOWS.large },
    image:        { width: '100%', height: '100%' },
    placeholder:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
    phTitle:      { fontSize: 18, fontWeight: '700', color: c.primaryLight },
    phSub:        { fontSize: 13, color: c.textSecondary },
    overlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', gap: 14 },
    overlayText:  { color: '#FFF', fontSize: 15, fontWeight: '600' },
    card:         { backgroundColor: c.surface, borderRadius: 24, padding: 20, marginBottom: 16, ...SHADOWS.medium },
    cardHeader:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
    emoji:        { fontSize: 44 },
    wordBlock:    { flex: 1 },
    wordRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
    wordText:     { fontSize: 30, fontWeight: '800', color: c.text, letterSpacing: -0.5 },
    speakIcon:    { padding: 4, backgroundColor: c.overlay, borderRadius: 10 },
    phonetic:     { fontSize: 15, color: c.textSecondary, marginTop: 2 },
    turkishPill:  { alignSelf: 'flex-start', backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
    turkishTxt:   { fontSize: 13, fontWeight: '600', color: '#92400E' },
    categoryPill: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
    categoryTxt:  { fontSize: 12, fontWeight: '600' },
    rightCol:     { alignItems: 'center', gap: 8 },
    badge:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    badgeText:    { color: '#FFF', fontWeight: '700', fontSize: 13 },
    shareBtn:     { padding: 6, backgroundColor: c.overlay, borderRadius: 10 },
    exBox:        { backgroundColor: c.overlay, borderRadius: 14, padding: 14, marginBottom: 14 },
    exLabel:      { fontSize: 10, fontWeight: '700', color: c.primary, letterSpacing: 0.8, marginBottom: 6 },
    exText:       { fontSize: 15, color: c.text, fontStyle: 'italic', lineHeight: 22 },
    predsBox:     { gap: 8 },
    predsLabel:   { fontSize: 10, fontWeight: '700', color: c.textSecondary, letterSpacing: 0.8, marginBottom: 4 },
    btnRow:       { flexDirection: 'row', gap: 12 },
    btn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 18, gap: 8, ...SHADOWS.small },
    btnPrimary:   { backgroundColor: c.primary },
    btnOutline:   { backgroundColor: c.surface, borderWidth: 2, borderColor: c.primary },
    btnOff:       { opacity: 0.5 },
    btnWhite:     { color: '#FFF', fontWeight: '700', fontSize: 16 },
    btnPrimaryTxt:{ color: c.primary, fontWeight: '700', fontSize: 16 },
  });
}
