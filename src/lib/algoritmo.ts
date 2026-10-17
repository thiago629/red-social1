import type { Estado, Publicacion } from './tipos';

// Pesos del feed "Para ti". Inspirados en los que X publicó en 2023 y ajustables con datos reales.
// La misma fórmula está en supabase/migrations/0002_feed.sql para cuando usemos la nube.
export const PESOS = {
  meGusta: 1,
  compartir: 2,
  guardar: 2,
  respuesta: 10,
  respuestaDelAutor: 30,
  voto: 1,
  noMeInteresa: -50,
  denuncia: -300,
};

const HORA = 3_600_000;

export type Puntuada = {
  publicacion: Publicacion;
  puntos: number;
  motivos: string[];
  compartidoPor?: string;
};

function interacciones(p: Publicacion) {
  const delAutor = p.respuestas.filter((r) => r.autorId === p.autorId).length;
  return (
    PESOS.meGusta * p.meGusta.length +
    PESOS.compartir * p.compartidos.length +
    PESOS.guardar * p.guardados.length +
    PESOS.respuesta * (p.respuestas.length - delAutor) +
    PESOS.respuestaDelAutor * delAutor +
    PESOS.voto * Object.keys(p.encuesta?.votos ?? {}).length +
    PESOS.noMeInteresa * p.noInteresa.length +
    PESOS.denuncia * p.denuncias
  );
}

// Lo que una persona puede ver: quita ocultas, bloqueos, silencios, palabras silenciadas
// y cuentas privadas que no sigue.
export function visibles(estado: Estado, yo: string) {
  const bloqueados = new Set(estado.bloqueados[yo] ?? []);
  for (const [quien, lista] of Object.entries(estado.bloqueados)) {
    if (lista.includes(yo)) bloqueados.add(quien);
  }
  const silenciados = new Set(estado.silenciados[yo] ?? []);
  const sigo = new Set(estado.sigue[yo] ?? []);
  const privadas = new Set(estado.perfiles.filter((p) => p.privacidad.privado).map((p) => p.id));
  const palabras = (estado.privados.find((p) => p.usuarioId === yo)?.palabrasSilenciadas ?? []).map((w) => w.toLowerCase());

  return estado.publicaciones.filter(
    (p) =>
      !p.oculta &&
      !bloqueados.has(p.autorId) &&
      !silenciados.has(p.autorId) &&
      !p.noInteresa.includes(yo) &&
      (!privadas.has(p.autorId) || sigo.has(p.autorId) || p.autorId === yo) &&
      (p.autorId === yo || !palabras.some((w) => p.texto.toLowerCase().includes(w))),
  );
}

// "Siguiendo": solo la gente que sigues y lo que comparten, de más nuevo a más antiguo.
export function feedSiguiendo(estado: Estado, yo: string): Puntuada[] {
  const sigo = new Set([...(estado.sigue[yo] ?? []), yo]);
  const lista: Puntuada[] = [];
  for (const p of visibles(estado, yo)) {
    if (sigo.has(p.autorId)) lista.push({ publicacion: p, puntos: p.creado, motivos: [] });
    else {
      const quien = p.compartidos.find((c) => sigo.has(c) && c !== yo);
      if (quien) lista.push({ publicacion: p, puntos: p.creado, motivos: [], compartidoPor: quien });
    }
  }
  return lista.sort((a, b) => b.puntos - a.puntos);
}

export function puntuar(estado: Estado, yo: string, p: Publicacion, ahora = Date.now()): Puntuada {
  const yoPerfil = estado.perfiles.find((u) => u.id === yo);
  const sigo = (estado.sigue[yo] ?? []).includes(p.autorId);
  const misTemas = new Set(yoPerfil?.intereses ?? []);
  const comunes = p.temas.filter((t) => misTemas.has(t));
  const heHablado = estado.publicaciones.some((q) => q.autorId === p.autorId && q.respuestas.some((r) => r.autorId === yo));

  const afinidad = 1 + (sigo ? 1 : 0) + (heHablado ? 0.5 : 0) + 0.5 * comunes.length;
  const calidad = p.denuncias > 0 ? 0.5 : 1;
  const horas = Math.max(0, (ahora - p.creado) / HORA);
  const puntos = ((1 + Math.max(0, interacciones(p))) * afinidad * calidad) / Math.pow(horas + 2, 1.5);

  const motivos: string[] = [];
  if (comunes.length) motivos.push(`Elegiste: ${comunes.join(', ')}.`);
  if (sigo) motivos.push('Sigues a esta persona.');
  if (heHablado) motivos.push('Has hablado con esta persona.');
  if (p.respuestas.length >= 2) motivos.push('Tiene conversación activa.');
  if (horas < 6) motivos.push('Es reciente.');
  if (yoPerfil?.verTodo && !comunes.length) motivos.push('Tienes activado «Ver de todo».');
  if (!motivos.length) motivos.push('Es popular entre gente de la red.');
  return { publicacion: p, puntos, motivos };
}

