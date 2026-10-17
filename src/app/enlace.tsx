import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { Aviso, Boton, Fila, Pantalla, Parrafo, Tarjeta, Titulo } from '../components/ui';
import { dominio, enlaceSospechoso } from '../lib/moderacion';
import { color } from '../lib/config';

// Los enlaces se abren dentro de la app, como en Facebook:
// en el móvil con el navegador integrado; en el ordenador en una pestaña nueva, sin cerrar la red social.
export default function Enlace() {
  const { url } = useLocalSearchParams<{ url: string }>();
  if (!url || !/^https?:\/\//i.test(url)) {
    return <Pantalla><Parrafo suave>Enlace no válido.</Parrafo></Pantalla>;
  }
  const peligro = enlaceSospechoso(url);

  const abrir = async () => {
    await WebBrowser.openBrowserAsync(url, {
      toolbarColor: color.papel,
      controlsColor: color.tinta,
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
  };

  return (
    <Pantalla>
      <Titulo>{dominio(url)}</Titulo>
      <Tarjeta>
        <Parrafo suave>{url}</Parrafo>
      </Tarjeta>
      {peligro ? (
        <Aviso tipo="peligro">Cuidado: este enlace se parece a otros que se usan para engañar o robar contraseñas. No escribas tus datos si no estás seguro.</Aviso>
      ) : null}
      <Parrafo suave>
        {Platform.OS === 'web'
          ? 'Se abrirá en una pestaña nueva y esta página seguirá abierta.'
          : 'Se abrirá dentro de la app. Cuando cierres la página, volverás aquí.'}
      </Parrafo>
      <Fila>
        <Boton texto={peligro ? 'Abrir de todas formas' : 'Abrir'} tipo={peligro ? 'peligro' : 'principal'} onPress={abrir} />
        <Boton tipo="secundario" texto="Volver" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </Fila>
    </Pantalla>
  );
}
