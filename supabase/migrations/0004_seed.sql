-- =====================================================================
-- Dados iniciais (gerado por scripts/generate-seed.mts — não editar à mão).
-- Pode ser executado mais de uma vez: só insere o que ainda não existe.
-- =====================================================================

insert into public.wedding_settings (id, wedding_at, ceremony_name, ceremony_address, ceremony_time,
  reception_name, reception_address, reception_time)
values (1, '2027-05-15 16:00:00-03', 'Igreja Nossa Senhora do Carmo', 'Rua Exemplo, 100 - Centro, São Paulo - SP', '16h00',
  'Espaço Jardim das Flores', 'Avenida Exemplo, 2000 - Jardins, São Paulo - SP', '18h00')
on conflict (id) do nothing;

insert into public.wedding_private (id) values (1) on conflict (id) do nothing;

do $$
declare v_theme uuid;
begin
  if (select active_theme_id from public.wedding_settings where id = 1) is null then
    insert into public.wedding_themes (name, base_preset, tokens) values ('Tema do site', 'classic', '{"primary":"#8a6d3b","secondary":"#c9b48a","background":"#fbf8f2","surface":"#ffffff","text":"#2f2a24","button":"#8a6d3b","buttonText":"#ffffff","headingFont":"cormorant","bodyFont":"montserrat","buttonStyle":"square","decoration":"minimal"}'::jsonb)
    returning id into v_theme;
    update public.wedding_settings set active_theme_id = v_theme where id = 1;
  end if;
end $$;

insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('hero', 0, 'Início', true, '{"tagline":"Com a bênção de Deus e de nossas famílias, convidamos você para celebrar o nosso amor.","photoId":null,"focalX":50,"focalY":40,"overlay":35,"ctaLabel":"Conheça nossa história","showCountdown":true}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('story', 1, 'Nossa história', true, '{"title":"Nossa história","subtitle":"Cada capítulo nos trouxe até aqui","intro":"Entre encontros inesperados, conversas que atravessaram madrugadas e muitos planos em comum, descobrimos que queríamos dividir a vida inteira. Aqui estão alguns dos momentos que marcaram o nosso caminho.","events":[{"id":"ev1","date":"2018","title":"Como nos conhecemos","text":"Um encontro despretensioso que mudou tudo.","photoId":null},{"id":"ev2","date":"2018","title":"Primeiro encontro","text":"Um café que durou a tarde inteira.","photoId":null},{"id":"ev3","date":"2019","title":"Pedido de namoro","text":"O sim mais fácil das nossas vidas.","photoId":null},{"id":"ev4","date":"2024","title":"Noivado","text":"Um pedido emocionante, cercado de quem amamos.","photoId":null},{"id":"ev5","date":"2026","title":"Preparativos","text":"Agora contamos os dias para celebrar com você.","photoId":null}]}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('countdown', 2, 'Contagem', false, '{"title":"Falta pouco para o grande dia","afterMessage":"Obrigado por fazer parte do dia mais feliz das nossas vidas!"}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('details', 3, 'O casamento', true, '{"title":"O casamento","subtitle":"Esperamos por você","extraInfo":"Pedimos a gentileza de chegar com 30 minutos de antecedência."}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('location', 4, 'Localização', false, '{"title":"Como chegar","subtitle":"Toque no botão para abrir o trajeto no seu aplicativo favorito","parking":"O local conta com estacionamento gratuito com manobrista.","access":"Acesso pela entrada principal. Local com acessibilidade.","showReceptionMap":true}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('godparents', 5, 'Padrinhos', true, '{"title":"Manual dos padrinhos","welcome":"Queridos padrinhos e madrinhas, vocês foram escolhidos por fazerem parte da nossa história. Preparamos este manual com todo carinho para que vocês aproveitem cada momento.","ceremony":"A entrada será feita em pares, ao som da música escolhida. Ensaiaremos tudo juntos na véspera.","schedule":[{"id":"s1","time":"15:00","label":"Chegada dos padrinhos para fotos"},{"id":"s2","time":"16:00","label":"Início da cerimônia"},{"id":"s3","time":"18:00","label":"Recepção"}],"dressCode":"Traje passeio completo.","palette":["#9bab8f","#c9b48a","#b56576"],"groomsmen":"Terno em tons escuros, gravata na cor indicada pela paleta.","bridesmaids":"Vestido longo em uma das cores da paleta. Evitar branco, off-white e estampas.","beauty":"Indicamos profissionais parceiros para cabelo e maquiagem. Fale conosco para agendar.","photoIds":[]}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('dresscode', 6, 'Dress code', false, '{"title":"Dress code","formality":"Traje passeio completo","guidelines":"Sugerimos tecidos leves e calçados confortáveis — parte da festa será ao ar livre.","suggestedColors":["#9bab8f","#c9b48a","#7d8fa6"],"avoidColors":["#ffffff","#f5f0e6"],"photoIds":[]}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('gallery', 7, 'Galeria', true, '{"title":"Galeria","subtitle":"Momentos que guardamos no coração","layout":"grid"}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('gifts', 8, 'Presentes', true, '{"title":"Lista de presentes","subtitle":"Sua presença é o nosso maior presente","intro":"Se desejar nos presentear, escolha uma das experiências abaixo. O valor é enviado diretamente para nós via PIX.","thankYou":"Muito obrigado pelo carinho! Assim que recebermos o PIX, confirmaremos o seu presente."}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('rsvp', 9, 'RSVP', true, '{"title":"Confirme sua presença","subtitle":"Sua resposta nos ajuda a preparar tudo com carinho","thankYou":"Resposta registrada! Obrigado por nos avisar."}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('messages', 10, 'Recados', false, '{"title":"Mural de recados","subtitle":"Deixe uma mensagem para os noivos"}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('faq', 11, 'Informações', true, '{"title":"Perguntas frequentes","items":[{"id":"f1","question":"Crianças podem participar?","answer":"Sim! As crianças são muito bem-vindas."},{"id":"f2","question":"Existe estacionamento?","answer":"Sim, o local possui estacionamento gratuito."},{"id":"f3","question":"Qual o horário de chegada?","answer":"Recomendamos chegar 30 minutos antes da cerimônia."},{"id":"f4","question":"Posso levar acompanhante?","answer":"O número de acompanhantes está indicado no seu convite."},{"id":"f5","question":"Como chegar?","answer":"Veja a seção Localização com os links para Google Maps e Waze."},{"id":"f6","question":"Existe lista de presentes?","answer":"Sim, preparamos uma lista simbólica com pagamento via PIX."}]}'::jsonb) on conflict (key) do nothing;

insert into public.gifts (name, category, price, mode, quantity, description, position)
select * from (values
  ('Jantar romântico', 'Experiências', 250::numeric, 'unlimited'::public.gift_mode, null::int, 'Um jantar especial a dois durante a lua de mel.', 0),
  ('Cota da lua de mel', 'Lua de mel', 150::numeric, 'unlimited'::public.gift_mode, null::int, 'Ajude a tornar nossa viagem inesquecível.', 1),
  ('Café da manhã especial', 'Experiências', 120::numeric, 'limited'::public.gift_mode, 3::int, 'Um café da manhã caprichado no hotel.', 2),
  ('Passeio a dois', 'Experiências', 300::numeric, 'limited'::public.gift_mode, 2::int, 'Um passeio de barco ao pôr do sol.', 3),
  ('Noite em hotel', 'Lua de mel', 600::numeric, 'single'::public.gift_mode, 1::int, 'Uma noite especial em um hotel charmoso.', 4),
  ('Decoração da casa', 'Casa nova', 200::numeric, 'unlimited'::public.gift_mode, null::int, 'Para deixar nosso lar com a nossa cara.', 5),
  ('Cafeteira', 'Casa nova', 450::numeric, 'single'::public.gift_mode, 1::int, 'Para cafés fresquinhos todas as manhãs.', 6),
  ('Aula de culinária', 'Experiências', 350::numeric, 'single'::public.gift_mode, 1::int, 'Uma aula para aprendermos receitas novas juntos.', 7)
) as v where not exists (select 1 from public.gifts);
