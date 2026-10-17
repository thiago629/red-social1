import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Share, Text, TextInput, View } from 'react-native';
import {
  Aviso,
  Avatar,
  Boton,
  Campo,
  Chip,
  Fila,
  FilaMenu,
  Interruptor,
  Pantalla,
  Parrafo,
  Selector,
  Subtitulo,
} from '../../components/ui';
import { color, EDAD_SENSIBLE, marca, modoDemo } from '../../lib/config';
import * as store from '../../lib/store';
import type { Quien } from '../../lib/tipos';

const TITULOS: Record<string, string> = {
  cuenta: 'Tu cuenta',
  privacidad: 'Privacidad',
  seguridad: 'Seguridad',
  contenido: 'Contenido que ves',
  notificaciones: 'Notificaciones',
  publicidad: 'Publicidad',
  datos: 'Tus datos y permisos',
  ayuda: 'Ayuda',
};

const QUIEN: { valor: Quien; texto: string }[] = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'seguidos', texto: 'Gente que sigo' },
  { valor: 'nadie', texto: 'Nadie' },
];

export default function Seccion() {
  store.useVersion();
  const { seccion } = useLocalSearchParams<{ seccion: string }>();
  const yo = store.yo();
  const privados = store.misPrivados();
  if (!yo || !privados) return null;

  const Contenido = { cuenta: Cuenta, privacidad: Privacidad, seguridad: Seguridad, contenido: ContenidoVes, notificaciones: Notificaciones, publicidad: Publicidad, datos: Datos, ayuda: Ayuda }[
    seccion as 'cuenta'
  ];

  return (
    <>
      <Stack.Screen options={{ title: TITULOS[seccion] ?? 'Ajustes' }} />
      <Pantalla>{Contenido ? <Contenido /> : <Parrafo suave>Sección no encontrada.</Parrafo>}</Pantalla>
    </>
  );
}

function Cuenta() {
  const yo = store.yo()!;
  const privados = store.misPrivados()!;
  const [usuario, setUsuario] = useState(yo.usuario);
  const [correo, setCorreo] = useState(privados.email);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [exportado, setExportado] = useState('');
  const [borrando, setBorrando] = useState(false);
  const [confirmacion, setConfirmacion] = useState('');

  const descargar = async () => {
    const datos = store.exportarMisDatos();
    setExportado(datos);
    if (Platform.OS === 'web') {
      try {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([datos], { type: 'application/json' }));
        a.download = `mis-datos-${yo.usuario}.json`;
        a.click();
      } catch {
        // Si el navegador no deja descargar, los datos se ven abajo.
      }
    } else {
      await Share.share({ message: datos, title: 'Mis datos' });
    }
  };

  return (
    <>
      <Campo etiqueta="Nombre de usuario" value={usuario} onChangeText={setUsuario} autoCapitalize="none" />
      <Boton
        pequeño
        tipo="secundario"
        texto="Guardar usuario"
        desactivado={usuario === yo.usuario}
        onPress={() => {
          const e = store.cambiarUsuario(usuario);
          setError(e ?? '');
          setMensaje(e ? '' : 'Usuario cambiado.');
        }}
      />
      <Campo etiqueta="Correo (privado)" value={correo} onChangeText={setCorreo} autoCapitalize="none" keyboardType="email-address" />
      <Boton
        pequeño
        tipo="secundario"
        texto="Guardar correo"
        desactivado={correo === privados.email}
        onPress={() => {
          const e = store.cambiarCorreo(correo);
          setError(e ?? '');
          setMensaje(e ? '' : modoDemo ? 'Correo cambiado.' : 'Te hemos enviado un correo para confirmarlo.');
        }}
      />
      <FilaMenu titulo="Cambiar contraseña" descripcion="Te enviaremos un enlace a tu correo." onPress={() => setMensaje(modoDemo ? 'En la versión real te llega un correo para cambiarla.' : 'Te hemos enviado un correo.')} />
      <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: color.borde }}>
        <Text style={{ color: color.tinta }}>Fecha de nacimiento (privada)</Text>
        <Text style={{ color: color.suave }}>
          {new Date(privados.nacimiento).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}. Para corregirla escribe a {marca.correoPrivacidad}.
        </Text>
      </View>
      <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: color.borde }}>
        <Text style={{ color: color.tinta }}>Idioma</Text>
        <Text style={{ color: color.suave }}>Español</Text>
      </View>
      {mensaje ? <Aviso>{mensaje}</Aviso> : null}
      {error ? <Aviso tipo="peligro">{error}</Aviso> : null}

      <Subtitulo>Tus datos</Subtitulo>
      <Parrafo suave>Descarga una copia de todo lo que guardamos sobre ti: perfil, datos privados, publicaciones, mensajes y consentimientos.</Parrafo>
      <Boton tipo="secundario" texto="Descargar mis datos" onPress={descargar} />
      {exportado ? (
        <TextInput
          value={exportado}
          editable={false}
          multiline
          style={{ maxHeight: 220, fontSize: 12, borderWidth: 1, borderColor: color.borde, borderRadius: 8, padding: 8, color: color.tinta, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }}
        />
      ) : null}

      <Subtitulo>Borrar la cuenta</Subtitulo>
      {!borrando ? (
        <Boton tipo="peligro" texto="Borrar mi cuenta" onPress={() => setBorrando(true)} />
      ) : (
        <>
          <Aviso tipo="peligro">Se borrarán tu perfil, tus publicaciones, respuestas, mensajes y datos privados. No se puede deshacer.</Aviso>
          <Campo etiqueta="Escribe BORRAR para confirmar" value={confirmacion} onChangeText={setConfirmacion} autoCapitalize="characters" />
          <Fila>
            <Boton
              tipo="peligro"
              texto="Borrar definitivamente"
              desactivado={confirmacion.trim().toUpperCase() !== 'BORRAR'}
              onPress={() => {
                store.borrarCuenta();
                router.replace('/entrar');
              }}
            />
            <Boton tipo="secundario" texto="Cancelar" onPress={() => { setBorrando(false); setConfirmacion(''); }} />
          </Fila>
        </>
      )}
    </>
  );
}

