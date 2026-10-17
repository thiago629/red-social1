import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { EDAD_SENSIBLE } from './config';
import { ESQUEMA, privacidadInicial, semilla } from './semilla';
import type {
  Aviso,
  Conversacion,
  DatosPrivados,
  Denuncia,
  Encuesta,
  Historia,
  Notificaciones,
  Perfil,
  Privacidad,
  Publicacion,
  Quien,
  Video,
} from './tipos';

// Datos de la app en modo prueba: viven en el dispositivo.
// Los componentes se suscriben al número de versión (un primitivo) y leen el estado con get().
const CLAVE = 'plazzo:estado';

let estado = semilla();
const oyentes = new Set<() => void>();

function emitir() {
  estado = { ...estado, version: estado.version + 1 };
  oyentes.forEach((o) => o());
  AsyncStorage.setItem(CLAVE, JSON.stringify(estado)).catch(() => {});
}

function suscribir(o: () => void) {
  oyentes.add(o);
  return () => oyentes.delete(o);
}

export function get() {
  return estado;
}

export function useVersion() {
  return useSyncExternalStore(
    suscribir,
    () => estado.version,
    () => estado.version,
  );
}

export async function cargar() {
  try {
    const guardado = await AsyncStorage.getItem(CLAVE);
    if (guardado) {
      const leido = JSON.parse(guardado);
      // Si cambió la forma de los datos, empezamos de cero con los ejemplos.
      if (leido.esquema === ESQUEMA) {
        estado = leido;
        oyentes.forEach((o) => o());
      }
    }
  } catch {
    // Sin almacenamiento: seguimos con los datos de ejemplo.
  }
}

const nuevoId = () => Math.random().toString(36).slice(2, 10);
const alternar = (lista: string[], id: string) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]);

// ---------- Lecturas ----------

export function yo() {
  return estado.perfiles.find((p) => p.id === estado.sesionId) ?? null;
}

export function perfil(id: string) {
  return estado.perfiles.find((p) => p.id === id);
}

export function perfilPorUsuario(usuario: string) {
  return estado.perfiles.find((p) => p.usuario === usuario.toLowerCase());
}

export function misPrivados() {
  return estado.privados.find((p) => p.usuarioId === estado.sesionId) ?? null;
}

export function edad(nacimiento: string) {
  const [a, m, d] = nacimiento.split('-').map(Number);
  const hoy = new Date();
  let e = hoy.getFullYear() - a;
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) e--;
  return e;
}

export function puedeVerSensible() {
  const p = misPrivados();
  return !!p && p.verSensible && edad(p.nacimiento) >= EDAD_SENSIBLE;
}

export function sigueA(quien: string, aQuien: string) {
  return (estado.sigue[quien] ?? []).includes(aQuien);
}

export function hayBloqueo(a: string, b: string) {
  return (estado.bloqueados[a] ?? []).includes(b) || (estado.bloqueados[b] ?? []).includes(a);
}

function permite(regla: Quien, dueño: string, otro: string) {
  if (dueño === otro) return true;
  if (hayBloqueo(dueño, otro)) return false;
  if (regla === 'todos') return true;
  if (regla === 'seguidos') return sigueA(dueño, otro);
  return false;
}

export function puedeEscribirA(otro: string) {
  const id = estado.sesionId;
  const p = perfil(otro);
  if (!id || !p) return false;
  // Si ya hay conversación y no hay bloqueo, se puede seguir hablando.
  const yaHablan = estado.conversaciones.some((c) => c.miembros.includes(id) && c.miembros.includes(otro));
  return (yaHablan && !hayBloqueo(id, otro)) || permite(p.privacidad.quienEscribe, otro, id);
}

export function puedeResponder(pub: Publicacion) {
  const id = estado.sesionId;
  if (!id) return false;
  if (hayBloqueo(id, pub.autorId)) return false;
  if (pub.autorId === id || pub.quienResponde === 'todos') return true;
  if (pub.quienResponde === 'seguidos') return sigueA(pub.autorId, id);
  const usuario = yo()?.usuario;
  return !!usuario && pub.texto.toLowerCase().includes(`@${usuario}`);
}

export function puedeVerPerfil(otro: string) {
  const id = estado.sesionId ?? '';
  const p = perfil(otro);
  if (!p) return false;
  if (otro === id) return true;
  if (hayBloqueo(id, otro)) return false;
  return !p.privacidad.privado || sigueA(id, otro);
}

