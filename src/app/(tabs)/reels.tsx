import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video } from '../../components/Medios';
import { formatoNumero } from '../../components/Publicacion';
import { Avatar, TextoRico, haceCuanto } from '../../components/ui';
import { paginaReels } from '../../lib/algoritmo';
import { color } from '../../lib/config';
import { compartirFuera, enlacePublicacion } from '../../lib/enlaces';
import { MOTIVOS_DENUNCIA, revisarTexto } from '../../lib/moderacion';
import * as store from '../../lib/store';
import type { Publicacion } from '../../lib/tipos';

type Fila = { clave: string; p: Publicacion };
type Visible = { index?: number | null; item: Fila };

// Reels: vídeos a pantalla completa, uno detrás de otro, sin final.
export default function Reels() {
  const version = store.useVersion();
  const yo = store.yo();
  const { id: primero } = useLocalSearchParams<{ id?: string }>();
  const [alto, setAlto] = useState(0);
  const [ancho, setAncho] = useState(0);
  const [activo, setActivo] = useState(0);
  const [paginas, setPaginas] = useState(3);
  const [enfocado, setEnfocado] = useState(true);
  const [silencio, setSilencio] = useState(Platform.OS === 'web');
  const [comentarios, setComentarios] = useState<string | null>(null);
  const [compartir, setCompartir] = useState<string | null>(null);
  const vistos = useRef(new Set<string>());

  useFocusEffect(
    useCallback(() => {
      setEnfocado(true);
      return () => setEnfocado(false);
    }, []),
  );

  const filas = useMemo<Fila[]>(() => {
    if (!yo) return [];
    const salida: Fila[] = [];
    for (let n = 0; n < paginas; n++) {
      let lista = paginaReels(store.get(), yo.id, n).map((x) => x.publicacion);
      if (n === 0 && primero) {
        const elegido = lista.find((p) => p.id === primero);
        if (elegido) lista = [elegido, ...lista.filter((p) => p !== elegido)];
      }
      lista.forEach((p) => salida.push({ clave: `${n}-${p.id}`, p }));
    }
    return salida;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, paginas, primero, yo?.id]);

  const alCambiar = useRef(({ viewableItems }: { viewableItems: Visible[] }) => {
    const v = viewableItems[0];
    if (v?.index == null) return;
    setActivo(v.index);
    const pid = v.item.p.id;
    if (!vistos.current.has(v.item.clave)) {
      vistos.current.add(v.item.clave);
      store.verReel(pid);
    }
  }).current;

  if (!yo) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }} onLayout={(e) => {
        setAlto(e.nativeEvent.layout.height);
        setAncho(e.nativeEvent.layout.width);
      }}>
      {alto > 0 && filas.length ? (
        <FlatList
          data={filas}
          keyExtractor={(f) => f.clave}
          pagingEnabled
          snapToInterval={alto}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, i) => ({ length: alto, offset: alto * i, index: i })}
          onViewableItemsChanged={alCambiar}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          onEndReachedThreshold={2}
          onEndReached={() => setPaginas((n) => n + 2)}
          windowSize={3}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          removeClippedSubviews
          renderItem={({ item, index }) => (
            <Reel
              p={item.p}
              alto={alto}
              ancho={Math.min(ancho, Math.round(alto * 0.62))}
              activo={enfocado && index === activo}
              cerca={Math.abs(index - activo) <= 1}
              silencio={silencio}
              alternarSonido={() => setSilencio((s) => !s)}
              abrirComentarios={() => setComentarios(item.p.id)}
              abrirCompartir={() => setCompartir(item.p.id)}
            />
          )}
        />
      ) : alto > 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Todavía no hay reels</Text>
        </View>
      ) : null}

      <Pressable
        onPress={() => router.push({ pathname: '/crear', params: { modo: 'reel' } })}
        accessibilityRole="button"
        accessibilityLabel="Subir reel"
        style={{ position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}
      >
        <Text style={{ color: '#fff', fontWeight: '800' }}>＋ Subir reel</Text>
      </Pressable>
      <Text pointerEvents="none" style={{ position: 'absolute', top: 16, left: 0, right: 0, textAlign: 'center', color: '#fff', fontWeight: '900', fontSize: 18, textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 6 }}>Reels</Text>

      <Comentarios pid={comentarios} cerrar={() => setComentarios(null)} />
      <HojaCompartir pid={compartir} cerrar={() => setCompartir(null)} />
    </View>
  );
}

