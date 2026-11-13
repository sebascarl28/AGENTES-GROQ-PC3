-- NEXO / GE703 PC3 — complemento SEGURO del proyecto existente.
-- Ejecutar una sola vez en Supabase SQL Editor DESPUES de supabase/schema.sql.
-- No borra tablas, usuarios ni sesiones del simulador anterior.
create table if not exists public.nexo_sesiones (
  id text primary key,
  nombre text not null default '',
  contador integer not null default 0,
  historial jsonb not null default '[]'::jsonb,
  actualizado timestamptz not null default now()
);
alter table public.nexo_sesiones enable row level security;
-- Sin políticas de lectura/escritura por la API pública.
-- Únicamente el backend con DATABASE_URL accede directamente a PostgreSQL.

-- Foto nueva para la DEMO de fecha 2026-11-12. Debe contener UNA foto completa
-- de stock (replicamos la foto previa y cambiamos solo UHT) ya que el ERP elige
-- la última fecha_corte no posterior a la fecha de la sesión.
insert into public.stock_lotes
(fecha_corte,id_lote,id_producto,almacen,cajas,estado_calidad,fecha_produccion,
 fecha_vencimiento,reposicion_cajas,reposicion_fecha,reposicion_ref,origen)
select '2026-11-12', id_lote || '-N12', id_producto, almacen,cajas,estado_calidad,
 fecha_produccion,fecha_vencimiento,reposicion_cajas,reposicion_fecha,reposicion_ref,
 'COPIA SINTÉTICA NEXO 2026-11-12'
from public.stock_lotes
where fecha_corte='2026-11-10'
  and id_producto<>'PRD-001'
on conflict (fecha_corte,id_lote) do nothing;

-- Caso 300/240/60: PRD-001 UHT: 240 cajas libres y 60 previstas por PP-PI
-- con referencia OP-UHT-1911 y fecha de reposición 2026-11-19.
insert into public.stock_lotes
(fecha_corte,id_lote,id_producto,almacen,cajas,estado_calidad,fecha_produccion,
 fecha_vencimiento,reposicion_cajas,reposicion_fecha,reposicion_ref,origen)
values
('2026-11-12','LT-UHT-NEXO-1112','PRD-001','ALM-PT-01','240','LIBERADO','2026-11-10',
 '2027-05-09','60','2026-11-19','OP-UHT-1911',
 'SINTETICO NEXO PC3: 240 cajas liberadas, 60 programadas por PP-PI para 19/11')
on conflict (fecha_corte,id_lote) do update set
 cajas=excluded.cajas,estado_calidad=excluded.estado_calidad,
 reposicion_cajas=excluded.reposicion_cajas,reposicion_fecha=excluded.reposicion_fecha,
 reposicion_ref=excluded.reposicion_ref,origen=excluded.origen;

-- Validar los tres datos del caso antes de exponer:
select fecha_corte,id_producto,cajas,estado_calidad,reposicion_cajas,reposicion_fecha,reposicion_ref
from public.stock_lotes
where fecha_corte='2026-11-12' and id_producto='PRD-001';
