import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Foto, Video } from '../components/Medios';
import { Aviso, Boton, Chip, Fila, Pantalla, Parrafo, Subtitulo } from '../components/ui';
import { color, INTERESES } from '../lib/config';
import { coloresFondo, FILTROS, FONDOS_HISTORIA } from '../lib/filtros';
import { elegirMedio, MAX_MB, MAX_SEGUNDOS, type Elegido } from '../lib/medios';
import { revisarTexto } from '../lib/moderacion';
import * as store from '../lib/store';

const COLORES_TEXTO = ['#FFFFFF', '#0F1419', '#FFD400', '#FF3D71', '#1D9BF0', '#00BA7C'];

// Crear un reel o una historia: elegir foto o vídeo, poner filtro, texto y publicar.
export default function Crear() {
  store.useVersion();
  const { modo: m } = useLocalSearchParams<{ modo?: string }>();
  const modo = m === 'historia' ? 'historia' : 'reel';
  const yo = store.yo();
  const { height } = useWindowDimensions();
  const [medio, setMedio] = useState<Elegido | null>(null);
  const [soloTexto, setSoloTexto] = useState(false);
  const [fondo, setFondo] = useState(FONDOS_HISTORIA[0]);
  const [filtro, setFiltro] = useState('normal');
  const [texto, setTexto] = useState('');
  const [colorTexto, setColorTexto] = useState(COLORES_TEXTO[0]);
  const [temas, setTemas] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  if (!yo) return null;

  const elegir = async () => {
    setError('');
    setCargando(true);
    try {
      const r = await elegirMedio(modo === 'reel' ? 'video' : 'todo');
      if (r && 'error' in r) setError(r.error);
      else if (r) {
        setMedio(r);
        setSoloTexto(false);
      }
    } catch {
      setError('No se ha podido cargar el archivo.');
    } finally {
      setCargando(false);
    }
  };

  const publicar = () => {
    const revision = revisarTexto(texto, modo === 'reel' ? 500 : 200);
    if (!revision.permitido) return setError(revision.motivo);
    if (modo === 'reel') {
      if (!medio || medio.tipo !== 'video') return setError('Elige un vídeo.');
      const id = store.publicar({
        texto,
        fotos: [],
        video: { uri: medio.uri, duracion: medio.duracion, ancho: medio.ancho, alto: medio.alto },
        reel: true,
        filtro,
        temas,
        sensible: false,
        quienResponde: yo.privacidad.quienResponde,
      });
      if (id) router.replace({ pathname: '/reels', params: { id } });
      return;
    }
    if (!medio && !soloTexto) return setError('Elige una foto o un vídeo, o haz una historia de texto.');
    if (soloTexto && !texto.trim()) return setError('Escribe algo para tu historia.');
    store.publicarHistoria({
      tipo: medio?.tipo ?? 'foto',
      uri: medio?.uri ?? '',
      filtro,
      texto: texto.trim() || undefined,
      colorTexto,
      fondo: soloTexto ? fondo : undefined,
      duracion: medio?.duracion,
    });
    router.replace(`/historias/${yo.id}`);
  };

  const altoVista = Math.min(height * 0.62, 640);
  const hayVista = !!medio || soloTexto;

  return (
    <Pantalla ancho={520}>
      <Stack.Screen options={{ title: modo === 'reel' ? 'Nuevo reel' : 'Nueva historia' }} />

      {!hayVista ? (
        <View style={{ gap: 12 }}>
          <Parrafo suave>
            {modo === 'reel'
              ? `Sube un vídeo vertical de hasta ${MAX_SEGUNDOS} segundos y ${MAX_MB} MB. Después eliges filtro y texto.`
              : 'Comparte una foto, un vídeo o un texto. Desaparece a las 24 horas.'}
          </Parrafo>
          <Boton texto={modo === 'reel' ? '🎬 Elegir vídeo de la galería' : '🖼 Elegir foto o vídeo'} onPress={elegir} />
          {modo === 'historia' ? <Boton tipo="secundario" texto="Aa  Historia solo de texto" onPress={() => setSoloTexto(true)} /> : null}
          {cargando ? <ActivityIndicator color={color.acento} /> : null}
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          <View style={{ alignSelf: 'center', height: altoVista, aspectRatio: 9 / 16, borderRadius: 18, overflow: 'hidden', backgroundColor: '#000' }}>
            {soloTexto ? (
              <LinearGradient colors={coloresFondo(fondo)} style={{ flex: 1 }} />
            ) : medio?.tipo === 'video' ? (
              <Video uri={medio.uri} filtro={filtro} activo silencio style={{ flex: 1 }} />
            ) : medio ? (
              <Foto uri={medio.uri} filtro={filtro} style={{ flex: 1 }} />
            ) : null}
            {modo === 'historia' && texto ? (
              <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, top: 0, bottom: 0, justifyContent: 'center' }}>
                <Text style={{ color: colorTexto, fontSize: 28, fontWeight: '900', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 8 }}>{texto}</Text>
              </View>
            ) : null}
          </View>

          {soloTexto ? (
            <Fila style={{ justifyContent: 'center' }}>
              {FONDOS_HISTORIA.map((f) => (
                <Pressable key={f} onPress={() => setFondo(f)} accessibilityLabel="Fondo">
                  <LinearGradient colors={coloresFondo(f)} style={{ width: 34, height: 34, borderRadius: 17, borderWidth: f === fondo ? 3 : 0, borderColor: color.tinta }} />
                </Pressable>
              ))}
            </Fila>
          ) : (
            <View style={{ gap: 6 }}>
              <Subtitulo>Filtros</Subtitulo>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {FILTROS.map((f) => (
                  <Pressable key={f.id} onPress={() => setFiltro(f.id)} accessibilityRole="button" accessibilityLabel={`Filtro ${f.nombre}`} accessibilityState={{ selected: filtro === f.id }} style={{ alignItems: 'center', gap: 4 }}>
                    <View style={{ borderWidth: 2, borderColor: filtro === f.id ? color.acento : 'transparent', borderRadius: 12, padding: 2 }}>
                      {medio?.tipo === 'foto' ? (
                        <Foto uri={medio.uri} filtro={f.id} style={{ width: 58, height: 58, borderRadius: 10 }} />
                      ) : (
                        <MuestraFiltro id={f.id} />
                      )}
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: filtro === f.id ? '800' : '500', color: color.tinta }}>{f.nombre}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {modo === 'historia' ? (
            <View style={{ gap: 8 }}>
              <TextInput
                value={texto}
                onChangeText={setTexto}
                placeholder="Escribe un texto (opcional)"
                placeholderTextColor={color.suave}
                accessibilityLabel="Texto de la historia"
                maxLength={200}
                style={{ borderWidth: 1, borderColor: color.bordeFuerte, borderRadius: 12, padding: 12, fontSize: 16 }}
              />
              <Fila>
                {COLORES_TEXTO.map((c) => (
                  <Pressable key={c} onPress={() => setColorTexto(c)} accessibilityLabel="Color del texto" style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c, borderWidth: c === colorTexto ? 3 : 1, borderColor: c === colorTexto ? color.acento : color.bordeFuerte }} />
                ))}
              </Fila>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <TextInput
                value={texto}
                onChangeText={setTexto}
                placeholder="Escribe una descripción… #hashtags @menciones"
                placeholderTextColor={color.suave}
                accessibilityLabel="Descripción del reel"
                multiline
                maxLength={500}
                style={{ borderWidth: 1, borderColor: color.bordeFuerte, borderRadius: 12, padding: 12, fontSize: 16, minHeight: 70 }}
              />
              <Subtitulo>Temas (hasta 3)</Subtitulo>
              <Fila>
                {INTERESES.map((t) => (
                  <Chip
                    key={t.id}
                    texto={`${t.emoji} ${t.id}`}
                    activo={temas.includes(t.id)}
                    onPress={() => setTemas((x) => (x.includes(t.id) ? x.filter((y) => y !== t.id) : x.length < 3 ? [...x, t.id] : x))}
                  />
                ))}
              </Fila>
            </View>
          )}

          {error ? <Aviso tipo="peligro">{error}</Aviso> : null}
          <Fila>
            <Boton texto={modo === 'reel' ? 'Publicar reel' : 'Compartir historia'} onPress={publicar} />
            <Boton
              tipo="secundario"
              texto="Cambiar"
              onPress={() => {
                setMedio(null);
                setSoloTexto(false);
                setFiltro('normal');
              }}
            />
          </Fila>
          <Parrafo suave style={{ fontSize: 12 }}>
            Se puede publicar de todo menos cosas ilegales. Solo sube vídeos y música que sean tuyos o que tengas permiso para usar.
          </Parrafo>
        </View>
      )}
      {!hayVista && error ? <Aviso tipo="peligro">{error}</Aviso> : null}
    </Pantalla>
  );
}

// Muestra de color para cada filtro cuando el archivo es un vídeo.
function MuestraFiltro({ id }: { id: string }) {
  return <Foto uri={require('../../assets/reels/viajes.jpg')} filtro={id} style={{ width: 58, height: 58, borderRadius: 10 }} />;
}