type ReelProps = {
  p: Publicacion;
  alto: number;
  ancho: number;
  activo: boolean;
  cerca: boolean;
  silencio: boolean;
  alternarSonido: () => void;
  abrirComentarios: () => void;
  abrirCompartir: () => void;
};

function Reel({ p, alto, ancho, activo, cerca, silencio, alternarSonido, abrirComentarios, abrirCompartir }: ReelProps) {
  const yo = store.get().sesionId ?? '';
  const autor = store.perfil(p.autorId);
  const [pausa, setPausa] = useState(false);
  const [corazon, setCorazon] = useState(false);
  const [menu, setMenu] = useState(false);
  const ultimoToque = useRef(0);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  if (!autor || !p.video) return <View style={{ height: alto }} />;

  const meGusta = p.meGusta.includes(yo);
  const guardado = p.guardados.includes(yo);
  const sigo = store.sigueA(yo, autor.id) || autor.id === yo;

  // Un toque pausa; dos toques seguidos dan me gusta, como en Instagram y TikTok.
  const tocar = () => {
    const ahora = Date.now();
    if (ahora - ultimoToque.current < 280) {
      if (temporizador.current) clearTimeout(temporizador.current);
      if (!meGusta) store.meGusta(p.id);
      setCorazon(true);
      setTimeout(() => setCorazon(false), 700);
    } else {
      temporizador.current = setTimeout(() => setPausa((x) => !x), 290);
    }
    ultimoToque.current = ahora;
  };

  // En el ordenador el vídeo va en una columna vertical centrada, como en TikTok.
  return (
    <View style={{ height: alto, backgroundColor: '#000', alignItems: 'center' }}>
      <View style={{ height: alto, width: ancho }}>
      {cerca ? (
        <Video uri={p.video.uri} filtro={p.filtro} activo={activo && !pausa} silencio={silencio} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      ) : null}
      <Pressable onPress={tocar} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Pausar o dar me gusta con dos toques">
        {pausa ? <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 64 }}>▶</Text> : null}
        {corazon ? <Text style={{ color: color.meGusta, fontSize: 110 }}>♥</Text> : null}
      </Pressable>

      <Pressable onPress={alternarSonido} hitSlop={10} style={{ position: 'absolute', top: 58, right: 16 }} accessibilityLabel={silencio ? 'Activar sonido' : 'Silenciar'}>
        <Text style={{ color: '#fff', fontSize: 20 }}>{silencio ? '🔇' : '🔊'}</Text>
      </Pressable>

      <View style={{ position: 'absolute', right: 10, bottom: 24 + insets.bottom, alignItems: 'center', gap: 18 }}>
        <Pressable onPress={() => router.push(`/usuario/${autor.id}`)} accessibilityLabel={`Perfil de ${autor.nombre}`}>
          <View style={{ borderWidth: 2, borderColor: '#fff', borderRadius: 26 }}>
            <Avatar nombre={autor.nombre} foto={autor.foto} tam={46} />
          </View>
          {!sigo ? (
            <Pressable
              onPress={() => store.seguir(autor.id)}
              accessibilityLabel={`Seguir a ${autor.nombre}`}
              style={{ position: 'absolute', bottom: -10, alignSelf: 'center', width: 22, height: 22, borderRadius: 11, backgroundColor: color.meGusta, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '900', lineHeight: 18 }}>+</Text>
            </Pressable>
          ) : null}
        </Pressable>
        <BotonLateral icono={meGusta ? '♥' : '♡'} tono={meGusta ? color.meGusta : '#fff'} texto={formatoNumero(p.meGusta.length)} etiqueta="Me gusta" onPress={() => store.meGusta(p.id)} />
        <BotonLateral icono="💬" texto={formatoNumero(p.respuestas.length)} etiqueta="Comentarios" onPress={abrirComentarios} />
        <BotonLateral icono="↗" texto={formatoNumero(p.compartidos.length)} etiqueta="Compartir" onPress={abrirCompartir} />
        <BotonLateral icono={guardado ? '★' : '☆'} tono={guardado ? '#FFD400' : '#fff'} texto="Guardar" etiqueta="Guardar" onPress={() => store.guardar(p.id)} />
        <BotonLateral icono="⋯" texto="" etiqueta="Más opciones" onPress={() => setMenu(true)} />
      </View>

      <View style={{ position: 'absolute', left: 14, right: 80, bottom: 24 + insets.bottom, gap: 6 }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
          @{autor.usuario}
          {autor.ejemplo ? <Text style={{ fontWeight: '400', opacity: 0.8 }}> · ejemplo</Text> : null}
          <Text style={{ fontWeight: '400', opacity: 0.8 }}> · {haceCuanto(p.creado)}</Text>
        </Text>
        {p.texto ? <TextoRico texto={p.texto} style={{ color: '#fff', fontSize: 14, lineHeight: 19 }} /> : null}
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>♫ Sonido original · ▷ {formatoNumero(p.vistas ?? 0)} reproducciones</Text>
      </View>

      </View>
      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <MenuReel p={p} cerrar={() => setMenu(false)} />
      </Modal>
    </View>
  );
}