// ---------- Avisos ----------

function avisar(paraId: string, tipo: Aviso['tipo'], texto: string, publicacionId?: string) {
  const deId = estado.sesionId ?? undefined;
  if (paraId === deId) return;
  if (deId && hayBloqueo(paraId, deId)) return;
  const prefs = estado.privados.find((p) => p.usuarioId === paraId)?.notificaciones;
  if (prefs && tipo !== 'sistema' && !prefs[tipo]) return;
  const aviso: Aviso = { id: nuevoId(), paraId, tipo, texto, publicacionId, deId, creado: Date.now(), leido: false };
  estado.avisos = [aviso, ...estado.avisos];
}

function avisoSistema(paraId: string, texto: string) {
  estado.avisos = [{ id: nuevoId(), paraId, tipo: 'sistema', texto, creado: Date.now(), leido: false }, ...estado.avisos];
}

export function leerAvisos() {
  const id = estado.sesionId;
  if (!estado.avisos.some((a) => a.paraId === id && !a.leido)) return;
  estado.avisos = estado.avisos.map((a) => (a.paraId === id ? { ...a, leido: true } : a));
  emitir();
}

// ---------- Cuenta ----------

export type Registro = {
  nombre: string;
  usuario: string;
  email: string;
  nacimiento: string;
  anunciosPersonalizados: boolean;
  correoNovedades: boolean;
};

const notificacionesIniciales = (correoNovedades: boolean): Notificaciones => ({
  meGusta: true,
  respuestas: true,
  menciones: true,
  seguidores: true,
  compartidos: true,
  mensajes: true,
  correoNovedades,
});

export function registrar(datos: Registro) {
  const usuario = datos.usuario.trim().replace(/^@/, '').toLowerCase();
  const email = datos.email.trim().toLowerCase();
  if (estado.perfiles.some((p) => p.usuario === usuario)) return 'Ese nombre de usuario ya existe.';
  if (estado.privados.some((p) => p.email === email)) return 'Ya hay una cuenta con ese correo.';
  const id = nuevoId();
  const ahora = Date.now();
  const nuevo: Perfil = {
    id,
    usuario,
    nombre: datos.nombre.trim(),
    bio: '',
    ubicacion: '',
    web: '',
    intereses: [],
    verTodo: false,
    interesesElegidos: false,
    privacidad: { ...privacidadInicial },
    creado: ahora,
  };
  const privados: DatosPrivados = {
    usuarioId: id,
    email,
    nacimiento: datos.nacimiento,
    anunciosPersonalizados: datos.anunciosPersonalizados,
    verSensible: false,
    palabrasSilenciadas: [],
    notificaciones: notificacionesIniciales(datos.correoNovedades),
    dosPasos: false,
    alertasInicio: true,
    aceptoTerminos: ahora,
    consentimientos: [
      { tipo: 'terminos', aceptado: true, creado: ahora },
      { tipo: 'anuncios_personalizados', aceptado: datos.anunciosPersonalizados, creado: ahora },
      { tipo: 'correo_novedades', aceptado: datos.correoNovedades, creado: ahora },
    ],
  };
  estado.perfiles = [...estado.perfiles, nuevo];
  estado.privados = [...estado.privados, privados];
  estado.sigue = { ...estado.sigue, [id]: [] };
  estado.sesionId = id;
  avisoSistema(id, 'Bienvenido. Tus datos privados (correo y fecha de nacimiento) se guardan aparte de tu perfil público y nadie más puede verlos.');
  emitir();
  return null;
}

export function entrarComo(email: string) {
  const p = estado.privados.find((x) => x.email === email.trim().toLowerCase());
  if (!p) return 'No hay ninguna cuenta con ese correo en este dispositivo.';
  estado.sesionId = p.usuarioId;
  if (p.alertasInicio) avisoSistema(p.usuarioId, 'Nuevo inicio de sesión en este dispositivo. Si no has sido tú, cambia la contraseña.');
  emitir();
  return null;
}

export function salir() {
  estado.sesionId = null;
  emitir();
}

export function elegirIntereses(intereses: string[], verTodo: boolean) {
  editarPerfil({ intereses, verTodo, interesesElegidos: true });
}

