import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Image, TextInput, Keyboard, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { getHistory, recordQuizAnswer } from '../utils/storage';
import { COLORS, SHADOWS } from '../constants/theme';

const FALLBACK_WORDS = [
  'Apple', 'Book', 'Car', 'Door', 'Elephant', 'Flower', 'Guitar',
  'House', 'Island', 'Kite', 'Lamp', 'Mirror', 'Notebook', 'Orange',
  'Piano', 'River', 'Sun', 'Tree', 'Umbrella', 'Violin', 'Window',
];

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function LearnScreen() {
  const [mode, setMode]   = useState(null);
  const [vocab, setVocab] = useState([]);

  useFocusEffect(
    useCallback(() => {
      getHistory().then(data => setVocab(dedupe(data)));
    }, [])
  );

  function handleSelectMode(m) {
    if (vocab.length === 0) {
      Alert.alert('Kelime Yok', 'Önce Tara sekmesinden nesne tarayın.');
      return;
    }
    setMode(m);
  }

  if (!mode)          return <ModeSelector onSelect={handleSelectMode} count={vocab.length} />;
  if (mode === 'fc')  return <FlashcardQuiz vocab={vocab}  onDone={() => setMode(null)} />;
  if (mode === 'mcq') return <MCQQuiz       vocab={vocab}  onDone={() => setMode(null)} />;
  if (mode === 'sp')  return <SpellingQuiz  vocab={vocab}  onDone={() => setMode(null)} />;
  return null;
}

// ─── Mode Selector ────────────────────────────────────────────────────────────

function ModeSelector({ onSelect, count }) {
  const MODES = [
    { id: 'fc',  icon: 'layers-outline',         title: 'Kartlar',        sub: 'Görselden kelimeyi tahmin et',     gradient: [COLORS.primary, COLORS.primaryDark] },
    { id: 'mcq', icon: 'radio-button-on-outline', title: 'Çoktan Seçmeli', sub: '4 seçenek arasından doğruyu bul', gradient: ['#10B981', '#059669'] },
    { id: 'sp',  icon: 'pencil-outline',          title: 'Yazım',          sub: 'Kelimeyi kendin yaz',              gradient: ['#F59E0B', '#D97706'] },
  ];
  return (
    <View style={styles.container}>
      <View style={styles.selHeader}>
        <Text style={styles.selTitle}>Pratik Yap</Text>
        <Text style={styles.selSub}>{count} kelime hazır</Text>
      </View>
      {MODES.map(m => (
        <TouchableOpacity key={m.id} onPress={() => onSelect(m.id)} activeOpacity={0.85}>
          <LinearGradient colors={m.gradient} style={styles.modeCard}>
            <Ionicons name={m.icon} size={32} color="#FFF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.modeTitle}>{m.title}</Text>
              <Text style={styles.modeSub}>{m.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Flashcard Quiz ───────────────────────────────────────────────────────────

function FlashcardQuiz({ vocab: raw, onDone }) {
  const [vocab]             = useState(() => shuffle(raw));
  const [index, setIndex]   = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore]   = useState({ correct: 0, wrong: 0 });
  const [done, setDone]     = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const frontRot = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg',   '180deg'] });
  const backRot  = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  function flip() {
    Haptics.selectionAsync();
    Animated.spring(flipAnim, { toValue: flipped ? 0 : 1, friction: 8, useNativeDriver: true }).start();
    setFlipped(f => !f);
  }

  async function answer(correct) {
    await Haptics.impactAsync(correct ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Heavy);
    await recordQuizAnswer(vocab[index].word, correct);
    setScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), wrong: prev.wrong + (correct ? 0 : 1) }));
    const next = index + 1;
    if (next >= vocab.length) { setDone(true); return; }
    flipAnim.setValue(0);
    setFlipped(false);
    setIndex(next);
  }

  if (done) return <ResultScreen score={score} onRestart={onDone} />;

  const item = vocab[index];
  return (
    <View style={styles.quizContainer}>
      <QuizHeader title="Kartlar" index={index} total={vocab.length} score={score} onBack={onDone} />
      <TouchableOpacity onPress={flip} activeOpacity={0.95} style={styles.cardWrapper}>
        <Animated.View style={[styles.card, styles.cardFront, { transform: [{ perspective: 1000 }, { rotateY: frontRot }] }]}>
          {item.imageUri
            ? <Image source={{ uri: item.imageUri }} style={styles.cardImg} />
            : <View style={styles.cardPlaceholder}><Text style={{ fontSize: 80 }}>{item.emoji || '🔍'}</Text></View>
          }
          <View style={styles.cardOverlay}>
            <Text style={styles.cardEmoji}>{item.emoji || '🔍'}</Text>
            <Text style={styles.tapHint}>Çevirmek için dokun</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.card, styles.cardBack, { transform: [{ perspective: 1000 }, { rotateY: backRot }] }]}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.cardGradient}>
            <Text style={styles.backWord}>{item.word}</Text>
            {item.phonetic && <Text style={styles.backPhonetic}>{item.phonetic}</Text>}
            {item.turkish  && <Text style={styles.backTurkish}>🇹🇷 {item.turkish}</Text>}
            {item.example  && <Text style={styles.backExample}>"{item.example}"</Text>}
            <TouchableOpacity onPress={() => Speech.speak(item.word, { language: 'en-US', pitch: 1.0, rate: 0.9 })} style={styles.speakBtn}>
              <Ionicons name="volume-high-outline" size={22} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {flipped && (
        <View style={styles.ansRow}>
          <TouchableOpacity style={[styles.ansBtn, { backgroundColor: COLORS.danger }]} onPress={() => answer(false)}>
            <Ionicons name="close" size={26} color="#FFF" />
            <Text style={styles.ansBtnTxt}>Bilmedim</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ansBtn, { backgroundColor: COLORS.accent }]} onPress={() => answer(true)}>
            <Ionicons name="checkmark" size={26} color="#FFF" />
            <Text style={styles.ansBtnTxt}>Bildim</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── MCQ Quiz ─────────────────────────────────────────────────────────────────

