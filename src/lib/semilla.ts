import type { Estado, Historia, Perfil, Privacidad, Publicacion } from './tipos';

// Cuentas y publicaciones de ejemplo para enseñar la app. Van marcadas como ejemplo
// y desaparecen cuando la app se conecta a la nube.
const H = 3_600_000;

// Vídeos de ejemplo hechos para la app (no son de nadie), en assets/reels.
const VIDEOS: Record<string, { video: number; portada: number }> = {
  coches: { video: require('../../assets/reels/coches.mp4'), portada: require('../../assets/reels/coches.jpg') },
  viajes: { video: require('../../assets/reels/viajes.mp4'), portada: require('../../assets/reels/viajes.jpg') },
  anime: { video: require('../../assets/reels/anime.mp4'), portada: require('../../assets/reels/anime.jpg') },
  cocina: { video: require('../../assets/reels/cocina.mp4'), portada: require('../../assets/reels/cocina.jpg') },
  gimnasio: { video: require('../../assets/reels/gimnasio.mp4'), portada: require('../../assets/reels/gimnasio.jpg') },
  interiores: { video: require('../../assets/reels/interiores.mp4'), portada: require('../../assets/reels/interiores.jpg') },
  dinero: { video: require('../../assets/reels/dinero.mp4'), portada: require('../../assets/reels/dinero.jpg') },
  memes: { video: require('../../assets/reels/memes.mp4'), portada: require('../../assets/reels/memes.jpg') },
};
export const ESQUEMA = 3;

export const privacidadInicial: Privacidad = {
  privado: false,
  quienEscribe: 'seguidos',
  quienMenciona: 'todos',
  quienResponde: 'todos',
  ocultarMeGusta: false,
  encontrarPorCorreo: false,
  confirmacionLectura: true,
};

