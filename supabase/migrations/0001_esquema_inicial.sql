-- Esquema inicial do controle de contas a pagar.
-- Rodar uma única vez no SQL Editor do Supabase.

-- ---------------------------------------------------------------------------
-- Categorias: tipo de gasto (fornecedores, salários, aluguel...).
-- ---------------------------------------------------------------------------
create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique check (length(trim(nome)) > 0),
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Favorecidos: para quem se paga (fornecedor, funcionário, imobiliária...).
-- ---------------------------------------------------------------------------
create table public.favorecidos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique check (length(trim(nome)) > 0),
  observacao text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Compras parceladas: agrupam as parcelas de uma mesma nota.
-- ---------------------------------------------------------------------------
create table public.compras (
  id uuid primary key default gen_random_uuid(),
  descricao text not null check (length(trim(descricao)) > 0),
  favorecido_id uuid references public.favorecidos (id),
  categoria_id uuid references public.categorias (id),
  valor_total numeric(12, 2) not null check (valor_total > 0),
  num_parcelas integer not null check (num_parcelas >= 1),
  data_compra date,
  criado_por uuid references auth.users (id) default auth.uid(),
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Recorrências: modelos que geram uma conta por mês (salário, aluguel...).
-- ---------------------------------------------------------------------------
create table public.recorrencias (
  id uuid primary key default gen_random_uuid(),
  descricao text not null check (length(trim(descricao)) > 0),
  favorecido_id uuid references public.favorecidos (id),
  categoria_id uuid references public.categorias (id),
  valor numeric(12, 2) not null check (valor > 0),
  -- Em meses mais curtos, o vencimento cai no último dia do mês.
  dia_vencimento integer not null check (dia_vencimento between 1 and 31),
  -- Primeiro e último mês em que a conta deve ser gerada (dia 1 do mês).
  inicio date not null,
  fim date,
  ativa boolean not null default true,
  criado_por uuid references auth.users (id) default auth.uid(),
  criado_em timestamptz not null default now(),
  check (fim is null or fim >= inicio)
);

-- ---------------------------------------------------------------------------
-- Contas: cada boleto ou obrigação com valor e vencimento.
-- "Atrasada" não é gravado: é toda conta aberta com vencimento anterior a hoje.
-- ---------------------------------------------------------------------------
create table public.contas (
  id uuid primary key default gen_random_uuid(),
  descricao text not null check (length(trim(descricao)) > 0),
  favorecido_id uuid references public.favorecidos (id),
  categoria_id uuid references public.categorias (id),
  valor numeric(12, 2) not null check (valor > 0),
  vencimento date not null,
  status text not null default 'aberta'
    check (status in ('aberta', 'paga', 'cancelada')),

  -- Preenchidos ao marcar como paga. O valor pago pode incluir juros.
  pago_em date,
  valor_pago numeric(12, 2) check (valor_pago is null or valor_pago > 0),
  pago_por uuid references auth.users (id),

  -- Origem: parcela de uma compra ou conta gerada por uma recorrência.
  compra_id uuid references public.compras (id),
  parcela_numero integer check (parcela_numero is null or parcela_numero >= 1),
  recorrencia_id uuid references public.recorrencias (id),
  -- Mês a que a conta recorrente se refere (dia 1 do mês).
  competencia date,

  observacao text,
  criado_por uuid references auth.users (id) default auth.uid(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  check ((status = 'paga') = (pago_em is not null)),
  check ((status = 'paga') = (valor_pago is not null)),
  check ((compra_id is null) = (parcela_numero is null)),
  check ((recorrencia_id is null) = (competencia is null))
);

create index contas_vencimento_idx on public.contas (vencimento);
create index contas_status_vencimento_idx on public.contas (status, vencimento);
create index contas_compra_idx on public.contas (compra_id);

-- Garante uma única conta por recorrência em cada mês, mesmo que duas pessoas
-- abram o mesmo mês ao mesmo tempo.
create unique index contas_recorrencia_mes_idx
  on public.contas (recorrencia_id, competencia)
  where recorrencia_id is not null;

create unique index contas_compra_parcela_idx
  on public.contas (compra_id, parcela_numero)
  where compra_id is not null;

create function public.marcar_atualizacao()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger contas_atualizado_em
  before update on public.contas
  for each row execute function public.marcar_atualizacao();

-- ---------------------------------------------------------------------------
-- Acesso: só usuários logados leem e gravam. Os dois usuários compartilham
-- todos os dados. O cadastro público precisa estar desligado no painel do
-- Supabase (Authentication > Sign In / Providers > "Allow new users to sign up").
-- ---------------------------------------------------------------------------
alter table public.categorias enable row level security;
alter table public.favorecidos enable row level security;
alter table public.compras enable row level security;
alter table public.recorrencias enable row level security;
alter table public.contas enable row level security;

create policy "usuarios logados" on public.categorias
  for all to authenticated using (true) with check (true);
create policy "usuarios logados" on public.favorecidos
  for all to authenticated using (true) with check (true);
create policy "usuarios logados" on public.compras
  for all to authenticated using (true) with check (true);
create policy "usuarios logados" on public.recorrencias
  for all to authenticated using (true) with check (true);
create policy "usuarios logados" on public.contas
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Categorias iniciais.
-- ---------------------------------------------------------------------------
insert into public.categorias (nome) values
  ('Fornecedores'),
  ('Salários'),
  ('Aluguel'),
  ('Impostos'),
  ('Água, luz e internet'),
  ('Outros');
