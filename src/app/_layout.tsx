import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AvisoCookies } from '../components/AvisoCookies';
import { color, marca } from '../lib/config';
import { cargar } from '../lib/store';

export default function Raiz() {
  const [listo, setListo] = useState(false);

  useEffect(() => {
    cargar().finally(() => setListo(true));
  }, []);

  if (!listo) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.papel }}>
        <ActivityIndicator color={color.tinta} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.papel }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: color.papel },
          headerTintColor: color.tinta,
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: color.papel },
          headerBackTitle: 'Atrás',
          title: marca.nombre,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="entrar" options={{ headerShown: false }} />
        <Stack.Screen name="intereses" options={{ title: 'Tus intereses' }} />
        <Stack.Screen name="publicar" options={{ title: 'Publicar', presentation: 'modal' }} />
        <Stack.Screen name="post/[id]" options={{ title: 'Publicación' }} />
        <Stack.Screen name="usuario/[id]" options={{ title: 'Perfil' }} />
        <Stack.Screen name="u/[usuario]" options={{ title: 'Perfil' }} />
        <Stack.Screen name="chat/[id]" options={{ title: 'Mensajes' }} />
        <Stack.Screen name="enlace" options={{ title: 'Enlace' }} />
        <Stack.Screen name="compartir" options={{ title: 'Compartir' }} />
        <Stack.Screen name="crear" options={{ title: 'Crear', presentation: 'modal' }} />
        <Stack.Screen name="historias/[id]" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade', contentStyle: { backgroundColor: '#000' } }} />
        <Stack.Screen name="asistente" options={{ title: 'Asistente' }} />
        <Stack.Screen name="ajustes/index" options={{ title: 'Ajustes' }} />
        <Stack.Screen name="ajustes/[seccion]" options={{ title: 'Ajustes' }} />
        <Stack.Screen name="legal/[slug]" options={{ title: 'Información legal' }} />
      </Stack>
      <AvisoCookies />
    </View>
  );
}