function Privacidad() {
  const yo = store.yo()!;
  const estado = store.get();
  const p = yo.privacidad;
  const bloqueados = (estado.bloqueados[yo.id] ?? []).map(store.perfil).filter((x) => !!x);
  const silenciados = (estado.silenciados[yo.id] ?? []).map(store.perfil).filter((x) => !!x);

  return (
    <>
      <Interruptor
        titulo="Cuenta privada"
        descripcion="Solo las personas que apruebes podrán ver tus publicaciones y seguirte."
        valor={p.privado}
        onCambio={(v) => store.cambiarPrivacidad({ privado: v })}
      />
      <Selector titulo="¿Quién te puede enviar mensajes?" opciones={QUIEN} valor={p.quienEscribe} onCambio={(v) => store.cambiarPrivacidad({ quienEscribe: v })} />
      <Selector titulo="¿Quién te puede mencionar?" opciones={QUIEN} valor={p.quienMenciona} onCambio={(v) => store.cambiarPrivacidad({ quienMenciona: v })} />
      <Selector
        titulo="¿Quién puede responder a tus publicaciones? (por defecto)"
        opciones={[
          { valor: 'todos', texto: 'Todos' },
          { valor: 'seguidos', texto: 'Gente que sigo' },
          { valor: 'mencionados', texto: 'Solo mencionados' },
        ]}
        valor={p.quienResponde}
        onCambio={(v) => store.cambiarPrivacidad({ quienResponde: v })}
      />
      <Interruptor titulo="Ocultar mis me gusta" descripcion="Nadie más verá qué publicaciones te gustan." valor={p.ocultarMeGusta} onCambio={(v) => store.cambiarPrivacidad({ ocultarMeGusta: v })} />
      <Interruptor
        titulo="Que me encuentren por mi correo"
        descripcion="Quien conozca tu correo exacto podrá encontrarte en el buscador. Tu correo nunca se muestra."
        valor={p.encontrarPorCorreo}
        onCambio={(v) => store.cambiarPrivacidad({ encontrarPorCorreo: v })}
      />
      <Interruptor
        titulo="Confirmaciones de lectura"
        descripcion="Mostrar «Visto» en los mensajes. Si lo desactivas, tú tampoco lo verás."
        valor={p.confirmacionLectura}
        onCambio={(v) => store.cambiarPrivacidad({ confirmacionLectura: v })}
      />

      <Subtitulo>Cuentas bloqueadas</Subtitulo>
      {bloqueados.length === 0 ? <Parrafo suave>No has bloqueado a nadie.</Parrafo> : null}
      {bloqueados.map((b) => (
        <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar nombre={b.nombre} foto={b.foto} tam={36} />
          <Text style={{ flex: 1, color: color.tinta }}>@{b.usuario}</Text>
          <Boton pequeño tipo="secundario" texto="Desbloquear" onPress={() => store.bloquear(b.id)} />
        </View>
      ))}
      <Subtitulo>Cuentas silenciadas</Subtitulo>
      {silenciados.length === 0 ? <Parrafo suave>No has silenciado a nadie.</Parrafo> : null}
      {silenciados.map((b) => (
        <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar nombre={b.nombre} foto={b.foto} tam={36} />
          <Text style={{ flex: 1, color: color.tinta }}>@{b.usuario}</Text>
          <Boton pequeño tipo="secundario" texto="Quitar silencio" onPress={() => store.silenciar(b.id)} />
        </View>
      ))}
    </>
  );
}

