import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, ScrollView, Animated, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { classifyImage } from '../utils/classifier';
import { saveToHistory, recordScan } from '../utils/storage';
import { COLORS, SHADOWS } from '../constants/theme';
import ConfidenceBar from '../components/ConfidenceBar';

const COOLDOWN = 5; // saniye

export default function ScanScreen() {
  const [image, setImage]        = useState(null);
  const [results, setResults]    = useState(null);
  const [wordInfo, setWordInfo]  = useState(null);
  const [loading, setLoading]    = useState(false);
  const [cooldown, setCooldown]  = useState(0);
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

  const busy = loading || cooldown > 0;

  async function pickFromCamera() {
    if (busy) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('İzin Gerekli', 'Kamera için izin gerekiyor.'); return; }
    const r = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!r.canceled) { setImage(r.assets[0].uri); processImage(r.assets[0].uri); }
  }

  async function pickFromGallery() {
    if (busy) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('İzin Gerekli', 'Galeri için izin gerekiyor.'); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (!r.canceled) { setImage(r.assets[0].uri); processImage(r.assets[0].uri); }
  }

  const btnLabel = (text) => cooldown > 0 ? `${cooldown}s` : loading ? '…' : text;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Fotoğraf */}
      <View style={styles.imageBox}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#EEF2FF', '#E0E7FF']} style={styles.placeholder}>
            <Ionicons name="scan-outline" size={72} color={COLORS.primaryLight} />
            <Text style={styles.phTitle}>Nesneyi Tara</Text>
            <Text style={styles.phSub}>Gemini 2.5 Flash ile tanı</Text>
          </LinearGradient>
        )}
        {loading && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.overlayText}>Gemini 2.5 analiz ediyor…</Text>
          </View>
        )}
      </View>

      {/* Sonuç */}
      {results && wordInfo && (
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.emoji}>{wordInfo.emoji}</Text>
            <View style={styles.wordBlock}>
              <View style={styles.wordRow}>
                <Text style={styles.wordText}>{wordInfo.word}</Text>
                <TouchableOpacity
                  onPress={() => Speech.speak(wordInfo.word, { language: 'en-US', pitch: 1.0, rate: 0.9 })}
                  style={styles.speakIcon}
                >
                  <Ionicons name="volume-high-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              {wordInfo.phonetic && <Text style={styles.phonetic}>{wordInfo.phonetic}</Text>}
              {wordInfo.turkish && (
                <View style={styles.turkishPill}>
                  <Text style={styles.turkishTxt}>🇹🇷 {wordInfo.turkish}</Text>
                </View>
              )}
            </View>
            <View style={[styles.badge, { backgroundColor: confColor(results[0].confidence) }]}>
              <Text style={styles.badgeText}>{results[0].confidence}%</Text>
            </View>
          </View>

          {wordInfo.example && (
            <View style={styles.exBox}>
              <Text style={styles.exLabel}>ÖRNEK CÜMLE</Text>
              <Text style={styles.exText}>"{wordInfo.example}"</Text>
            </View>
          )}

          {results.length > 1 && (
            <View style={styles.predsBox}>
              <Text style={styles.predsLabel}>GÖRSELDEKI DİĞER NESNELER</Text>
              {results.slice(1, 5).map((p, i) => (
                <ConfidenceBar key={i} label={p.label} confidence={p.confidence} delay={i * 80} />
              ))}
            </View>
          )}
        </Animated.View>
      )}

      {/* Butonlar */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, busy && styles.btnOff]}
          onPress={pickFromCamera} disabled={busy} activeOpacity={0.85}>
          <Ionicons name="camera" size={22} color="#FFF" />
          <Text style={styles.btnWhite}>{btnLabel('Kamera')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnOutline, busy && styles.btnOff]}
          onPress={pickFromGallery} disabled={busy} activeOpacity={0.85}>
          <Ionicons name="images" size={22} color={busy ? '#9CA3AF' : COLORS.primary} />
          <Text style={[styles.btnPrimaryTxt, busy && { color: '#9CA3AF' }]}>{btnLabel('Galeri')}</Text>
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

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.background },
  content:       { padding: 16, paddingBottom: 32 },
  imageBox:      { width: '100%', height: 290, borderRadius: 24, overflow: 'hidden', marginBottom: 16, ...SHADOWS.large },
  image:         { width: '100%', height: '100%' },
  placeholder:   { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  phTitle:       { fontSize: 18, fontWeight: '700', color: COLORS.primaryLight },
  phSub:         { fontSize: 13, color: '#A5B4FC' },
  overlay:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', gap: 14 },
  overlayText:   { color: '#FFF', fontSize: 15, fontWeight: '600' },
  card:          { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 16, ...SHADOWS.medium },
  cardHeader:    { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  emoji:         { fontSize: 44 },
  wordBlock:     { flex: 1 },
  wordRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordText:      { fontSize: 30, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  speakIcon:   { padding: 4, backgroundColor: COLORS.overlay, borderRadius: 10 },
  phonetic:    { fontSize: 15, color: COLORS.textSecondary, marginTop: 2 },
  turkishPill: { alignSelf: 'flex-start', backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  turkishTxt:  { fontSize: 13, fontWeight: '600', color: '#92400E' },
  badge:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText:     { color: '#FFF', fontWeight: '700', fontSize: 13 },
  exBox:         { backgroundColor: COLORS.overlay, borderRadius: 14, padding: 14, marginBottom: 14 },
  exLabel:       { fontSize: 10, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.8, marginBottom: 6 },
  exText:        { fontSize: 15, color: COLORS.text, fontStyle: 'italic', lineHeight: 22 },
  predsBox:      { gap: 8 },
  predsLabel:    { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.8, marginBottom: 4 },
  btnRow:        { flexDirection: 'row', gap: 12 },
  btn:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 18, gap: 8, ...SHADOWS.small },
  btnPrimary:    { backgroundColor: COLORS.primary },
  btnOutline:    { backgroundColor: '#FFF', borderWidth: 2, borderColor: COLORS.primary },
  btnOff:        { opacity: 0.5 },
  btnWhite:      { color: '#FFF', fontWeight: '700', fontSize: 16 },
  btnPrimaryTxt: { color: COLORS.primary, fontWeight: '700', fontSize: 16 },
});
