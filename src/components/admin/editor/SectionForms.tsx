"use client";

import type { Section, SectionContentMap, SectionKey } from "@/lib/content/schemas";
import type { Photo } from "@/lib/types";
import { storageUrl } from "@/lib/photos";
import { ColorList, ListEditor, newId, PhotoField, PhotoListField, Range, TextArea, TextField, Toggle } from "./fields";

type FormProps<K extends SectionKey> = {
  content: SectionContentMap[K];
  set: (patch: Partial<SectionContentMap[K]>) => void;
  photos: Photo[];
};

function HeroForm({ content: c, set, photos }: FormProps<"hero">) {
  const photo = c.photoId ? photos.find((p) => p.id === c.photoId) : undefined;
  return (
    <>
      <PhotoField label="Fotografia principal" value={c.photoId} onChange={(photoId) => set({ photoId })} photos={photos} album="cover" />
      {photo && (
        <div>
          <p className="admin-label">Enquadramento — toque no ponto que deve ficar sempre visível</p>
          <button
            type="button"
            className="relative block w-full overflow-hidden rounded-lg"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              set({ focalX: Math.round(((e.clientX - r.left) / r.width) * 100), focalY: Math.round(((e.clientY - r.top) / r.height) * 100) });
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={storageUrl(photo.thumb_path)} alt="" className="w-full" />
            <span
              aria-hidden
              className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.4)]"
              style={{ left: `${c.focalX}%`, top: `${c.focalY}%` }}
            />
          </button>
        </div>
      )}
      <Range label="Escurecimento da foto" value={c.overlay} onChange={(overlay) => set({ overlay })} max={80} suffix="%" />
      <TextArea label="Frase personalizada" value={c.tagline} onChange={(tagline) => set({ tagline })} max={200} rows={2} hint=" " />
      <TextField label="Texto do botão" value={c.ctaLabel} onChange={(ctaLabel) => set({ ctaLabel })} max={40} />
      <Toggle label="Mostrar contagem regressiva na capa" checked={c.showCountdown} onChange={(showCountdown) => set({ showCountdown })} />
    </>
  );
}

function StoryForm({ content: c, set, photos }: FormProps<"story">) {
  return (
    <>
      <TextField label="Título" value={c.title} onChange={(title) => set({ title })} />
      <TextField label="Subtítulo" value={c.subtitle} onChange={(subtitle) => set({ subtitle })} />
      <TextArea label="Texto de abertura" value={c.intro} onChange={(intro) => set({ intro })} max={3000} rows={5} />
      <ListEditor
        label="Linha do tempo"
        items={c.events}
        onChange={(events) => set({ events })}
        max={20}
        addLabel="Adicionar momento"
        create={() => ({ id: newId(), date: "", title: "Novo momento", text: "", photoId: null })}
        render={(ev, update) => (
          <>
            <div className="grid grid-cols-3 gap-2">
              <TextField label="Data" value={ev.date} onChange={(date) => update({ date })} max={60} />
              <div className="col-span-2">
                <TextField label="Título" value={ev.title} onChange={(title) => update({ title })} max={120} />
              </div>
            </div>
            <TextArea label="Texto" value={ev.text} onChange={(text) => update({ text })} max={1500} rows={3} hint=" " />
            <PhotoField label="Foto (opcional)" value={ev.photoId} onChange={(photoId) => update({ photoId })} photos={photos} album="story" />
          </>
        )}
      />
    </>
  );
}

function GodparentsForm({ content: c, set, photos }: FormProps<"godparents">) {
  return (
    <>
      <p className="rounded-lg bg-stone-100 p-3 text-xs text-stone-600">
        Para proteger esta seção com senha, vá em Configurações → Senha do manual dos padrinhos.
      </p>
      <TextField label="Título" value={c.title} onChange={(title) => set({ title })} />
      <TextArea label="Mensagem de boas-vindas" value={c.welcome} onChange={(welcome) => set({ welcome })} max={3000} />
      <TextArea label="Orientações da cerimônia" value={c.ceremony} onChange={(ceremony) => set({ ceremony })} max={3000} />
      <ListEditor
        label="Horários"
        items={c.schedule}
        onChange={(schedule) => set({ schedule })}
        max={20}
        addLabel="Adicionar horário"
        create={() => ({ id: newId(), time: "", label: "" })}
        render={(s, update) => (
          <div className="grid grid-cols-3 gap-2">
            <TextField label="Hora" value={s.time} onChange={(time) => update({ time })} max={20} />
            <div className="col-span-2">
              <TextField label="Descrição" value={s.label} onChange={(label) => update({ label })} max={160} />
            </div>
          </div>
        )}
      />
      <TextArea label="Dress code" value={c.dressCode} onChange={(dressCode) => set({ dressCode })} />
      <ColorList label="Paleta de cores" value={c.palette} onChange={(palette) => set({ palette })} />
      <TextArea label="Orientações para padrinhos" value={c.groomsmen} onChange={(groomsmen) => set({ groomsmen })} />
      <TextArea label="Orientações para madrinhas" value={c.bridesmaids} onChange={(bridesmaids) => set({ bridesmaids })} />
      <TextArea label="Cabelo e maquiagem" value={c.beauty} onChange={(beauty) => set({ beauty })} />
      <PhotoListField label="Fotos de referência" value={c.photoIds} onChange={(photoIds) => set({ photoIds })} photos={photos} album="godparents" />
    </>
  );
}

