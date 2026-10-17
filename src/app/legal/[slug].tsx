import { Stack, useLocalSearchParams } from 'expo-router';
import { Markdown } from '../../components/Markdown';
import { Pantalla, Parrafo, Titulo } from '../../components/ui';
import { PESOS } from '../../lib/algoritmo';
import { marca } from '../../lib/config';
import { TEXTOS } from '../../legal/textos';

// Explicación del algoritmo (DSA art. 27): la escribe la app con los pesos reales.
const ALGORITMO = `## Dos formas de ver el inicio

- **Siguiendo**: solo la gente que sigues y lo que comparte, de más nuevo a más antiguo. Sin algoritmo.
- **Para ti**: publicaciones ordenadas por puntos según tus gustos.

## Qué sale en «Para ti»

Al crear la cuenta eliges tus temas (negocios, dinero, anime, coches, viajes, diseño…) o «Ver de todo». Si eliges temas, en «Para ti» solo salen publicaciones de esos temas y de la gente que sigues. Puedes cambiarlos cuando quieras en Ajustes > Tus intereses.

## Inicio y reels sin final

«Para ti» y Reels no se acaban: cuando has visto lo nuevo de tus temas, seguimos con más de tus temas y, de cada cuatro publicaciones, una de otros temas para que descubras cosas nuevas. Puedes parar cuando quieras; «Siguiendo» sí tiene final.

## Cómo se ordena

puntos = (1 + interacciones) × afinidad × calidad ÷ (horas + 2)^1,5

| Señal | Peso |
| --- | --- |
| Me gusta | ${PESOS.meGusta} |
| Compartido | ${PESOS.compartir} |
| Guardado | ${PESOS.guardar} |
| Voto en encuesta | ${PESOS.voto} |
| Respuesta | ${PESOS.respuesta} |
| Respuesta del autor | ${PESOS.respuestaDelAutor} |
| «No me interesa» | ${PESOS.noMeInteresa} |
| Denuncia | ${PESOS.denuncia} |

- **Afinidad**: sube si sigues al autor, si habéis hablado y por cada tema tuyo que coincide.
- **Calidad**: baja a la mitad si la publicación tiene denuncias.
- **Tiempo**: las publicaciones van bajando con las horas.
- Nunca salen dos seguidas de la misma persona si se puede evitar.

## Qué no usamos

Nunca usamos tu fecha de nacimiento, tu correo ni datos sensibles (salud, religión, política, orientación sexual) para ordenar el inicio.

## Tu control

En cada publicación, toca ⋯ y «¿Por qué veo esto?» para ver los motivos, o «No me interesa» para dejar de verla.`;

export default function Legal() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const pagina = slug === 'algoritmo' ? { titulo: 'Cómo funciona el algoritmo', md: ALGORITMO } : TEXTOS[slug];
  if (!pagina) return <Pantalla><Parrafo suave>Página no encontrada.</Parrafo></Pantalla>;
  const rellenar = (t: string) => t.replace(/\{\{NOMBRE\}\}/g, marca.nombre).replace(/\{\{DOMINIO\}\}/g, marca.dominio);

  return (
    <Pantalla>
      <Stack.Screen options={{ title: rellenar(pagina.titulo) }} />
      <Titulo>{rellenar(pagina.titulo)}</Titulo>
      <Markdown md={rellenar(pagina.md)} />
    </Pantalla>
  );
}
