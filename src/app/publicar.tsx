import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Foto } from '../components/Medios';
import { Aviso, Avatar, Boton, Campo, Casilla, Chip, Fila, Pantalla, Selector, Subtitulo } from '../components/ui';
import { color, INTERESES, LIMITE_TEXTO, MAX_FOTOS } from '../lib/config';
import { FILTROS } from '../lib/filtros';
import { elegirFotos } from '../lib/fotos';
import { enlaceSospechoso, normalizarEnlace, revisarTexto } from '../lib/moderacion';
import * as store from '../lib/store';
import type { Publicacion } from '../lib/tipos';

// Se puede publicar de todo (texto, fotos, encuestas, enlaces) menos lo ilegal.
export default function Publicar() {
  store.useVersion();
  const yo = store.yo();
  // Si viene de compartir desde otra app, el texto y el enlace llegan ya puestos.
  const compartido = useLocalSearchParams<{ texto?: string; enlace?: string }>();
  const [texto, setTexto] = useState(compartido.texto ?? '');
  const [fotos, setFotos] = useState<string[]>([]);
  const [filtro, setFiltro] = useState('normal');
  const [enlace, setEnlace] = useState(compartido.enlace ?? '');
  const [verEnlace, setVerEnlace] = useState(!!compartido.enlace);
  const [encuesta, setEncuesta] = useState<string[] | null>(null);
  const [dias, setDias] = useState(1);
  const [temas, setTemas] = useState<string[]>([]);
  const [sensible, setSensible] = useState(false);
  const [quienResponde, setQuienResponde] = useState<Publicacion['quienResponde']>(yo?.privacidad.quienResponde ?? 'todos');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  if (!yo) return null;

  const opcionesValidas = encuesta?.map((o) => o.trim()).filter(Boolean) ?? [];
  const vacio = !texto.trim() && !fotos.length && !encuesta;
  const restantes = LIMITE_TEXTO - texto.length;

  const añadirFotos = async () => {
    setCargando(true);
    try {
      const nuevas = await elegirFotos(MAX_FOTOS - fotos.length);
      setFotos((f) => [...f, ...nuevas].slice(0, MAX_FOTOS));
      if (nuevas.length) setEncuesta(null);
    } catch {
      setError('No se ha podido cargar la foto.');
    } finally {
      setCargando(false);
    }
  };

  const enviar = () => {
    const r = revisarTexto(`${texto} ${opcionesValidas.join(' ')}`, LIMITE_TEXTO + 200);
    if (!r.permitido) return setError(r.motivo);
    if (texto.length > LIMITE_TEXTO) return setError(`Máximo ${LIMITE_TEXTO} caracteres.`);
    if (encuesta && opcionesValidas.length < 2) return setError('La encuesta necesita al menos 2 opciones.');
    if (encuesta && !texto.trim()) return setError('Escribe la pregunta de la encuesta.');
    const url = normalizarEnlace(enlace);
    if (url && enlaceSospechoso(url)) return setError('Ese enlace parece peligroso. Usa la dirección completa de la web.');
    const id = store.publicar({
      texto,
      fotos,
      filtro: fotos.length ? filtro : undefined,
      enlace: url,
      encuesta: encuesta ? { opciones: opcionesValidas, dias } : undefined,
      sensible,
      quienResponde,
      temas,
    });
    if (id) router.replace(`/post/${id}`);
  };

  return (
    <Pantalla>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Avatar nombre={yo.nombre} foto={yo.foto} />
        <View style={{ flex: 1, gap: 10 }}>
          <TextInput
            value={texto}
            onChangeText={(t) => {
              setTexto(t);
              setError('');
            }}
            placeholder={encuesta ? 'Haz una pregunta' : '¿Qué está pasando?'}
            placeholderTextColor={color.suave}
            multiline
            autoFocus
            accessibilityLabel="Texto de la publicación"
            style={{ fontSize: 20, minHeight: 110, color: color.tinta, textAlignVertical: 'top', paddingTop: 8 }}
          />

          {fotos.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {fotos.map((f, i) => (
                <View key={i}>
                  <Foto uri={f} filtro={filtro} style={{ width: 120, height: 120, borderRadius: 12 }} />
                  <Pressable
                    onPress={() => setFotos(fotos.filter((_, j) => j !== i))}
                    accessibilityLabel="Quitar foto"
                    style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(15,20,25,0.75)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800' }}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
          {fotos.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {FILTROS.map((f) => (
                <Pressable key={f.id} onPress={() => setFiltro(f.id)} accessibilityRole="button" accessibilityLabel={`Filtro ${f.nombre}`} style={{ alignItems: 'center', gap: 2 }}>
                  <View style={{ borderWidth: 2, borderColor: filtro === f.id ? color.acento : 'transparent', borderRadius: 10, padding: 1 }}>
                    <Foto uri={fotos[0]} filtro={f.id} style={{ width: 48, height: 48, borderRadius: 8 }} />
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: filtro === f.id ? '800' : '400', color: color.tinta }}>{f.nombre}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          {encuesta ? (
            <View style={{ borderWidth: 1, borderColor: color.borde, borderRadius: 16, padding: 12, gap: 8 }}>
              {encuesta.map((o, i) => (
                <Campo
                  key={i}
                  etiqueta={`Opción ${i + 1}${i > 1 ? ' (opcional)' : ''}`}
                  value={o}
                  maxLength={25}
                  onChangeText={(t) => setEncuesta(encuesta.map((x, j) => (j === i ? t : x)))}
                />
              ))}
              <Fila>
                {encuesta.length < 4 ? <Boton pequeño tipo="secundario" texto="+ Opción" onPress={() => setEncuesta([...encuesta, ''])} /> : null}
                <Boton pequeño tipo="texto" texto="Quitar encuesta" onPress={() => setEncuesta(null)} />
              </Fila>
              <Text style={{ color: color.suave }}>Duración</Text>
              <Fila>
                {[1, 3, 7].map((d) => (
                  <Chip key={d} texto={d === 1 ? '1 día' : `${d} días`} activo={dias === d} onPress={() => setDias(d)} />
                ))}
              </Fila>
            </View>
          ) : null}

          {verEnlace ? (
            <Campo etiqueta="Enlace" value={enlace} onChangeText={setEnlace} autoCapitalize="none" keyboardType="url" placeholder="https://..." />
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.borde, paddingVertical: 6 }}>
        <Herramienta texto="🖼 Foto" onPress={añadirFotos} desactivado={fotos.length >= MAX_FOTOS || !!encuesta || cargando} />
        <Herramienta texto="📊 Encuesta" onPress={() => setEncuesta(['', ''])} desactivado={!!encuesta || fotos.length > 0} />
        <Herramienta texto="🔗 Enlace" onPress={() => setVerEnlace(!verEnlace)} />
        <View style={{ flex: 1 }} />
        <Text style={{ color: restantes < 0 ? color.peligro : restantes < 40 ? '#FFAD1F' : color.suave, fontVariant: ['tabular-nums'] }}>{restantes}</Text>
      </View>
      {cargando ? <Text style={{ color: color.suave }}>Preparando la foto…</Text> : null}

      <Subtitulo>Temas</Subtitulo>
      <Text style={{ color: color.suave, marginTop: -8 }}>Hasta 3. Ayudan a que lo vea la gente a la que le interesa.</Text>
      <Fila>
        {INTERESES.map((t) => (
          <Chip
            key={t.id}
            texto={`${t.emoji} ${t.id}`}
            activo={temas.includes(t.id)}
            onPress={() => setTemas(temas.includes(t.id) ? temas.filter((x) => x !== t.id) : temas.length < 3 ? [...temas, t.id] : temas)}
          />
        ))}
      </Fila>

      <Selector
        titulo="¿Quién puede responder?"
        valor={quienResponde}
        onCambio={setQuienResponde}
        opciones={[
          { valor: 'todos', texto: 'Todos' },
          { valor: 'seguidos', texto: 'Gente que sigo' },
          { valor: 'mencionados', texto: 'Solo mencionados' },
        ]}
      />
      <Casilla marcada={sensible} onCambio={setSensible}>
        Marcar como contenido sensible (violencia, desnudos no sexuales, lenguaje fuerte). Se tapa hasta que alguien decida verlo.
      </Casilla>

      {error ? <Aviso tipo="peligro">{error}</Aviso> : null}
      <Boton texto="Publicar" onPress={enviar} desactivado={vacio || restantes < 0 || cargando} />
      <Text style={{ color: color.suave, fontSize: 13 }}>
        Puedes publicar de todo menos cosas ilegales. Antes de publicarse, cada texto pasa un filtro automático según las normas de la comunidad.
      </Text>
    </Pantalla>
  );
}

function Herramienta({ texto, onPress, desactivado }: { texto: string; onPress: () => void; desactivado?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={desactivado} accessibilityRole="button" style={{ paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, opacity: desactivado ? 0.4 : 1 }}>
      <Text style={{ color: color.acento, fontWeight: '700' }}>{texto}</Text>
    </Pressable>
  );
}
