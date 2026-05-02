import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { setOnboardingSeen } from '../utils/storage';
import { COLORS, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'language-outline',
    title: "ObjEnglish'e\nHoş Geldin!",
    sub: 'Etrafındaki nesneleri tara,\nİngilizce karşılıklarını öğren.',
    gradient: [COLORS.primary, COLORS.primaryDark],
  },
  {
    id: '2',
    icon: 'camera-outline',
    title: 'Nesneyi Tara',
    sub: 'Kamera veya galerinden fotoğraf çek.\nGemini 2.5 Flash anında tanısın,\nTürkçe karşılığını görsün.',
    gradient: ['#10B981', '#059669'],
  },
  {
    id: '3',
    icon: 'school-outline',
    title: 'Pratik Yap',
    sub: 'Flashcard, çoktan seçmeli ve yazım\nquizleriyle kelimeleri pekiştir.\nXP kazan, serisini kır!',
    gradient: ['#F59E0B', '#D97706'],
  },
];

export default function OnboardingScreen({ onDone }) {
  const [current, setCurrent] = useState(0);
  const flatRef = useRef(null);

  function goNext() {
    if (current < SLIDES.length - 1) {
      const next = current + 1;
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrent(next);
    } else {
      finish();
    }
  }

  async function finish() {
    await setOnboardingSeen();
    onDone();
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrent(idx);
        }}
        renderItem={({ item }) => (
          <LinearGradient colors={item.gradient} style={styles.slide}>
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={72} color="#FFF" />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.sub}>{item.sub}</Text>
          </LinearGradient>
        )}
      />

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.85}>
          <Text style={styles.nextTxt}>
            {current === SLIDES.length - 1 ? 'Başla!' : 'İleri'}
          </Text>
          <Ionicons
            name={current === SLIDES.length - 1 ? 'checkmark-circle' : 'arrow-forward-circle'}
            size={22}
            color="#FFF"
          />
        </TouchableOpacity>

        {current < SLIDES.length - 1 && (
          <TouchableOpacity onPress={finish} style={styles.skipBtn}>
            <Text style={styles.skipTxt}>Atla</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },

  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 28,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 40,
  },
  sub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    lineHeight: 26,
  },

  bottom: {
    backgroundColor: '#FFF',
    paddingVertical: 28,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 16,
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  nextTxt: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  skipBtn: { paddingVertical: 4 },
  skipTxt: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
});