export function editarPerfil(
  cambios: Partial<Pick<Perfil, 'nombre' | 'bio' | 'ubicacion' | 'web' | 'foto' | 'intereses' | 'verTodo' | 'interesesElegidos'>>,
) {
  const id = estado.sesionId;
  estado.perfiles = estado.perfiles.map((p) => (p.id === id ? { ...p, ...cambios } : p));
  emitir();
}

export function cambiarUsuario(nuevo: string) {
  const usuario = nuevo.trim().replace(/^@/, '').toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(usuario)) return 'De 3 a 20 letras, números o guiones bajos.';
  if (estado.perfiles.some((p) => p.usuario === usuario && p.id !== estado.sesionId)) return 'Ese nombre de usuario ya existe.';
  estado.perfiles = estado.perfiles.map((p) => (p.id === estado.sesionId ? { ...p, usuario } : p));
  emitir();
  return null;
}

export function cambiarPrivacidad(cambios: Partial<Privacidad>) {
  const id = estado.sesionId;
  estado.perfiles = estado.perfiles.map((p) => (p.id === id ? { ...p, privacidad: { ...p.privacidad, ...cambios } } : p));
  // Al pasar a cuenta pública se aceptan las solicitudes pendientes.
  if (cambios.privado === false && id) {
    for (const quien of estado.solicitudes[id] ?? []) {
      estado.sigue = { ...estado.sigue, [quien]: [...new Set([...(estado.sigue[quien] ?? []), id])] };
    }
    estado.solicitudes = { ...estado.solicitudes, [id]: [] };
  }
  emitir();
}

const CON_CONSENTIMIENTO = ['anunciosPersonalizados', 'verSensible'] as const;

export function cambiarPrivados(cambios: Partial<Omit<DatosPrivados, 'usuarioId' | 'nacimiento' | 'consentimientos'>>) {
  const id = estado.sesionId;
  const ahora = Date.now();
  estado.privados = estado.privados.map((p) => {
    if (p.usuarioId !== id) return p;
    const consentimientos = [...p.consentimientos];
    for (const k of CON_CONSENTIMIENTO) {
      if (k in cambios) consentimientos.push({ tipo: k, aceptado: !!cambios[k], creado: ahora });
    }
    if (cambios.notificaciones && cambios.notificaciones.correoNovedades !== p.notificaciones.correoNovedades) {
      consentimientos.push({ tipo: 'correo_novedades', aceptado: cambios.notificaciones.correoNovedades, creado: ahora });
    }
    return { ...p, ...cambios, consentimientos };
  });
  emitir();
}

export function cambiarCorreo(nuevo: string) {
  const email = nuevo.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'El correo no es válido.';
  if (estado.privados.some((p) => p.email === email && p.usuarioId !== estado.sesionId)) return 'Ese correo ya está en uso.';
  cambiarPrivados({ email });
  return null;
}

// Derecho de acceso y portabilidad (RGPD arts. 15 y 20).
export function exportarMisDatos() {
  const id = estado.sesionId;
  if (!id) return '';
  return JSON.stringify(
    {
      perfil: perfil(id),
      datosPrivados: misPrivados(),
      publicaciones: estado.publicaciones.filter((p) => p.autorId === id),
      respuestas: estado.publicaciones.flatMap((p) => p.respuestas.filter((r) => r.autorId === id)),
      meGusta: estado.publicaciones.filter((p) => p.meGusta.includes(id)).map((p) => p.id),
      guardados: estado.publicaciones.filter((p) => p.guardados.includes(id)).map((p) => p.id),
      sigues: estado.sigue[id] ?? [],
      bloqueados: estado.bloqueados[id] ?? [],
      silenciados: estado.silenciados[id] ?? [],
      mensajes: estado.conversaciones.filter((c) => c.miembros.includes(id)),
      historias: estado.historias.filter((h) => h.autorId === id),
      denunciasHechas: estado.denuncias.filter((d) => d.denuncianteId === id),
      cookies: estado.cookies,
      exportado: new Date().toISOString(),
    },
    null,
    2,
  );
}

