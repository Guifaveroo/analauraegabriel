# Checklist de testes antes da publicação

## Automatizados (já incluídos no projeto)

- [x] `npm test`: gerador PIX (exemplo oficial do BCB, CRC16, valores, chaves CPF, CNPJ, e-mail, telefone e aleatória)
- [x] `npm run test:sql`:
  - presente único não aceita duas reservas;
  - 20 reservas simultâneas em um estoque de 3 resultam em exatamente 3;
  - histórico de status;
  - visitante anônimo não lê convidados nem pedidos e não grava direto;
  - limite de acompanhantes, modo fechado e bloqueio de edição do RSVP;
  - antispam;
  - publicação do rascunho.
- [x] `tests/e2e/smoke.mjs`:
  - login (inclusive senha errada);
  - chave PIX com QR de teste;
  - senha dos padrinhos;
  - família, convidado e link de convite;
  - upload de foto;
  - troca de tema e publicação;
  - PIX gerado com CRC válido e valor correto;
  - presente indisponível após a reserva;
  - confirmação manual com histórico;
  - CSV;
  - RSVP pelo link;
  - mural com aprovação;
  - manual protegido.

## Manuais (fazer no site publicado)

### PIX (obrigatório)
- [ ] Em Configurações, escanear o QR Code de teste (R$ 1,00) com o app de **dois bancos diferentes**. Conferir nome, cidade e valor, e concluir o pagamento.
- [ ] Repetir com o **PIX copia e cola**.
- [ ] Escolher um presente no site, pagar e confirmar em **Pagamentos**. Verificar que o dashboard passa o valor de "pendente" para "confirmado".
- [ ] Cancelar uma solicitação e verificar que o presente volta a ficar disponível.

### Celular (abrir o link pelo WhatsApp)
- [ ] iPhone (Safari) e Android (Chrome): menu, capa, contagem regressiva, galeria (deslizar), formulários sem zoom indesejado.
- [ ] Compartilhar o link no WhatsApp e conferir a prévia: foto, nomes e data.
- [ ] Botões **Google Maps** e **Waze** abrindo os apps.

### Painel
- [ ] Editor: pré-visualização em computador, tablet e celular. Salvar rascunho, conferir que o site público **não** muda, e só então publicar.
- [ ] Trocar de tema e conferir que os textos e as fotos foram mantidos.
- [ ] Exportar CSV de convidados, confirmações e pagamentos e abrir no Excel ou no Google Planilhas.
- [ ] Acessar `/admin` em janela anônima: deve pedir login.

### Segurança
- [ ] No Supabase, conferir que "Allow new users to sign up" está **desativado**.
- [ ] Conferir que `SUPABASE_SERVICE_ROLE_KEY` **não** tem o prefixo `NEXT_PUBLIC_` na Vercel.
