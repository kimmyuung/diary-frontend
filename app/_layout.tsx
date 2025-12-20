import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider } from '@/contexts/AuthContext';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen
            name="diary/create"
            options={{
              title: '새 일기 작성',
              headerBackTitle: '뒤로',
            }}
          />
          <Stack.Screen
            name="diary/[id]"
            options={{
              title: '일기 상세',
              headerBackTitle: '뒤로',
            }}
          />
          <Stack.Screen
            name="diary/edit/[id]"
            options={{
              title: '일기 수정',
              headerBackTitle: '뒤로',
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}

