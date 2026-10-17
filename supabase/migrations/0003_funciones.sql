-- Funciones de la versión 1: ajustes de privacidad por cuenta, intereses con "Ver de todo",
-- fotos, encuestas, guardados, solicitudes de seguimiento, palabras silenciadas y mensajes privados.

-- ---------- Ajustes de privacidad (perfil) ----------
alter table public.perfiles
  add column ubicacion text not null default '' check (char_length(ubicacion) <= 30),
  add column web text not null default '' check (char_length(web) <= 100),
  add column foto_url text,
  add column ver_todo boolean not null default false,
  add column intereses_elegidos boolean not null default false,
  add column quien_menciona text not null default 'todos' check (quien_menciona in ('todos', 'seguidos', 'nadie')),
  add column quien_responde text not null default 'todos' check (quien_responde in ('todos', 'seguidos', 'mencionados')),
  add column ocultar_me_gusta boolean not null default false,
  add column encontrar_por_correo boolean not null default false,
  add column confirmacion_lectura boolean not null default true;

-- ---------- Ajustes privados ----------
alter table public.datos_privados
  add column ver_sensible boolean not null default false,
  add column dos_pasos boolean not null default false,
  add column alertas_inicio boolean not null default true,
  add column notificaciones jsonb not null default
    '{"meGusta":true,"respuestas":true,"menciones":true,"seguidores":true,"compartidos":true,"mensajes":true,"correoNovedades":false}';

-- Contenido sensible solo para mayores de 18.
alter table public.datos_privados
  add constraint sensible_mayores check (not ver_sensible or nacimiento <= (current_date - interval '18 years'));

create table public.palabras_silenciadas (
  usuario_id uuid references auth.users (id) on delete cascade,
  palabra text not null check (char_length(palabra) between 1 and 50),
  primary key (usuario_id, palabra)
);
alter table public.palabras_silenciadas enable row level security;
create policy "mis palabras" on public.palabras_silenciadas for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Nuevos intereses (la lista completa está en src/lib/config.ts).
insert into public.intereses (id) values
  ('Empresarios'), ('Dinero e inversión'), ('Criptomonedas'), ('Emprender'), ('Marketing'), ('Inmobiliaria'),
  ('Lujo'), ('Relojes'), ('Motos'), ('Diseño de interiores'), ('Diseño de exteriores'), ('Arquitectura'),
  ('Anime y manga'), ('Cómics'), ('Inteligencia artificial'), ('Ciencia'), ('Baloncesto'), ('Deportes'),
  ('Gimnasio'), ('Salud y bienestar'), ('Belleza'), ('Humor y memes'), ('Fotografía'), ('Arte y dibujo'),
  ('Libros'), ('Mascotas'), ('Naturaleza'), ('Familia'), ('Educación'), ('Noticias')
on conflict do nothing;

-- ---------- Publicaciones: fotos, encuestas, sensible, quién responde ----------
alter table public.publicaciones
  alter column texto drop not null,
  drop constraint publicaciones_texto_check,
  add constraint publicaciones_texto_check check (texto is null or char_length(texto) <= 500),
  add column fotos text[] not null default '{}' check (cardinality(fotos) <= 4),
  add column sensible boolean not null default false,
  add column quien_responde text not null default 'todos' check (quien_responde in ('todos', 'seguidos', 'mencionados'));

create table public.encuestas (
  publicacion_id uuid primary key references public.publicaciones (id) on delete cascade,
  opciones text[] not null check (cardinality(opciones) between 2 and 4),
  termina timestamptz not null
);
create table public.votos (
  publicacion_id uuid references public.encuestas (publicacion_id) on delete cascade,
  usuario_id uuid references auth.users (id) on delete cascade,
  opcion smallint not null check (opcion between 0 and 3),
  primary key (publicacion_id, usuario_id)
);
alter table public.encuestas enable row level security;
alter table public.votos enable row level security;
create policy "ver encuestas" on public.encuestas for select to authenticated
  using (exists (select 1 from public.publicaciones p where p.id = publicacion_id));
create policy "crear encuesta" on public.encuestas for insert to authenticated
  with check (exists (select 1 from public.publicaciones p where p.id = publicacion_id and p.autor_id = auth.uid()));
create policy "ver votos" on public.votos for select to authenticated using (true);
create policy "votar" on public.votos for insert to authenticated
  with check (usuario_id = auth.uid() and exists (select 1 from public.encuestas e where e.publicacion_id = votos.publicacion_id and e.termina > now()));