function DresscodeForm({ content: c, set, photos }: FormProps<"dresscode">) {
  return (
    <>
      <TextField label="Título" value={c.title} onChange={(title) => set({ title })} />
      <TextField label="Formalidade do evento" value={c.formality} onChange={(formality) => set({ formality })} placeholder="Traje passeio completo" />
      <TextArea label="Orientações sobre vestimenta" value={c.guidelines} onChange={(guidelines) => set({ guidelines })} />
      <ColorList label="Cores sugeridas" value={c.suggestedColors} onChange={(suggestedColors) => set({ suggestedColors })} />
      <ColorList label="Cores a evitar" value={c.avoidColors} onChange={(avoidColors) => set({ avoidColors })} />
      <PhotoListField label="Fotos de referência" value={c.photoIds} onChange={(photoIds) => set({ photoIds })} photos={photos} album="dresscode" />
    </>
  );
}

function FaqForm({ content: c, set }: FormProps<"faq">) {
  return (
    <>
      <TextField label="Título" value={c.title} onChange={(title) => set({ title })} />
      <ListEditor
        label="Perguntas e respostas"
        items={c.items}
        onChange={(items) => set({ items })}
        max={40}
        addLabel="Adicionar pergunta"
        create={() => ({ id: newId(), question: "Nova pergunta", answer: "" })}
        render={(it, update) => (
          <>
            <TextField label="Pergunta" value={it.question} onChange={(question) => update({ question })} />
            <TextArea label="Resposta" value={it.answer} onChange={(answer) => update({ answer })} rows={3} hint=" " />
          </>
        )}
      />
    </>
  );
}

export const SECTION_TITLES: Record<SectionKey, string> = {
  hero: "Capa",
  story: "Nossa história",
  countdown: "Contagem regressiva",
  details: "Informações do casamento",
  location: "Localização",
  gallery: "Galeria",
  godparents: "Manual dos padrinhos",
  dresscode: "Dress code",
  gifts: "Lista de presentes",
  rsvp: "Confirmação de presença",
  messages: "Mural de recados",
  faq: "Perguntas frequentes",
};

const HINTS: Partial<Record<SectionKey, string>> = {
  details: "Data, horários e endereços são editados em Configurações.",
  location: "Os endereços e coordenadas do mapa são editados em Configurações.",
  gallery: "As fotos da galeria são gerenciadas em Fotografias (álbum Galeria).",
  gifts: "Os presentes são cadastrados em Lista de presentes.",
  rsvp: "Modo aberto/fechado, prazo e edição são definidos em Configurações.",
  messages: "As mensagens são aprovadas em Mensagens.",
  countdown: "A data usada é a cadastrada em Configurações.",
};

/** Formulário de conteúdo de uma seção. */
export function SectionForm({ section, onChange, photos }: { section: Section; onChange: (content: Section["content"]) => void; photos: Photo[] }) {
  const c = section.content as never;
  const set = (patch: object) => onChange({ ...(section.content as object), ...patch } as Section["content"]);
  const p = { content: c, set, photos };

  const simple = (fields: [string, string, number?, boolean?][]) =>
    fields.map(([key, label, max, area]) =>
      area ? (
        <TextArea key={key} label={label} value={(section.content as Record<string, string>)[key] ?? ""} onChange={(v) => set({ [key]: v })} max={max} />
      ) : (
        <TextField key={key} label={label} value={(section.content as Record<string, string>)[key] ?? ""} onChange={(v) => set({ [key]: v })} max={max} />
      ),
    );

  let body;
  switch (section.key) {
    case "hero": body = <HeroForm {...p} />; break;
    case "story": body = <StoryForm {...p} />; break;
    case "godparents": body = <GodparentsForm {...p} />; break;
    case "dresscode": body = <DresscodeForm {...p} />; break;
    case "faq": body = <FaqForm {...p} />; break;
    case "countdown":
      body = simple([["title", "Título", 120], ["afterMessage", "Mensagem após o casamento", 500, true]]);
      break;
    case "details":
      body = simple([["title", "Título", 120], ["subtitle", "Subtítulo", 200], ["extraInfo", "Informações adicionais", 2000, true]]);
      break;
    case "location": {
      const lc = section.content as SectionContentMap["location"];
      body = (
        <>
          {simple([["title", "Título", 120], ["subtitle", "Subtítulo", 200], ["parking", "Orientações sobre estacionamento", 1000, true], ["access", "Informações de acesso", 1000, true]])}
          <Toggle label="Mostrar mapa da recepção" checked={lc.showReceptionMap} onChange={(showReceptionMap) => set({ showReceptionMap })} />
        </>
      );
      break;
    }
    case "gallery": {
      const gc = section.content as SectionContentMap["gallery"];
      body = (
        <>
          {simple([["title", "Título", 120], ["subtitle", "Subtítulo", 200]])}
          <div>
            <p className="admin-label">Formato</p>
            <div className="flex gap-2">
              {(["grid", "carousel"] as const).map((l) => (
                <button key={l} type="button" onClick={() => set({ layout: l })} className={`admin-btn ${gc.layout === l ? "" : "admin-btn-secondary"}`}>
                  {l === "grid" ? "Grade" : "Carrossel"}
                </button>
              ))}
            </div>
          </div>
        </>
      );
      break;
    }
    case "gifts":
      body = simple([["title", "Título", 120], ["subtitle", "Subtítulo", 200], ["intro", "Texto de introdução", 1500, true], ["thankYou", "Agradecimento após o PIX", 500, true]]);
      break;
    case "rsvp":
      body = simple([["title", "Título", 120], ["subtitle", "Subtítulo", 300], ["thankYou", "Mensagem após confirmar", 500, true]]);
      break;
    case "messages":
      body = simple([["title", "Título", 120], ["subtitle", "Subtítulo", 300]]);
      break;
  }

  return (
    <div className="space-y-4">
      {HINTS[section.key] && <p className="rounded-lg bg-stone-100 p-3 text-xs text-stone-600">{HINTS[section.key]}</p>}
      {body}
    </div>
  );
}