function Seguridad() {
  const privados = store.misPrivados()!;
  return (
    <>
      <Interruptor
        titulo="Verificación en dos pasos"
        descripcion={
          modoDemo
            ? 'Al entrar te pediremos también un código de una app de autenticación. Se activa de verdad al conectar la nube.'
            : 'Al entrar te pediremos también un código de una app de autenticación.'
        }
        valor={privados.dosPasos}
        onCambio={(v) => store.cambiarPrivados({ dosPasos: v })}
      />
      <Interruptor
        titulo="Alertas de inicio de sesión"
        descripcion="Te avisamos cuando alguien entre en tu cuenta desde un dispositivo nuevo."
        valor={privados.alertasInicio}
        onCambio={(v) => store.cambiarPrivados({ alertasInicio: v })}
      />
      <Subtitulo>Sesiones abiertas</Subtitulo>
      <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: color.borde }}>
        <Text style={{ color: color.tinta, fontWeight: '700' }}>Este dispositivo</Text>
        <Text style={{ color: color.suave }}>{Platform.OS === 'web' ? 'Navegador web' : Platform.OS === 'ios' ? 'iPhone' : 'Android'} · Activa ahora</Text>
      </View>
      <Parrafo suave>Tus contraseñas se guardan cifradas y todas las conexiones van cifradas (HTTPS).</Parrafo>
    </>
  );
}

function ContenidoVes() {
  const privados = store.misPrivados()!;
  const mayor = store.edad(privados.nacimiento) >= EDAD_SENSIBLE;
  const [palabra, setPalabra] = useState('');
  const añadir = () => {
    const w = palabra.trim().toLowerCase();
    if (!w || privados.palabrasSilenciadas.includes(w)) return;
    store.cambiarPrivados({ palabrasSilenciadas: [...privados.palabrasSilenciadas, w] });
    setPalabra('');
  };
  return (
    <>
      <FilaMenu titulo="Tus intereses" descripcion="Lo que sale en «Para ti»." onPress={() => router.push('/intereses')} />
      <Interruptor
        titulo="Mostrar contenido sensible"
        descripcion={mayor ? 'Ver sin tapar las publicaciones marcadas como sensibles.' : `Solo disponible para mayores de ${EDAD_SENSIBLE} años.`}
        valor={privados.verSensible && mayor}
        desactivado={!mayor}
        onCambio={(v) => store.cambiarPrivados({ verSensible: v })}
      />
      <Subtitulo>Palabras silenciadas</Subtitulo>
      <Parrafo suave>No verás publicaciones que contengan estas palabras o #hashtags.</Parrafo>
      <Fila style={{ flexWrap: 'nowrap' }}>
        <View style={{ flex: 1 }}>
          <Campo etiqueta="Palabra" value={palabra} onChangeText={setPalabra} onSubmitEditing={añadir} autoCapitalize="none" />
        </View>
        <View style={{ alignSelf: 'flex-end' }}>
          <Boton pequeño texto="Añadir" onPress={añadir} />
        </View>
      </Fila>
      <Fila>
        {privados.palabrasSilenciadas.map((w) => (
          <Chip key={w} texto={`${w}  ×`} onPress={() => store.cambiarPrivados({ palabrasSilenciadas: privados.palabrasSilenciadas.filter((x) => x !== w) })} />
        ))}
      </Fila>
    </>
  );
}

