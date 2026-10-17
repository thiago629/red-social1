-- Base de datos de la red social. Proyecto Supabase en la región de Frankfurt (UE).
-- Regla general: cada tabla tiene RLS activado; sin una política que lo permita, nadie lee ni escribe.

create extension if not exists pgcrypto;

-- Perfil público: lo puede ver cualquiera con sesión, salvo bloqueos.
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  usuario text not null unique check (usuario ~ '^[a-z0-9_]{3,20}$'),
  nombre text not null check (char_length(nombre) between 1 and 50),
  bio text not null default '' check (char_length(bio) <= 160),
  privado boolean not null default false,
  quien_escribe text not null default 'seguidos' check (quien_escribe in ('todos', 'seguidos', 'nadie')),
  creado timestamptz not null default now()
);

-- Datos privados: solo los ve su dueño. Separados del perfil para que un fallo en el perfil no los exponga.
create table public.datos_privados (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  nacimiento date not null check (nacimiento <= (current_date - interval '16 years')),
  anuncios_personalizados boolean not null default false,
  acepto_terminos timestamptz not null,
  version_terminos text not null
);
-- El correo y la contraseña (cifrada con hash) los guarda Supabase Auth en auth.users.

create table public.intereses (
  id text primary key
);
insert into public.intereses (id) values
  ('Coches'), ('Fútbol'), ('Música'), ('Cocina'), ('Viajes'), ('Tecnología'),
  ('Moda'), ('Cine y series'), ('Videojuegos'), ('Negocios'), ('Deporte'), ('Humor');

create table public.intereses_usuario (
  usuario_id uuid references auth.users (id) on delete cascade,
  interes text references public.intereses (id),
  primary key (usuario_id, interes)
);

create table public.publicaciones (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references auth.users (id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 500),
  enlace text check (enlace is null or enlace ~ '^https?://'),
  temas text[] not null default '{}',
  oculta boolean not null default false,
  creado timestamptz not null default now()
);
create index on public.publicaciones (autor_id, creado desc);
create index on public.publicaciones (creado desc);

create table public.respuestas (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references public.publicaciones (id) on delete cascade,
  autor_id uuid not null references auth.users (id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 500),
  creado timestamptz not null default now()
);
create index on public.respuestas (publicacion_id);

create table public.me_gusta (
  publicacion_id uuid references public.publicaciones (id) on delete cascade,
  usuario_id uuid references auth.users (id) on delete cascade,
  creado timestamptz not null default now(),
  primary key (publicacion_id, usuario_id)
);

create table public.compartidos (
  publicacion_id uuid references public.publicaciones (id) on delete cascade,
  usuario_id uuid references auth.users (id) on delete cascade,
  creado timestamptz not null default now(),
  primary key (publicacion_id, usuario_id)
);

create table public.no_interesa (
  publicacion_id uuid references public.publicaciones (id) on delete cascade,
  usuario_id uuid references auth.users (id) on delete cascade,
  primary key (publicacion_id, usuario_id)
);

create table public.sigue (
  seguidor_id uuid references auth.users (id) on delete cascade,
  seguido_id uuid references auth.users (id) on delete cascade,
  creado timestamptz not null default now(),
  primary key (seguidor_id, seguido_id),
  check (seguidor_id <> seguido_id)
);

create table public.bloqueos (
  usuario_id uuid references auth.users (id) on delete cascade,
  bloqueado_id uuid references auth.users (id) on delete cascade,
  primary key (usuario_id, bloqueado_id)
);

create table public.silencios (
  usuario_id uuid references auth.users (id) on delete cascade,
  silenciado_id uuid references auth.users (id) on delete cascade,
  primary key (usuario_id, silenciado_id)
);

-- Denuncias (DSA art. 16 y guía 1.2 de Apple). Solo las ve quien denuncia y el equipo de moderación.
create table public.denuncias (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references public.publicaciones (id) on delete cascade,
  denunciante_id uuid references auth.users (id) on delete set null,
  motivo text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'revisada')),
  decision text,
  creado timestamptz not null default now(),
  unique (publicacion_id, denunciante_id)
);

