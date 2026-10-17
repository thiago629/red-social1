export type Quien = 'todos' | 'seguidos' | 'nadie';

// Ajustes de privacidad que afectan a lo que pueden hacer los demás.
export type Privacidad = {
  privado: boolean;
  quienEscribe: Quien;
  quienMenciona: Quien;
  quienResponde: 'todos' | 'seguidos' | 'mencionados';
  ocultarMeGusta: boolean;
  encontrarPorCorreo: boolean;
  confirmacionLectura: boolean;
};

// Perfil público: lo que ve cualquiera.
export type Perfil = {
  id: string;
  usuario: string;
  nombre: string;
  bio: string;
  ubicacion: string;
  web: string;
  foto?: string;
  intereses: string[];
  verTodo: boolean;
  interesesElegidos: boolean;
  privacidad: Privacidad;
  creado: number;
  ejemplo?: boolean;
};

export type Notificaciones = {
  meGusta: boolean;
  respuestas: boolean;
  menciones: boolean;
  seguidores: boolean;
  compartidos: boolean;
  mensajes: boolean;
  correoNovedades: boolean;
};

export type Consentimiento = { tipo: string; aceptado: boolean; creado: number };

// Datos privados: solo los ve su dueño. En la nube van en otra tabla con sus propias reglas.
export type DatosPrivados = {
  usuarioId: string;
  email: string;
  nacimiento: string; // AAAA-MM-DD
  anunciosPersonalizados: boolean;
  verSensible: boolean;
  palabrasSilenciadas: string[];
  notificaciones: Notificaciones;
  dosPasos: boolean;
  alertasInicio: boolean;
  aceptoTerminos: number;
  consentimientos: Consentimiento[];
  desactivada?: number;
};

export type Respuesta = {
  id: string;
  autorId: string;
  texto: string;
  creado: number;
};

export type Encuesta = {
  opciones: string[];
  votos: Record<string, number>; // usuarioId -> índice de opción
  termina: number;
};

// Vídeo de un reel. `uri` puede ser un archivo del propio paquete de la app (número),
// una dirección web, un archivo del móvil o, en la web en modo prueba, "idb:<clave>" (guardado en el navegador).
export type Video = {
  uri: string | number;
  portada?: string | number;
  duracion?: number;
  ancho?: number;
  alto?: number;
};

export type Publicacion = {
  id: string;
  autorId: string;
  texto: string;
  fotos: string[];
  filtro?: string;
  video?: Video;
  reel?: boolean;
  vistas?: number;
  enlace?: string;
  encuesta?: Encuesta;
  sensible: boolean;
  quienResponde: 'todos' | 'seguidos' | 'mencionados';
  temas: string[];
  creado: number;
  meGusta: string[];
  compartidos: string[];
  guardados: string[];
  respuestas: Respuesta[];
  noInteresa: string[];
  denuncias: number;
  oculta: boolean;
};

export type Denuncia = {
  id: string;
  tipo: 'publicacion' | 'usuario' | 'mensaje';
  objetoId: string;
  denuncianteId: string;
  motivo: string;
  detalle: string;
  creado: number;
  estado: 'pendiente' | 'revisada';
};

export type Aviso = {
  id: string;
  paraId: string;
  tipo: 'meGusta' | 'respuestas' | 'menciones' | 'seguidores' | 'compartidos' | 'mensajes' | 'sistema';
  texto: string;
  publicacionId?: string;
  deId?: string;
  creado: number;
  leido: boolean;
};

export type Mensaje = { id: string; autorId: string; texto: string; creado: number };

export type Conversacion = {
  id: string;
  miembros: string[];
  mensajes: Mensaje[];
  leido: Record<string, number>;
  creado: number;
};

// Historias: fotos o vídeos que desaparecen a las 24 horas.
export type Historia = {
  id: string;
  autorId: string;
  tipo: 'foto' | 'video';
  uri: string | number;
  filtro: string;
  texto?: string;
  colorTexto?: string;
  fondo?: string; // historias solo de texto
  duracion?: number; // segundos, en vídeos
  creado: number;
  vistas: string[];
  meGusta: string[];
};

export type Estado = {
  esquema: number;
  version: number;
  sesionId: string | null;
  perfiles: Perfil[];
  privados: DatosPrivados[];
  publicaciones: Publicacion[];
  sigue: Record<string, string[]>;
  solicitudes: Record<string, string[]>; // usuarioId -> quién le ha pedido seguirle
  bloqueados: Record<string, string[]>;
  silenciados: Record<string, string[]>;
  denuncias: Denuncia[];
  avisos: Aviso[];
  conversaciones: Conversacion[];
  historias: Historia[];
  cookies: { decidido: boolean; estadisticas: boolean; publicidad: boolean };
};
