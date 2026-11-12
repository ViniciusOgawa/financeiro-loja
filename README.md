# Financeiro da loja

Controle de contas a pagar da loja: boletos de fornecedores, salários, aluguel
e demais despesas, com vencimentos, parcelas e contas que se repetem todo mês.

## Tecnologia

- [Next.js](https://nextjs.org) (TypeScript) para as telas e o servidor.
- [Supabase](https://supabase.com) para o banco de dados (Postgres) e o login.

## Como rodar no computador

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env.local` e preencha com o endereço e a chave
   pública do projeto no Supabase.

3. Inicie o servidor e abra <http://localhost:3000>:

   ```bash
   npm run dev
   ```

## Preparar o Supabase (uma única vez)

1. Crie um projeto em <https://supabase.com>.
2. No **SQL Editor**, cole e execute o conteúdo de
   [`supabase/migrations/0001_esquema_inicial.sql`](supabase/migrations/0001_esquema_inicial.sql).
3. Em **Authentication**, desligue a opção que permite novos cadastros
   ("Allow new users to sign up"). O sistema não tem tela de cadastro, e todo
   usuário logado enxerga todos os dados.
4. Ainda em **Authentication > Users**, crie os dois usuários (e-mail e senha).

## Publicar na internet (Vercel)

1. Crie uma conta em <https://vercel.com> entrando com o GitHub.
2. Em **Add New > Project**, importe o repositório `financeiro-loja`. A Vercel
   reconhece o Next.js sozinha; não mude os comandos de build.
3. Antes de clicar em **Deploy**, abra **Environment Variables** e cadastre as
   duas variáveis, com os mesmos valores do seu `.env`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Clique em **Deploy**. Ao terminar, a Vercel mostra o endereço do sistema.

Depois disso, cada envio ao ramo `main` publica a nova versão sozinho.

Use sempre a chave **publicável** do Supabase. A chave secreta
(`service_role`) nunca deve ser cadastrada aqui.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `src/app/login` | Tela de entrada e ações de entrar e sair |
| `src/app/(app)` | Telas internas, só para quem está logado |
| `src/lib/supabase` | Conexão com o Supabase |
| `src/lib/usuario.ts` | Conferência do usuário logado |
| `src/proxy.ts` | Renova a sessão e barra quem não está logado |
| `src/app/globals.css` | Cores, fontes e componentes visuais |
| `supabase/migrations` | Esquema do banco de dados |
