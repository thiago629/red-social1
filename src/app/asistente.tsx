import { useState } from 'react';
import { Text, View } from 'react-native';
import { Aviso, Boton, Campo, Chip, Fila, Pantalla } from '../components/ui';
import { color, modoDemo } from '../lib/config';

type Mensaje = { de: 'yo' | 'asistente'; texto: string };

// En la versión real, la pregunta va a una función del servidor que llama a la IA.
// La clave de la IA vive solo en el servidor, nunca en la app.
const RESPUESTAS: [RegExp, string][] = [
  [/reel|v[ií]deo/i, 'En la pestaña Reels desliza hacia arriba para ver más vídeos; nunca se acaban. Para subir el tuyo pulsa «＋ Subir reel» o el botón + y elige «Reel». Puedes poner filtros, descripción y temas.'],
  [/historia|stor/i, 'Toca «Tu historia» arriba en Inicio o el botón + y elige «Historia». Puedes subir una foto, un vídeo o solo texto, con filtros. Desaparece a las 24 horas.'],
  [/filtro/i, 'Al subir una foto, un reel o una historia verás más de 20 filtros debajo de la vista previa. Toca el que quieras.'],
  [/tema|interes|ver de todo/i, 'Ve a Ajustes > Tus intereses. Puedes elegir los temas que quieras o pulsar «Ver de todo».'],
  [/privad|perfil/i, 'Ve a Ajustes > Privacidad. Ahí puedes hacer tu cuenta privada y elegir quién te escribe, te menciona o te responde.'],
  [/mensaje|escrib/i, 'En la pestaña Mensajes pulsa «Nuevo mensaje». Cada persona elige en Ajustes > Privacidad quién le puede escribir.'],
  [/foto|imagen|encuesta|public/i, 'Toca el botón azul + para publicar. Puedes añadir hasta 4 fotos, una encuesta o un enlace. Se puede publicar de todo menos cosas ilegales.'],
  [/borrar|eliminar|cuenta/i, 'En Ajustes > Tu cuenta, al final, está «Borrar mi cuenta». Se borran tu perfil, tus publicaciones, tus mensajes y tus datos privados.'],
  [/datos|descargar|copia/i, 'En Ajustes > Tu cuenta, pulsa «Descargar mis datos» y tendrás una copia de todo lo que guardamos sobre ti.'],
  [/contraseña|seguridad|hack|robar/i, 'En Ajustes > Seguridad puedes activar la verificación en dos pasos y las alertas de inicio de sesión.'],
  [/denunci|acoso|insult/i, 'Toca ⋯ en la publicación y elige «Denunciar». También puedes bloquear o silenciar a esa persona.'],
  [/algoritmo|para ti|por qué/i, '«Para ti» ordena según tus intereses, a quién sigues y las respuestas que tiene cada publicación. Si prefieres verlo sin algoritmo, usa «Siguiendo».'],
  [/anunci|publicidad/i, 'Por ahora apenas hay anuncios. Si activas los anuncios personalizados en Ajustes, se basarán solo en los intereses que elijas, nunca en datos sensibles.'],
];

function responder(pregunta: string) {
  for (const [patron, respuesta] of RESPUESTAS) if (patron.test(pregunta)) return respuesta;
  return 'Aún estoy aprendiendo. Puedo ayudarte con tus temas, privacidad, mensajes, publicar, tu cuenta, tus datos, seguridad, denuncias, el algoritmo y la publicidad.';
}

export default function Asistente() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { de: 'asistente', texto: 'Hola, soy el asistente virtual. Soy una inteligencia artificial, no una persona. ¿En qué te ayudo?' },
  ]);
  const [texto, setTexto] = useState('');

  const enviar = (pregunta = texto) => {
    if (!pregunta.trim()) return;
    setMensajes((m) => [...m, { de: 'yo', texto: pregunta.trim() }, { de: 'asistente', texto: responder(pregunta) }]);
    setTexto('');
  };

  return (
    <Pantalla>
      {modoDemo ? <Aviso>Versión de prueba: respuestas preparadas. En la versión real responde la IA.</Aviso> : null}
      {mensajes.map((m, i) => (
        <View
          key={i}
          style={{
            alignSelf: m.de === 'yo' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            backgroundColor: m.de === 'yo' ? color.acento : color.borde,
            borderColor: color.borde,
            borderWidth: 0,
            borderRadius: 20,
            padding: 12,
          }}
        >
          <Text style={{ color: m.de === 'yo' ? '#fff' : color.tinta, lineHeight: 21 }}>{m.texto}</Text>
        </View>
      ))}
      <Fila>
        {['¿Cómo cambio mis temas?', '¿Cómo hago mi cuenta privada?', '¿Cómo funciona Para ti?'].map((s) => (
          <Chip key={s} texto={s} onPress={() => enviar(s)} />
        ))}
      </Fila>
      <Campo etiqueta="Tu pregunta" value={texto} onChangeText={setTexto} onSubmitEditing={() => enviar()} returnKeyType="send" />
      <Boton texto="Enviar" onPress={() => enviar()} desactivado={!texto.trim()} />
    </Pantalla>
  );
}
