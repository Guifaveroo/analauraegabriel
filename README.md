# Site de casamento

Este é o site de casamento de um único casal, com painel administrativo. Ele roda nos planos gratuitos da Vercel e do Supabase.

- **Site público.** Tem capa com contagem regressiva, nossa história, informações do casamento, localização (Google Maps e Waze), galeria, manual dos padrinhos (com senha opcional), dress code, lista de presentes com **PIX estático**, confirmação de presença (RSVP), mural de recados e perguntas frequentes.
- **Painel `/admin`.** Tem dashboard, editor visual com pré-visualização (computador, tablet e celular), 6 temas, cores, fontes, fotos, convidados e famílias, confirmações, presentes, pagamentos com **confirmação manual**, mensagens e configurações.

> O site **não** usa gateway de pagamento nem API bancária, e não confirma pagamentos sozinho. O convidado paga pelo app do banco, direto na chave PIX dos noivos. Os noivos conferem o extrato e confirmam o pagamento no painel.

## Tecnologias

Next.js 16 (App Router) · TypeScript · React 19 · Tailwind CSS 4 · Supabase (PostgreSQL, Auth, Storage) · Vercel · `qrcode`. O código PIX (BR Code / EMV) é gerado localmente, em `src/lib/pix/brcode.ts`.

## Estrutura

```
src/
  app/(site)/            site público, ações dos convidados, /padrinhos, /privacidade, Open Graph
  app/admin/             login, painel (dashboard, editor, fotos, convidados, confirmações,
                         presentes, pagamentos, mensagens, configurações), pré-visualização e CSV
  components/site/       seções do site (Hero, Story, Gifts, PixCheckout, Rsvp…)
  components/admin/      painel (Sidebar, editor visual, upload de fotos…)
  lib/                   esquemas de conteúdo, temas, PIX, Supabase, segurança, formatação
supabase/migrations/     schema, RLS, funções, Storage e dados iniciais (executar em ordem)
tests/                   unitários (vitest), SQL (regras + concorrência) e ponta a ponta
```

## Publicação passo a passo

### 1. Supabase (plano gratuito)

