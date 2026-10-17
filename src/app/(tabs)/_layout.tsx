import { Redirect, router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, Text, useWindowDimensions } from 'react-native';
import { Logo } from '../../components/Logo';
import { color } from '../../lib/config';
import * as store from '../../lib/store';

function Icono({ simbolo, foco }: { simbolo: string; foco: boolean }) {
  return <Text style={{ fontSize: 22, color: foco ? color.tinta : color.suave, fontWeight: foco ? '800' : '400' }}>{simbolo}</Text>;
}

function BotonCabecera({ texto, ruta }: { texto: string; ruta: '/asistente' | '/ajustes' }) {
  return (
    <Pressable onPress={() => router.push(ruta)} accessibilityRole="button" style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
      <Text style={{ color: color.tinta, fontWeight: '700' }}>{texto}</Text>
    </Pressable>
  );
}

export default function LayoutPestanas() {
  store.useVersion();
  const { width } = useWindowDimensions();
  const ancho = width >= 768;
  const estado = store.get();
  const yo = store.yo();
  if (!estado.sesionId || !yo) return <Redirect href="/entrar" />;
  if (!yo.interesesElegidos) return <Redirect href="/intereses" />;

  const avisosSinLeer = estado.avisos.filter((a) => a.paraId === yo.id && !a.leido).length + (estado.solicitudes[yo.id] ?? []).length;
  const mensajesSinLeer = estado.conversaciones.filter((c) => c.miembros.includes(yo.id) && store.sinLeer(c) > 0).length;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: color.papel, borderBottomColor: color.borde, borderBottomWidth: 1, shadowOpacity: 0, elevation: 0 },
        headerTintColor: color.tinta,
        headerTitleStyle: { fontWeight: '800' },
        headerTitleAlign: ancho ? 'left' : 'center',
        tabBarPosition: ancho ? 'left' : 'bottom',
        tabBarLabelPosition: ancho ? 'beside-icon' : undefined,
        tabBarShowLabel: ancho,
        tabBarActiveTintColor: color.tinta,
        tabBarActiveBackgroundColor: ancho ? color.gris : undefined,
        tabBarInactiveTintColor: color.tinta,
        tabBarLabelStyle: ancho ? { fontSize: 18 } : undefined,
        tabBarStyle: ancho
          ? { backgroundColor: color.papel, borderRightColor: color.borde, width: 240, paddingTop: 12 }
          : { backgroundColor: color.papel, borderTopColor: color.borde },
        tabBarBadgeStyle: { backgroundColor: color.acento },
        sceneStyle: { backgroundColor: color.papel },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          headerTitle: () => <Logo tam={28} />,
          tabBarIcon: ({ focused }) => <Icono simbolo="⌂" foco={focused} />,
          headerRight: () => <BotonCabecera texto="✦ Asistente" ruta="/asistente" />,
        }}
      />
      <Tabs.Screen name="explorar" options={{ title: 'Explorar', tabBarIcon: ({ focused }) => <Icono simbolo="⌕" foco={focused} /> }} />
      <Tabs.Screen name="reels" options={{ title: 'Reels', headerShown: false, tabBarIcon: ({ focused }) => <Icono simbolo="▶" foco={focused} /> }} />
      <Tabs.Screen
        name="avisos"
        options={{ title: 'Notificaciones', tabBarBadge: avisosSinLeer || undefined, tabBarIcon: ({ focused }) => <Icono simbolo="🔔︎" foco={focused} /> }}
      />
      <Tabs.Screen
        name="mensajes"
        options={{ title: 'Mensajes', tabBarBadge: mensajesSinLeer || undefined, tabBarIcon: ({ focused }) => <Icono simbolo="✉" foco={focused} /> }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <Icono simbolo="◉" foco={focused} />,
          headerRight: () => <BotonCabecera texto="⚙ Ajustes" ruta="/ajustes" />,
        }}
      />
    </Tabs>
  );
}
