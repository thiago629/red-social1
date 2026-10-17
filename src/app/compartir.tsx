import { Redirect, useLocalSearchParams } from 'expo-router';
import * as store from '../lib/store';

// Llega aquí lo que alguien comparte desde otra app (barra de compartir del móvil):
// en la web, por el "share_target" de public/manifest.json; en las apps de las tiendas, por la extensión de compartir.
// Se abre Publicar con el texto y el enlace ya puestos.
export default function Compartir() {
  store.useVersion();
  const { title, text, url } = useLocalSearchParams<{ title?: string; text?: string; url?: string }>();
  if (!store.yo()) return <Redirect href="/entrar" />;

  // Muchas apps meten el enlace dentro del texto en vez de en "url".
  let texto = [title, text].filter(Boolean).join('\n').trim();
  let enlace = url ?? '';
  if (!enlace) {
    const encontrado = texto.match(/https?:\/\/\S+/i)?.[0];
    if (encontrado) {
      enlace = encontrado;
      texto = texto.replace(encontrado, '').trim();
    }
  }
  return <Redirect href={{ pathname: '/publicar', params: { texto, enlace } }} />;
}