// Derecho de supresión (RGPD art. 17) y guía 5.1.1(v) de Apple: borrar la cuenta desde la app.
export function borrarCuenta() {
  const id = estado.sesionId;
  if (!id) return;
  const sin = (l: string[]) => l.filter((x) => x !== id);
  estado.perfiles = estado.perfiles.filter((p) => p.id !== id);
  estado.privados = estado.privados.filter((p) => p.usuarioId !== id);
  estado.publicaciones = estado.publicaciones
    .filter((p) => p.autorId !== id)
    .map((p) => ({
      ...p,
      meGusta: sin(p.meGusta),
      compartidos: sin(p.compartidos),
      guardados: sin(p.guardados),
      noInteresa: sin(p.noInteresa),
      respuestas: p.respuestas.filter((r) => r.autorId !== id),
      encuesta: p.encuesta
        ? { ...p.encuesta, votos: Object.fromEntries(Object.entries(p.encuesta.votos).filter(([k]) => k !== id)) }
        : undefined,
    }));
  const sinMi = (r: Record<string, string[]>) =>
    Object.fromEntries(Object.entries(r).filter(([k]) => k !== id).map(([k, v]) => [k, sin(v)]));
  estado.sigue = sinMi(estado.sigue);
  estado.solicitudes = sinMi(estado.solicitudes);
  estado.bloqueados = sinMi(estado.bloqueados);
  estado.silenciados = sinMi(estado.silenciados);
  estado.avisos = estado.avisos.filter((a) => a.paraId !== id && a.deId !== id);
  estado.denuncias = estado.denuncias.filter((d) => d.denuncianteId !== id);
  estado.conversaciones = estado.conversaciones.filter((c) => !c.miembros.includes(id));
  estado.historias = estado.historias
    .filter((h) => h.autorId !== id)
    .map((h) => ({ ...h, vistas: sin(h.vistas), meGusta: sin(h.meGusta) }));
  estado.sesionId = null;
  emitir();
}

// ---------- Publicaciones ----------

export type NuevaPublicacion = {
  texto: string;
  fotos: string[];
  enlace?: string;
  encuesta?: { opciones: string[]; dias: number };
  sensible: boolean;
  quienResponde: Publicacion['quienResponde'];
  temas: string[];
  filtro?: string;
  video?: Video;
  reel?: boolean;
};

function menciones(texto: string) {
  return [...new Set([...texto.matchAll(/@([a-z0-9_]{3,20})/gi)].map((m) => m[1].toLowerCase()))];
}

function avisarMenciones(texto: string, pid: string) {
  const id = estado.sesionId ?? '';
  for (const usuario of menciones(texto)) {
    const p = perfilPorUsuario(usuario);
    if (p && permite(p.privacidad.quienMenciona, p.id, id)) {
      avisar(p.id, 'menciones', `@${yo()?.usuario} te ha mencionado: "${texto.slice(0, 80)}"`, pid);
    }
  }
}

export function publicar(n: NuevaPublicacion) {
  const id = estado.sesionId;
  if (!id) return;
  const encuesta: Encuesta | undefined = n.encuesta
    ? { opciones: n.encuesta.opciones, votos: {}, termina: Date.now() + n.encuesta.dias * 24 * 3_600_000 }
    : undefined;
  const p: Publicacion = {
    id: nuevoId(),
    autorId: id,
    texto: n.texto.trim(),
    fotos: n.fotos,
    filtro: n.filtro,
    video: n.video,
    reel: n.reel,
    vistas: n.reel ? 0 : undefined,
    enlace: n.enlace,
    encuesta,
    sensible: n.sensible,
    quienResponde: n.quienResponde,
    temas: n.temas,
    creado: Date.now(),
    meGusta: [],
    compartidos: [],
    guardados: [],
    respuestas: [],
    noInteresa: [],
    denuncias: 0,
    oculta: false,
  };
  estado.publicaciones = [p, ...estado.publicaciones];
  avisarMenciones(p.texto, p.id);
  emitir();
  return p.id;
}

export function votar(pid: string, opcion: number) {
  const id = estado.sesionId;
  if (!id) return;
  cambiarPublicacion(pid, (x) =>
    x.encuesta && !(id in x.encuesta.votos) && x.encuesta.termina > Date.now()
      ? { ...x, encuesta: { ...x.encuesta, votos: { ...x.encuesta.votos, [id]: opcion } } }
      : x,
  );
  emitir();
}

function cambiarPublicacion(id: string, cambio: (p: Publicacion) => Publicacion) {
  estado.publicaciones = estado.publicaciones.map((p) => (p.id === id ? cambio(p) : p));
}