export function semilla(): Estado {
  const ahora = Date.now();
  const base: [string, string, string, string, string[]][] = [
    ['u1', 'motor_lucia', 'Lucía Motor', 'Coches clásicos y rutas de fin de semana.', ['Coches', 'Motos', 'Viajes']],
    ['u2', 'dani_futbol', 'Dani', 'Hablo de fútbol todos los días.', ['Fútbol', 'Deportes']],
    ['u3', 'cocina_marta', 'Marta en la cocina', 'Recetas fáciles de 20 minutos.', ['Cocina', 'Salud y bienestar']],
    ['u4', 'pablo_tech', 'Pablo Tech', 'Móviles, ordenadores e IA explicados fácil.', ['Tecnología', 'Inteligencia artificial', 'Videojuegos']],
    ['u5', 'viaja_irene', 'Irene viaja', 'Escapadas baratas por España.', ['Viajes', 'Fotografía']],
    ['u6', 'sergio_negocios', 'Sergio Negocios', 'Empresario. Hablo de empresa, ventas y dinero sin humo.', ['Empresarios', 'Dinero e inversión', 'Emprender']],
    ['u7', 'aiko_anime', 'Aiko', 'Anime, manga y cosplay. Opiniones sin spoilers (casi).', ['Anime y manga', 'Cómics', 'Videojuegos']],
    ['u8', 'casa_de_nuria', 'Nuria Interiorismo', 'Diseño de interiores y jardines con poco presupuesto.', ['Diseño de interiores', 'Diseño de exteriores', 'Arquitectura']],
    ['u9', 'alex_gym', 'Álex Fit', 'Entreno, nutrición y constancia.', ['Gimnasio', 'Salud y bienestar']],
    ['u10', 'memes_diarios', 'Memes Diarios', 'Un meme al día, mínimo.', ['Humor y memes']],
  ];
  const perfiles: Perfil[] = base.map(([id, usuario, nombre, bio, intereses], i) => ({
    id,
    usuario,
    nombre,
    bio,
    ubicacion: 'España',
    web: '',
    intereses,
    verTodo: false,
    interesesElegidos: true,
    privacidad: { ...privacidadInicial, quienEscribe: 'todos' },
    creado: ahora - (60 - i) * 24 * H,
    ejemplo: true,
  }));

  const pub = (
    id: string,
    autorId: string,
    texto: string,
    temas: string[],
    horas: number,
    extra: Partial<Publicacion> = {},
  ): Publicacion => ({
    id,
    autorId,
    texto,
    fotos: [],
    sensible: false,
    quienResponde: 'todos',
    temas,
    creado: ahora - horas * H,
    meGusta: [],
    compartidos: [],
    guardados: [],
    respuestas: [],
    noInteresa: [],
    denuncias: 0,
    oculta: false,
    ...extra,
  });
  const r = (id: string, autorId: string, texto: string, horas: number) => ({ id, autorId, texto, creado: ahora - horas * H });

  const publicaciones: Publicacion[] = [
    pub('p1', 'u1', 'Hoy he sacado el Seat 600 de mi abuelo después de 10 años en el garaje. Arrancó a la segunda. #clasicos', ['Coches'], 2, {
      meGusta: ['u2', 'u3', 'u5', 'u6'],
      compartidos: ['u5'],
      respuestas: [r('r1', 'u5', '¡Qué joya! ¿Lo vas a restaurar?', 1.5), r('r2', 'u1', 'Poco a poco. Primero frenos y luego pintura.', 1)],
    }),
    pub('p2', 'u6', 'Lo que nadie te cuenta de montar una empresa: el primer año el 80 % del tiempo es vender, no hacer el producto. #emprender', ['Empresarios', 'Emprender'], 3, {
      meGusta: ['u4', 'u1', 'u9'],
      compartidos: ['u4', 'u9'],
      respuestas: [r('r3', 'u4', 'Totalmente. Y el otro 20 % es papeleo.', 2.5), r('r4', 'u6', 'Y aprender a cobrar a tiempo 😅', 2)],
    }),
    pub('p3', 'u7', 'Ranking honesto de los openings de anime de este año. ¿Cuál es el vuestro?', ['Anime y manga', 'Música'], 4, {
      encuesta: { opciones: ['El de acción', 'El de comedia', 'El de deportes', 'Ninguno me convence'], votos: { u4: 0, u10: 1, u2: 2 }, termina: ahora + 20 * H },
      meGusta: ['u4', 'u10'],
    }),
    pub('p4', 'u8', 'Truco para un salón pequeño: espejo grande frente a la ventana y una sola alfombra que ocupe casi todo el suelo. Parece el doble de grande. #interiorismo', ['Diseño de interiores'], 5, {
      meGusta: ['u3', 'u5', 'u6'],
      guardados: ['u3'],
    }),
    pub('p5', 'u2', '¿Quién gana el derbi del domingo? Yo digo empate a uno. ⚽', ['Fútbol'], 6, {
      meGusta: ['u1', 'u4'],
      respuestas: [r('r5', 'u4', 'Dos a uno para el local.', 5), r('r6', 'u1', 'Empate, como siempre.', 4)],
    }),
    pub('p6', 'u3', 'Tortilla de patatas en el microondas en 12 minutos. Os dejo la receta completa en el enlace.', ['Cocina'], 8, {
      enlace: 'https://es.wikipedia.org/wiki/Tortilla_de_patatas',
      meGusta: ['u1', 'u2', 'u4', 'u5'],
      compartidos: ['u1', 'u2'],
    }),
    pub('p7', 'u6', 'Regla que me ha funcionado: antes de invertir, ten 6 meses de gastos ahorrados. Lo demás viene después. #dinero', ['Dinero e inversión'], 9, {
      meGusta: ['u9', 'u1'],
      compartidos: ['u9'],
    }),
    pub('p8', 'u10', 'Yo: "hoy me acuesto pronto". También yo a las 3:00: viendo vídeos de cómo se hacen las tuberías. 😂', ['Humor y memes'], 10, {
      meGusta: ['u1', 'u2', 'u3', 'u4', 'u5', 'u7'],
      compartidos: ['u2', 'u7'],
    }),
    pub('p9', 'u4', 'Truco: activa la verificación en dos pasos en todas tus redes. Tarda un minuto y evita que te roben la cuenta. #seguridad', ['Tecnología'], 12, {
      meGusta: ['u3'],
      compartidos: ['u2', 'u3', 'u5'],
    }),
    pub('p10', 'u8', 'Jardín de 20 m² con plantas que casi no necesitan agua: lavanda, romero, olivo enano y gravilla. Precioso todo el año.', ['Diseño de exteriores'], 14, {
      meGusta: ['u5'],
    }),
    pub('p11', 'u9', 'No necesitas 2 horas de gimnasio. 45 minutos, 4 días a la semana, y dormir bien. #gimnasio', ['Gimnasio', 'Salud y bienestar'], 16, {
      meGusta: ['u2', 'u6'],
    }),
    pub('p12', 'u5', 'Cuenca en un día: casas colgadas, morteruelo y vistas desde el puente de San Pablo. #viajes', ['Viajes', 'Cocina'], 20, {
      meGusta: ['u1', 'u3'],
    }),
    pub('p13', 'u7', 'Empiezo a leer un manga de cocina y ahora tengo hambre a todas horas. Recomendaciones aceptadas.', ['Anime y manga'], 22, {
      respuestas: [r('r7', 'u3', '¡Si quieres te paso recetas de los platos que salgan!', 21)],
    }),
    pub('p14', 'u1', 'Ruta por la costa de Asturias en moto este finde. ¿Recomendaciones para comer?', ['Motos', 'Viajes'], 30, {
      respuestas: [r('r8', 'u5', 'Cudillero, sin duda. Pide pixín.', 28)],
    }),
    pub('p15', 'u4', 'He probado tres asistentes de IA para resumir correos. El que mejor va es el que menos datos pide. #ia', ['Inteligencia artificial'], 34, {
      meGusta: ['u2', 'u6'],
    }),
  ];

  // Más publicaciones de ejemplo para que «Para ti» tenga de todo.
  const mas: [string, string, string[]][] = [
    ['u1', 'El sonido de un V8 por la mañana arregla cualquier lunes. #motor', ['Coches']],
    ['u1', '¿Eléctrico o gasolina para el primer coche? Os leo.', ['Coches']],
    ['u1', 'Ruta de puertos por Picos de Europa: 180 km de curvas y vistas. Guardadla. #rutas', ['Motos', 'Viajes']],
    ['u2', 'Ese gol en el último minuto merece entrar en la historia del club.', ['Fútbol']],
    ['u2', 'Mi once ideal de la temporada, sin discusión 😤', ['Fútbol', 'Deportes']],
    ['u2', 'La NBA está más abierta que nunca este año. #baloncesto', ['Baloncesto', 'Deportes']],
    ['u3', 'Lentejas de la abuela, versión rápida: 25 minutos en olla exprés.', ['Cocina']],
    ['u3', 'Desayuno de 5 minutos: tostada, aguacate, huevo y un poco de lima. #recetas', ['Cocina', 'Salud y bienestar']],
    ['u3', '¿Paella con chorizo? Abro debate 🥘', ['Cocina', 'Humor y memes']],
    ['u4', 'El móvil más vendido del año no es el más potente: es el que más batería dura.', ['Tecnología']],
    ['u4', 'Tres atajos de teclado que te ahorran una hora a la semana.', ['Tecnología']],
    ['u4', 'La IA no te va a quitar el trabajo; te lo quitará alguien que sepa usarla. #ia', ['Inteligencia artificial', 'Empresarios']],
    ['u4', 'Juegazo indie de este mes: 12 € y 30 horas de diversión. #videojuegos', ['Videojuegos']],
    ['u5', 'Albarracín al amanecer. Ningún filtro le hace justicia. #viajes', ['Viajes', 'Fotografía']],
    ['u5', 'Vuelo a Oporto por 19 €: os cuento cómo lo encontré.', ['Viajes', 'Dinero e inversión']],
    ['u5', 'Consejo de fotografía: la hora dorada es una hora antes de que se ponga el sol.', ['Fotografía']],
    ['u6', 'Vender no es convencer: es ayudar a alguien a decidir. #ventas', ['Empresarios', 'Marketing']],
    ['u6', 'Si tu negocio depende de una sola red social, no tienes un negocio: tienes un alquiler.', ['Emprender', 'Marketing']],
    ['u6', 'Comprar piso o alquilar: hice las cuentas con números reales. #inmobiliaria', ['Inmobiliaria', 'Dinero e inversión']],
    ['u6', 'El reloj que llevas dice mucho menos de ti que tu puntualidad. #relojes', ['Relojes', 'Lujo']],
    ['u7', 'Top 5 mangas cortos para empezar este fin de semana.', ['Anime y manga']],
    ['u7', 'Mi cosplay para el salón del manga va al 70 %. Os enseño el proceso.', ['Anime y manga', 'Arte y dibujo']],
    ['u7', 'Ese momento en que el anime supera al manga. Pocas veces, pero pasa.', ['Anime y manga', 'Cine y series']],
    ['u8', 'Antes y después de un baño de 4 m²: azulejo grande y espejo sin marco.', ['Diseño de interiores']],
    ['u8', 'Terraza pequeña con mucho estilo: suelo de madera, luces cálidas y tres macetas grandes.', ['Diseño de exteriores']],
    ['u8', 'La casa de piedra que más me ha inspirado este año. #arquitectura', ['Arquitectura']],
    ['u9', 'Tres ejercicios para la espalda si trabajas sentado todo el día.', ['Gimnasio', 'Salud y bienestar']],
    ['u9', 'Proteína: no necesitas batidos si comes bien. Te explico cuánta.', ['Salud y bienestar']],
    ['u9', 'Día 100 de entrenar sin fallar. La constancia gana a la motivación. #gimnasio', ['Gimnasio']],
    ['u10', 'Cuando el GPS dice "gire a la derecha" y a la derecha hay un río. 😂', ['Humor y memes']],
    ['u10', 'Mi planta y yo tenemos algo en común: sobrevivimos con agua y luz solar. A veces.', ['Humor y memes', 'Naturaleza']],
    ['u10', 'Lunes: el único día de la semana que llega sin avisar.', ['Humor y memes']],
    ['u10', 'Mi gato mirándome teletrabajar como si yo fuera el raro. 🐱', ['Humor y memes', 'Mascotas']],
    ['u5', 'Ruta de cascadas en Galicia: 6 km y aptas para ir con niños. #familia', ['Viajes', 'Naturaleza', 'Familia']],
    ['u4', 'Libro recomendado: un clásico sobre hábitos que se lee en una tarde. #libros', ['Libros', 'Educación']],
    ['u3', 'Galletas para el perro hechas en casa: avena, plátano y calabaza. #mascotas', ['Mascotas', 'Cocina']],
    ['u6', 'Bitcoin sube, bitcoin baja. Mi consejo: no inviertas lo que no puedas perder. #cripto', ['Criptomonedas', 'Dinero e inversión']],
    ['u8', 'Colores que vuelven este año en casa: verde salvia y terracota. #diseño', ['Diseño de interiores', 'Arte y dibujo']],
    ['u7', 'Recomendación de serie: 8 capítulos, cero relleno. #series', ['Cine y series']],
    ['u2', 'Hoy he corrido mi primera media maratón. 2 h 04 min. ¡A por la siguiente! #running', ['Deportes', 'Salud y bienestar']],
  ];
  mas.forEach(([autor, texto, temas], i) => {
    const otros = base.map((b) => b[0]).filter((u) => u !== autor);
    publicaciones.push(
      pub(`m${i + 1}`, autor, texto, temas, 36 + i * 5, {
        meGusta: otros.slice(0, (i * 7) % 9),
        compartidos: otros.slice(0, (i * 3) % 4),
      }),
    );
  });

  // Reels de ejemplo (vídeos verticales que vienen dentro de la app).
  const reels: [string, string, string, string[], number, number][] = [
    ['u1', 'Top 3 deportivos que puedes alquilar un día. ¿Cuál elegís? #coches', 'coches', ['Coches', 'Lujo'], 1, 0],
    ['u5', 'Lisboa en 24 horas: miradores, pasteles de nata y el tranvía 28. #viajes', 'viajes', ['Viajes'], 2, 1],
    ['u7', 'Openings que nunca te saltas 🎶 #anime', 'anime', ['Anime y manga', 'Música'], 3, 2],
    ['u3', 'Tortilla en 5 pasos, jugosa por dentro. #recetas', 'cocina', ['Cocina'], 5, 3],
    ['u9', 'Rutina de 15 minutos sin material. Guárdalo para mañana. #gimnasio', 'gimnasio', ['Gimnasio', 'Salud y bienestar'], 6, 4],
    ['u8', 'Salón pequeño que parece el doble. #interiorismo', 'interiores', ['Diseño de interiores'], 8, 5],
    ['u6', 'La regla 50/30/20 para organizar tu sueldo. #dinero', 'dinero', ['Dinero e inversión', 'Empresarios'], 9, 6],
    ['u10', 'Cuando dices «solo un capítulo más» 😂', 'memes', ['Humor y memes', 'Cine y series'], 11, 7],
  ];
  reels.forEach(([autor, texto, clip, temas, horas, i]) => {
    const otros = base.map((b) => b[0]).filter((u) => u !== autor);
    publicaciones.push(
      pub(`reel${i + 1}`, autor, texto, temas, horas, {
        reel: true,
        video: { uri: VIDEOS[clip].video, portada: VIDEOS[clip].portada, duracion: 6, ancho: 540, alto: 960 },
        vistas: 1200 + i * 731,
        meGusta: otros.slice(0, 3 + (i % 6)),
        compartidos: otros.slice(0, 1 + (i % 3)),
        respuestas: [r(`rr${i}a`, otros[0], '¡Qué bueno! 🔥', horas - 0.5), r(`rr${i}b`, otros[1], 'Guardado para luego.', horas - 0.2)],
      }),
    );
  });

  // Historias de ejemplo (duran 24 horas).
  const historia = (id: string, autorId: string, horas: number, extra: Partial<Historia>): Historia => ({
    id,
    autorId,
    tipo: 'foto',
    uri: '',
    filtro: 'normal',
    creado: ahora - horas * H,
    vistas: [],
    meGusta: [],
    ...extra,
  });
  const historias: Historia[] = [
    historia('h1', 'u1', 1, { tipo: 'video', uri: VIDEOS.coches.video, filtro: 'cine', duracion: 6 }),
    historia('h2', 'u1', 0.5, { uri: '', fondo: 'linear(#FF8A3D,#FF3D71)', texto: '¿Ruta en moto el sábado? 🏍️' }),
    historia('h3', 'u5', 2, { uri: VIDEOS.viajes.portada, filtro: 'playa', texto: 'Desde Lisboa ☀️' }),
    historia('h4', 'u3', 3, { tipo: 'video', uri: VIDEOS.cocina.video, filtro: 'dorado', duracion: 6 }),
    historia('h5', 'u7', 4, { uri: VIDEOS.anime.portada, filtro: 'neon', texto: 'Maratón de anime hoy' }),
    historia('h6', 'u8', 5, { uri: VIDEOS.interiores.portada, filtro: 'mate' }),
    historia('h7', 'u10', 6, { uri: '', fondo: 'linear(#7C3AED,#1D9BF0)', texto: 'Viernes: modo sofá activado 🛋️' }),
    historia('h8', 'u9', 7, { tipo: 'video', uri: VIDEOS.gimnasio.video, filtro: 'drama', duracion: 6 }),
  ];

  return {
    esquema: ESQUEMA,
    historias,
    version: 0,
    sesionId: null,
    perfiles,
    privados: [],
    publicaciones,
    sigue: { u1: ['u5'], u2: ['u4'], u3: ['u5', 'u8'], u4: ['u2', 'u6'], u5: ['u1', 'u3'], u6: ['u4', 'u9'], u7: ['u10'], u8: ['u3'], u9: ['u6'], u10: ['u7'] },
    solicitudes: {},
    bloqueados: {},
    silenciados: {},
    denuncias: [],
    avisos: [],
    conversaciones: [],
    cookies: { decidido: false, estadisticas: false, publicidad: false },
  };
}
