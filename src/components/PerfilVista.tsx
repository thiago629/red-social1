import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { color } from '../lib/config';
import { elegirFotos } from '../lib/fotos';
import { MOTIVOS_DENUNCIA } from '../lib/moderacion';
import * as store from '../lib/store';
import { Publicacion } from './Publicacion';
import { Avatar, Boton, Campo, Chip, Fila, Pantalla, Parrafo, TextoRico } from './ui';

type Pestana = 'publicaciones' | 'respuestas' | 'megusta' | 'guardados';

export function PerfilVista({ id }: { id: string }) {
  store.useVersion();
  const estado = store.get();
  const yo = estado.sesionId ?? '';
  const p = store.perfil(id);
  const [pestana, setPestana] = useState<Pestana>('publicaciones');
  const [editando, setEditando] = useState(false);
  const [menu, setMenu] = useState<'nada' | 'opciones' | 'denunciar' | 'hecho'>('nada');
  const [form, setForm] = useState({ nombre: '', bio: '', ubicacion: '', web: '' });
  const [aviso, setAviso] = useState('');
  if (!p) return <Pantalla><Parrafo suave>Esta cuenta no existe.</Parrafo></Pantalla>;

  const esYo = id === yo;
  const sigo = store.sigueA(yo, id);
  const pedido = store.haSolicitado(id);
  const bloqueado = (estado.bloqueados[yo] ?? []).includes(id);
  const meBloquea = (estado.bloqueados[id] ?? []).includes(yo);
  const silenciado = (estado.silenciados[yo] ?? []).includes(id);
  const meSigue = store.sigueA(id, yo);
  const siguiendo = (estado.sigue[id] ?? []).length;
  const seguidores = Object.values(estado.sigue).filter((l) => l.includes(id)).length;
  const puedoVer = store.puedeVerPerfil(id);

  const lista = (() => {
    if (!puedoVer) return [];
    const vis = estado.publicaciones.filter((x) => !x.oculta && !store.hayBloqueo(yo, x.autorId));
    if (pestana === 'publicaciones') return vis.filter((x) => x.autorId === id || x.compartidos.includes(id)).sort((a, b) => b.creado - a.creado);
    if (pestana === 'respuestas') return vis.filter((x) => x.respuestas.some((r) => r.autorId === id));
    if (pestana === 'megusta') return p.privacidad.ocultarMeGusta && !esYo ? [] : vis.filter((x) => x.meGusta.includes(id));
    return esYo ? vis.filter((x) => x.guardados.includes(id)) : [];
  })();

  const empezarEdicion = () => {
    setForm({ nombre: p.nombre, bio: p.bio, ubicacion: p.ubicacion, web: p.web });
    setEditando(true);
  };

  const cambiarFoto = async () => {
    try {
      const [f] = await elegirFotos(1, true);
      if (f) store.editarPerfil({ foto: f });
    } catch {
      setAviso('No se ha podido cargar la foto.');
    }
  };

  const escribir = () => {
    const cid = store.abrirConversacion(id);
    if (cid) router.push(`/chat/${cid}`);
    else setAviso('Esta persona no acepta mensajes tuyos por su configuración de privacidad.');
  };

  return (
    <Pantalla>
      <View style={{ height: 120, backgroundColor: '#CFD9DE', marginHorizontal: -16, marginTop: -16 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -50 }}>
        <Pressable onPress={esYo ? cambiarFoto : undefined} disabled={!esYo} accessibilityLabel={esYo ? 'Cambiar foto de perfil' : undefined}>
          <View style={{ borderWidth: 4, borderColor: color.papel, borderRadius: 60 }}>
            <Avatar nombre={p.nombre} foto={p.foto} tam={96} />
          </View>
          {esYo ? <Text style={{ color: color.acento, fontSize: 12, textAlign: 'center', fontWeight: '700' }}>Cambiar foto</Text> : null}
        </Pressable>
        <Fila>
          {esYo ? (
            <Boton pequeño tipo="secundario" texto={editando ? 'Cancelar' : 'Editar perfil'} onPress={() => (editando ? setEditando(false) : empezarEdicion())} />
          ) : meBloquea ? null : bloqueado ? (
            <Boton pequeño tipo="peligro" texto="Desbloquear" onPress={() => store.bloquear(id)} />
          ) : (
            <>
              <Pressable onPress={() => setMenu(menu === 'nada' ? 'opciones' : 'nada')} accessibilityLabel="Más opciones" style={{ borderWidth: 1, borderColor: color.bordeFuerte, borderRadius: 999, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: color.tinta }}>⋯</Text>
              </Pressable>
              <Pressable onPress={escribir} accessibilityLabel="Enviar mensaje" style={{ borderWidth: 1, borderColor: color.bordeFuerte, borderRadius: 999, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: color.tinta }}>✉</Text>
              </Pressable>
              <Boton pequeño tipo={sigo || pedido ? 'secundario' : 'negro'} texto={sigo ? 'Siguiendo' : pedido ? 'Pendiente' : 'Seguir'} onPress={() => store.seguir(id)} />
            </>
          )}
        </Fila>
      </View>

      {menu === 'opciones' ? (
        <View style={{ borderWidth: 1, borderColor: color.borde, borderRadius: 12, padding: 8, gap: 4 }}>
          <Boton tipo="texto" texto={silenciado ? `Quitar silencio a @${p.usuario}` : `Silenciar a @${p.usuario}`} onPress={() => { store.silenciar(id); setMenu('nada'); }} />
          <Boton tipo="texto" texto={`Bloquear a @${p.usuario}`} onPress={() => { store.bloquear(id); setMenu('nada'); }} />
          {meSigue ? <Boton tipo="texto" texto="Eliminar de mis seguidores" onPress={() => { store.quitarSeguidor(id); setMenu('nada'); }} /> : null}
          <Boton tipo="texto" texto={`Denunciar a @${p.usuario}`} onPress={() => setMenu('denunciar')} />
        </View>
      ) : null}
      {menu === 'denunciar' ? (
        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: '700', color: color.tinta }}>¿Qué pasa con esta cuenta?</Text>
          <Fila>
            {MOTIVOS_DENUNCIA.map((m) => (
              <Chip key={m} texto={m} onPress={() => { store.denunciar('usuario', id, m); setMenu('hecho'); }} />
            ))}
          </Fila>
        </View>
      ) : null}
      {menu === 'hecho' ? <Text style={{ color: color.ok }}>Gracias. Revisaremos la cuenta.</Text> : null}
      {aviso ? <Text style={{ color: color.peligro }}>{aviso}</Text> : null}

      {editando ? (
        <View style={{ gap: 12 }}>
          <Campo etiqueta="Nombre" value={form.nombre} onChangeText={(t) => setForm({ ...form, nombre: t })} maxLength={50} />
          <Campo etiqueta="Biografía" value={form.bio} onChangeText={(t) => setForm({ ...form, bio: t })} multiline maxLength={160} />
          <Campo etiqueta="Ubicación" value={form.ubicacion} onChangeText={(t) => setForm({ ...form, ubicacion: t })} maxLength={30} />
          <Campo etiqueta="Web" value={form.web} onChangeText={(t) => setForm({ ...form, web: t })} autoCapitalize="none" maxLength={100} />
          <Fila>
            <Boton tipo="negro" texto="Guardar" onPress={() => { store.editarPerfil({ ...form, nombre: form.nombre.trim() || p.nombre }); setEditando(false); }} />
            {p.foto ? <Boton tipo="texto" texto="Quitar foto" onPress={() => store.editarPerfil({ foto: undefined })} /> : null}
          </Fila>
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          <View>
            <Text style={{ fontSize: 21, fontWeight: '800', color: color.tinta }}>
              {p.nombre}
              {p.privacidad.privado ? ' 🔒' : ''}
            </Text>
            <Text style={{ color: color.suave }}>
              @{p.usuario}
              {p.ejemplo ? ' · cuenta de ejemplo' : ''}
              {!esYo && meSigue ? ' · Te sigue' : ''}
            </Text>
          </View>
          {p.bio ? <TextoRico texto={p.bio} style={{ color: color.tinta, fontSize: 15, lineHeight: 21 }} /> : null}
          <Text style={{ color: color.suave }}>
            {p.ubicacion ? `📍 ${p.ubicacion}   ` : ''}
            {p.web ? `🔗 ${p.web}   ` : ''}
            📅 Se unió en {new Date(p.creado).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </Text>
          <Text style={{ color: color.suave }}>
            <Text style={{ fontWeight: '800', color: color.tinta }}>{siguiendo}</Text> Siguiendo{'   '}
            <Text style={{ fontWeight: '800', color: color.tinta }}>{seguidores}</Text> Seguidores
          </Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', marginHorizontal: -16, borderBottomWidth: 1, borderBottomColor: color.borde }}>
        {(
          [
            ['publicaciones', 'Posts'],
            ['respuestas', 'Respuestas'],
            ['megusta', 'Me gusta'],
            ...(esYo ? [['guardados', 'Guardados']] : []),
          ] as [Pestana, string][]
        ).map(([k, t]) => (
          <Pressable key={k} onPress={() => setPestana(k)} accessibilityRole="tab" accessibilityState={{ selected: pestana === k }} style={{ flex: 1, alignItems: 'center', paddingTop: 12 }}>
            <Text style={{ fontWeight: pestana === k ? '800' : '500', color: pestana === k ? color.tinta : color.suave, paddingBottom: 10 }}>{t}</Text>
            <View style={{ height: 4, width: 48, borderRadius: 2, backgroundColor: pestana === k ? color.acento : 'transparent' }} />
          </Pressable>
        ))}
      </View>

      {!puedoVer ? (
        <View style={{ gap: 6, paddingVertical: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: color.tinta }}>
            {meBloquea ? 'No puedes ver esta cuenta' : bloqueado ? `Has bloqueado a @${p.usuario}` : 'Esta cuenta es privada'}
          </Text>
          <Parrafo suave>{meBloquea || bloqueado ? 'No veréis las publicaciones del otro.' : 'Solo la gente que aprueba puede ver lo que publica. Pulsa Seguir para enviar una solicitud.'}</Parrafo>
        </View>
      ) : lista.length === 0 ? (
        <Parrafo suave>
          {pestana === 'megusta' && p.privacidad.ocultarMeGusta && !esYo ? 'Esta persona tiene sus me gusta ocultos.' : 'Todavía no hay nada aquí.'}
        </Parrafo>
      ) : (
        lista.map((x) => <Publicacion key={x.id} publicacion={x} compartidoPor={pestana === 'publicaciones' && x.autorId !== id ? id : undefined} />)
      )}
    </Pantalla>
  );
}