export function meGusta(pid: string) {
  const id = estado.sesionId;
  if (!id) return;
  const p = estado.publicaciones.find((x) => x.id === pid);
  if (p && !p.meGusta.includes(id)) avisar(p.autorId, 'meGusta', `A @${yo()?.usuario} le gusta tu publicación.`, pid);
  cambiarPublicacion(pid, (x) => ({ ...x, meGusta: alternar(x.meGusta, id) }));
  emitir();
}

export function compartir(pid: string) {
  const id = estado.sesionId;
  if (!id) return;
  const p = estado.publicaciones.find((x) => x.id === pid);
  if (p && !p.compartidos.includes(id)) avisar(p.autorId, 'compartidos', `@${yo()?.usuario} ha compartido tu publicación.`, pid);
  cambiarPublicacion(pid, (x) => ({ ...x, compartidos: alternar(x.compartidos, id) }));
  emitir();
}

export function guardar(pid: string) {
  const id = estado.sesionId;
  if (!id) return;
  cambiarPublicacion(pid, (x) => ({ ...x, guardados: alternar(x.guardados, id) }));
  emitir();
}

export function responder(pid: string, texto: string) {
  const id = estado.sesionId;
  const p = estado.publicaciones.find((x) => x.id === pid);
  if (!id || !p || !texto.trim() || !puedeResponder(p)) return;
  avisar(p.autorId, 'respuestas', `@${yo()?.usuario} te ha respondido: "${texto.trim().slice(0, 60)}"`, pid);
  cambiarPublicacion(pid, (x) => ({
    ...x,
    respuestas: [...x.respuestas, { id: nuevoId(), autorId: id, texto: texto.trim(), creado: Date.now() }],
  }));
  avisarMenciones(texto, pid);
  emitir();
}

export function borrarRespuesta(pid: string, rid: string) {
  const id = estado.sesionId;
  cambiarPublicacion(pid, (x) => ({ ...x, respuestas: x.respuestas.filter((r) => !(r.id === rid && r.autorId === id)) }));
  emitir();
}

export function noMeInteresa(pid: string) {
  const id = estado.sesionId;
  if (!id) return;
  cambiarPublicacion(pid, (x) => ({ ...x, noInteresa: [...new Set([...x.noInteresa, id])] }));
  emitir();
}

export function borrarPublicacion(pid: string) {
  estado.publicaciones = estado.publicaciones.filter((p) => !(p.id === pid && p.autorId === estado.sesionId));
  emitir();
}

// Denuncias (guía 1.2 de Apple y DSA art. 16). Con 3 denuncias la publicación se oculta hasta revisarla.
export function denunciar(tipo: Denuncia['tipo'], objetoId: string, motivo: string, detalle = '') {
  const id = estado.sesionId;
  if (!id) return;
  if (estado.denuncias.some((d) => d.objetoId === objetoId && d.denuncianteId === id)) return;
  estado.denuncias = [
    { id: nuevoId(), tipo, objetoId, denuncianteId: id, motivo, detalle, creado: Date.now(), estado: 'pendiente' },
    ...estado.denuncias,
  ];
  if (tipo === 'publicacion') {
    cambiarPublicacion(objetoId, (x) => ({ ...x, denuncias: x.denuncias + 1, oculta: x.denuncias + 1 >= 3 }));
  }
  avisoSistema(id, `Hemos recibido tu denuncia (${motivo}). La revisará una persona del equipo y te avisaremos de lo que decidamos.`);
  emitir();
}

// ---------- Personas ----------

export function seguir(otro: string) {
  const id = estado.sesionId;
  const p = perfil(otro);
  if (!id || !p || id === otro || hayBloqueo(id, otro)) return;
  const lista = estado.sigue[id] ?? [];
  if (lista.includes(otro)) {
    estado.sigue = { ...estado.sigue, [id]: lista.filter((x) => x !== otro) };
  } else if (p.privacidad.privado) {
    // Cuenta privada: se envía una solicitud que el otro acepta o rechaza.
    estado.solicitudes = { ...estado.solicitudes, [otro]: alternar(estado.solicitudes[otro] ?? [], id) };
    if ((estado.solicitudes[otro] ?? []).includes(id)) avisar(otro, 'seguidores', `@${yo()?.usuario} quiere seguirte.`);
  } else {
    estado.sigue = { ...estado.sigue, [id]: [...lista, otro] };
    avisar(otro, 'seguidores', `@${yo()?.usuario} ha empezado a seguirte.`);
  }
  emitir();
}