function genOptions(item, allItems) {
  const correct = item.word;
  const pool = allItems.filter(v => v.word !== correct).map(v => v.word);
  for (const fw of FALLBACK_WORDS) {
    if (pool.length >= 3) break;
    if (!pool.includes(fw) && fw.toLowerCase() !== correct.toLowerCase()) pool.push(fw);
  }
  return shuffle([correct, ...shuffle(pool).slice(0, 3)]);
}

function MCQQuiz({ vocab: raw, onDone }) {
  const [quizData] = useState(() => {
    const v = shuffle(raw);
    return v.map((item, _, arr) => ({ item, options: genOptions(item, arr) }));
  });
  const [index, setIndex]       = useState(0);
  const [score, setScore]       = useState({ correct: 0, wrong: 0 });
  const [selected, setSelected] = useState(null);
  const [done, setDone]         = useState(false);
  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const { item, options } = quizData[index];

  async function handleAnswer(word) {
    if (selected !== null) return;
    const isCorrect = word === item.word;
    setSelected(word);
    await Haptics.impactAsync(isCorrect ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Heavy);
    await recordQuizAnswer(item.word, isCorrect);
    setScore(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), wrong: prev.wrong + (isCorrect ? 0 : 1) }));
    timerRef.current = setTimeout(() => {
      const next = index + 1;
      if (next >= quizData.length) { setDone(true); return; }
      setSelected(null);
      setIndex(next);
    }, 900);
  }

  if (done) return <ResultScreen score={score} onRestart={onDone} />;

  return (
    <View style={styles.quizContainer}>
      <QuizHeader title="Çoktan Seçmeli" index={index} total={quizData.length} score={score} onBack={onDone} />
      <View style={styles.mcqImgBox}>
        {item.imageUri
          ? <Image source={{ uri: item.imageUri }} style={styles.mcqImg} resizeMode="cover" />
          : <View style={styles.imgFallback}><Text style={{ fontSize: 72 }}>{item.emoji || '🔍'}</Text></View>
        }
      </View>
      <Text style={styles.mcqQuestion}>Bu nesne nedir?</Text>
      <View style={styles.mcqOpts}>
        {options.map(opt => {
          let bg = '#FFF'; let border = COLORS.border; let txtColor = COLORS.text;
          if (selected !== null) {
            if (opt === item.word)   { bg = COLORS.accent; border = COLORS.accent; txtColor = '#FFF'; }
            else if (opt === selected) { bg = COLORS.danger; border = COLORS.danger; txtColor = '#FFF'; }
          }
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => handleAnswer(opt)}
              activeOpacity={0.8}
              style={[styles.mcqOpt, { backgroundColor: bg, borderColor: border }]}
            >
              <Text style={[styles.mcqOptTxt, { color: txtColor }]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Spelling Quiz ────────────────────────────────────────────────────────────

function SpellingQuiz({ vocab: raw, onDone }) {
  const [vocab]               = useState(() => shuffle(raw));
  const [index, setIndex]     = useState(0);
  const [score, setScore]     = useState({ correct: 0, wrong: 0 });
  const [input, setInput]     = useState('');
  const [feedback, setFeedback] = useState(null);
  const [done, setDone]       = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const timerRef  = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const item = vocab[index];

  async function handleSubmit() {
    if (!input.trim() || feedback) return;
    Keyboard.dismiss();
    const isCorrect = input.trim().toLowerCase() === item.word.toLowerCase();
    setFeedback(isCorrect ? 'correct' : 'wrong');
    await Haptics.impactAsync(isCorrect ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Heavy);
    await recordQuizAnswer(item.word, isCorrect);
    setScore(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), wrong: prev.wrong + (isCorrect ? 0 : 1) }));

    if (!isCorrect) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10,  duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10,  duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0,   duration: 50, useNativeDriver: true }),
      ]).start();
    }

    timerRef.current = setTimeout(() => {
      const next = index + 1;
      if (next >= vocab.length) { setDone(true); return; }
      setFeedback(null);
      setInput('');
      setIndex(next);
    }, 1200);
  }

  if (done) return <ResultScreen score={score} onRestart={onDone} />;

  return (
    <View style={styles.quizContainer}>
      <QuizHeader title="Yazım" index={index} total={vocab.length} score={score} onBack={onDone} />
      <View style={styles.spellImgBox}>
        {item.imageUri
          ? <Image source={{ uri: item.imageUri }} style={styles.spellImg} resizeMode="cover" />
          : <View style={styles.imgFallback}><Text style={{ fontSize: 80 }}>{item.emoji || '🔍'}</Text></View>
        }
        <View style={styles.cardOverlay}>
          <Text style={styles.cardEmoji}>{item.emoji || '🔍'}</Text>
          {item.phonetic && <Text style={styles.spellPhonetic}>{item.phonetic}</Text>}
        </View>
      </View>
      <Text style={styles.spellPrompt}>Bu nesneyi İngilizce yaz:</Text>
      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <TextInput
          style={[
            styles.spellInput,
            feedback === 'correct' && styles.spellInputOk,
            feedback === 'wrong'   && styles.spellInputErr,
          ]}
          value={input}
          onChangeText={setInput}
          placeholder="Kelimeyi yaz..."
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={handleSubmit}
          editable={!feedback}
          returnKeyType="done"
        />
      </Animated.View>
      {feedback === 'wrong' && (
        <Text style={styles.spellAnswer}>
          Doğru cevap: <Text style={{ fontWeight: '800' }}>{item.word}</Text>
        </Text>
      )}
      <TouchableOpacity
        style={[styles.spellSubmit, (!input.trim() || !!feedback) && styles.spellSubmitOff]}
        onPress={handleSubmit}
        disabled={!input.trim() || !!feedback}
      >
        <Text style={styles.spellSubmitTxt}>Kontrol Et</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function QuizHeader({ title, index, total, score, onBack }) {
  return (
    <View style={styles.qHeader}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={22} color={COLORS.text} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.qTitle}>{title}</Text>
        <View style={styles.progTrack}>
          <View style={[styles.progFill, { width: `${(index / total) * 100}%` }]} />
        </View>
        <Text style={styles.progTxt}>{index + 1} / {total}</Text>
      </View>
      <View style={styles.scorePill}>
        <Text style={styles.scoreGreen}>✓ {score.correct}</Text>
        <Text style={styles.scoreRed}>✗ {score.wrong}</Text>
      </View>
    </View>
  );
}