create table public.avisos (
  id uuid primary key default gen_random_uuid(),
  para_id uuid not null references auth.users (id) on delete cascade,
  texto text not null,
  publicacion_id uuid references public.publicaciones (id) on delete cascade,
  leido boolean not null default false,
  creado timestamptz not null default now()
);
create index on public.avisos (para_id, creado desc);

-- Consentimientos (cookies, anuncios personalizados): historial, nunca se sobrescribe.
create table public.consentimientos (
  id bigint generated always as identity primary key,
  usuario_id uuid references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('estadisticas', 'publicidad', 'anuncios_personalizados', 'terminos')),
  aceptado boolean not null,
  creado timestamptz not null default now()
);

-- Equipo de moderación y administración (con verificación en dos pasos obligatoria en el panel).
create table public.equipo (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  rol text not null check (rol in ('moderador', 'admin'))
);

-- Registro de accesos del equipo a datos de usuarios (RGPD art. 32). Solo se añade, nunca se edita.
create table public.registro_accesos (
  id bigint generated always as identity primary key,
  quien uuid not null,
  accion text not null,
  sobre uuid,
  creado timestamptz not null default now()
);

-- ---------- Funciones de ayuda ----------

create or replace function public.es_equipo() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.equipo where usuario_id = auth.uid());
$$;

create or replace function public.hay_bloqueo(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.bloqueos
    where (usuario_id = a and bloqueado_id = b) or (usuario_id = b and bloqueado_id = a)
  );
$$;

create or replace function public.puedo_ver_a(autor uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select autor = auth.uid()
    or (
      not public.hay_bloqueo(auth.uid(), autor)
      and (
        not (select privado from public.perfiles where id = autor)
        or exists (select 1 from public.sigue where seguidor_id = auth.uid() and seguido_id = autor)
      )
    );
$$;

-- ---------- Reglas de acceso (RLS) ----------

alter table public.perfiles enable row level security;
alter table public.datos_privados enable row level security;
alter table public.intereses enable row level security;
alter table public.intereses_usuario enable row level security;
alter table public.publicaciones enable row level security;
alter table public.respuestas enable row level security;
alter table public.me_gusta enable row level security;
alter table public.compartidos enable row level security;
alter table public.no_interesa enable row level security;
alter table public.sigue enable row level security;
alter table public.bloqueos enable row level security;
alter table public.silencios enable row level security;
alter table public.denuncias enable row level security;
alter table public.avisos enable row level security;
alter table public.consentimientos enable row level security;
alter table public.equipo enable row level security;
alter table public.registro_accesos enable row level security;

-- Perfiles
create policy "ver perfiles" on public.perfiles for select to authenticated
  using (not public.hay_bloqueo(auth.uid(), id));
create policy "crear mi perfil" on public.perfiles for insert to authenticated with check (id = auth.uid());
create policy "editar mi perfil" on public.perfiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Datos privados: solo el dueño
create policy "mis datos privados" on public.datos_privados for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy "ver intereses" on public.intereses for select to authenticated using (true);
create policy "mis intereses" on public.intereses_usuario for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Publicaciones
create policy "ver publicaciones" on public.publicaciones for select to authenticated
  using ((not oculta and public.puedo_ver_a(autor_id)) or autor_id = auth.uid() or public.es_equipo());
create policy "publicar" on public.publicaciones for insert to authenticated with check (autor_id = auth.uid() and not oculta);
create policy "borrar mis publicaciones" on public.publicaciones for delete to authenticated using (autor_id = auth.uid());
create policy "moderar publicaciones" on public.publicaciones for update to authenticated using (public.es_equipo());

-- Respuestas
create policy "ver respuestas" on public.respuestas for select to authenticated
  using (public.puedo_ver_a(autor_id) and exists (select 1 from public.publicaciones p where p.id = publicacion_id));
create policy "responder" on public.respuestas for insert to authenticated
  with check (
    autor_id = auth.uid()
    and exists (select 1 from public.publicaciones p where p.id = publicacion_id and not public.hay_bloqueo(auth.uid(), p.autor_id))
  );
create policy "borrar mis respuestas" on public.respuestas for delete to authenticated using (autor_id = auth.uid());

-- Interacciones: cualquiera ve los recuentos, cada uno gestiona las suyas
create policy "ver me gusta" on public.me_gusta for select to authenticated using (true);
create policy "mis me gusta" on public.me_gusta for insert to authenticated with check (usuario_id = auth.uid());
create policy "quitar me gusta" on public.me_gusta for delete to authenticated using (usuario_id = auth.uid());
create policy "ver compartidos" on public.compartidos for select to authenticated using (true);
create policy "compartir" on public.compartidos for insert to authenticated with check (usuario_id = auth.uid());
create policy "dejar de compartir" on public.compartidos for delete to authenticated using (usuario_id = auth.uid());
create policy "mis no interesa" on public.no_interesa for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Seguir, bloquear, silenciar
create policy "ver seguidores" on public.sigue for select to authenticated using (true);
create policy "seguir" on public.sigue for insert to authenticated
  with check (seguidor_id = auth.uid() and not public.hay_bloqueo(seguidor_id, seguido_id));
create policy "dejar de seguir" on public.sigue for delete to authenticated
  using (seguidor_id = auth.uid() or seguido_id = auth.uid());
create policy "mis bloqueos" on public.bloqueos for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy "mis silencios" on public.silencios for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Denuncias
create policy "denunciar" on public.denuncias for insert to authenticated with check (denunciante_id = auth.uid());
create policy "ver mis denuncias" on public.denuncias for select to authenticated
  using (denunciante_id = auth.uid() or public.es_equipo());
create policy "resolver denuncias" on public.denuncias for update to authenticated using (public.es_equipo());

-- Avisos
create policy "mis avisos" on public.avisos for select to authenticated using (para_id = auth.uid());
create policy "leer avisos" on public.avisos for update to authenticated using (para_id = auth.uid()) with check (para_id = auth.uid());

-- Consentimientos: el usuario añade y consulta los suyos
create policy "ver mis consentimientos" on public.consentimientos for select to authenticated using (usuario_id = auth.uid());
create policy "dar consentimiento" on public.consentimientos for insert to authenticated with check (usuario_id = auth.uid());

-- Equipo y registro: solo el equipo los consulta; el registro solo se escribe desde el servidor
create policy "ver equipo" on public.equipo for select to authenticated using (public.es_equipo());
create policy "ver registro" on public.registro_accesos for select to authenticated using (public.es_equipo());

-- ---------- Ocultar automáticamente con 3 denuncias ----------

create or replace function public.tras_denuncia() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.denuncias where publicacion_id = new.publicacion_id and estado = 'pendiente') >= 3 then
    update public.publicaciones set oculta = true where id = new.publicacion_id;
  end if;
  insert into public.avisos (para_id, texto)
  values (new.denunciante_id, 'Hemos recibido tu denuncia. La revisaremos y te avisaremos de lo que decidamos.');
  return new;
