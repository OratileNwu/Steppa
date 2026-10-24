import { Stack } from 'expo-router';

// Without this, Expo Router opens the first file alphabetically (sign-in) instead of welcome.
export const unstable_settings = { initialRouteName: 'welcome' };

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom', contentStyle: { backgroundColor: '#FFFFFF' } }} />;
}
