import React, { useState, useEffect } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import ScanScreen       from './src/screens/ScanScreen';
import HistoryScreen    from './src/screens/HistoryScreen';
import LearnScreen      from './src/screens/LearnScreen';
import ProgressScreen   from './src/screens/ProgressScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { COLORS }          from './src/constants/theme';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { hasSeenOnboarding } from './src/utils/storage';

const Tab = createBottomTabNavigator();

const ICONS = {
  Tara:     ['camera',  'camera-outline'],
  Pratik:   ['school',  'school-outline'],
  Geçmiş:   ['time',    'time-outline'],
  İlerleme: ['trophy',  'trophy-outline'],
};

function MainApp() {
  const { isDark, colors } = useTheme();
  const [onboardingDone, setOnboardingDone] = useState(null);

  useEffect(() => {
    hasSeenOnboarding().then(done => setOnboardingDone(done));
  }, []);

  if (onboardingDone === null) return null;

  if (!onboardingDone) {
    return (
      <>
        <StatusBar style="light" />
        <OnboardingScreen onDone={() => setOnboardingDone(true)} />
      </>
    );
  }

  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background, card: colors.surface, border: colors.border } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background, card: colors.surface, border: colors.border } };

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={navTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              const [active, inactive] = ICONS[route.name];
              return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: 5,
              height: 60,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
          })}
        >
          <Tab.Screen name="Tara"     component={ScanScreen}     options={{ title: 'ObjEnglish' }} />
          <Tab.Screen name="Pratik"   component={LearnScreen}    options={{ title: 'Pratik Yap' }} />
          <Tab.Screen name="Geçmiş"   component={HistoryScreen}  options={{ title: 'Tarama Geçmişi' }} />
          <Tab.Screen name="İlerleme" component={ProgressScreen} options={{ title: 'İlerleme' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <MainApp />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
