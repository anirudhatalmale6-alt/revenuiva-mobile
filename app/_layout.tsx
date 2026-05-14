import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { BrandProvider } from '../src/contexts/BrandContext';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="appointments" options={{ presentation: 'card' }} />
      <Stack.Screen name="packages/index" options={{ presentation: 'card' }} />
      <Stack.Screen name="messages/index" options={{ presentation: 'card' }} />
      <Stack.Screen name="booking" options={{ presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <BrandProvider>
        <RootNavigator />
      </BrandProvider>
    </AuthProvider>
  );
}
