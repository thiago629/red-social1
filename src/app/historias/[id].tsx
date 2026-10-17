import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Foto, Video } from '../../components/Medios';
import { Avatar, haceCuanto } from '../../components/ui';
import { color } from '../../lib/config';
import { coloresFondo } from '../../lib/filtros';
import { revisarTexto } from '../../lib/moderacion';
import * as store from '../../lib/store';

const SEGUNDOS_FOTO = 5;

// Visor de historias a pantalla completa, como en Instagram:
// toca a la derecha para avanzar, a la izquierda para volver y mantén pulsado para pausar.
export default function Historias() {
  store.useVersion();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const yo = store.get().sesionId ?? '';
  // Los grupos se fijan al abrir, para que no cambien de orden mientras se ven.
  const grupos = useMemo(() => store.gruposDeHistorias(), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [g, setG] = useState(() => Math.max(0, grupos.findIndex((x) => x.autorId === id)));
  const [i, setI] = useState(() => {
    const grupo = grupos.find((x) => x.autorId === id);
    const pendiente = grupo?.historias.findIndex((h) => !h.vistas.includes(yo)) ?? -1;
    return pendiente > 0 ? pendiente : 0;
  });
  const [progreso, setProgreso] = useState(0);
  const [pausa, setPausa] = useState(false);
  const [respuesta, setRespuesta] = useState('');
  const [aviso, setAviso] = useState('');
  const escribiendo = useRef(false);

  const grupo = grupos[g];
  const historia = grupo ? store.get().historias.find((h) => h.id === grupo.historias[i]?.id) : undefined;
  const autor = grupo ? store.perfil(grupo.autorId) : undefined;
  const duracion = historia?.tipo === 'video' ? historia.duracion ?? 15 : SEGUNDOS_FOTO;

  const cerrar = useCallback(() => (router.canGoBack() ? router.back() : router.replace('/')), []);

  const siguiente = useCallback(() => {
    if (!grupo) return cerrar();
    if (i < grupo.historias.length - 1) setI(i + 1);
    else if (g < grupos.length - 1) {
      setG(g + 1);
      setI(0);
    } else cerrar();
  }, [grupo, i, g, grupos.length, cerrar]);

  const anterior = () => {
    if (i > 0) setI(i - 1);
    else if (g > 0) {
      setG(g - 1);
      setI(grupos[g - 1].historias.length - 1);
    }
  };

  useEffect(() => {
    setProgreso(0);
    setAviso('');
    if (historia) store.verHistoria(historia.id);
  }, [historia?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pausa || !historia) return;
    const t = setInterval(() => setProgreso((p) => p + 0.05 / duracion), 50);
    return () => clearInterval(t);
  }, [pausa, historia, duracion]);

  useEffect(() => {
    if (progreso >= 1) siguiente();
  }, [progreso, siguiente]);

  if (!grupo || !historia || !autor) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Text style={{ color: '#fff' }}>Esta historia ya no está disponible.</Text>
        <Pressable onPress={cerrar}><Text style={{ color: '#fff', fontWeight: '800' }}>Cerrar</Text></Pressable>
      </View>
    );
  }

  const mia = autor.id === yo;
  const meGusta = historia.meGusta.includes(yo);

  const enviar = () => {
    const r = revisarTexto(respuesta, 300);
    if (!r.permitido) return setAviso(r.motivo);
    if (!respuesta.trim()) return;
    if (!store.puedeEscribirA(autor.id)) return setAviso(`@${autor.usuario} no recibe mensajes de todo el mundo.`);
    const cid = store.abrirConversacion(autor.id);
    if (cid) store.enviarMensaje(cid, `Respondió a tu historia: ${respuesta.trim()}`);
    setRespuesta('');
    setAviso('Mensaje enviado.');
    escribiendo.current = false;
    setPausa(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
        {historia.fondo ? (
          <LinearGradient colors={coloresFondo(historia.fondo)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        ) : historia.tipo === 'video' ? (
          <Video key={historia.id} uri={historia.uri} filtro={historia.filtro} activo={!pausa} bucle={false} alTerminar={siguiente} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        ) : (
          <Foto uri={historia.uri} filtro={historia.filtro} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        )}
        {historia.texto ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 20, right: 20, top: 0, bottom: 0, justifyContent: 'center' }}>
            <Text style={{ color: historia.colorTexto ?? '#fff', fontSize: 30, fontWeight: '900', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 8 }}>
              {historia.texto}
            </Text>
          </View>
        ) : null}

        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 90, flexDirection: 'row' }}>
          <Pressable style={{ flex: 1 }} onPress={anterior} onLongPress={() => setPausa(true)} onPressOut={() => !escribiendo.current && setPausa(false)} accessibilityLabel="Historia anterior" />
          <Pressable style={{ flex: 2 }} onPress={siguiente} onLongPress={() => setPausa(true)} onPressOut={() => !escribiendo.current && setPausa(false)} accessibilityLabel="Siguiente historia" />
        </View>

        <View style={{ position: 'absolute', top: insets.top + 8, left: 10, right: 10, gap: 10 }} pointerEvents="box-none">
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {grupo.historias.map((h, n) => (
              <View key={h.id} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' }}>
                <View style={{ height: 3, backgroundColor: '#fff', width: `${(n < i ? 1 : n === i ? Math.min(1, progreso) : 0) * 100}%` }} />
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} pointerEvents="box-none">
            <Pressable onPress={() => router.push(`/usuario/${autor.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Avatar nombre={autor.nombre} foto={autor.foto} tam={34} />
              <Text style={{ color: '#fff', fontWeight: '800' }}>
                {autor.usuario} <Text style={{ fontWeight: '400', opacity: 0.8 }}>{haceCuanto(historia.creado)}</Text>
              </Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => setPausa((p) => !p)} hitSlop={10} accessibilityLabel={pausa ? 'Reanudar' : 'Pausar'}>
              <Text style={{ color: '#fff', fontSize: 18 }}>{pausa ? '▶' : '❚❚'}</Text>
            </Pressable>
            <Pressable onPress={cerrar} hitSlop={10} accessibilityLabel="Cerrar">
              <Text style={{ color: '#fff', fontSize: 26 }}>✕</Text>
            </Pressable>
          </View>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <View style={{ paddingHorizontal: 12, paddingBottom: insets.bottom + 12, paddingTop: 8, gap: 6 }}>
            {aviso ? <Text style={{ color: '#fff', textAlign: 'center' }}>{aviso}</Text> : null}
            {mia ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>👁 {historia.vistas.length} {historia.vistas.length === 1 ? 'vista' : 'vistas'} · ♥ {historia.meGusta.length}</Text>
                <View style={{ flex: 1 }} />
                <Pressable onPress={() => router.push({ pathname: '/crear', params: { modo: 'historia' } })} accessibilityRole="button">
                  <Text style={{ color: '#fff', fontWeight: '800' }}>＋ Otra</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    store.borrarHistoria(historia.id);
                    cerrar();
                  }}
                  accessibilityRole="button"
                >
                  <Text style={{ color: '#fff', fontWeight: '800' }}>🗑 Borrar</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TextInput
                  value={respuesta}
                  onChangeText={setRespuesta}
                  onFocus={() => {
                    escribiendo.current = true;
                    setPausa(true);
                  }}
                  onBlur={() => {
                    escribiendo.current = false;
                    setPausa(false);
                  }}
                  onSubmitEditing={enviar}
                  placeholder={`Responder a ${autor.usuario}…`}
                  placeholderTextColor="rgba(255,255,255,0.75)"
                  accessibilityLabel="Responder a la historia"
                  maxLength={300}
                  style={{ flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 15 }}
                />
                <Pressable onPress={() => store.meGustaHistoria(historia.id)} accessibilityLabel="Me gusta" hitSlop={8}>
                  <Text style={{ fontSize: 28, color: meGusta ? color.meGusta : '#fff' }}>{meGusta ? '♥' : '♡'}</Text>
                </Pressable>
                {respuesta ? (
                  <Pressable onPress={enviar} accessibilityLabel="Enviar">
                    <Text style={{ color: '#fff', fontWeight: '800' }}>Enviar</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}
