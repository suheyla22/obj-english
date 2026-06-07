import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Image, TextInput, Keyboard, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { getHistory, recordQuizAnswer, getWordMastery } from '../utils/storage';
import { SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const FALLBACK_WORDS = [
  'Apple', 'Book', 'Car', 'Door', 'Elephant', 'Flower', 'Guitar',
  'House', 'Island', 'Kite', 'Lamp', 'Mirror', 'Notebook', 'Orange',
  'Piano', 'River', 'Sun', 'Tree', 'Umbrella', 'Violin', 'Window',
];

// Kelimeler ustalık seviyesine göre sıralanır: düşük seviye önce (aralıklı tekrar)
function buildSpacedVocab(items, mastery) {
  const groups = [[], [], [], [], [], []];
  for (const item of items) {
    const level = (mastery[item.word] || { level: 0 }).level;
    groups[Math.min(level, 5)].push(item);
  }
  return groups.map(g => shuffle(g)).flat();
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export default function LearnScreen() {
  const { colors } = useTheme();
  const [mode, setMode]             = useState(null);
  const [vocab, setVocab]           = useState([]);
  const [spacedVocab, setSpacedVocab] = useState([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getHistory(), getWordMastery()]).then(([data, mastery]) => {
        const deduped = dedupe(data);
        setVocab(deduped);
        setSpacedVocab(buildSpacedVocab(deduped, mastery));
      });
    }, [])
  );

  function handleSelectMode(m) {
    if (vocab.length === 0) {
      Alert.alert('Kelime Yok', 'Önce Tara sekmesinden nesne tarayın.');
      return;
    }
    setMode(m);
  }

  if (!mode)          return <ModeSelector onSelect={handleSelectMode} count={vocab.length} colors={colors} />;
  if (mode === 'fc')  return <FlashcardQuiz vocab={spacedVocab} onDone={() => setMode(null)} colors={colors} />;
  if (mode === 'mcq') return <MCQQuiz       vocab={spacedVocab} onDone={() => setMode(null)} colors={colors} />;
  if (mode === 'sp')  return <SpellingQuiz  vocab={spacedVocab} onDone={() => setMode(null)} colors={colors} />;
  return null;
}

// ─── Mod Seçim Ekranı ────────────────────────────────────────────────────────

