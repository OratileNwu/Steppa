import {
  Stack,
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from 'expo-router';

import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}