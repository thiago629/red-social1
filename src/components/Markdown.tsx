import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { color } from '../lib/config';

// Muestra los textos legales (Markdown sencillo): títulos, párrafos, listas, tablas, citas, negritas y enlaces.
function enLinea(texto: string): ReactNode[] {
  const partes = texto.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return partes.map((p, i) => {
    const negrita = p.match(/^\*\*(.+)\*\*$/);
    if (negrita) return <Text key={i} style={{ fontWeight: '700' }}>{negrita[1]}</Text>;
    const enlace = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (enlace) {
      const [, t, url] = enlace;
      return (
        <Text
          key={i}
          style={{ color: color.acento }}
          onPress={() => (url.startsWith('/') ? router.push(url as '/legal/privacidad') : router.push({ pathname: '/enlace', params: { url } }))}
        >
          {t}
        </Text>
      );
    }
    return p;
  });
}

export function Markdown({ md }: { md: string }) {
  const lineas = md.split('\n');
  const bloques: ReactNode[] = [];
  let i = 0;
  while (i < lineas.length) {
    const l = lineas[i];
    if (!l.trim()) {
      i++;
      continue;
    }
    if (l.startsWith('|')) {
      const filas: string[][] = [];
      while (i < lineas.length && lineas[i].startsWith('|')) {
        if (!/^\|\s*-/.test(lineas[i])) filas.push(lineas[i].split('|').slice(1, -1).map((c) => c.trim()));
        i++;
      }
      bloques.push(
        <ScrollView key={i} horizontal style={{ borderWidth: 1, borderColor: color.borde, borderRadius: 8 }}>
          <View>
            {filas.map((f, j) => (
              <View key={j} style={{ flexDirection: 'row', borderBottomWidth: j < filas.length - 1 ? 1 : 0, borderBottomColor: color.borde, backgroundColor: j === 0 ? color.gris : color.papel }}>
                {f.map((c, k) => (
                  <Text key={k} style={{ width: 200, padding: 8, fontSize: 13, lineHeight: 18, color: color.tinta, fontWeight: j === 0 ? '700' : '400' }}>
                    {enLinea(c)}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>,
      );
      continue;
    }
    const h = l.match(/^(#{2,4}) (.+)/);
    if (h) {
      bloques.push(
        <Text key={i} style={{ fontSize: h[1].length === 2 ? 19 : 16, fontWeight: '800', color: color.tinta, marginTop: 8 }}>
          {enLinea(h[2])}
        </Text>,
      );
    } else if (l.startsWith('>')) {
      bloques.push(
        <View key={i} style={{ borderLeftWidth: 3, borderLeftColor: color.acento, paddingLeft: 10 }}>
          <Text style={{ color: color.suave, lineHeight: 21 }}>{enLinea(l.replace(/^>\s?/, ''))}</Text>
        </View>,
      );
    } else if (/^(\s*[-*]|\s*\d+\.)\s/.test(l)) {
      const num = l.match(/^\s*(\d+)\./);
      bloques.push(
        <View key={i} style={{ flexDirection: 'row', gap: 8, paddingLeft: 4 }}>
          <Text style={{ color: color.tinta }}>{num ? `${num[1]}.` : '•'}</Text>
          <Text style={{ flex: 1, color: color.tinta, lineHeight: 21 }}>{enLinea(l.replace(/^\s*([-*]|\d+\.)\s/, ''))}</Text>
        </View>,
      );
    } else {
      bloques.push(
        <Text key={i} style={{ color: color.tinta, lineHeight: 22, fontSize: 15 }}>
          {enLinea(l)}
        </Text>,
      );
    }
    i++;
  }
  return <View style={{ gap: 10 }}>{bloques}</View>;
}
