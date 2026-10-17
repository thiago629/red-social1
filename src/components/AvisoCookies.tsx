import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { color } from '../lib/config';
import * as store from '../lib/store';
import { Boton, Casilla, Fila } from './ui';

// Banner de cookies de la web (LSSI art. 22.2 y guía de cookies de la AEPD):
// aceptar y rechazar igual de fáciles, y nada opcional activado hasta que se decida.
export function AvisoCookies() {
  store.useVersion();
  const [configurar, setConfigurar] = useState(false);
  const [estadisticas, setEstadisticas] = useState(false);
  const [publicidad, setPublicidad] = useState(false);

  if (Platform.OS !== 'web' || store.get().cookies.decidido) return null;

  return (
    <View
      accessibilityRole="alert"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: color.tarjeta,
        borderTopWidth: 1,
        borderTopColor: color.borde,
        padding: 16,
        gap: 10,
        zIndex: 10,
      }}
    >
      <View style={{ maxWidth: 640, width: '100%', alignSelf: 'center', gap: 10 }}>
        <Text style={{ fontWeight: '700', color: color.tinta, fontSize: 16 }}>Cookies</Text>
        <Text style={{ color: color.tinta, lineHeight: 21 }}>
          Usamos cookies necesarias para que la web funcione. Con tu permiso, también usamos cookies de estadísticas y de
          publicidad. Puedes cambiarlo cuando quieras en Ajustes.
        </Text>
        {configurar ? (
          <View style={{ gap: 8 }}>
            <Casilla marcada onCambio={() => {}}>Necesarias (siempre activas)</Casilla>
            <Casilla marcada={estadisticas} onCambio={setEstadisticas}>
              Estadísticas: saber qué pantallas se usan para mejorar la app.
            </Casilla>
            <Casilla marcada={publicidad} onCambio={setPublicidad}>
              Publicidad: medir anuncios.
            </Casilla>
          </View>
        ) : null}
        <Fila>
          <Boton texto="Aceptar todas" onPress={() => store.decidirCookies(true, true)} />
          <Boton texto="Rechazar todas" onPress={() => store.decidirCookies(false, false)} />
          {configurar ? (
            <Boton tipo="secundario" texto="Guardar selección" onPress={() => store.decidirCookies(estadisticas, publicidad)} />
          ) : (
            <Boton tipo="secundario" texto="Configurar" onPress={() => setConfigurar(true)} />
          )}
        </Fila>
      </View>
    </View>
  );
}
