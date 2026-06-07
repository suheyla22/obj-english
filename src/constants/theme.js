export const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',
  accent: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F8F7FF',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  overlay: 'rgba(79, 70, 229, 0.08)',
};

export const DARK_COLORS = {
  primary: '#818CF8',
  primaryLight: '#A5B4FC',
  primaryDark: '#4F46E5',
  accent: '#34D399',
  warning: '#FCD34D',
  danger: '#F87171',
  background: '#0F172A',
  surface: '#1E293B',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  border: '#334155',
  overlay: 'rgba(129, 140, 248, 0.12)',
};

export function getColors(isDark) {
  return isDark ? DARK_COLORS : COLORS;
}

// Uygulama genelinde kullanılan gölge stilleri (küçük, orta, büyük)
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
};