1. Crie um projeto em [supabase.com](https://supabase.com) (região São Paulo).
2. Abra **SQL Editor** e execute, **nesta ordem**, o conteúdo de cada arquivo de `supabase/migrations/`:
   1. `0001_schema.sql`
   2. `0002_security_functions.sql`
   3. `0003_storage.sql`
   4. `0004_seed.sql` (conteúdo de exemplo, que vocês editam depois pelo painel)
3. Em **Authentication → Sign In / Providers**:
   - desative **Allow new users to sign up**. Só os noivos acessam.
   - mantenha **Email** habilitado.
4. Em **Authentication → Users → Add user**, crie o usuário de cada noivo (e-mail e senha forte, com "Auto Confirm User").
5. Autorize esses usuários no painel. No **SQL Editor**, troque pelos e-mails reais e execute:

   ```sql
   insert into public.admin_users (user_id, email)
   select id, email from auth.users where email in ('noivo1@email.com', 'noivo2@email.com');
   ```

6. Em **Project Settings → API**, copie a *Project URL*, a chave `anon` (pública) e a chave `service_role` (secreta).

### 2. Vercel (plano Hobby, gratuito)

1. Importe este repositório em [vercel.com/new](https://vercel.com/new).
2. Em **Environment Variables**, cadastre:

   | Variável | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave `anon` |
   | `SUPABASE_SERVICE_ROLE_KEY` | chave `service_role`. **Nunca** use prefixo `NEXT_PUBLIC_` |
   | `SITE_COOKIE_SECRET` | texto aleatório com 32 caracteres ou mais (`openssl rand -base64 48`) |
   | `NEXT_PUBLIC_SITE_URL` | `https://nome-escolhido.vercel.app` |

3. Faça o deploy. O endereço gratuito `*.vercel.app` pode ser renomeado em **Settings → Domains**.
4. No Supabase, em **Authentication → URL Configuration**, informe o mesmo endereço em *Site URL*.

### 3. Primeiro acesso ao painel

1. Acesse `/admin` e entre com o e-mail do noivo.
2. Em **Configurações**:
   - nomes, data e horário;
   - endereços (coordenadas opcionais deixam o Waze mais preciso);
   - modo do RSVP;
   - **chave PIX**. O painel mostra um QR Code de R$ 1,00 para testar no app do banco.
3. Em **Fotografias**, envie as fotos. Elas são convertidas para WebP no navegador antes do envio.
4. Em **Editar meu site**:
   - escolha o tema;
   - edite os textos e escolha as fotos;
   - use **Salvar rascunho** para guardar e **Publicar** para colocar no ar.
5. Em **Convidados**:
   - cadastre famílias e convidados;
   - copie o **link de convite** de cada família para enviar pelo WhatsApp.
6. Em **Lista de presentes**, cadastre os presentes simbólicos.

## Como funciona o PIX

1. O convidado escolhe o presente e informa o nome. O servidor cria a solicitação com status `PENDING` e gera o código "copia e cola" e o QR Code. O código inclui a chave, o beneficiário, a cidade, o **valor cadastrado do presente** (nunca o valor enviado pelo navegador) e um TXID único.
2. A reserva é atômica: o banco trava o presente (`SELECT … FOR UPDATE`), então duas pessoas não conseguem escolher a última unidade ao mesmo tempo.
3. Os noivos conferem o recebimento no app do banco. Depois, em **Pagamentos**, usam:
   - **Confirmar pagamento**: muda para `PAID`;
   - **Cancelar**: muda para `CANCELLED` e libera o presente;
   - **Liberar presente**: cancela um pagamento já confirmado (estorno ou engano);
   - **Histórico**: lista todas as mudanças com data.
4. O dashboard separa **valor pendente** de **valor confirmado**. Valor pendente não conta como dinheiro recebido.

## Segurança e privacidade (LGPD)

- **RLS em todas as tabelas.** Visitantes leem apenas o conteúdo publicado e as mensagens aprovadas. Convidados, respostas e pedidos só são acessíveis aos noivos.
- **Escrita dos convidados.** Passa por Server Actions com validação Zod e por funções SQL executadas apenas pelo servidor. O navegador não grava nada direto no banco.
- **Chave `service_role`.** É usada só no servidor (`import "server-only"`).
- **Antispam.** Campo isca, tempo mínimo de preenchimento e limite de envios por IP. O IP é guardado apenas como hash, temporariamente.
- **Uploads.** Aceita só JPEG, PNG ou WebP, até 5 MB. A imagem é decodificada e reconvertida no navegador, o que também remove metadados como localização GPS. O bucket do Storage repete a restrição, e só o admin pode enviar arquivos.
- **Manual dos padrinhos.** Quando protegido, o conteúdo é entregue apenas no servidor, após a senha (hash scrypt e cookie assinado).
- **LGPD.** Os formulários têm caixa de consentimento e há uma página `/privacidade`. Em **Confirmações** existe a opção de apagar todos os dados de convidados depois do casamento.
- **Indexação.** O site fica fora do Google por padrão. Isso pode ser alterado em Configurações.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local   # preencha com um projeto Supabase de testes
npm run dev
```

| Comando | O que faz |
|---|---|
| `npm test` | testes unitários (gerador PIX validado contra o exemplo oficial do Banco Central) |
| `npm run test:sql` | aplica as migrações num PostgreSQL local e testa regras, RLS e **concorrência** (20 reservas simultâneas, estoque de 3) |
| `node tests/e2e/smoke.mjs` | teste ponta a ponta com Playwright: login, PIX, temas, upload, publicação, presente, confirmação manual, RSVP, mural, padrinhos e CSV (veja as variáveis no topo do arquivo) |
| `npm run seed:generate` | regenera `0004_seed.sql` a partir de `src/lib/content/defaults.ts` |
| `npm run lint` / `npm run typecheck` | qualidade de código |

## Antes de divulgar o link

Siga o checklist em [`docs/TESTES.md`](docs/TESTES.md). O item principal é **pagar R$ 1,00 com o QR Code de teste** em pelo menos dois bancos diferentes e conferir o nome do beneficiário.

## Limites dos planos gratuitos

- **Supabase Free.** 500 MB de banco e 1 GB de Storage, suficiente para centenas de fotos WebP. O projeto **pausa após 7 dias sem acesso**. Enquanto o site recebe visitas isso não acontece, mas vale entrar no painel de vez em quando nos meses anteriores à divulgação.
- **Vercel Hobby.** Uso pessoal e não comercial, que é o caso. O site usa páginas em cache e não usa a otimização de imagens da Vercel.
