// Datos de la marca. Para cambiar el nombre: aquí, en app.json y en public/manifest.json.
// Todo lo demás (también los textos legales) lo toma de aquí.
export const marca = {
  nombre: 'Plazzo',
  eslogan: 'Tu plaza para contarlo y enseñarlo todo.',
  dominio: 'plazzo.app',
  correoContacto: 'contacto@plazzo.app',
  correoPrivacidad: 'privacidad@plazzo.app',
  correoDenuncias: 'denuncias@plazzo.app',
};

// Degradado de la marca: naranja, coral, violeta y azul (historias, reels y logo).
export const degradado = ['#FF8A3D', '#FF3D71', '#7C3AED', '#1D9BF0'] as const;

export const EDAD_MINIMA = 16;
// El contenido marcado como sensible solo se puede activar desde los 18.
export const EDAD_SENSIBLE = 18;

// Base limpia al estilo de X (blanco, texto casi negro) con el color de la marca para las acciones.
export const color = {
  tinta: '#0F1419',
  papel: '#FFFFFF',
  tarjeta: '#FFFFFF',
  gris: '#F7F9F9',
  borde: '#EFF3F4',
  bordeFuerte: '#CFD9DE',
  suave: '#536471',
  acento: '#6D3BF0',
  acentoSuave: '#F1ECFE',
  meGusta: '#FF3D71',
  compartir: '#00BA7C',
  peligro: '#F4212E',
  ok: '#00BA7C',
};

// Temas que cada persona elige al entrar. El algoritmo de "Para ti" usa esta lista.
export const INTERESES = [
  { id: 'Empresarios', emoji: '💼' },
  { id: 'Dinero e inversión', emoji: '💰' },
  { id: 'Criptomonedas', emoji: '🪙' },
  { id: 'Emprender', emoji: '🚀' },
  { id: 'Marketing', emoji: '📈' },
  { id: 'Inmobiliaria', emoji: '🏢' },
  { id: 'Lujo', emoji: '💎' },
  { id: 'Relojes', emoji: '⌚' },
  { id: 'Coches', emoji: '🏎️' },
  { id: 'Motos', emoji: '🏍️' },
  { id: 'Viajes', emoji: '✈️' },
  { id: 'Diseño de interiores', emoji: '🛋️' },
  { id: 'Diseño de exteriores', emoji: '🌳' },
  { id: 'Arquitectura', emoji: '🏛️' },
  { id: 'Anime y manga', emoji: '🍥' },
  { id: 'Cómics', emoji: '💥' },
  { id: 'Videojuegos', emoji: '🎮' },
  { id: 'Tecnología', emoji: '💻' },
  { id: 'Inteligencia artificial', emoji: '🤖' },
  { id: 'Ciencia', emoji: '🔬' },
  { id: 'Fútbol', emoji: '⚽' },
  { id: 'Baloncesto', emoji: '🏀' },
  { id: 'Deportes', emoji: '🏅' },
  { id: 'Gimnasio', emoji: '🏋️' },
  { id: 'Salud y bienestar', emoji: '🧘' },
  { id: 'Moda', emoji: '👗' },
  { id: 'Belleza', emoji: '💄' },
  { id: 'Música', emoji: '🎵' },
  { id: 'Cine y series', emoji: '🎬' },
  { id: 'Humor y memes', emoji: '😂' },
  { id: 'Cocina', emoji: '🍳' },
  { id: 'Fotografía', emoji: '📷' },
  { id: 'Arte y dibujo', emoji: '🎨' },
  { id: 'Libros', emoji: '📚' },
  { id: 'Mascotas', emoji: '🐶' },
  { id: 'Naturaleza', emoji: '🏔️' },
  { id: 'Familia', emoji: '👨‍👩‍👧' },
  { id: 'Educación', emoji: '🎓' },
  { id: 'Noticias', emoji: '📰' },
] as const;

export const emojiDe = (tema: string) => INTERESES.find((i) => i.id === tema)?.emoji ?? '#';

// Si existen estas variables, la app usa la nube (Supabase en Frankfurt).
// Sin ellas funciona en modo prueba, con datos de ejemplo en el propio dispositivo.
export const nube = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  claveAnonima: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
};
export const modoDemo = !nube.url || !nube.claveAnonima;

export const LIMITE_TEXTO = 500;
export const MAX_FOTOS = 4;
