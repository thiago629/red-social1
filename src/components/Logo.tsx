import { Image, Text, View } from 'react-native';
import { color } from '../lib/config';

// Logo de Plazzo: una "P" que es a la vez bocadillo de conversación y objetivo de cámara.
export function Logo({ tam = 32, conNombre = true }: { tam?: number; conNombre?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: tam * 0.3 }} accessibilityRole="image" accessibilityLabel="Plazzo">
      <Image source={require('../../assets/logo.png')} style={{ width: tam, height: tam, borderRadius: tam * 0.24 }} />
      {conNombre ? <Text style={{ fontSize: tam * 0.82, fontWeight: '900', color: color.tinta, letterSpacing: -tam * 0.03 }}>plazzo</Text> : null}
    </View>
  );
}
