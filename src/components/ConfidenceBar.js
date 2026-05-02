import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../constants/theme';

export default function ConfidenceBar({ label, confidence, delay = 0 }) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const cleanLabel = label.split(',')[0].trim();

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: confidence,
      duration: 600,
      delay,
      useNativeDriver: false,
    }).start();
  }, [confidence]);

  const barColor = confidence >= 60 ? COLORS.primaryLight : confidence >= 30 ? COLORS.warning : '#CBD5E1';

  return (
    <View style={styles.row}>
      <Text style={styles.label} numberOfLines={1}>{cleanLabel}</Text>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
      <Text style={styles.pct}>{confidence}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { width: 115, fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  track: { flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 3 },
  pct:   { width: 34, fontSize: 12, color: COLORS.textSecondary, textAlign: 'right', fontWeight: '600' },
});