function BotonLateral({ icono, texto, etiqueta, onPress, tono = '#fff' }: { icono: string; texto: string; etiqueta: string; onPress: () => void; tono?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={etiqueta} hitSlop={6} style={{ alignItems: 'center', gap: 2 }}>
      <Text style={{ color: tono, fontSize: 30, textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 6 }}>{icono}</Text>
      {texto ? <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{texto}</Text> : null}
    </Pressable>
  );
}

function Hoja({ children, cerrar }: { children: React.ReactNode; cerrar: () => void }) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Pressable onPress={cerrar} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' }} accessibilityLabel="Cerrar" />
      <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, gap: 12, maxHeight: '75%', width: '100%', maxWidth: 600, alignSelf: 'center' }}>
        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: color.bordeFuerte }} />
        {children}
      </View>
    </KeyboardAvoidingView>
  );
}

function MenuReel({ p, cerrar }: { p: Publicacion; cerrar: () => void }) {
  const [denunciar, setDenunciar] = useState(false);
  const [hecho, setHecho] = useState('');
  const esMio = p.autorId === store.get().sesionId;
  const fila = (texto: string, accion: () => void, peligro = false) => (
    <Pressable key={texto} onPress={accion} style={{ paddingVertical: 12 }} accessibilityRole="button">
      <Text style={{ fontSize: 16, color: peligro ? color.peligro : color.tinta, fontWeight: '600' }}>{texto}</Text>
    </Pressable>
  );
  return (
    <Hoja cerrar={cerrar}>
      {hecho ? (
        <Text style={{ color: color.ok, fontSize: 15 }}>{hecho}</Text>
      ) : denunciar ? (
        <View style={{ gap: 4 }}>
          <Text style={{ fontWeight: '800', fontSize: 17 }}>¿Por qué lo denuncias?</Text>
          {MOTIVOS_DENUNCIA.map((m) =>
            fila(m, () => {
              store.denunciar('publicacion', p.id, m);
              setHecho('Gracias. Lo revisará una persona.');
            }),
          )}
        </View>
      ) : (
        <View>
          {fila('No me interesa', () => {
            store.noMeInteresa(p.id);
            setHecho('Verás menos vídeos como este.');
          })}
          {fila('Ver publicación', () => {
            cerrar();
            router.push(`/post/${p.id}`);
          })}
          {esMio
            ? fila('Borrar reel', () => {
                store.borrarPublicacion(p.id);
                cerrar();
              }, true)
            : fila('Denunciar', () => setDenunciar(true), true)}
        </View>
      )}
    </Hoja>
  );
}

