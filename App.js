import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import ScanScreen       from './src/screens/ScanScreen';
import HistoryScreen    from './src/screens/HistoryScreen';
import LearnScreen      from './src/screens/LearnScreen';
import ProgressScreen   from './src/screens/ProgressScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { COLORS } from './src/constants/theme';
import { hasSeenOnboarding } from './src/utils/storage';

const Tab = createBottomTabNavigator();

const ICONS = {
  Tara:     ['camera',  'camera-outline'],
  Pratik:   ['school',  'school-outline'],
  Geçmiş:   ['time',    'time-outline'],
  İlerleme: ['trophy',  'trophy-outline'],
};

export default function App() {
  const [onboardingDone, setOnboardingDone] = useState(null);

  useEffect(() => {
    hasSeenOnboarding().then(done => setOnboardingDone(done));
  }, []);

  if (onboardingDone === null) return null;

  if (!onboardingDone) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <OnboardingScreen onDone={() => setOnboardingDone(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              const [active, inactive] = ICONS[route.name];
              return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
            },
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: '#9CA3AF',
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopColor: '#E5E7EB',
              paddingBottom: 5,
              height: 60,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            headerStyle: { backgroundColor: COLORS.primary },
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
    </SafeAreaProvider>
  );
}
