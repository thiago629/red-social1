import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Publicacion } from '../../components/Publicacion';
import { Avatar, Boton, Campo, Pantalla, Parrafo, TextoRico, haceCuanto } from '../../components/ui';
import { color } from '../../lib/config';
import { revisarTexto } from '../../lib/moderacion';
import * as store from '../../lib/store';

const QUIEN = { todos: '', seguidos: 'Solo puede responder la gente que sigue el autor.', mencionados: 'Solo pueden responder las personas mencionadas.' };

export default function Detalle() {
  store.useVersion();
  const { id } = useLocalSearchParams<{ id: string }>();
  const estado = store.get();
  const yo = estado.sesionId ?? '';
  const p = estado.publicaciones.find((x) => x.id === id);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');

  if (!p || (p.oculta && p.autorId !== yo) || !store.puedeVerPerfil(p.autorId)) {
    return <Pantalla><Parrafo suave>Esta publicación no existe, es de una cuenta privada o se ha ocultado mientras se revisa.</Parrafo></Pantalla>;
  }
  const puede = store.puedeResponder(p);

  const enviar = () => {
    const r = revisarTexto(texto);
    if (!r.permitido) return setError(r.motivo);
    store.responder(p.id, texto);
    setTexto('');
    setError('');
  };

  return (
    <Pantalla>
      {p.oculta ? <Parrafo suave>Tu publicación está oculta mientras revisamos varias denuncias.</Parrafo> : null}
      <Publicacion publicacion={p} detalle />
      <Text style={{ color: color.suave, fontSize: 13 }}>
        {new Date(p.creado).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short', year: 'numeric' })}
      </Text>
      {QUIEN[p.quienResponde] ? <Text style={{ color: color.acento, fontSize: 13 }}>{QUIEN[p.quienResponde]}</Text> : null}
      {puede ? (
        <View style={{ gap: 8 }}>
          <Campo etiqueta="Publica tu respuesta" value={texto} onChangeText={setTexto} multiline maxLength={500} error={error} />
          <View style={{ alignSelf: 'flex-end' }}>
            <Boton pequeño texto="Responder" onPress={enviar} desactivado={!texto.trim()} />
          </View>
        </View>
      ) : null}
      {p.respuestas
        .filter((r) => !store.hayBloqueo(yo, r.autorId) && !(estado.silenciados[yo] ?? []).includes(r.autorId))
        .map((r) => {
          const autor = store.perfil(r.autorId);
          if (!autor) return null;
          return (
            <View key={r.id} style={{ flexDirection: 'row', gap: 12, paddingVertical: 12, paddingHorizontal: 16, marginHorizontal: -16, borderBottomWidth: 1, borderBottomColor: color.borde }}>
              <Pressable onPress={() => router.push(`/usuario/${autor.id}`)}>
                <Avatar nombre={autor.nombre} foto={autor.foto} />
              </Pressable>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: color.suave }}>
                  <Text style={{ color: color.tinta, fontWeight: '700' }}>{autor.nombre}</Text> @{autor.usuario} · {haceCuanto(r.creado)}
                  {autor.id === p.autorId ? ' · Autor' : ''}
                </Text>
                <TextoRico texto={r.texto} style={{ color: color.tinta, lineHeight: 21, fontSize: 15 }} />
                {r.autorId === yo ? (
                  <Pressable onPress={() => store.borrarRespuesta(p.id, r.id)}>
                    <Text style={{ color: color.peligro, fontSize: 13 }}>Borrar</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })}
    </Pantalla>
  );
}