function ModeSelector({ onSelect, count, colors }) {
  const s = useMemo(() => makeStyles(colors), [colors]);
  const MODES = [
    { id: 'fc',  icon: 'layers-outline',         title: 'Kartlar',        sub: 'Zayıf kelimeleri önce göster',     gradient: [colors.primary, colors.primaryDark] },
    { id: 'mcq', icon: 'radio-button-on-outline', title: 'Çoktan Seçmeli', sub: '4 seçenek arasından doğruyu bul', gradient: ['#10B981', '#059669'] },
    { id: 'sp',  icon: 'pencil-outline',          title: 'Yazım',          sub: 'Kelimeyi kendin yaz',              gradient: ['#F59E0B', '#D97706'] },
  ];
  return (
    <View style={s.container}>
      <View style={s.selHeader}>
        <Text style={s.selTitle}>Pratik Yap</Text>
        <Text style={s.selSub}>{count} kelime · aralıklı tekrar aktif</Text>
      </View>
      {MODES.map(m => (
        <TouchableOpacity key={m.id} onPress={() => onSelect(m.id)} activeOpacity={0.85}>
          <LinearGradient colors={m.gradient} style={[s.modeCard, SHADOWS.medium]}>
            <Ionicons name={m.icon} size={32} color="#FFF" />
            <View style={{ flex: 1 }}>
              <Text style={s.modeTitle}>{m.title}</Text>
              <Text style={s.modeSub}>{m.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Flashcard Quiz ───────────────────────────────────────────────────────────

function FlashcardQuiz({ vocab: raw, onDone, colors }) {
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [vocab]               = useState(() => raw);
  const [index, setIndex]     = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore]     = useState({ correct: 0, wrong: 0 });
  const [done, setDone]       = useState(false);
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

  if (done) return <ResultScreen score={score} onRestart={onDone} colors={colors} />;

  const item = vocab[index];
  return (
    <View style={s.quizContainer}>
      <QuizHeader title="Kartlar" index={index} total={vocab.length} score={score} onBack={onDone} colors={colors} />
      <TouchableOpacity onPress={flip} activeOpacity={0.95} style={s.cardWrapper}>
        <Animated.View style={[s.card, s.cardFront, { transform: [{ perspective: 1000 }, { rotateY: frontRot }] }]}>
          {item.imageUri
            ? <Image source={{ uri: item.imageUri }} style={s.cardImg} />
            : <View style={s.cardPlaceholder}><Text style={{ fontSize: 80 }}>{item.emoji || '🔍'}</Text></View>
          }
          <View style={s.cardOverlay}>
            <Text style={s.cardEmoji}>{item.emoji || '🔍'}</Text>
            <Text style={s.tapHint}>Çevirmek için dokun</Text>
          </View>
        </Animated.View>

        <Animated.View style={[s.card, s.cardBack, { transform: [{ perspective: 1000 }, { rotateY: backRot }] }]}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={s.cardGradient}>
            <Text style={s.backWord}>{item.word}</Text>
            {item.phonetic && <Text style={s.backPhonetic}>{item.phonetic}</Text>}
            {item.turkish  && <Text style={s.backTurkish}>🇹🇷 {item.turkish}</Text>}
            {item.example  && <Text style={s.backExample}>"{item.example}"</Text>}
            <TouchableOpacity onPress={() => Speech.speak(item.word, { language: 'en-US', pitch: 1.0, rate: 0.9 })} style={s.speakBtn}>
              <Ionicons name="volume-high-outline" size={22} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {flipped && (
        <View style={s.ansRow}>
          <TouchableOpacity style={[s.ansBtn, { backgroundColor: colors.danger }]} onPress={() => answer(false)}>
            <Ionicons name="close" size={26} color="#FFF" />
            <Text style={s.ansBtnTxt}>Bilmedim</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.ansBtn, { backgroundColor: colors.accent }]} onPress={() => answer(true)}>
            <Ionicons name="checkmark" size={26} color="#FFF" />
            <Text style={s.ansBtnTxt}>Bildim</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Çoktan Seçmeli Quiz ─────────────────────────────────────────────────────

function genOptions(item, allItems) {
  const correct = item.word;
  const pool = allItems.filter(v => v.word !== correct).map(v => v.word);
  for (const fw of FALLBACK_WORDS) {
    if (pool.length >= 3) break;
    if (!pool.includes(fw) && fw.toLowerCase() !== correct.toLowerCase()) pool.push(fw);
  }
  return shuffle([correct, ...shuffle(pool).slice(0, 3)]);
}

function MCQQuiz({ vocab: raw, onDone, colors }) {
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [quizData] = useState(() => {
    const v = raw;
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

  if (done) return <ResultScreen score={score} onRestart={onDone} colors={colors} />;

  return (
    <View style={s.quizContainer}>
      <QuizHeader title="Çoktan Seçmeli" index={index} total={quizData.length} score={score} onBack={onDone} colors={colors} />
      <View style={s.mcqImgBox}>
        {item.imageUri
          ? <Image source={{ uri: item.imageUri }} style={s.mcqImg} resizeMode="cover" />
          : <View style={s.imgFallback}><Text style={{ fontSize: 72 }}>{item.emoji || '🔍'}</Text></View>
        }
      </View>
      <Text style={s.mcqQuestion}>Bu nesne nedir?</Text>
      <View style={s.mcqOpts}>
        {options.map(opt => {
          let bg = colors.surface, border = colors.border, txtColor = colors.text;
          if (selected !== null) {
            if (opt === item.word)   { bg = colors.accent; border = colors.accent; txtColor = '#FFF'; }
            else if (opt === selected) { bg = colors.danger; border = colors.danger; txtColor = '#FFF'; }
          }
          return (
            <TouchableOpacity
              key={opt} onPress={() => handleAnswer(opt)} activeOpacity={0.8}
              style={[s.mcqOpt, { backgroundColor: bg, borderColor: border }]}
            >
              <Text style={[s.mcqOptTxt, { color: txtColor }]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Yazım Quiz ───────────────────────────────────────────────────────────────

function SpellingQuiz({ vocab: raw, onDone, colors }) {
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [vocab]                 = useState(() => raw);
  const [index, setIndex]       = useState(0);
  const [score, setScore]       = useState({ correct: 0, wrong: 0 });
  const [input, setInput]       = useState('');
  const [feedback, setFeedback] = useState(null);
  const [done, setDone]         = useState(false);
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

  if (done) return <ResultScreen score={score} onRestart={onDone} colors={colors} />;

  return (
    <View style={s.quizContainer}>
      <QuizHeader title="Yazım" index={index} total={vocab.length} score={score} onBack={onDone} colors={colors} />
      <View style={s.spellImgBox}>
        {item.imageUri
          ? <Image source={{ uri: item.imageUri }} style={s.spellImg} resizeMode="cover" />
          : <View style={s.imgFallback}><Text style={{ fontSize: 80 }}>{item.emoji || '🔍'}</Text></View>
        }
        <View style={s.cardOverlay}>
          <Text style={s.cardEmoji}>{item.emoji || '🔍'}</Text>
          {item.phonetic && <Text style={s.spellPhonetic}>{item.phonetic}</Text>}
        </View>
      </View>
      <Text style={s.spellPrompt}>Bu nesneyi İngilizce yaz:</Text>
      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <TextInput
          style={[
            s.spellInput,
            feedback === 'correct' && s.spellInputOk,
            feedback === 'wrong'   && s.spellInputErr,
          ]}
          value={input}
          onChangeText={setInput}
          placeholder="Kelimeyi yaz..."
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={handleSubmit}
          editable={!feedback}
          returnKeyType="done"
        />
      </Animated.View>
      {feedback === 'wrong' && (
        <Text style={s.spellAnswer}>
          Doğru cevap: <Text style={{ fontWeight: '800' }}>{item.word}</Text>
        </Text>
      )}
      <TouchableOpacity
        style={[s.spellSubmit, (!input.trim() || !!feedback) && s.spellSubmitOff]}
        onPress={handleSubmit}
        disabled={!input.trim() || !!feedback}
      >
        <Text style={s.spellSubmitTxt}>Kontrol Et</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Ortak Bileşenler ─────────────────────────────────────────────────────────

function QuizHeader({ title, index, total, score, onBack, colors }) {
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={s.qHeader}>
      <TouchableOpacity onPress={onBack} style={s.backBtn}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={s.qTitle}>{title}</Text>
        <View style={s.progTrack}>
          <View style={[s.progFill, { width: `${(index / total) * 100}%` }]} />
        </View>
        <Text style={s.progTxt}>{index + 1} / {total}</Text>
      </View>
      <View style={s.scorePill}>
        <Text style={s.scoreGreen}>✓ {score.correct}</Text>
        <Text style={s.scoreRed}>✗ {score.wrong}</Text>
      </View>
    </View>
  );
}

function ResultScreen({ score, onRestart, colors }) {
  const s = useMemo(() => makeStyles(colors), [colors]);
  const total = score.correct + score.wrong;
  const pct   = total > 0 ? Math.round((score.correct / total) * 100) : 0;
  const xp    = score.correct * 20;
  return (
    <View style={s.resultBox}>
      <Text style={s.resultEmoji}>{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</Text>
      <Text style={s.resultTitle}>Tur Bitti!</Text>
      <View style={[s.resultStats, SHADOWS.medium]}>
        <RStat label="Doğru"  value={score.correct} color={colors.accent}  />
        <RStat label="Yanlış" value={score.wrong}   color={colors.danger}  />
        <RStat label="Başarı" value={`${pct}%`}     color={colors.primary} />
      </View>
      <View style={s.xpBadge}>
        <Text style={s.xpBadgeTxt}>+{xp} XP kazandın! ⭐</Text>
      </View>
      <TouchableOpacity style={[s.doneBtn, SHADOWS.medium]} onPress={onRestart}>
        <Text style={s.doneBtnTxt}>Moda Dön</Text>
      </TouchableOpacity>
    </View>
  );
}

function RStat({ label, value, color }) {
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Text style={{ fontSize: 32, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600' }}>{label}</Text>
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

function makeStyles(c) {
  return StyleSheet.create({
    container:     { flex: 1, backgroundColor: c.background, padding: 16 },
    quizContainer: { flex: 1, backgroundColor: c.background, padding: 16 },

    selHeader: { paddingTop: 12, paddingBottom: 24, alignItems: 'center' },
    selTitle:  { fontSize: 28, fontWeight: '800', color: c.text },
    selSub:    { fontSize: 14, color: c.textSecondary, marginTop: 4 },
    modeCard:  { flexDirection: 'row', alignItems: 'center', borderRadius: 22, padding: 20, gap: 16, marginBottom: 12 },
    modeTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
    modeSub:   { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

    qHeader:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
    backBtn:   { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: c.surface, borderRadius: 12, ...SHADOWS.small },
    qTitle:    { fontSize: 12, fontWeight: '700', color: c.textSecondary, marginBottom: 6 },
    progTrack: { height: 6, backgroundColor: c.border, borderRadius: 3 },
    progFill:  { height: '100%', backgroundColor: c.primary, borderRadius: 3 },
    progTxt:   { fontSize: 11, color: c.textSecondary, marginTop: 3 },
    scorePill: { flexDirection: 'row', gap: 8, paddingTop: 6 },
    scoreGreen:{ fontSize: 14, fontWeight: '700', color: c.accent },
    scoreRed:  { fontSize: 14, fontWeight: '700', color: c.danger },

    cardWrapper:  { flex: 1, marginBottom: 16 },
    card: { position: 'absolute', width: '100%', height: '100%', borderRadius: 28, overflow: 'hidden', backfaceVisibility: 'hidden', ...SHADOWS.large },
    cardFront:       { backgroundColor: c.surface },
    cardBack:        { backgroundColor: c.primary },
    cardPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.overlay },
    cardImg:         { width: '100%', height: '100%', resizeMode: 'cover' },
    cardOverlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)', justifyContent: 'flex-end', padding: 24, gap: 8 },
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
    imgFallback: { flex: 1, backgroundColor: c.overlay, justifyContent: 'center', alignItems: 'center' },
    mcqQuestion: { fontSize: 16, fontWeight: '700', color: c.text, textAlign: 'center', marginBottom: 14 },
    mcqOpts:     { gap: 10 },
    mcqOpt:      { borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, ...SHADOWS.small },
    mcqOptTxt:   { fontSize: 17, fontWeight: '700' },

    spellImgBox:  { width: '100%', height: 190, borderRadius: 24, overflow: 'hidden', marginBottom: 14, ...SHADOWS.medium },
    spellImg:     { width: '100%', height: '100%' },
    spellPhonetic:{ fontSize: 18, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' },
    spellPrompt:  { fontSize: 15, fontWeight: '700', color: c.text, textAlign: 'center', marginBottom: 12 },
    spellInput:   { backgroundColor: c.surface, borderRadius: 16, padding: 16, fontSize: 20, fontWeight: '600', color: c.text, borderWidth: 2, borderColor: c.border, textAlign: 'center', marginBottom: 10, ...SHADOWS.small },
    spellInputOk:  { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
    spellInputErr: { borderColor: '#EF4444', backgroundColor: '#FFF1F2' },
    spellAnswer:   { textAlign: 'center', color: c.danger, fontSize: 14, marginBottom: 10 },
    spellSubmit:   { backgroundColor: '#F59E0B', borderRadius: 16, padding: 16, alignItems: 'center', ...SHADOWS.small },
    spellSubmitOff:{ opacity: 0.45 },
    spellSubmitTxt:{ color: '#FFF', fontWeight: '700', fontSize: 16 },

    resultBox:   { flex: 1, backgroundColor: c.background, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 18 },
    resultEmoji: { fontSize: 80 },
    resultTitle: { fontSize: 32, fontWeight: '800', color: c.text },
    resultStats: { flexDirection: 'row', gap: 28, backgroundColor: c.surface, padding: 24, borderRadius: 24 },
    xpBadge:     { backgroundColor: '#FCD34D', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
    xpBadgeTxt:  { fontSize: 16, fontWeight: '800', color: '#92400E' },
    doneBtn:     { backgroundColor: c.primary, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 18 },
    doneBtnTxt:  { color: '#FFF', fontWeight: '700', fontSize: 18 },
  });
}