create table public.guardados (
  publicacion_id uuid references public.publicaciones (id) on delete cascade,
  usuario_id uuid references auth.users (id) on delete cascade,
  creado timestamptz not null default now(),
  primary key (publicacion_id, usuario_id)
);
alter table public.guardados enable row level security;
-- Los guardados son privados: solo los ve quien guarda.
create policy "mis guardados" on public.guardados for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Me gusta ocultos: si el dueño los oculta, solo él ve su lista.
drop policy "ver me gusta" on public.me_gusta;
create policy "ver me gusta" on public.me_gusta for select to authenticated
  using (usuario_id = auth.uid() or not (select ocultar_me_gusta from public.perfiles where id = usuario_id));

-- Responder solo si el autor lo permite.
create or replace function public.puedo_responder(pub uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.publicaciones p
    where p.id = pub
      and not public.hay_bloqueo(auth.uid(), p.autor_id)
      and (
        p.autor_id = auth.uid()
        or p.quien_responde = 'todos'
        or (p.quien_responde = 'seguidos' and exists (select 1 from public.sigue s where s.seguidor_id = p.autor_id and s.seguido_id = auth.uid()))
        or (p.quien_responde = 'mencionados' and p.texto ilike '%@' || (select usuario from public.perfiles where id = auth.uid()) || '%')
      )
  );
$$;
drop policy "responder" on public.respuestas;
create policy "responder" on public.respuestas for insert to authenticated
  with check (autor_id = auth.uid() and public.puedo_responder(publicacion_id));

-- ---------- Solicitudes de seguimiento (cuentas privadas) ----------
create table public.solicitudes (
  solicitante_id uuid references auth.users (id) on delete cascade,
  destino_id uuid references auth.users (id) on delete cascade,
  creado timestamptz not null default now(),
  primary key (solicitante_id, destino_id)
);
alter table public.solicitudes enable row level security;
create policy "ver mis solicitudes" on public.solicitudes for select to authenticated
  using (solicitante_id = auth.uid() or destino_id = auth.uid());
create policy "pedir seguir" on public.solicitudes for insert to authenticated
  with check (solicitante_id = auth.uid() and not public.hay_bloqueo(solicitante_id, destino_id));
create policy "retirar o responder" on public.solicitudes for delete to authenticated
  using (solicitante_id = auth.uid() or destino_id = auth.uid());

-- A una cuenta privada solo se la sigue si ella acepta (lo hace con aceptar_solicitud).
drop policy "seguir" on public.sigue;
create policy "seguir" on public.sigue for insert to authenticated
  with check (
    seguidor_id = auth.uid()
    and not public.hay_bloqueo(seguidor_id, seguido_id)
    and not (select privado from public.perfiles where id = seguido_id)
  );

