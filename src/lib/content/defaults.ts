import type { SectionContentMap, SectionKey } from "./schemas";

/** Conteúdo inicial de exemplo — os noivos editam tudo pelo painel. */
export const DEFAULT_SECTIONS: {
  [K in SectionKey]: { position: number; nav_label: string; show_in_nav: boolean; content: SectionContentMap[K] };
} = {
  hero: {
    position: 0,
    nav_label: "Início",
    show_in_nav: true,
    content: {
      tagline: "Com a bênção de Deus e de nossas famílias, convidamos você para celebrar o nosso amor.",
      photoId: null,
      focalX: 50,
      focalY: 40,
      overlay: 35,
      ctaLabel: "Conheça nossa história",
      showCountdown: true,
    },
  },
  story: {
    position: 1,
    nav_label: "Nossa história",
    show_in_nav: true,
    content: {
      title: "Nossa história",
      subtitle: "Cada capítulo nos trouxe até aqui",
      intro:
        "Entre encontros inesperados, conversas que atravessaram madrugadas e muitos planos em comum, descobrimos que queríamos dividir a vida inteira. Aqui estão alguns dos momentos que marcaram o nosso caminho.",
      events: [
        { id: "ev1", date: "2018", title: "Como nos conhecemos", text: "Um encontro despretensioso que mudou tudo.", photoId: null },
        { id: "ev2", date: "2018", title: "Primeiro encontro", text: "Um café que durou a tarde inteira.", photoId: null },
        { id: "ev3", date: "2019", title: "Pedido de namoro", text: "O sim mais fácil das nossas vidas.", photoId: null },
        { id: "ev4", date: "2024", title: "Noivado", text: "Um pedido emocionante, cercado de quem amamos.", photoId: null },
        { id: "ev5", date: "2026", title: "Preparativos", text: "Agora contamos os dias para celebrar com você.", photoId: null },
      ],
    },
  },
  countdown: {
    position: 2,
    nav_label: "Contagem",
    show_in_nav: false,
    content: {
      title: "Falta pouco para o grande dia",
      afterMessage: "Obrigado por fazer parte do dia mais feliz das nossas vidas!",
    },
  },
  details: {
    position: 3,
    nav_label: "O casamento",
    show_in_nav: true,
    content: {
      title: "O casamento",
      subtitle: "Esperamos por você",
      extraInfo: "Pedimos a gentileza de chegar com 30 minutos de antecedência.",
    },
  },
  location: {
    position: 4,
    nav_label: "Localização",
    show_in_nav: false,
    content: {
      title: "Como chegar",
      subtitle: "Toque no botão para abrir o trajeto no seu aplicativo favorito",
      parking: "O local conta com estacionamento gratuito com manobrista.",
      access: "Acesso pela entrada principal. Local com acessibilidade.",
      showReceptionMap: true,
    },
  },
  godparents: {
    position: 5,
    nav_label: "Padrinhos",
    show_in_nav: true,
    content: {
      title: "Manual dos padrinhos",
      welcome:
        "Queridos padrinhos e madrinhas, vocês foram escolhidos por fazerem parte da nossa história. Preparamos este manual com todo carinho para que vocês aproveitem cada momento.",
      ceremony: "A entrada será feita em pares, ao som da música escolhida. Ensaiaremos tudo juntos na véspera.",
      schedule: [
        { id: "s1", time: "15:00", label: "Chegada dos padrinhos para fotos" },
        { id: "s2", time: "16:00", label: "Início da cerimônia" },
        { id: "s3", time: "18:00", label: "Recepção" },
      ],
      dressCode: "Traje passeio completo.",
      palette: ["#9bab8f", "#c9b48a", "#b56576"],
      groomsmen: "Terno em tons escuros, gravata na cor indicada pela paleta.",
      bridesmaids: "Vestido longo em uma das cores da paleta. Evitar branco, off-white e estampas.",
      beauty: "Indicamos profissionais parceiros para cabelo e maquiagem. Fale conosco para agendar.",
      photoIds: [],
    },
  },
  dresscode: {
    position: 6,
    nav_label: "Dress code",
    show_in_nav: false,
    content: {
      title: "Dress code",
      formality: "Traje passeio completo",
      guidelines: "Sugerimos tecidos leves e calçados confortáveis — parte da festa será ao ar livre.",
      suggestedColors: ["#9bab8f", "#c9b48a", "#7d8fa6"],
      avoidColors: ["#ffffff", "#f5f0e6"],
      photoIds: [],
    },
  },
  gallery: {
    position: 7,
    nav_label: "Galeria",
    show_in_nav: true,
    content: { title: "Galeria", subtitle: "Momentos que guardamos no coração", layout: "grid" },
  },
  gifts: {
    position: 8,
    nav_label: "Presentes",
    show_in_nav: true,
    content: {
      title: "Lista de presentes",
      subtitle: "Sua presença é o nosso maior presente",
      intro:
        "Se desejar nos presentear, escolha uma das experiências abaixo. O valor é enviado diretamente para nós via PIX.",
      thankYou: "Muito obrigado pelo carinho! Assim que recebermos o PIX, confirmaremos o seu presente.",
    },
  },
  rsvp: {
    position: 9,
    nav_label: "RSVP",
    show_in_nav: true,
    content: {
      title: "Confirme sua presença",
      subtitle: "Sua resposta nos ajuda a preparar tudo com carinho",
      thankYou: "Resposta registrada! Obrigado por nos avisar.",
    },
  },
  messages: {
    position: 10,
    nav_label: "Recados",
    show_in_nav: false,
    content: { title: "Mural de recados", subtitle: "Deixe uma mensagem para os noivos" },
  },
  faq: {
    position: 11,
    nav_label: "Informações",
    show_in_nav: true,
    content: {
      title: "Perguntas frequentes",
      items: [
        { id: "f1", question: "Crianças podem participar?", answer: "Sim! As crianças são muito bem-vindas." },
        { id: "f2", question: "Existe estacionamento?", answer: "Sim, o local possui estacionamento gratuito." },
        { id: "f3", question: "Qual o horário de chegada?", answer: "Recomendamos chegar 30 minutos antes da cerimônia." },
        { id: "f4", question: "Posso levar acompanhante?", answer: "O número de acompanhantes está indicado no seu convite." },
        { id: "f5", question: "Como chegar?", answer: "Veja a seção Localização com os links para Google Maps e Waze." },
        { id: "f6", question: "Existe lista de presentes?", answer: "Sim, preparamos uma lista simbólica com pagamento via PIX." },
      ],
    },
  },
};

