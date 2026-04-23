import React from 'react';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/src/store/authStore';

export default function RootLayout() {
  const loadUser = useAuthStore(state => state.loadUser);

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="store/[id]" />
      <Stack.Screen name="store/[id]/products" />
      <Stack.Screen name="store/[id]/count" />
      <Stack.Screen name="store/[id]/reports" />
      <Stack.Screen name="store/[id]/settings" />
      <Stack.Screen name="store/[id]/product/[productId]" />
    </Stack>
  );
}