function Notificaciones() {
  const n = store.misPrivados()!.notificaciones;
  const cambiar = (k: keyof typeof n, v: boolean) => store.cambiarPrivados({ notificaciones: { ...n, [k]: v } });
  return (
    <>
      <Interruptor titulo="Me gusta" valor={n.meGusta} onCambio={(v) => cambiar('meGusta', v)} />
      <Interruptor titulo="Respuestas" valor={n.respuestas} onCambio={(v) => cambiar('respuestas', v)} />
      <Interruptor titulo="Menciones" valor={n.menciones} onCambio={(v) => cambiar('menciones', v)} />
      <Interruptor titulo="Nuevos seguidores y solicitudes" valor={n.seguidores} onCambio={(v) => cambiar('seguidores', v)} />
      <Interruptor titulo="Compartidos" valor={n.compartidos} onCambio={(v) => cambiar('compartidos', v)} />
      <Interruptor titulo="Mensajes" valor={n.mensajes} onCambio={(v) => cambiar('mensajes', v)} />
      <Interruptor
        titulo="Novedades por correo"
        descripcion="Correos con novedades de la app. Puedes darte de baja cuando quieras."
        valor={n.correoNovedades}
        onCambio={(v) => cambiar('correoNovedades', v)}
      />
      <Parrafo suave>Las notificaciones del móvil se activan o desactivan también desde los ajustes del propio teléfono.</Parrafo>
    </>
  );
}

function Publicidad() {
  const privados = store.misPrivados()!;
  return (
    <>
      <Interruptor
        titulo="Anuncios según tus intereses"
        descripcion="Si lo activas, los anuncios se eligen según los temas que has elegido. Si no, verás anuncios generales."
        valor={privados.anunciosPersonalizados}
        onCambio={(v) => store.cambiarPrivados({ anunciosPersonalizados: v })}
      />
      <Aviso>
        Nunca usamos datos sensibles (salud, religión, política, orientación sexual) para anuncios, nunca vendemos tus datos y cada
        anuncio dirá claramente que es publicidad y quién lo paga. Por ahora la app no tiene anuncios.
      </Aviso>
    </>
  );
}

function Datos() {
  const privados = store.misPrivados()!;
  return (
    <>
      <Subtitulo>Qué guardamos</Subtitulo>
      <Parrafo>• Perfil público: nombre, usuario, foto, biografía, ubicación y web que tú escribas.</Parrafo>
      <Parrafo>• Datos privados (solo tú los ves): correo, fecha de nacimiento y tus ajustes.</Parrafo>
      <Parrafo>• Lo que publicas, tus respuestas, me gusta, guardados y mensajes privados.</Parrafo>
      <Parrafo>• A quién sigues, bloqueas y silencias.</Parrafo>
      <Parrafo suave>Todo se guarda en servidores de la Unión Europea (Frankfurt). Nunca vendemos tus datos.</Parrafo>

      <Subtitulo>Tus consentimientos</Subtitulo>
      {privados.consentimientos
        .slice()
        .reverse()
        .map((c, i) => (
          <Text key={i} style={{ color: color.tinta }}>
            {new Date(c.creado).toLocaleString('es-ES')} · {c.tipo.replace(/_/g, ' ')}: {c.aceptado ? 'aceptado' : 'no aceptado'}
          </Text>
        ))}

      <Subtitulo>Tus derechos</Subtitulo>
      <Parrafo>
        Puedes acceder a tus datos, corregirlos, borrarlos, llevártelos, oponerte a su uso y limitarlo. Descarga o borra desde «Tu cuenta», o
        escribe a {marca.correoPrivacidad}. Si no estás de acuerdo, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).
      </Parrafo>
      <FilaMenu titulo="Política de privacidad completa" onPress={() => router.push('/legal/privacidad')} />
    </>
  );
}

function Ayuda() {
  return (
    <>
      <FilaMenu titulo="Asistente virtual" descripcion="Pregunta cómo funciona cualquier cosa." onPress={() => router.push('/asistente')} />
      <FilaMenu titulo="Normas de la comunidad" onPress={() => router.push('/legal/normas')} />
      <View style={{ paddingVertical: 10, gap: 4 }}>
        <Text style={{ color: color.tinta, fontWeight: '700' }}>Contacto</Text>
        <Text selectable style={{ color: color.suave }}>Soporte: {marca.correoContacto}</Text>
        <Text selectable style={{ color: color.suave }}>Privacidad y delegado de protección de datos: {marca.correoPrivacidad}</Text>
        <Text selectable style={{ color: color.suave }}>Denuncias y autoridades: {marca.correoDenuncias}</Text>
      </View>
      <Parrafo suave>Para denunciar una publicación, perfil o mensaje, toca ⋯ y elige «Denunciar». Si hay un riesgo para la vida de alguien, llama al 112.</Parrafo>
    </>
  );
}
