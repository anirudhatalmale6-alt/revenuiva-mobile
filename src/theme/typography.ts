import { StyleSheet } from 'react-native';

export const Typography = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 34, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyMedium: { fontSize: 15, fontWeight: '500', lineHeight: 22 },
  bodySm: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '500', lineHeight: 16, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  button: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  buttonSm: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
});
