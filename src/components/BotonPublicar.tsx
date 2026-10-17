import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { color, degradado } from '../lib/config';

// Botón flotante para crear: publicación (como en X), reel o historia (como en Instagram).
export function BotonPublicar() {
  const [abierto, setAbierto] = useState(false);
  const ir = (ruta: () => void) => {
    setAbierto(false);
    ruta();
  };
  return (
    <View style={{ position: 'absolute', right: 20, bottom: 20, alignItems: 'flex-end', gap: 10 }} pointerEvents="box-none">
      {abierto ? (
        <View style={{ backgroundColor: color.papel, borderRadius: 16, borderWidth: 1, borderColor: color.borde, paddingVertical: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 }}>
          <Opcion texto="✎  Publicación" onPress={() => ir(() => router.push('/publicar'))} />
          <Opcion texto="▶  Reel" onPress={() => ir(() => router.push({ pathname: '/crear', params: { modo: 'reel' } }))} />
          <Opcion texto="◎  Historia" onPress={() => ir(() => router.push({ pathname: '/crear', params: { modo: 'historia' } }))} />
        </View>
      ) : null}
      <Pressable onPress={() => setAbierto((a) => !a)} accessibilityRole="button" accessibilityLabel="Publicar" accessibilityState={{ expanded: abierto }}>
        <LinearGradient
          colors={[...degradado]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={{ width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', elevation: 4 }}
        >
          <Text style={{ color: '#fff', fontSize: 30, lineHeight: 32 }}>{abierto ? '×' : '+'}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function Opcion({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ paddingHorizontal: 18, paddingVertical: 12, backgroundColor: pressed ? color.gris : 'transparent' })}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: color.tinta }}>{texto}</Text>
    </Pressable>
  );
}