function ResultScreen({ score, onRestart }) {
  const total = score.correct + score.wrong;
  const pct   = total > 0 ? Math.round((score.correct / total) * 100) : 0;
  const xp    = score.correct * 20;
  return (
    <View style={styles.resultBox}>
      <Text style={styles.resultEmoji}>{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</Text>
      <Text style={styles.resultTitle}>Tur Bitti!</Text>
      <View style={styles.resultStats}>
        <RStat label="Doğru"  value={score.correct}  color={COLORS.accent}  />
        <RStat label="Yanlış" value={score.wrong}    color={COLORS.danger}  />
        <RStat label="Başarı" value={`${pct}%`}      color={COLORS.primary} />
      </View>
      <View style={styles.xpBadge}>
        <Text style={styles.xpBadgeTxt}>+{xp} XP kazandın! ⭐</Text>
      </View>
      <TouchableOpacity style={styles.doneBtn} onPress={onRestart}>
        <Text style={styles.doneBtnTxt}>Moda Dön</Text>
      </TouchableOpacity>
    </View>
  );
}

function RStat({ label, value, color }) {
  return (
    <View style={styles.rStat}>
      <Text style={[styles.rStatVal, { color }]}>{value}</Text>
      <Text style={styles.rStatLbl}>{label}</Text>
    </View>
  );
}

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function dedupe(items) {
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item.word)) return false;
    seen.add(item.word);
    return true;
  });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  quizContainer: { flex: 1, backgroundColor: COLORS.background, padding: 16 },

  selHeader: { paddingTop: 12, paddingBottom: 24, alignItems: 'center' },
  selTitle:  { fontSize: 28, fontWeight: '800', color: COLORS.text },
  selSub:    { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  modeCard:  { flexDirection: 'row', alignItems: 'center', borderRadius: 22, padding: 20, gap: 16, marginBottom: 12, ...SHADOWS.medium },
  modeTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  modeSub:   { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  qHeader:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  backBtn:   { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, ...SHADOWS.small },
  qTitle:    { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6 },
  progTrack: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3 },
  progFill:  { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  progTxt:   { fontSize: 11, color: COLORS.textSecondary, marginTop: 3 },
  scorePill: { flexDirection: 'row', gap: 8, paddingTop: 6 },
  scoreGreen:{ fontSize: 14, fontWeight: '700', color: COLORS.accent },
  scoreRed:  { fontSize: 14, fontWeight: '700', color: COLORS.danger },

  cardWrapper:  { flex: 1, marginBottom: 16 },
  card: {
    position: 'absolute', width: '100%', height: '100%',
    borderRadius: 28, overflow: 'hidden',
    backfaceVisibility: 'hidden', ...SHADOWS.large,
  },
  cardFront:       { backgroundColor: '#FFF' },
  cardBack:        { backgroundColor: COLORS.primary },
  cardPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EEF2FF' },
  cardImg:         { width: '100%', height: '100%', resizeMode: 'cover' },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'flex-end', padding: 24, gap: 8,
  },
  cardEmoji:    { fontSize: 52 },
  tapHint:      { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  cardGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 12 },
  backWord:     { fontSize: 44, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  backPhonetic: { fontSize: 20, color: 'rgba(255,255,255,0.8)' },
  backTurkish:  { fontSize: 16, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  backExample:  { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center', fontStyle: 'italic', lineHeight: 24 },
  speakBtn:     { marginTop: 4, padding: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 24 },
  ansRow:       { flexDirection: 'row', gap: 12 },
  ansBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 18, gap: 8, ...SHADOWS.small },
  ansBtnTxt:    { color: '#FFF', fontWeight: '700', fontSize: 16 },

  mcqImgBox:   { width: '100%', height: 200, borderRadius: 24, overflow: 'hidden', marginBottom: 14, ...SHADOWS.medium },
  mcqImg:      { width: '100%', height: '100%' },
  imgFallback: { flex: 1, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  mcqQuestion: { fontSize: 16, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 14 },
  mcqOpts:     { gap: 10 },
  mcqOpt:      { borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, ...SHADOWS.small },
  mcqOptTxt:   { fontSize: 17, fontWeight: '700' },

  spellImgBox:  { width: '100%', height: 190, borderRadius: 24, overflow: 'hidden', marginBottom: 14, ...SHADOWS.medium },
  spellImg:     { width: '100%', height: '100%' },
  spellPhonetic:{ fontSize: 18, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' },
  spellPrompt:  { fontSize: 15, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 12 },
  spellInput: {
    backgroundColor: '#FFF', borderRadius: 16,
    padding: 16, fontSize: 20, fontWeight: '600',
    color: COLORS.text, borderWidth: 2, borderColor: COLORS.border,
    textAlign: 'center', marginBottom: 10, ...SHADOWS.small,
  },
  spellInputOk:  { borderColor: COLORS.accent,  backgroundColor: '#F0FDF4' },
  spellInputErr: { borderColor: COLORS.danger,  backgroundColor: '#FFF1F2' },
  spellAnswer:   { textAlign: 'center', color: COLORS.danger, fontSize: 14, marginBottom: 10 },
  spellSubmit:   { backgroundColor: '#F59E0B', borderRadius: 16, padding: 16, alignItems: 'center', ...SHADOWS.small },
  spellSubmitOff:{ opacity: 0.45 },
  spellSubmitTxt:{ color: '#FFF', fontWeight: '700', fontSize: 16 },

  resultBox:   { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 18 },
  resultEmoji: { fontSize: 80 },
  resultTitle: { fontSize: 32, fontWeight: '800', color: COLORS.text },
  resultStats: { flexDirection: 'row', gap: 28, backgroundColor: '#FFF', padding: 24, borderRadius: 24, ...SHADOWS.medium },
  rStat:       { alignItems: 'center', gap: 4 },
  rStatVal:    { fontSize: 32, fontWeight: '800' },
  rStatLbl:    { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  xpBadge:     { backgroundColor: '#FCD34D', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  xpBadgeTxt:  { fontSize: 16, fontWeight: '800', color: '#92400E' },
  doneBtn:     { backgroundColor: COLORS.primary, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 18, ...SHADOWS.medium },
  doneBtnTxt:  { color: '#FFF', fontWeight: '700', fontSize: 18 },
});
