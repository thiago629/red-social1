import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Aviso, Avatar, Boton, Pantalla, Parrafo, haceCuanto } from '../../components/ui';
import { color } from '../../lib/config';
import * as store from '../../lib/store';

export default function Mensajes() {
  store.useVersion();
  const estado = store.get();
  const yo = store.yo();
  const [nuevo, setNuevo] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  if (!yo) return null;

  const mias = estado.conversaciones
    .filter((c) => c.miembros.includes(yo.id))
    .sort((a, b) => (b.mensajes[b.mensajes.length - 1]?.creado ?? b.creado) - (a.mensajes[a.mensajes.length - 1]?.creado ?? a.creado));
  const q = busqueda.trim().toLowerCase().replace(/^@/, '');
  const candidatos = q
    ? estado.perfiles.filter((p) => p.id !== yo.id && !store.hayBloqueo(yo.id, p.id) && (p.usuario.includes(q) || p.nombre.toLowerCase().includes(q))).slice(0, 8)
    : [];

  const abrir = (otro: string) => {
    const cid = store.abrirConversacion(otro);
    if (!cid) return setError('Esta persona no acepta mensajes tuyos por su configuración de privacidad.');
    setNuevo(false);
    setBusqueda('');
    router.push(`/chat/${cid}`);
  };

  const textoQuien = { todos: 'cualquiera', seguidos: 'solo la gente que sigues', nadie: 'nadie nuevo' };

  return (
    <Pantalla>
      <Boton tipo={nuevo ? 'secundario' : 'principal'} texto={nuevo ? 'Cancelar' : '✉ Nuevo mensaje'} onPress={() => { setNuevo(!nuevo); setError(''); }} />
      {nuevo ? (
        <View style={{ gap: 8 }}>
          <TextInput
            value={busqueda}
            onChangeText={(t) => { setBusqueda(t); setError(''); }}
            placeholder="Buscar a quién escribir"
            placeholderTextColor={color.suave}
            autoFocus
            autoCapitalize="none"
            style={{ backgroundColor: color.borde, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 11, fontSize: 15, color: color.tinta }}
          />
          {candidatos.map((p) => (
            <Pressable key={p.id} onPress={() => abrir(p.id)} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 6 }}>
              <Avatar nombre={p.nombre} foto={p.foto} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: color.tinta }}>{p.nombre}</Text>
                <Text style={{ color: color.suave }}>
                  @{p.usuario}
                  {store.puedeEscribirA(p.id) ? '' : ' · no acepta mensajes'}
                </Text>
              </View>
            </Pressable>
          ))}
          {error ? <Aviso tipo="peligro">{error}</Aviso> : null}
        </View>
      ) : null}

      {mias.length === 0 && !nuevo ? (
        <View style={{ gap: 6, paddingVertical: 20 }}>
          <Text style={{ fontSize: 26, fontWeight: '900', color: color.tinta }}>Tu bandeja de entrada</Text>
          <Parrafo suave>Habla en privado con otras personas. Los mensajes solo los veis los que estáis en la conversación.</Parrafo>
        </View>
      ) : null}

      {mias.map((c) => {
        const otro = store.perfil(c.miembros.find((m) => m !== yo.id) ?? '');
        const ultimo = c.mensajes[c.mensajes.length - 1];
        const pendientes = store.sinLeer(c);
        if (!otro) return null;
        return (
          <Pressable
            key={c.id}
            onPress={() => router.push(`/chat/${c.id}`)}
            style={{ flexDirection: 'row', gap: 12, paddingVertical: 12, paddingHorizontal: 16, marginHorizontal: -16, borderBottomWidth: 1, borderBottomColor: color.borde }}
          >
            <Avatar nombre={otro.nombre} foto={otro.foto} tam={48} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: color.suave }} numberOfLines={1}>
                <Text style={{ color: color.tinta, fontWeight: '700' }}>{otro.nombre}</Text> @{otro.usuario}
                {ultimo ? ` · ${haceCuanto(ultimo.creado)}` : ''}
              </Text>
              <Text style={{ color: pendientes ? color.tinta : color.suave, fontWeight: pendientes ? '700' : '400' }} numberOfLines={1}>
                {ultimo ? `${ultimo.autorId === yo.id ? 'Tú: ' : ''}${ultimo.texto}` : 'Conversación nueva'}
              </Text>
            </View>
            {pendientes ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color.acento, alignSelf: 'center' }} /> : null}
          </Pressable>
        );
      })}

      <Text style={{ color: color.suave, fontSize: 13 }}>
        Ahora te puede escribir {textoQuien[yo.privacidad.quienEscribe]}.{' '}
        <Text style={{ color: color.acento }} onPress={() => router.push('/ajustes/privacidad')}>
          Cambiar
        </Text>
      </Text>
    </Pantalla>
  );
}
