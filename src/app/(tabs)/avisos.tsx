import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Avatar, Boton, Fila, Pantalla, Parrafo, haceCuanto } from '../../components/ui';
import { color } from '../../lib/config';
import * as store from '../../lib/store';

const ICONO = { meGusta: '♥', respuestas: '💬', menciones: '@', seguidores: '👤', compartidos: '↻', mensajes: '✉', sistema: 'ℹ︎' };

export default function Avisos() {
  store.useVersion();
  const estado = store.get();
  const yo = estado.sesionId ?? '';
  const [filtro, setFiltro] = useState<'todas' | 'menciones'>('todas');
  const mios = estado.avisos.filter((a) => a.paraId === yo && (filtro === 'todas' || a.tipo === 'menciones'));
  const solicitudes = (estado.solicitudes[yo] ?? []).map((id) => store.perfil(id)).filter((p) => !!p);

  // Al salir de la pantalla se marcan como leídas.
  useFocusEffect(useCallback(() => () => store.leerAvisos(), []));

  return (
    <Pantalla>
      <View style={{ flexDirection: 'row', marginHorizontal: -16, marginTop: -16, borderBottomWidth: 1, borderBottomColor: color.borde }}>
        {(['todas', 'menciones'] as const).map((f) => (
          <Pressable key={f} onPress={() => setFiltro(f)} style={{ flex: 1, alignItems: 'center', paddingTop: 14 }} accessibilityRole="tab" accessibilityState={{ selected: filtro === f }}>
            <Text style={{ fontWeight: filtro === f ? '800' : '500', color: filtro === f ? color.tinta : color.suave, paddingBottom: 12 }}>
              {f === 'todas' ? 'Todas' : 'Menciones'}
            </Text>
            <View style={{ height: 4, width: 56, borderRadius: 2, backgroundColor: filtro === f ? color.acento : 'transparent' }} />
          </Pressable>
        ))}
      </View>

      {solicitudes.length ? (
        <View style={{ gap: 10 }}>
          <Text style={{ fontWeight: '800', color: color.tinta, fontSize: 16 }}>Solicitudes para seguirte</Text>
          {solicitudes.map((p) => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar nombre={p.nombre} foto={p.foto} />
              <Text style={{ flex: 1, color: color.tinta }}>
                <Text style={{ fontWeight: '700' }}>{p.nombre}</Text> @{p.usuario}
              </Text>
              <Fila>
                <Boton pequeño tipo="negro" texto="Aceptar" onPress={() => store.responderSolicitud(p.id, true)} />
                <Boton pequeño tipo="secundario" texto="Rechazar" onPress={() => store.responderSolicitud(p.id, false)} />
              </Fila>
            </View>
          ))}
        </View>
      ) : null}

      {mios.length === 0 ? <Parrafo suave>No tienes notificaciones todavía.</Parrafo> : null}
      {mios.map((a) => {
        const de = a.deId ? store.perfil(a.deId) : undefined;
        return (
          <Pressable
            key={a.id}
            onPress={() => (a.publicacionId ? router.push(`/post/${a.publicacionId}`) : a.deId ? router.push(`/usuario/${a.deId}`) : undefined)}
            style={{
              flexDirection: 'row',
              gap: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginHorizontal: -16,
              borderBottomWidth: 1,
              borderBottomColor: color.borde,
              backgroundColor: a.leido ? color.papel : color.acentoSuave,
            }}
          >
            <Text style={{ fontSize: 20, width: 28, textAlign: 'center', color: a.tipo === 'meGusta' ? color.meGusta : a.tipo === 'compartidos' ? color.compartir : color.acento }}>
              {ICONO[a.tipo]}
            </Text>
            <View style={{ flex: 1, gap: 6 }}>
              {de ? <Avatar nombre={de.nombre} foto={de.foto} tam={32} /> : null}
              <Text style={{ color: color.tinta, lineHeight: 21 }}>{a.texto}</Text>
              <Text style={{ color: color.suave, fontSize: 13 }}>{haceCuanto(a.creado)}</Text>
            </View>
          </Pressable>
        );
      })}
    </Pantalla>
  );
}