export const DEFAULT_GIFTS = [
  { name: "Jantar romântico", category: "Experiências", price: 250, mode: "unlimited", quantity: null, description: "Um jantar especial a dois durante a lua de mel." },
  { name: "Cota da lua de mel", category: "Lua de mel", price: 150, mode: "unlimited", quantity: null, description: "Ajude a tornar nossa viagem inesquecível." },
  { name: "Café da manhã especial", category: "Experiências", price: 120, mode: "limited", quantity: 3, description: "Um café da manhã caprichado no hotel." },
  { name: "Passeio a dois", category: "Experiências", price: 300, mode: "limited", quantity: 2, description: "Um passeio de barco ao pôr do sol." },
  { name: "Noite em hotel", category: "Lua de mel", price: 600, mode: "single", quantity: 1, description: "Uma noite especial em um hotel charmoso." },
  { name: "Decoração da casa", category: "Casa nova", price: 200, mode: "unlimited", quantity: null, description: "Para deixar nosso lar com a nossa cara." },
  { name: "Cafeteira", category: "Casa nova", price: 450, mode: "single", quantity: 1, description: "Para cafés fresquinhos todas as manhãs." },
  { name: "Aula de culinária", category: "Experiências", price: 350, mode: "single", quantity: 1, description: "Uma aula para aprendermos receitas novas juntos." },
] as const;
