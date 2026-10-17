import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { color } from '../lib/config';
import * as store from '../lib/store';
import { AnilloHistoria } from './Medios';
import { Avatar } from './ui';

// Fila de historias arriba del inicio, como en Instagram.
export function BarraHistorias() {
  store.useVersion();
  const yo = store.yo();
  if (!yo) return null;
  const grupos = store.gruposDeHistorias();
  const tengo = grupos.some((g) => g.autorId === yo.id);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 12, paddingHorizontal: 2 }}>
      {!tengo ? (
        <View style={{ alignItems: 'center', gap: 4, width: 74 }}>
          <Pressable
            onPress={() => router.push({ pathname: '/crear', params: { modo: 'historia' } })}
            accessibilityRole="button"
            accessibilityLabel="Crear historia"
            style={{ padding: 4 }}
          >
            <Avatar nombre={yo.nombre} foto={yo.foto} tam={64} />
            <View style={{ position: 'absolute', right: 0, bottom: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: color.acento, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '800', lineHeight: 18 }}>+</Text>
            </View>
          </Pressable>
          <Text style={{ fontSize: 12, color: color.tinta }} numberOfLines={1}>Tu historia</Text>
        </View>
      ) : null}
      {grupos.map((g) => {
        const p = store.perfil(g.autorId);
        if (!p) return null;
        const mia = g.autorId === yo.id;
        return (
          <View key={g.autorId} style={{ alignItems: 'center', gap: 4, width: 74 }}>
            <AnilloHistoria nombre={p.nombre} foto={p.foto} visto={g.vistas && !mia} onPress={() => router.push(`/historias/${g.autorId}`)} />
            <Text style={{ fontSize: 12, color: color.tinta }} numberOfLines={1}>
              {mia ? 'Tu historia' : p.usuario}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}