function Comentarios({ pid, cerrar }: { pid: string | null; cerrar: () => void }) {
  store.useVersion();
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
  const p = pid ? store.get().publicaciones.find((x) => x.id === pid) : undefined;
  const enviar = () => {
    if (!p || !texto.trim()) return;
    const r = revisarTexto(texto, 300);
    if (!r.permitido) return setError(r.motivo);
    store.responder(p.id, texto);
    setTexto('');
    setError('');
  };
  return (
    <Modal visible={!!p} transparent animationType="slide" onRequestClose={cerrar}>
      {p ? (
        <Hoja cerrar={cerrar}>
          <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 15 }}>{p.respuestas.length} comentarios</Text>
          <FlatList
            data={p.respuestas}
            keyExtractor={(r) => r.id}
            style={{ flexGrow: 0 }}
            ListEmptyComponent={<Text style={{ color: color.suave, textAlign: 'center', paddingVertical: 20 }}>Sé el primero en comentar.</Text>}
            renderItem={({ item }) => {
              const a = store.perfil(item.autorId);
              return (
                <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 8 }}>
                  <Avatar nombre={a?.nombre ?? '?'} foto={a?.foto} tam={34} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: color.suave, fontSize: 13 }}>
                      <Text style={{ fontWeight: '700', color: color.tinta }}>{a?.usuario ?? 'cuenta borrada'}</Text> · {haceCuanto(item.creado)}
                    </Text>
                    <TextoRico texto={item.texto} style={{ fontSize: 15, color: color.tinta }} />
                  </View>
                </View>
              );
            }}
          />
          {store.puedeResponder(p) ? (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput
                value={texto}
                onChangeText={setTexto}
                placeholder="Añade un comentario…"
                placeholderTextColor={color.suave}
                accessibilityLabel="Comentario"
                maxLength={300}
                onSubmitEditing={enviar}
                style={{ flex: 1, borderWidth: 1, borderColor: color.borde, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 }}
              />
              <Pressable onPress={enviar} accessibilityRole="button" accessibilityLabel="Publicar comentario">
                <Text style={{ color: color.acento, fontWeight: '800' }}>Publicar</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={{ color: color.suave }}>El autor ha limitado quién puede comentar.</Text>
          )}
          {error ? <Text style={{ color: color.peligro }}>{error}</Text> : null}
        </Hoja>
      ) : null}
    </Modal>
  );
}

function HojaCompartir({ pid, cerrar }: { pid: string | null; cerrar: () => void }) {
  store.useVersion();
  const [aviso, setAviso] = useState('');
  const yo = store.get().sesionId ?? '';
  const p = pid ? store.get().publicaciones.find((x) => x.id === pid) : undefined;
  const contactos = (store.get().sigue[yo] ?? []).map((id) => store.perfil(id)).filter((x) => !!x && store.puedeEscribirA(x.id)).slice(0, 8);
  const salir = () => {
    setAviso('');
    cerrar();
  };
  return (
    <Modal visible={!!p} transparent animationType="slide" onRequestClose={salir}>
      {p ? (
        <Hoja cerrar={salir}>
          <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 15 }}>Compartir</Text>
          {contactos.length ? (
            <View style={{ gap: 6 }}>
              <Text style={{ color: color.suave, fontSize: 13 }}>Enviar por mensaje</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
                {contactos.map((c) => (
                  <Pressable
                    key={c!.id}
                    onPress={() => {
                      const cid = store.abrirConversacion(c!.id);
                      if (cid) store.enviarMensaje(cid, `Mira este reel: ${enlacePublicacion(p.id)}`);
                      setAviso(`Enviado a @${c!.usuario}.`);
                    }}
                    style={{ alignItems: 'center', gap: 4, width: 64 }}
                    accessibilityLabel={`Enviar a ${c!.nombre}`}
                  >
                    <Avatar nombre={c!.nombre} foto={c!.foto} tam={48} />
                    <Text style={{ fontSize: 11 }} numberOfLines={1}>{c!.usuario}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
          <Pressable
            onPress={() => {
              store.compartir(p.id);
              setAviso(p.compartidos.includes(yo) ? 'Ya no lo compartes en tu perfil.' : 'Compartido en tu perfil.');
            }}
            style={{ paddingVertical: 12 }}
            accessibilityRole="button"
          >
            <Text style={{ fontSize: 16, fontWeight: '600' }}>↻ {p.compartidos.includes(yo) ? 'Quitar de mi perfil' : 'Compartir en mi perfil'}</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              const r = await compartirFuera(p.texto, enlacePublicacion(p.id));
              if (r === 'copiado') setAviso('Enlace copiado.');
            }}
            style={{ paddingVertical: 12 }}
            accessibilityRole="button"
          >
            <Text style={{ fontSize: 16, fontWeight: '600' }}>↗ Compartir en otras apps (WhatsApp, Instagram…)</Text>
          </Pressable>
          {aviso ? <Text style={{ color: color.ok }}>{aviso}</Text> : null}
        </Hoja>
      ) : null}
    </Modal>
  );
}
