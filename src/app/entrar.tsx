import { Link, Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Logo } from '../components/Logo';
import { Aviso, Boton, Campo, Casilla, Fila, Pantalla, Parrafo, Titulo } from '../components/ui';
import { color, EDAD_MINIMA, marca, modoDemo } from '../lib/config';
import * as store from '../lib/store';

function edad(dia: string, mes: string, anio: string) {
  const d = Number(dia), m = Number(mes), a = Number(anio);
  const fecha = new Date(a, m - 1, d);
  if (!d || !m || !a || fecha.getDate() !== d || fecha.getMonth() !== m - 1 || a < 1900 || fecha > new Date()) return null;
  return store.edad(`${a}-${m}-${d}`);
}

const correoValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export default function Entrar() {
  store.useVersion();
  const [modo, setModo] = useState<'inicio' | 'registro' | 'entrar'>('inicio');
  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [dia, setDia] = useState('');
  const [mes, setMes] = useState('');
  const [anio, setAnio] = useState('');
  const [terminos, setTerminos] = useState(false);
  const [anuncios, setAnuncios] = useState(false);
  const [novedades, setNovedades] = useState(false);
  const [error, setError] = useState('');

  if (store.get().sesionId) return <Redirect href="/" />;

  const registrar = () => {
    const e = edad(dia, mes, anio);
    if (!nombre.trim()) return setError('Escribe tu nombre.');
    if (!/^@?[a-zA-Z0-9_]{3,20}$/.test(usuario.trim())) return setError('El usuario debe tener de 3 a 20 letras, números o guiones bajos.');
    if (!correoValido(email)) return setError('El correo no es válido.');
    if (clave.length < 8 || !/\d/.test(clave) || !/[a-zA-Z]/.test(clave)) return setError('La contraseña debe tener al menos 8 caracteres, con letras y números.');
    if (e === null) return setError('La fecha de nacimiento no es válida.');
    if (e < EDAD_MINIMA) return setError(`Tienes que tener al menos ${EDAD_MINIMA} años para crear una cuenta.`);
    if (!terminos) return setError('Tienes que aceptar las condiciones y haber leído la política de privacidad.');
    const fallo = store.registrar({
      nombre,
      usuario,
      email,
      nacimiento: `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`,
      anunciosPersonalizados: anuncios,
      correoNovedades: novedades,
    });
    if (fallo) return setError(fallo);
    router.replace('/intereses');
  };

  const entrar = () => {
    if (!correoValido(email)) return setError('Escribe tu correo.');
    const fallo = store.entrarComo(email);
    if (fallo) return setError(fallo);
    router.replace(store.yo()?.interesesElegidos ? '/' : '/intereses');
  };

  const cambiar = (m: typeof modo) => {
    setModo(m);
    setError('');
  };

  return (
    <Pantalla ancho={480}>
      <View style={{ gap: 8, marginTop: 28 }}>
        <Logo tam={48} />
        <Text style={{ color: color.suave, fontSize: 15 }}>{marca.eslogan}</Text>
      </View>

      {modo === 'inicio' ? (
        <View style={{ gap: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 34, fontWeight: '900', color: color.tinta, lineHeight: 40 }}>Lo que está pasando ahora</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: color.tinta }}>Únete hoy.</Text>
          <Boton texto="Crear cuenta" onPress={() => cambiar('registro')} />
          <Parrafo suave style={{ fontSize: 12 }}>
            Al registrarte, aceptas las <Link href="/legal/condiciones" style={{ color: color.acento }}>condiciones de uso</Link> y la{' '}
            <Link href="/legal/privacidad" style={{ color: color.acento }}>política de privacidad</Link>, incluida la{' '}
            <Link href="/legal/cookies" style={{ color: color.acento }}>política de cookies</Link>.
          </Parrafo>
          <Text style={{ fontSize: 16, fontWeight: '800', color: color.tinta, marginTop: 12 }}>¿Ya tienes una cuenta?</Text>
          <Boton tipo="secundario" texto="Iniciar sesión" onPress={() => cambiar('entrar')} />
        </View>
      ) : null}

      {modo !== 'inicio' && modoDemo ? (
        <Aviso>Versión de prueba: la cuenta se guarda solo en este dispositivo. La contraseña no se guarda aquí; en la versión real la guarda la nube cifrada.</Aviso>
      ) : null}

      {modo === 'registro' ? (
        <View style={{ gap: 14 }}>
          <Titulo>Crea tu cuenta</Titulo>
          <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} autoComplete="name" maxLength={50} />
          <Campo etiqueta="Nombre de usuario" value={usuario} onChangeText={setUsuario} autoCapitalize="none" placeholder="@usuario" maxLength={21} />
          <Campo etiqueta="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Campo etiqueta="Contraseña" value={clave} onChangeText={setClave} secureTextEntry autoComplete="new-password" ayuda="Mínimo 8 caracteres, con letras y números." />
          <Text style={{ fontWeight: '700', color: color.tinta, fontSize: 15 }}>Fecha de nacimiento</Text>
          <Text style={{ color: color.suave, fontSize: 13, marginTop: -8 }}>
            No se muestra en tu perfil. Solo sirve para comprobar que tienes {EDAD_MINIMA} años o más.
          </Text>
          <Fila style={{ flexWrap: 'nowrap' }}>
            <View style={{ flex: 1 }}><Campo etiqueta="Día" value={dia} onChangeText={setDia} keyboardType="number-pad" maxLength={2} /></View>
            <View style={{ flex: 1 }}><Campo etiqueta="Mes" value={mes} onChangeText={setMes} keyboardType="number-pad" maxLength={2} /></View>
            <View style={{ flex: 1.4 }}><Campo etiqueta="Año" value={anio} onChangeText={setAnio} keyboardType="number-pad" maxLength={4} /></View>
          </Fila>

          <Casilla marcada={terminos} onCambio={setTerminos}>
            Acepto las <Link href="/legal/condiciones" style={{ color: color.acento }}>condiciones de uso</Link> y las{' '}
            <Link href="/legal/normas" style={{ color: color.acento }}>normas de la comunidad</Link>, y he leído la{' '}
            <Link href="/legal/privacidad" style={{ color: color.acento }}>política de privacidad</Link>.
          </Casilla>
          <Casilla marcada={anuncios} onCambio={setAnuncios}>
            Quiero ver anuncios según mis intereses (opcional). Si no lo marcas, los anuncios serán generales.
          </Casilla>
          <Casilla marcada={novedades} onCambio={setNovedades}>
            Quiero recibir novedades por correo (opcional).
          </Casilla>

          {error ? <Aviso tipo="peligro">{error}</Aviso> : null}
          <Boton tipo="negro" texto="Crear cuenta" onPress={registrar} />
          <Boton tipo="texto" texto="Ya tengo cuenta" onPress={() => cambiar('entrar')} />
        </View>
      ) : null}

      {modo === 'entrar' ? (
        <View style={{ gap: 14 }}>
          <Titulo>Inicia sesión</Titulo>
          <Campo etiqueta="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Campo etiqueta="Contraseña" value={clave} onChangeText={setClave} secureTextEntry autoComplete="current-password" />
          {error ? <Aviso tipo="peligro">{error}</Aviso> : null}
          <Boton tipo="negro" texto="Iniciar sesión" onPress={entrar} />
          <Boton tipo="texto" texto="¿Has olvidado tu contraseña?" onPress={() => setError('En la versión real te llegará un correo para cambiarla.')} />
          <Boton tipo="texto" texto="Crear una cuenta nueva" onPress={() => cambiar('registro')} />
        </View>
      ) : null}

      <Fila style={{ marginTop: 24 }}>
        {[
          ['/legal/privacidad', 'Privacidad'],
          ['/legal/condiciones', 'Condiciones'],
          ['/legal/normas', 'Normas'],
          ['/legal/cookies', 'Cookies'],
          ['/legal/aviso-legal', 'Aviso legal'],
        ].map(([href, t]) => (
          <Link key={href} href={href as '/legal/privacidad'} style={{ color: color.suave, fontSize: 13 }}>
            {t}
          </Link>
        ))}
      </Fila>
    </Pantalla>
  );
}
