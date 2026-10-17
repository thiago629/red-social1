# Plazzo

La red social para contarlo y enseñarlo todo: publicaciones como en X, reels e historias como en Instagram.
Funciona en el móvil (iPhone y Android) y en el ordenador con el mismo código (Expo + React Native).

![Plazzo](marca/logo-con-nombre.png)

## Qué tiene

| Parte | Qué hace |
|---|---|
| Registro | Correo, contraseña, fecha de nacimiento (mínimo 16 años), condiciones; anuncios y correos opcionales |
| Tus temas | Al entrar se eligen temas (negocios, dinero, anime, coches, viajes, diseño…) o «Ver de todo» |
| Inicio | Historias arriba, «Para ti» infinito (algoritmo) y «Siguiendo» (por fecha) |
| Reels | Vídeos verticales a pantalla completa sin final; me gusta (también con doble toque), comentarios, compartir, guardar, seguir |
| Historias | Foto, vídeo o texto con fondo de color; duran 24 horas; vistas, me gusta y respuestas por mensaje |
| Crear | Publicación, reel o historia con 24 filtros, texto y temas |
| Publicar | Texto, hasta 4 fotos con filtro, encuestas, enlaces (los de TikTok se ven con su reproductor oficial) |
| Explorar, Notificaciones, Mensajes, Perfil | Búsqueda, tendencias, avisos, chats privados y perfil con privacidad por cuenta |
| Ajustes y legal | Privacidad, seguridad, datos, publicidad y textos legales (RGPD, LSSI, DSA) |

Se puede publicar de todo menos cosas ilegales.

## Probar en el ordenador

```bash
npm install
npx expo start --web
```

## Publicar

**Web (GitHub Pages).** Cada vez que se sube algo a `main`, la acción `.github/workflows/web.yml` genera la web y la deja en la rama `gh-pages`.
Una sola vez: *Settings → Pages → Deploy from a branch → `gh-pages` / `(root)`*. La web queda en `https://<usuario>.github.io/<repo>`.

**Dominio propio (plazzo.app).** Se compra en un registrador (Namecheap, Cloudflare, DonDominio…). Después:
1. En el registrador, registros DNS `A` a `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (y `CNAME www` a `<usuario>.github.io`).
2. En el repo, *Settings → Secrets and variables → Actions → Variables*: `DOMINIO` = `plazzo.app`.
3. *Settings → Pages → Custom domain*: `plazzo.app` y marcar *Enforce HTTPS*.

**iPhone y Android.** Se compilan en la nube con EAS (no hace falta Mac):
```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform all --profile production
npx eas-cli@latest submit --platform ios      # App Store (cuenta de Apple Developer, 99 $/año)
npx eas-cli@latest submit --platform android  # Google Play (cuenta de desarrollador, 25 $ una vez)
```

## Nube

Sin variables de entorno la app funciona en modo prueba (datos en el propio dispositivo).
Con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` usa Supabase (servidores en Frankfurt). Migraciones en `supabase/migrations`.

## Marca

Logo e iconos en `marca/`. El nombre se cambia en `src/lib/config.ts`, `app.json` y `public/manifest.json`.
