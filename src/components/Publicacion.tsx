import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { color } from '../lib/config';
import { dominio, MOTIVOS_DENUNCIA } from '../lib/moderacion';
import * as store from '../lib/store';
import type { Publicacion as TPublicacion } from '../lib/tipos';
import { ConFiltro, Foto } from './Medios';
import { idTikTok, TikTok } from './TikTok';
import { Avatar, Boton, Chip, Fila, TextoRico, haceCuanto } from './ui';

type Props = { publicacion: TPublicacion; motivos?: string[]; compartidoPor?: string; detalle?: boolean };

export function Publicacion({ publicacion: p, motivos, compartidoPor, detalle }: Props) {
  const yo = store.get().sesionId ?? '';
  const autor = store.perfil(p.autorId);
  const [panel, setPanel] = useState<'nada' | 'opciones' | 'porque' | 'denunciar' | 'denunciada'>('nada');
  const [motivo, setMotivo] = useState('');
  const [detalleDenuncia, setDetalleDenuncia] = useState('');
  const [mostrarSensible, setMostrarSensible] = useState(false);
  if (!autor) return null;

  const meGusta = p.meGusta.includes(yo);
  const compartido = p.compartidos.includes(yo);
  const guardado = p.guardados.includes(yo);
  const esMia = p.autorId === yo;
  const sigo = store.sigueA(yo, autor.id);
  const tapado = p.sensible && !mostrarSensible && !store.puedeVerSensible() && !esMia;
  const quienCompartio = compartidoPor ? store.perfil(compartidoPor) : undefined;
  const abrir = detalle ? undefined : () => router.push(`/post/${p.id}`);

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: color.borde, paddingVertical: 12, paddingHorizontal: 16, marginHorizontal: -16, gap: 6 }}>
      {quienCompartio ? (
        <Text style={{ color: color.suave, fontSize: 13, fontWeight: '700', marginLeft: 52 }}>↻ {quienCompartio.nombre} lo compartió</Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Pressable onPress={() => router.push(`/usuario/${autor.id}`)} accessibilityRole="link" accessibilityLabel={`Perfil de ${autor.nombre}`}>
          <Avatar nombre={autor.nombre} foto={autor.foto} />
        </Pressable>
        <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ flexShrink: 1, color: color.suave, fontSize: 15 }} numberOfLines={1}>
              <Text style={{ fontWeight: '700', color: color.tinta }}>{autor.nombre}</Text>
              {autor.privacidad.privado ? ' 🔒' : ''} @{autor.usuario} · {haceCuanto(p.creado)}
              {autor.ejemplo ? ' · ejemplo' : ''}
            </Text>
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={() => setPanel(panel === 'nada' ? 'opciones' : 'nada')}
              accessibilityLabel="Más opciones"
              hitSlop={10}
              style={{ paddingHorizontal: 4 }}
            >
              <Text style={{ fontSize: 18, color: color.suave }}>⋯</Text>
            </Pressable>
          </View>

          {tapado ? (
            <Pressable
              onPress={() => setMostrarSensible(true)}
              style={{ backgroundColor: color.gris, borderRadius: 16, padding: 16, gap: 4, borderWidth: 1, borderColor: color.borde }}
            >
              <Text style={{ fontWeight: '700', color: color.tinta }}>Contenido sensible</Text>
              <Text style={{ color: color.suave }}>
                El autor lo ha marcado como sensible. Toca para verlo. Puedes mostrarlo siempre en Ajustes &gt; Contenido.
              </Text>
            </Pressable>
          ) : (
            <>
              {p.texto ? (
                <Pressable onPress={abrir} disabled={detalle}>
                  <TextoRico texto={p.texto} style={{ fontSize: detalle ? 18 : 15, lineHeight: detalle ? 25 : 21, color: color.tinta }} />
                </Pressable>
              ) : null}
              {p.fotos.length ? <Fotos fotos={p.fotos} filtro={p.filtro} /> : null}
              {p.video ? <TarjetaReel p={p} /> : null}
            </>
          )}

          {p.encuesta ? <Encuesta p={p} yo={yo} /> : null}

          {p.enlace && idTikTok(p.enlace) ? <TikTok url={p.enlace} /> : null}
          {p.enlace && !idTikTok(p.enlace) ? (
            <Link href={{ pathname: '/enlace', params: { url: p.enlace } }} asChild>
              <Pressable style={{ borderWidth: 1, borderColor: color.borde, borderRadius: 16, padding: 12, gap: 2 }}>
                <Text style={{ color: color.suave, fontSize: 13 }}>{dominio(p.enlace)}</Text>
                <Text style={{ color: color.tinta, fontWeight: '600' }} numberOfLines={1}>
                  {p.enlace}
                </Text>
                <Text style={{ color: color.suave, fontSize: 12 }}>Se abre dentro de la app</Text>
              </Pressable>
            </Link>
          ) : null}

          <Fila style={{ justifyContent: 'space-between', flexWrap: 'nowrap', maxWidth: 420 }}>
            <Accion icono="💬" n={p.respuestas.length} etiqueta="Responder" onPress={() => router.push(`/post/${p.id}`)} />
            <Accion icono="↻" n={p.compartidos.length} etiqueta="Compartir" activo={compartido} tono={color.compartir} onPress={() => store.compartir(p.id)} />
            <Accion icono={meGusta ? '♥' : '♡'} n={p.meGusta.length} etiqueta="Me gusta" activo={meGusta} tono={color.meGusta} onPress={() => store.meGusta(p.id)} />
            <Accion icono={guardado ? '★' : '☆'} etiqueta="Guardar" activo={guardado} tono={color.acento} onPress={() => store.guardar(p.id)} />
          </Fila>

          {panel === 'opciones' ? (
            <View style={{ borderWidth: 1, borderColor: color.borde, borderRadius: 12, overflow: 'hidden' }}>
              {motivos ? <Opcion texto="¿Por qué veo esto?" onPress={() => setPanel('porque')} /> : null}
              {!esMia ? (
                <>
                  <Opcion texto="No me interesa" onPress={() => store.noMeInteresa(p.id)} />
                  <Opcion texto={sigo ? `Dejar de seguir a @${autor.usuario}` : `Seguir a @${autor.usuario}`} onPress={() => { store.seguir(autor.id); setPanel('nada'); }} />
                  <Opcion texto={`Silenciar a @${autor.usuario}`} onPress={() => store.silenciar(autor.id)} />
                  <Opcion texto={`Bloquear a @${autor.usuario}`} onPress={() => store.bloquear(autor.id)} />
                  <Opcion texto="Denunciar publicación" peligro onPress={() => setPanel('denunciar')} />
                </>
              ) : (
                <Opcion texto="Borrar publicación" peligro onPress={() => store.borrarPublicacion(p.id)} />
              )}
              <Opcion texto="Cerrar" onPress={() => setPanel('nada')} />
            </View>
          ) : null}

          {panel === 'porque' && motivos ? (
            <View style={{ gap: 4, backgroundColor: color.gris, borderRadius: 12, padding: 12 }}>
              <Text style={{ fontWeight: '700', color: color.tinta }}>¿Por qué veo esto?</Text>
              {motivos.map((m) => (
                <Text key={m} style={{ color: color.tinta }}>
                  • {m}
                </Text>
              ))}
              <Text style={{ color: color.suave, fontSize: 13 }}>
                Cambia tus temas en Ajustes &gt; Tus intereses, o usa «Siguiendo» para verlo sin algoritmo.
              </Text>
              <Boton tipo="texto" texto="Cerrar" onPress={() => setPanel('nada')} />
            </View>
          ) : null}

          {panel === 'denunciar' ? (
            <View style={{ gap: 8, backgroundColor: color.gris, borderRadius: 12, padding: 12 }}>
              <Text style={{ fontWeight: '700', color: color.tinta }}>¿Qué pasa con esta publicación?</Text>
              <Fila>
                {MOTIVOS_DENUNCIA.map((m) => (
                  <Chip key={m} texto={m} activo={motivo === m} onPress={() => setMotivo(m)} />
                ))}
              </Fila>
              <TextInput
                value={detalleDenuncia}
                onChangeText={setDetalleDenuncia}
                placeholder="Explica por qué (opcional)"
                placeholderTextColor={color.suave}
                multiline
                style={{ borderWidth: 1, borderColor: color.bordeFuerte, borderRadius: 8, padding: 10, color: color.tinta, backgroundColor: color.papel }}
              />
              <Fila>
                <Boton
                  pequeño
                  tipo="peligro"
                  texto="Enviar denuncia"
                  desactivado={!motivo}
                  onPress={() => {
                    store.denunciar('publicacion', p.id, motivo, detalleDenuncia);
                    setPanel('denunciada');
                  }}
                />
                <Boton pequeño tipo="texto" texto="Cancelar" onPress={() => setPanel('nada')} />
              </Fila>
              <Text style={{ color: color.suave, fontSize: 12 }}>Si hay un riesgo para la vida de alguien, llama al 112.</Text>
            </View>
          ) : null}

          {panel === 'denunciada' ? <Text style={{ color: color.ok }}>Gracias. Hemos recibido tu denuncia y la revisará una persona.</Text> : null}
        </View>
      </View>
    </View>
  );
}

