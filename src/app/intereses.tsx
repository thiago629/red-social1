import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Boton, Pantalla, Parrafo, Titulo } from '../components/ui';
import { color, INTERESES } from '../lib/config';
import * as store from '../lib/store';

// Pantalla que sale al crear la cuenta (y desde Ajustes): qué quieres ver en "Para ti".
export default function Intereses() {
  store.useVersion();
  const yo = store.yo();
  const [elegidos, setElegidos] = useState<string[]>(yo?.intereses ?? []);
  if (!yo) return <Redirect href="/entrar" />;

  const primeraVez = !yo.interesesElegidos;
  const alternar = (id: string) => setElegidos((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  const terminar = (verTodo: boolean) => {
    store.elegirIntereses(verTodo ? INTERESES.map((i) => i.id) : elegidos, verTodo);
    if (primeraVez || !router.canGoBack()) router.replace('/');
    else router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.papel }}>
      <Pantalla>
        <View style={{ gap: 6, marginTop: primeraVez ? 24 : 0 }}>
          <Titulo>¿Qué quieres ver?</Titulo>
          <Parrafo suave>
            Elige los temas que te gustan y tu inicio «Para ti» se llenará de eso. Puedes elegir todos los que quieras y cambiarlos
            cuando quieras en Ajustes.
          </Parrafo>
        </View>

        <Pressable
          onPress={() => terminar(true)}
          accessibilityRole="button"
          style={({ pressed }) => ({
            borderWidth: 2,
            borderColor: color.tinta,
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: pressed ? color.gris : color.papel,
          })}
        >
          <Text style={{ fontSize: 28 }}>🌍</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', fontSize: 17, color: color.tinta }}>Ver de todo</Text>
            <Text style={{ color: color.suave }}>Un poco de cada tema, ordenado por lo que más te guste.</Text>
          </View>
          <Text style={{ fontSize: 20, color: color.tinta }}>›</Text>
        </Pressable>

        <Text style={{ color: color.suave, fontWeight: '700', textAlign: 'center' }}>o elige tus temas</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {INTERESES.map((i) => {
            const activo = elegidos.includes(i.id);
            return (
              <Pressable
                key={i.id}
                onPress={() => alternar(i.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: activo }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: activo ? color.acento : color.bordeFuerte,
                  backgroundColor: activo ? color.acento : color.papel,
                }}
              >
                <Text style={{ fontSize: 17 }}>{i.emoji}</Text>
                <Text style={{ color: activo ? '#fff' : color.tinta, fontWeight: '700', fontSize: 15 }}>{i.id}</Text>
                {activo ? <Text style={{ color: '#fff', fontWeight: '800' }}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>
        <View style={{ height: 90 }} />
      </Pantalla>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: color.papel, borderTopWidth: 1, borderTopColor: color.borde }}>
        <View style={{ maxWidth: 600, width: '100%', alignSelf: 'center', gap: 6 }}>
          <Boton
            tipo="negro"
            texto={elegidos.length ? `Continuar con ${elegidos.length} ${elegidos.length === 1 ? 'tema' : 'temas'}` : 'Elige al menos un tema'}
            desactivado={!elegidos.length}
            onPress={() => terminar(false)}
          />
        </View>
      </View>
    </View>
  );
}