export function haSolicitado(otro: string) {
  return (estado.solicitudes[otro] ?? []).includes(estado.sesionId ?? '');
}

export function responderSolicitud(quien: string, aceptar: boolean) {
  const id = estado.sesionId;
  if (!id) return;
  estado.solicitudes = { ...estado.solicitudes, [id]: (estado.solicitudes[id] ?? []).filter((x) => x !== quien) };
  if (aceptar) estado.sigue = { ...estado.sigue, [quien]: [...new Set([...(estado.sigue[quien] ?? []), id])] };
  emitir();
}

export function quitarSeguidor(quien: string) {
  const id = estado.sesionId;
  if (!id) return;
  estado.sigue = { ...estado.sigue, [quien]: (estado.sigue[quien] ?? []).filter((x) => x !== id) };
  emitir();
}

export function bloquear(otro: string) {
  const id = estado.sesionId;
  if (!id || id === otro) return;
  estado.bloqueados = { ...estado.bloqueados, [id]: alternar(estado.bloqueados[id] ?? [], otro) };
  // Bloquear también deja de seguir en los dos sentidos.
  estado.sigue = {
    ...estado.sigue,
    [id]: (estado.sigue[id] ?? []).filter((x) => x !== otro),
    [otro]: (estado.sigue[otro] ?? []).filter((x) => x !== id),
  };
  emitir();
}

export function silenciar(otro: string) {
  const id = estado.sesionId;
  if (!id || id === otro) return;
  estado.silenciados = { ...estado.silenciados, [id]: alternar(estado.silenciados[id] ?? [], otro) };
  emitir();
}

// ---------- Mensajes privados ----------

export function conversacionCon(otro: string) {
  const id = estado.sesionId ?? '';
  return estado.conversaciones.find((c) => c.miembros.length === 2 && c.miembros.includes(id) && c.miembros.includes(otro));
}

export function abrirConversacion(otro: string) {
  const id = estado.sesionId;
  if (!id) return null;
  const existente = conversacionCon(otro);
  if (existente) return existente.id;
  if (!puedeEscribirA(otro)) return null;
  const c: Conversacion = { id: nuevoId(), miembros: [id, otro], mensajes: [], leido: {}, creado: Date.now() };
  estado.conversaciones = [c, ...estado.conversaciones];
  emitir();
  return c.id;
}

export function enviarMensaje(cid: string, texto: string) {
  const id = estado.sesionId;
  const c = estado.conversaciones.find((x) => x.id === cid);
  if (!id || !c || !texto.trim()) return;
  const otro = c.miembros.find((m) => m !== id) ?? '';
  if (hayBloqueo(id, otro)) return;
  const ahora = Date.now();
  estado.conversaciones = estado.conversaciones.map((x) =>
    x.id === cid
      ? { ...x, mensajes: [...x.mensajes, { id: nuevoId(), autorId: id, texto: texto.trim(), creado: ahora }], leido: { ...x.leido, [id]: ahora } }
      : x,
  );
  emitir();

  // Las cuentas de ejemplo contestan una vez para que se vea cómo funciona.
  const p = perfil(otro);
  if (p?.ejemplo && !c.mensajes.some((m) => m.autorId === otro)) {
    setTimeout(() => {
      estado.conversaciones = estado.conversaciones.map((x) =>
        x.id === cid
          ? {
              ...x,
              mensajes: [
                ...x.mensajes,
                { id: nuevoId(), autorId: otro, texto: `¡Hola! Soy ${p.nombre}, una cuenta de ejemplo. Así se ven los mensajes privados 🙂`, creado: Date.now() },
              ],
            }
          : x,
      );
      emitir();
    }, 1200);
  }
}

export function leerConversacion(cid: string) {
  const id = estado.sesionId;
  if (!id) return;
  const c = estado.conversaciones.find((x) => x.id === cid);
  const ultimo = c?.mensajes[c.mensajes.length - 1]?.creado ?? 0;
  if (!c || (c.leido[id] ?? 0) >= ultimo) return;
  estado.conversaciones = estado.conversaciones.map((x) => (x.id === cid ? { ...x, leido: { ...x.leido, [id]: Date.now() } } : x));
  emitir();
}