// Un reel dentro del inicio: portada con ▶ que abre la pestaña Reels en ese vídeo.
function TarjetaReel({ p }: { p: TPublicacion }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/reels', params: { id: p.id } })}
      accessibilityRole="button"
      accessibilityLabel="Ver reel"
      style={{ width: 220, aspectRatio: 9 / 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' }}
    >
      {p.video?.portada !== undefined ? <Foto uri={p.video.portada} filtro={p.filtro} style={{ width: '100%', height: '100%' }} /> : null}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 24, marginLeft: 4 }}>▶</Text>
        </View>
      </View>
      <Text style={{ position: 'absolute', left: 10, bottom: 8, color: '#fff', fontWeight: '700', fontSize: 13 }}>▷ {formatoNumero(p.vistas ?? 0)} · Reel</Text>
    </Pressable>
  );
}

export function formatoNumero(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')} mil`;
  return String(n);
}

function Fotos({ fotos, filtro }: { fotos: string[]; filtro?: string }) {
  const una = fotos.length === 1;
  return (
    <ConFiltro filtro={filtro} style={{ borderRadius: 16, borderWidth: 1, borderColor: color.borde }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
      {fotos.map((f, i) => (
        <Image
          key={i}
          source={{ uri: f }}
          accessibilityLabel={`Foto ${i + 1}`}
          style={{ width: una ? '100%' : '49.6%', aspectRatio: una ? 4 / 3 : 1, backgroundColor: color.borde }}
          resizeMode="cover"
        />
      ))}
    </View>
    </ConFiltro>
  );
}

function Encuesta({ p, yo }: { p: TPublicacion; yo: string }) {
  const e = p.encuesta!;
  const total = Object.keys(e.votos).length;
  const miVoto = e.votos[yo];
  const cerrada = e.termina <= Date.now();
  const verResultados = miVoto !== undefined || cerrada || p.autorId === yo;
  const quedan = Math.max(0, Math.ceil((e.termina - Date.now()) / 3_600_000));

  return (
    <View style={{ gap: 6 }}>
      {e.opciones.map((o, i) => {
        const n = Object.values(e.votos).filter((v) => v === i).length;
        const pct = total ? Math.round((n / total) * 100) : 0;
        return verResultados ? (
          <View key={i} style={{ borderRadius: 6, overflow: 'hidden', backgroundColor: color.gris }}>
            <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, backgroundColor: miVoto === i ? '#BEE3FC' : color.borde }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8 }}>
              <Text style={{ color: color.tinta, fontWeight: miVoto === i ? '700' : '400' }}>
                {o} {miVoto === i ? '✓' : ''}
              </Text>
              <Text style={{ color: color.tinta, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{pct} %</Text>
            </View>
          </View>
        ) : (
          <Pressable
            key={i}
            onPress={() => store.votar(p.id, i)}
            accessibilityRole="button"
            style={{ borderWidth: 1, borderColor: color.acento, borderRadius: 999, padding: 8, alignItems: 'center' }}
          >
            <Text style={{ color: color.acento, fontWeight: '700' }}>{o}</Text>
          </Pressable>
        );
      })}
      <Text style={{ color: color.suave, fontSize: 13 }}>
        {total} {total === 1 ? 'voto' : 'votos'} · {cerrada ? 'Encuesta cerrada' : quedan > 24 ? `Quedan ${Math.ceil(quedan / 24)} días` : `Quedan ${quedan} h`}
      </Text>
    </View>
  );
}

function Accion({ icono, n, etiqueta, onPress, activo, tono }: { icono: string; n?: number; etiqueta: string; onPress: () => void; activo?: boolean; tono?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={etiqueta} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, minWidth: 48 }}>
      <Text style={{ fontSize: 16, color: activo ? tono : color.suave }}>{icono}</Text>
      {n ? <Text style={{ color: activo ? tono : color.suave, fontSize: 13, fontVariant: ['tabular-nums'] }}>{n}</Text> : null}
    </Pressable>
  );
}

function Opcion({ texto, onPress, peligro }: { texto: string; onPress: () => void; peligro?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [{ paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: color.borde }, pressed && { backgroundColor: color.gris }]}
    >
      <Text style={{ color: peligro ? color.peligro : color.tinta, fontSize: 15, fontWeight: '600' }}>{texto}</Text>
    </Pressable>
  );
}