end;
$$;
create trigger tras_denuncia after insert on public.denuncias
  for each row execute function public.tras_denuncia();

-- ---------- Exportar y borrar mis datos (RGPD arts. 15, 17 y 20) ----------

create or replace function public.exportar_mis_datos() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'perfil', (select to_jsonb(p) from public.perfiles p where id = auth.uid()),
    'correo', (select email from auth.users where id = auth.uid()),
    'datos_privados', (select to_jsonb(d) from public.datos_privados d where usuario_id = auth.uid()),
    'intereses', (select coalesce(jsonb_agg(interes), '[]') from public.intereses_usuario where usuario_id = auth.uid()),
    'publicaciones', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from public.publicaciones x where autor_id = auth.uid()),
    'respuestas', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from public.respuestas x where autor_id = auth.uid()),
    'me_gusta', (select coalesce(jsonb_agg(publicacion_id), '[]') from public.me_gusta where usuario_id = auth.uid()),
    'sigues', (select coalesce(jsonb_agg(seguido_id), '[]') from public.sigue where seguidor_id = auth.uid()),
    'consentimientos', (select coalesce(jsonb_agg(to_jsonb(c)), '[]') from public.consentimientos c where usuario_id = auth.uid()),
    'exportado', now()
  );
$$;

-- Borra el usuario de auth.users; todo lo demás cae en cascada.
create or replace function public.borrar_mi_cuenta() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then
    raise exception 'Sin sesión';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.borrar_mi_cuenta() from public, anon;
grant execute on function public.borrar_mi_cuenta() to authenticated;
revoke all on function public.exportar_mis_datos() from public, anon;
grant execute on function public.exportar_mis_datos() to authenticated;