create or replace function public.aceptar_solicitud(quien uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.solicitudes where solicitante_id = quien and destino_id = auth.uid();
  if found then
    insert into public.sigue (seguidor_id, seguido_id) values (quien, auth.uid()) on conflict do nothing;
  end if;
end;
$$;
grant execute on function public.aceptar_solicitud(uuid) to authenticated;

-- ---------- Mensajes privados ----------
create table public.conversaciones (
  id uuid primary key default gen_random_uuid(),
  creado timestamptz not null default now()
);
create table public.miembros (
  conversacion_id uuid references public.conversaciones (id) on delete cascade,
  usuario_id uuid references auth.users (id) on delete cascade,
  leido timestamptz not null default 'epoch',
  primary key (conversacion_id, usuario_id)
);
create table public.mensajes (
  id uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references public.conversaciones (id) on delete cascade,
  autor_id uuid not null references auth.users (id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 1000),
  creado timestamptz not null default now()
);
create index on public.mensajes (conversacion_id, creado);

alter table public.conversaciones enable row level security;
alter table public.miembros enable row level security;
alter table public.mensajes enable row level security;

create or replace function public.soy_miembro(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.miembros where conversacion_id = c and usuario_id = auth.uid());
$$;

create policy "ver mis conversaciones" on public.conversaciones for select to authenticated using (public.soy_miembro(id));
create policy "borrar mis conversaciones" on public.conversaciones for delete to authenticated using (public.soy_miembro(id));
create policy "ver miembros" on public.miembros for select to authenticated using (public.soy_miembro(conversacion_id));
create policy "marcar leido" on public.miembros for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy "leer mensajes" on public.mensajes for select to authenticated using (public.soy_miembro(conversacion_id));
create policy "escribir mensajes" on public.mensajes for insert to authenticated
  with check (
    autor_id = auth.uid()
    and public.soy_miembro(conversacion_id)
    and not exists (
      select 1 from public.miembros m
      where m.conversacion_id = mensajes.conversacion_id and m.usuario_id <> auth.uid() and public.hay_bloqueo(auth.uid(), m.usuario_id)
    )
  );

-- Abrir conversación respetando "¿Quién te puede enviar mensajes?" del otro.
create or replace function public.abrir_conversacion(otro uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  c uuid;
  regla text;
begin
  if auth.uid() is null or otro = auth.uid() then raise exception 'No permitido'; end if;
  select m1.conversacion_id into c
  from public.miembros m1 join public.miembros m2 on m1.conversacion_id = m2.conversacion_id
  where m1.usuario_id = auth.uid() and m2.usuario_id = otro
    and (select count(*) from public.miembros m3 where m3.conversacion_id = m1.conversacion_id) = 2
  limit 1;
  if c is not null then return c; end if;
  if public.hay_bloqueo(auth.uid(), otro) then raise exception 'No permitido'; end if;
  select quien_escribe into regla from public.perfiles where id = otro;
  if regla = 'nadie' or (regla = 'seguidos' and not exists (
    select 1 from public.sigue where seguidor_id = otro and seguido_id = auth.uid()
  )) then
    raise exception 'Esta persona no acepta mensajes tuyos';
  end if;
  insert into public.conversaciones default values returning id into c;
  insert into public.miembros (conversacion_id, usuario_id) values (c, auth.uid()), (c, otro);
  return c;
end;
$$;
grant execute on function public.abrir_conversacion(uuid) to authenticated;

-- Las denuncias ahora pueden ser de publicaciones, cuentas o mensajes.
alter table public.denuncias
  add column tipo text not null default 'publicacion' check (tipo in ('publicacion', 'usuario', 'mensaje')),
  add column objeto_id uuid,
  add column detalle text not null default '' check (char_length(detalle) <= 1000),
  alter column publicacion_id drop not null;
alter table public.denuncias drop constraint denuncias_publicacion_id_denunciante_id_key;
create unique index denuncias_unica on public.denuncias (tipo, coalesce(publicacion_id, objeto_id), denunciante_id);

-- ---------- Fotos (Supabase Storage) ----------
-- Cubo "fotos": cada persona solo sube a su carpeta (fotos/<su id>/...). Lectura pública por enlace.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('fotos', 'fotos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do nothing;
    execute $p$create policy "subir mis fotos" on storage.objects for insert to authenticated
      with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
    execute $p$create policy "borrar mis fotos" on storage.objects for delete to authenticated
      using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
  end if;
end $$;

-- ---------- Exportar datos: incluir lo nuevo ----------
create or replace function public.exportar_mis_datos() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'perfil', (select to_jsonb(p) from public.perfiles p where id = auth.uid()),
    'correo', (select email from auth.users where id = auth.uid()),
    'datos_privados', (select to_jsonb(d) from public.datos_privados d where usuario_id = auth.uid()),
    'intereses', (select coalesce(jsonb_agg(interes), '[]') from public.intereses_usuario where usuario_id = auth.uid()),
    'palabras_silenciadas', (select coalesce(jsonb_agg(palabra), '[]') from public.palabras_silenciadas where usuario_id = auth.uid()),
    'publicaciones', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from public.publicaciones x where autor_id = auth.uid()),
    'respuestas', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from public.respuestas x where autor_id = auth.uid()),
    'me_gusta', (select coalesce(jsonb_agg(publicacion_id), '[]') from public.me_gusta where usuario_id = auth.uid()),
    'guardados', (select coalesce(jsonb_agg(publicacion_id), '[]') from public.guardados where usuario_id = auth.uid()),
    'votos', (select coalesce(jsonb_agg(to_jsonb(v)), '[]') from public.votos v where usuario_id = auth.uid()),
    'sigues', (select coalesce(jsonb_agg(seguido_id), '[]') from public.sigue where seguidor_id = auth.uid()),
    'bloqueados', (select coalesce(jsonb_agg(bloqueado_id), '[]') from public.bloqueos where usuario_id = auth.uid()),
    'silenciados', (select coalesce(jsonb_agg(silenciado_id), '[]') from public.silencios where usuario_id = auth.uid()),
    'mensajes', (select coalesce(jsonb_agg(to_jsonb(m)), '[]') from public.mensajes m where public.soy_miembro(m.conversacion_id)),
    'denuncias', (select coalesce(jsonb_agg(to_jsonb(d)), '[]') from public.denuncias d where denunciante_id = auth.uid()),
    'consentimientos', (select coalesce(jsonb_agg(to_jsonb(c)), '[]') from public.consentimientos c where usuario_id = auth.uid()),
    'exportado', now()
  );
