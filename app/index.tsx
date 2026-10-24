import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuthSession } from '@/hooks/use-auth-session';

export default function IndexRoute() {
  const { ready, signedIn } = useAuthSession();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={signedIn ? '/entry' : '/welcome'} />;
}
