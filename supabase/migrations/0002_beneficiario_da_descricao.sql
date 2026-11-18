-- Os nomes dos beneficiários vinham sendo digitados na descrição do boleto.
-- Este script cria um beneficiário para cada nome e liga cada boleto a ele.
--
-- * Só mexe em boletos que ainda não têm beneficiário.
-- * Nomes com diferença só de maiúsculas ou espaços viram um beneficiário só.
-- * Descrições com a palavra "teste" ficam de fora.
-- * Nada é apagado: a descrição continua guardada como estava.
--
-- Rode uma única vez, no SQL Editor do Supabase. Rodar de novo não estraga
-- nada: os boletos já ligados são ignorados.
--
-- (No banco, a tabela de beneficiários se chama "favorecidos".)

begin;

-- 1. Cria os beneficiários que ainda não existem.
with nomes as (
  select distinct on (lower(nome)) nome
  from (
    select trim(regexp_replace(descricao, '\s+', ' ', 'g')) as nome
    from public.contas
    where favorecido_id is null
      and descricao not ilike '%teste%'
    union all
    select trim(regexp_replace(descricao, '\s+', ' ', 'g'))
    from public.compras
    where favorecido_id is null
      and descricao not ilike '%teste%'
  ) as descricoes
  order by lower(nome), nome
)
insert into public.favorecidos (nome)
select nomes.nome
from nomes
where not exists (
  select 1 from public.favorecidos f where lower(f.nome) = lower(nomes.nome)
);

-- 2. Liga cada boleto ao beneficiário com o mesmo nome.
update public.contas c
set favorecido_id = f.id
from public.favorecidos f
where c.favorecido_id is null
  and c.descricao not ilike '%teste%'
  and lower(f.nome) = lower(trim(regexp_replace(c.descricao, '\s+', ' ', 'g')));

-- 3. O mesmo para o registro das compras parceladas.
update public.compras c
set favorecido_id = f.id
from public.favorecidos f
where c.favorecido_id is null
  and c.descricao not ilike '%teste%'
  and lower(f.nome) = lower(trim(regexp_replace(c.descricao, '\s+', ' ', 'g')));

-- 4. Beneficiários usados por boletos voltam a aparecer nas sugestões.
update public.favorecidos f
set ativo = true
where not f.ativo
  and exists (select 1 from public.contas c where c.favorecido_id = f.id);

commit;

-- Para conferir depois: boletos que continuam sem beneficiário.
-- select descricao, vencimento, valor, status
-- from public.contas
-- where favorecido_id is null
-- order by vencimento;
