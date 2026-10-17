import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { BotonPublicar } from '../../components/BotonPublicar';
import { Publicacion } from '../../components/Publicacion';
import { Avatar, Boton, Chip, Fila, Pantalla, Parrafo, Subtitulo } from '../../components/ui';
import { tendencias, visibles } from '../../lib/algoritmo';
import { color, INTERESES } from '../../lib/config';
import * as store from '../../lib/store';

export default function Explorar() {
  store.useVersion();
  const params = useLocalSearchParams<{ q?: string }>();
  const estado = store.get();
  const yo = estado.sesionId ?? '';
  const [busqueda, setBusqueda] = useState(params.q ?? '');
  const [tema, setTema] = useState<string | null>(null);
  useEffect(() => {
    if (params.q) setBusqueda(params.q);
  }, [params.q]);

  const q = busqueda.trim().toLowerCase();
  const personas = estado.perfiles.filter((p) => {
    if (p.id === yo || store.hayBloqueo(yo, p.id)) return false;
    if (!q) return true;
    const porCorreo = p.privacidad.encontrarPorCorreo && estado.privados.find((x) => x.usuarioId === p.id)?.email === q;
    return p.nombre.toLowerCase().includes(q) || p.usuario.includes(q.replace(/^@/, '')) || porCorreo;
  });
  const publicaciones = visibles(estado, yo)
    .filter((p) => (!tema || p.temas.includes(tema)) && (!q || p.texto.toLowerCase().includes(q)))
    .sort((a, b) => b.meGusta.length + b.compartidos.length * 2 + b.respuestas.length * 3 - (a.meGusta.length + a.compartidos.length * 2 + a.respuestas.length * 3));
  const tags = tendencias(estado, yo);

  return (
    <View style={{ flex: 1, backgroundColor: color.papel }}>
      <Pantalla>
        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar personas, #temas o publicaciones"
          placeholderTextColor={color.suave}
          autoCapitalize="none"
          accessibilityLabel="Buscar"
          style={{ backgroundColor: color.borde, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 11, fontSize: 15, color: color.tinta }}
        />

        {!q && !tema && tags.length ? (
          <View>
            <Subtitulo>Tendencias</Subtitulo>
            {tags.map(([tag, n], i) => (
              <Pressable key={tag} onPress={() => setBusqueda(`#${tag}`)} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: color.borde }}>
                <Text style={{ color: color.suave, fontSize: 13 }}>{i + 1} · Tendencia</Text>
                <Text style={{ color: color.tinta, fontWeight: '800', fontSize: 15 }}>#{tag}</Text>
                <Text style={{ color: color.suave, fontSize: 13 }}>{n} interacciones</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Subtitulo>{q ? 'Personas' : 'A quién seguir'}</Subtitulo>
        {personas.slice(0, q ? 10 : 4).map((p) => {
          const sigo = store.sigueA(yo, p.id);
          const pedido = store.haSolicitado(p.id);
          return (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable onPress={() => router.push(`/usuario/${p.id}`)} style={{ flexDirection: 'row', gap: 10, flex: 1, alignItems: 'center', minWidth: 0 }}>
                <Avatar nombre={p.nombre} foto={p.foto} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontWeight: '700', color: color.tinta }} numberOfLines={1}>
                    {p.nombre}
                    {p.privacidad.privado ? ' 🔒' : ''}
                  </Text>
                  <Text style={{ color: color.suave, fontSize: 13 }} numberOfLines={1}>
                    @{p.usuario}
                  </Text>
                </View>
              </Pressable>
              <Boton
                pequeño
                tipo={sigo || pedido ? 'secundario' : 'negro'}
                texto={sigo ? 'Siguiendo' : pedido ? 'Pendiente' : 'Seguir'}
                onPress={() => store.seguir(p.id)}
              />
            </View>
          );
        })}
        {personas.length === 0 ? <Parrafo suave>Nadie coincide con la búsqueda.</Parrafo> : null}

        <Subtitulo>Temas</Subtitulo>
        <Fila>
          {INTERESES.map((t) => (
            <Chip key={t.id} texto={`${t.emoji} ${t.id}`} activo={tema === t.id} onPress={() => setTema(tema === t.id ? null : t.id)} />
          ))}
        </Fila>

        <Subtitulo>{tema ? `Lo más visto en ${tema}` : q ? 'Publicaciones' : 'Lo más visto'}</Subtitulo>
        {publicaciones.map((p) => (
          <Publicacion key={p.id} publicacion={p} />
        ))}
        {publicaciones.length === 0 ? <Parrafo suave>No hay publicaciones que coincidan.</Parrafo> : null}
        <View style={{ height: 80 }} />
      </Pantalla>
      <BotonPublicar />
    </View>
  );
}