// "Para ti": si la persona eligió temas, solo sale lo de esos temas y de quien sigue.
// Con "Ver de todo" sale todo, ordenado igual.
export function feedParaTi(estado: Estado, yo: string): Puntuada[] {
  const perfil = estado.perfiles.find((u) => u.id === yo);
  const temas = new Set(perfil?.intereses ?? []);
  const sigo = new Set(estado.sigue[yo] ?? []);
  const todo = !perfil || perfil.verTodo || temas.size === 0;

  const puntuadas = visibles(estado, yo)
    .filter((p) => p.autorId !== yo)
    .filter((p) => todo || sigo.has(p.autorId) || p.temas.some((t) => temas.has(t)))
    .map((p) => puntuar(estado, yo, p))
    .sort((a, b) => b.puntos - a.puntos);

  // Mezcla: nunca dos seguidas del mismo autor si se puede evitar.
  const resultado: Puntuada[] = [];
  const pendientes = [...puntuadas];
  while (pendientes.length) {
    const ultimo = resultado[resultado.length - 1]?.publicacion.autorId;
    const i = pendientes.findIndex((x) => x.publicacion.autorId !== ultimo);
    resultado.push(pendientes.splice(i === -1 ? 0 : i, 1)[0]);
  }
  return resultado;
}

// Tendencias: hashtags más usados en las últimas 72 horas.
export function tendencias(estado: Estado, yo: string, max = 8) {
  const desde = Date.now() - 72 * HORA;
  const cuenta = new Map<string, number>();
  for (const p of visibles(estado, yo)) {
    if (p.creado < desde) continue;
    for (const m of p.texto.matchAll(/#([\p{L}\p{N}_]{2,30})/gu)) {
      const tag = m[1].toLowerCase();
      cuenta.set(tag, (cuenta.get(tag) ?? 0) + 1 + p.meGusta.length + p.compartidos.length);
    }
  }
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1]).slice(0, max);
}

// Mezcla con semilla: la misma página sale siempre igual (no salta al volver a pintar).
function barajar<T>(lista: T[], semilla: number) {
  const r = [...lista];
  let a = semilla * 2654435761;
  const azar = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

// «Para ti» infinito: la página 0 es lo mejor de tus temas. Las siguientes vuelven a mezclar tus temas
// y añaden cosas de otros temas para descubrir, como hace TikTok. Nunca se acaba.
// En la nube, cada página la pide al servidor (feed_para_ti con desplazamiento) y lo ya visto baja.
export function paginaParaTi(estado: Estado, yo: string, pagina: number): Puntuada[] {
  const base = feedParaTi(estado, yo);
  if (pagina === 0) return base;
  const ids = new Set(base.map((x) => x.publicacion.id));
  const descubrir = visibles(estado, yo)
    .filter((p) => p.autorId !== yo && !ids.has(p.id))
    .map((p) => ({ ...puntuar(estado, yo, p), motivos: ['Para que descubras algo nuevo, fuera de tus temas.'] }));
  const extra = barajar(descubrir, pagina);
  // Tres de tus temas, una para descubrir, y así siempre.
  const salida: Puntuada[] = [];
  barajar(base, pagina * 7 + 1).forEach((x, i) => {
    salida.push(x);
    if (i % 3 === 2 && extra.length) salida.push(extra.shift()!);
  });
  return salida.length ? salida : barajar(descubrir, pagina);
}

// Reels: todos los vídeos que puedes ver, ordenados con la misma fórmula.
// Al acabarse se vuelven a mezclar, así que el deslizamiento es infinito.
export function paginaReels(estado: Estado, yo: string, pagina: number): Puntuada[] {
  const reels = visibles(estado, yo)
    .filter((p) => p.reel && p.video)
    .map((p) => puntuar(estado, yo, p))
    .sort((a, b) => b.puntos - a.puntos);
  return pagina === 0 ? reels : barajar(reels, pagina + 11);
}
