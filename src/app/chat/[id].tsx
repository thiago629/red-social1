import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import { Aviso, Avatar, Boton, Fila, Parrafo } from '../../components/ui';
import { color } from '../../lib/config';
import { revisarTexto } from '../../lib/moderacion';
import * as store from '../../lib/store';

export default function Chat() {
  store.useVersion();
  const { id } = useLocalSearchParams<{ id: string }>();
  const estado = store.get();
  const yo = estado.sesionId ?? '';
  const c = estado.conversaciones.find((x) => x.id === id && x.miembros.includes(yo));
  const otro = c ? store.perfil(c.miembros.find((m) => m !== yo) ?? '') : undefined;
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
  const [menu, setMenu] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  const n = c?.mensajes.length ?? 0;

  useEffect(() => {
    if (c) store.leerConversacion(c.id);
    setTimeout(() => scroll.current?.scrollToEnd({ animated: false }), 50);
  }, [c, n]);

  if (!c || !otro) return <View style={{ flex: 1, padding: 16 }}><Parrafo suave>Esta conversación no existe.</Parrafo></View>;

  const bloqueo = store.hayBloqueo(yo, otro.id);
  const otroLeyo = otro.privacidad.confirmacionLectura && store.yo()?.privacidad.confirmacionLectura ? c.leido[otro.id] ?? 0 : 0;
  const ultimoMio = [...c.mensajes].reverse().find((m) => m.autorId === yo);

  const enviar = () => {
    const r = revisarTexto(texto, 1000);
    if (!r.permitido) return setError(r.motivo);
    store.enviarMensaje(c.id, texto);
    setTexto('');
    setError('');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.papel }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title: otro.nombre,
          headerRight: () => (
            <Pressable onPress={() => setMenu(!menu)} style={{ paddingHorizontal: 12 }} accessibilityLabel="Opciones de la conversación">
              <Text style={{ fontSize: 20, color: color.tinta }}>ⓘ</Text>
            </Pressable>
          ),
        }}
      />
      {menu ? (
        <View style={{ padding: 16, gap: 10, borderBottomWidth: 1, borderBottomColor: color.borde, maxWidth: 600, width: '100%', alignSelf: 'center' }}>
          <Fila>
            <Boton pequeño tipo="secundario" texto="Ver perfil" onPress={() => router.push(`/usuario/${otro.id}`)} />
            <Boton pequeño tipo="secundario" texto={bloqueo ? 'Desbloquear' : 'Bloquear'} onPress={() => store.bloquear(otro.id)} />
            <Boton pequeño tipo="secundario" texto="Denunciar" onPress={() => { store.denunciar('mensaje', c.id, 'Mensaje privado'); setMenu(false); }} />
            <Boton pequeño tipo="peligro" texto="Borrar conversación" onPress={() => { store.borrarConversacion(c.id); router.back(); }} />
          </Fila>
          <Text style={{ color: color.suave, fontSize: 12 }}>Borrar la conversación la elimina para los dos.</Text>
        </View>
      ) : null}
      <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, gap: 8, maxWidth: 600, width: '100%', alignSelf: 'center' }}>
        <View style={{ alignItems: 'center', gap: 4, paddingVertical: 16 }}>
          <Avatar nombre={otro.nombre} foto={otro.foto} tam={64} />
          <Text style={{ fontWeight: '800', fontSize: 17, color: color.tinta }}>{otro.nombre}</Text>
          <Text style={{ color: color.suave }}>@{otro.usuario}</Text>
        </View>
        {c.mensajes.map((m) => {
          const mio = m.autorId === yo;
          return (
            <View
              key={m.id}
              style={{
                alignSelf: mio ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                backgroundColor: mio ? color.acento : color.borde,
                borderRadius: 22,
                borderBottomRightRadius: mio ? 4 : 22,
                borderBottomLeftRadius: mio ? 22 : 4,
                paddingVertical: 10,
                paddingHorizontal: 14,
              }}
            >
              <Text style={{ color: mio ? '#fff' : color.tinta, fontSize: 15, lineHeight: 20 }}>{m.texto}</Text>
            </View>
          );
        })}
        {ultimoMio && otroLeyo >= ultimoMio.creado ? <Text style={{ alignSelf: 'flex-end', color: color.suave, fontSize: 12 }}>Visto</Text> : null}
      </ScrollView>
      <View style={{ borderTopWidth: 1, borderTopColor: color.borde, padding: 10, gap: 6 }}>
        <View style={{ maxWidth: 600, width: '100%', alignSelf: 'center', gap: 6 }}>
          {error ? <Aviso tipo="peligro">{error}</Aviso> : null}
          {bloqueo ? (
            <Parrafo suave>No puedes enviar mensajes en esta conversación.</Parrafo>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput
                value={texto}
                onChangeText={setTexto}
                placeholder="Escribe un mensaje"
                placeholderTextColor={color.suave}
                onSubmitEditing={enviar}
                returnKeyType="send"
                accessibilityLabel="Mensaje"
                style={{ flex: 1, backgroundColor: color.borde, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: color.tinta }}
              />
              <Pressable onPress={enviar} disabled={!texto.trim()} accessibilityLabel="Enviar" style={{ padding: 8, opacity: texto.trim() ? 1 : 0.4 }}>
                <Text style={{ color: color.acento, fontWeight: '800', fontSize: 16 }}>Enviar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