export function sinLeer(c: Conversacion) {
  const id = estado.sesionId ?? '';
  return c.mensajes.filter((m) => m.autorId !== id && m.creado > (c.leido[id] ?? 0)).length;
}

export function borrarConversacion(cid: string) {
  estado.conversaciones = estado.conversaciones.filter((c) => c.id !== cid);
  emitir();
}

// ---------- Cookies ----------

export function decidirCookies(estadisticas: boolean, publicidad: boolean) {
  estado.cookies = { decidido: true, estadisticas, publicidad };
  emitir();
}

export function reabrirCookies() {
  estado.cookies = { ...estado.cookies, decidido: false };
  emitir();
}

export function reiniciarDemo() {
  estado = { ...semilla(), version: estado.version + 1 };
  emitir();
}

// ---------- Reels e historias ----------

export function verReel(pid: string) {
  cambiarPublicacion(pid, (x) => ({ ...x, vistas: (x.vistas ?? 0) + 1 }));
  emitir();
}

const DIA = 24 * 3_600_000;

export type NuevaHistoria = Pick<Historia, 'tipo' | 'uri' | 'filtro' | 'texto' | 'colorTexto' | 'fondo' | 'duracion'>;

export function publicarHistoria(n: NuevaHistoria) {
  const id = estado.sesionId;
  if (!id) return;
  const h: Historia = { ...n, id: nuevoId(), autorId: id, creado: Date.now(), vistas: [], meGusta: [] };
  estado.historias = [...estado.historias, h];
  emitir();
  return h.id;
}

// Historias de las últimas 24 horas que puedo ver, agrupadas por persona:
// primero las mías, luego las que no he visto y al final las vistas.
export function gruposDeHistorias() {
  const id = estado.sesionId ?? '';
  const desde = Date.now() - DIA;
  const silenciados = new Set(estado.silenciados[id] ?? []);
  const porAutor = new Map<string, Historia[]>();
  for (const h of estado.historias) {
    if (h.creado < desde || hayBloqueo(id, h.autorId) || silenciados.has(h.autorId)) continue;
    if (h.autorId !== id && !puedeVerPerfil(h.autorId)) continue;
    porAutor.set(h.autorId, [...(porAutor.get(h.autorId) ?? []), h]);
  }
  const sigo = new Set(estado.sigue[id] ?? []);
  return [...porAutor.entries()]
    .map(([autorId, historias]) => ({
      autorId,
      historias: historias.sort((a, b) => a.creado - b.creado),
      vistas: historias.every((h) => h.vistas.includes(id)),
    }))
    .sort((a, b) => {
      if (a.autorId === id) return -1;
      if (b.autorId === id) return 1;
      if (a.vistas !== b.vistas) return a.vistas ? 1 : -1;
      if (sigo.has(a.autorId) !== sigo.has(b.autorId)) return sigo.has(a.autorId) ? -1 : 1;
      return b.historias[b.historias.length - 1].creado - a.historias[a.historias.length - 1].creado;
    });
}

function cambiarHistoria(hid: string, f: (h: Historia) => Historia) {
  estado.historias = estado.historias.map((h) => (h.id === hid ? f(h) : h));
}

export function verHistoria(hid: string) {
  const id = estado.sesionId;
  const h = estado.historias.find((x) => x.id === hid);
  if (!id || !h || h.vistas.includes(id)) return;
  cambiarHistoria(hid, (x) => ({ ...x, vistas: [...x.vistas, id] }));
  emitir();
}

export function meGustaHistoria(hid: string) {
  const id = estado.sesionId;
  const h = estado.historias.find((x) => x.id === hid);
  if (!id || !h) return;
  if (!h.meGusta.includes(id)) avisar(h.autorId, 'meGusta', `A @${yo()?.usuario} le gusta tu historia.`);
  cambiarHistoria(hid, (x) => ({ ...x, meGusta: alternar(x.meGusta, id) }));
  emitir();
}

export function borrarHistoria(hid: string) {
  const id = estado.sesionId;
  estado.historias = estado.historias.filter((h) => !(h.id === hid && h.autorId === id));
  emitir();
}
