import { router } from 'expo-router';
import { Platform, Text } from 'react-native';
import { FilaMenu, Pantalla, Subtitulo } from '../../components/ui';
import { color, marca, modoDemo } from '../../lib/config';
import * as store from '../../lib/store';

export default function Ajustes() {
  store.useVersion();
  const yo = store.yo();
  if (!yo) return null;
  const ir = (s: string) => router.push(`/ajustes/${s}`);

  return (
    <Pantalla>
      <Text style={{ color: color.suave }}>@{yo.usuario}</Text>
      <FilaMenu titulo="Tu cuenta" descripcion="Nombre, usuario, correo, contraseña, descargar tus datos o borrar la cuenta." onPress={() => ir('cuenta')} />
      <FilaMenu titulo="Privacidad" descripcion="Cuenta privada, quién te escribe, te menciona o te responde, bloqueados y silenciados." onPress={() => ir('privacidad')} />
      <FilaMenu titulo="Seguridad" descripcion="Verificación en dos pasos, alertas de inicio de sesión y sesiones abiertas." onPress={() => ir('seguridad')} />
      <FilaMenu titulo="Tus intereses" descripcion={yo.verTodo ? 'Viendo de todo.' : yo.intereses.join(', ')} onPress={() => router.push('/intereses')} />
      <FilaMenu titulo="Contenido que ves" descripcion="Contenido sensible y palabras silenciadas." onPress={() => ir('contenido')} />
      <FilaMenu titulo="Notificaciones" descripcion="Elige de qué quieres enterarte." onPress={() => ir('notificaciones')} />
      <FilaMenu titulo="Publicidad" descripcion="Anuncios según tus intereses o generales." onPress={() => ir('publicidad')} />
      {Platform.OS === 'web' ? <FilaMenu titulo="Cookies" descripcion="Cambia qué cookies aceptas." onPress={store.reabrirCookies} /> : null}
      <FilaMenu titulo="Tus datos y permisos" descripcion="Qué datos guardamos, tus consentimientos y tus derechos." onPress={() => ir('datos')} />
      <FilaMenu titulo="Ayuda" descripcion="Asistente virtual, contacto y cómo denunciar." onPress={() => ir('ayuda')} />

      <Subtitulo>Información legal</Subtitulo>
      {[
        ['privacidad', 'Política de privacidad'],
        ['condiciones', 'Condiciones de uso'],
        ['normas', 'Normas de la comunidad'],
        ['algoritmo', 'Cómo funciona el algoritmo'],
        ['cookies', 'Política de cookies'],
        ['aviso-legal', 'Aviso legal'],
      ].map(([slug, t]) => (
        <FilaMenu key={slug} titulo={t} onPress={() => router.push(`/legal/${slug}`)} />
      ))}

      <FilaMenu
        titulo="Cerrar sesión"
        peligro
        onPress={() => {
          store.salir();
          router.replace('/entrar');
        }}
      />
      {modoDemo ? (
        <FilaMenu
          titulo="Reiniciar los datos de prueba"
          descripcion="Borra todo lo de este dispositivo y vuelve a los ejemplos."
          onPress={() => {
            store.reiniciarDemo();
            router.replace('/entrar');
          }}
        />
      ) : null}
      <Text style={{ color: color.suave, fontSize: 12, marginTop: 8 }}>
        {marca.nombre} · versión 1.0 · Datos guardados en la Unión Europea
      </Text>
    </Pantalla>
  );
}
