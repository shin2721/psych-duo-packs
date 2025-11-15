import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: 'Psycle Preview' }}
      />
      <Stack.Screen
        name="preview/mental_l01_preview"
        options={{ title: 'Mental L01 Preview' }}
      />
    </Stack>
  );
}
