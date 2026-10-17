-- Feed "Para ti" (primera versión; 0003_funciones.sql la sustituye con temas y "Ver de todo").
-- puntos = (1 + interacciones) × afinidad × calidad / (horas + 2)^1.5

create or replace function public.feed_para_ti(limite int default 50, desde timestamptz default now() - interval '7 days')
returns table (id uuid, autor_id uuid, texto text, enlace text, temas text[], creado timestamptz, puntos double precision, motivos text[])
language sql stable security invoker set search_path = public as $$
  with yo as (select auth.uid() as id),
  mis_temas as (select array_agg(interes) as temas from public.intereses_usuario where usuario_id = (select id from yo)),
  candidatas as (
    select p.*
    from public.publicaciones p
    where p.creado >= desde
      and p.autor_id <> (select id from yo)
      and not exists (select 1 from public.silencios s where s.usuario_id = (select id from yo) and s.silenciado_id = p.autor_id)
      and not exists (select 1 from public.no_interesa n where n.usuario_id = (select id from yo) and n.publicacion_id = p.id)
      -- las reglas RLS ya quitan ocultas, bloqueos y cuentas privadas que no sigo
  ),
  medidas as (
    select c.*,
      (select count(*) from public.me_gusta m where m.publicacion_id = c.id) as n_gusta,
      (select count(*) from public.compartidos m where m.publicacion_id = c.id) as n_compartidos,
      (select count(*) from public.respuestas r where r.publicacion_id = c.id and r.autor_id <> c.autor_id) as n_respuestas,
      (select count(*) from public.respuestas r where r.publicacion_id = c.id and r.autor_id = c.autor_id) as n_autor,
      (select count(*) from public.no_interesa n where n.publicacion_id = c.id) as n_no,
      (select count(*) from public.denuncias d where d.publicacion_id = c.id) as n_denuncias,
      exists (select 1 from public.sigue s where s.seguidor_id = (select id from yo) and s.seguido_id = c.autor_id) as sigo,
      cardinality(array(select unnest(c.temas) intersect select unnest(coalesce((select temas from mis_temas), '{}')))) as comunes,
      extract(epoch from now() - c.creado) / 3600 as horas
    from candidatas c
  )
  select id, autor_id, texto, enlace, temas, creado,
    (1 + greatest(0, 1 * n_gusta + 2 * n_compartidos + 10 * n_respuestas + 30 * n_autor - 50 * n_no - 300 * n_denuncias))
      * (1 + (case when sigo then 1 else 0 end) + 0.5 * comunes)
      * (case when n_denuncias > 0 then 0.5 else 1 end)
      / power(horas + 2, 1.5) as puntos,
    array_remove(array[
      case when sigo then 'Sigues a esta persona.' end,
      case when comunes > 0 then 'Coincide con tus intereses.' end,
      case when n_respuestas >= 2 then 'Tiene conversación activa.' end,
      case when horas < 6 then 'Es reciente.' end
    ], null) as motivos
  from medidas
  order by puntos desc
  limit limite;
$$;

grant execute on function public.feed_para_ti(int, timestamptz) to authenticated;