$$;

alter table public.consentimientos drop constraint consentimientos_tipo_check;
alter table public.consentimientos add constraint consentimientos_tipo_check
  check (tipo in ('estadisticas', 'publicidad', 'anuncios_personalizados', 'terminos', 'correo_novedades', 'ver_sensible'));

-- ---------- Feed "Para ti" con temas elegidos o "Ver de todo" ----------
-- Misma fórmula que src/lib/algoritmo.ts. Si la persona eligió temas, solo salen esos temas y la gente que sigue.
drop function if exists public.feed_para_ti(int, timestamptz);
create or replace function public.feed_para_ti(limite int default 50, desde timestamptz default now() - interval '7 days')
returns table (id uuid, autor_id uuid, texto text, creado timestamptz, puntos double precision, motivos text[])
language sql stable security invoker set search_path = public as $$
  with yo as (
    select auth.uid() as id, coalesce((select ver_todo from public.perfiles where id = auth.uid()), true) as ver_todo
  ),
  mis_temas as (select coalesce(array_agg(interes), '{}') as temas from public.intereses_usuario where usuario_id = (select id from yo)),
  candidatas as (
    select p.*
    from public.publicaciones p
    where p.creado >= desde
      and p.autor_id <> (select id from yo)
      and not exists (select 1 from public.silencios s where s.usuario_id = (select id from yo) and s.silenciado_id = p.autor_id)
      and not exists (select 1 from public.no_interesa n where n.usuario_id = (select id from yo) and n.publicacion_id = p.id)
      and not exists (
        select 1 from public.palabras_silenciadas w
        where w.usuario_id = (select id from yo) and coalesce(p.texto, '') ilike '%' || w.palabra || '%'
      )
      -- las reglas RLS ya quitan ocultas, bloqueos y cuentas privadas que no sigo
  ),
  medidas as (
    select c.*,
      (select count(*) from public.me_gusta m where m.publicacion_id = c.id) as n_gusta,
      (select count(*) from public.compartidos m where m.publicacion_id = c.id) as n_compartidos,
      (select count(*) from public.guardados m where m.publicacion_id = c.id) as n_guardados,
      (select count(*) from public.votos v where v.publicacion_id = c.id) as n_votos,
      (select count(*) from public.respuestas r where r.publicacion_id = c.id and r.autor_id <> c.autor_id) as n_respuestas,
      (select count(*) from public.respuestas r where r.publicacion_id = c.id and r.autor_id = c.autor_id) as n_autor,
      (select count(*) from public.no_interesa n where n.publicacion_id = c.id) as n_no,
      (select count(*) from public.denuncias d where d.publicacion_id = c.id) as n_denuncias,
      exists (select 1 from public.sigue s where s.seguidor_id = (select id from yo) and s.seguido_id = c.autor_id) as sigo,
      cardinality(array(select unnest(c.temas) intersect select unnest((select temas from mis_temas)))) as comunes,
      extract(epoch from now() - c.creado) / 3600 as horas
    from candidatas c
  )
  select id, autor_id, texto, creado,
    (1 + greatest(0, 1 * n_gusta + 2 * n_compartidos + 2 * n_guardados + 1 * n_votos + 10 * n_respuestas + 30 * n_autor - 50 * n_no - 300 * n_denuncias))
      * (1 + (case when sigo then 1 else 0 end) + 0.5 * comunes)
      * (case when n_denuncias > 0 then 0.5 else 1 end)
      / power(horas + 2, 1.5) as puntos,
    array_remove(array[
      case when comunes > 0 then 'Coincide con tus temas.' end,
      case when sigo then 'Sigues a esta persona.' end,
      case when n_respuestas >= 2 then 'Tiene conversación activa.' end,
      case when horas < 6 then 'Es reciente.' end
    ], null) as motivos
  from medidas
  where (select ver_todo from yo) or cardinality((select temas from mis_temas)) = 0 or sigo or comunes > 0
  order by puntos desc
  limit limite;
$$;
grant execute on function public.feed_para_ti(int, timestamptz) to authenticated;
