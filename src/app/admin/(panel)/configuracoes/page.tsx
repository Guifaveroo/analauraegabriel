import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { saveGodparentsPassword, saveSettings } from "@/app/admin/actions/settings";
import { isoToZonedLocal } from "@/lib/format";
import type { WeddingSettings, Photo } from "@/lib/types";
import { PixForm } from "./PixForm";
import { SITE_URL } from "@/lib/env";

function Field({ label, name, defaultValue, type = "text", placeholder, hint, step }: { label: string; name: string; defaultValue?: string | number | null; type?: string; placeholder?: string; hint?: string; step?: string }) {
  return (
    <div>
      <label htmlFor={name} className="admin-label">{label}</label>
      <input id={name} name={name} type={type} step={step} defaultValue={defaultValue ?? ""} placeholder={placeholder} className="admin-input" />
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

function Card({ id, title, description, children }: { id?: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="admin-card scroll-mt-20 p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const [{ data }, { data: priv }, { data: photos }] = await Promise.all([
    supabase.from("wedding_settings").select("*").eq("id", 1).single(),
    supabase.from("wedding_private").select("godparents_password_hash").eq("id", 1).maybeSingle(),
    supabase.from("photos").select("id,caption,album").order("created_at", { ascending: false }),
  ]);
  const s = data as WeddingSettings;
  const tz = s.timezone;
  const hasPassword = Boolean(priv?.godparents_password_hash);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Configurações" description="Dados do casamento, endereços, PIX, confirmação de presença e privacidade." />

      <ActionForm action={saveSettings} className="space-y-6" submitLabel="Salvar configurações">
        <Card title="Noivos e data">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome (1)" name="partner1_name" defaultValue={s.partner1_name} />
            <Field label="Nome (2)" name="partner2_name" defaultValue={s.partner2_name} />
            <Field label="Data e horário da cerimônia" name="wedding_local" type="datetime-local" defaultValue={isoToZonedLocal(s.wedding_at, tz)} />
            <div>
              <label htmlFor="timezone" className="admin-label">Fuso horário</label>
              <select id="timezone" name="timezone" defaultValue={tz} className="admin-input">
                {["America/Sao_Paulo", "America/Manaus", "America/Cuiaba", "America/Belem", "America/Fortaleza", "America/Recife", "America/Bahia", "America/Rio_Branco", "America/Noronha"].map((z) => (
                  <option key={z} value={z}>{z.replace("America/", "").replace("_", " ")}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card title="Endereços" description="Coordenadas são opcionais, mas deixam o Waze e o mapa mais precisos (no Google Maps: clique com o botão direito no local → copie os números).">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-stone-700">Cerimônia</h3>
              <Field label="Local" name="ceremony_name" defaultValue={s.ceremony_name} />
              <Field label="Endereço completo" name="ceremony_address" defaultValue={s.ceremony_address} />
              <Field label="Horário (texto)" name="ceremony_time" defaultValue={s.ceremony_time} placeholder="16h00" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude" name="ceremony_lat" defaultValue={s.ceremony_lat} step="any" placeholder="-23.5505" />
                <Field label="Longitude" name="ceremony_lng" defaultValue={s.ceremony_lng} step="any" placeholder="-46.6333" />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-stone-700">Recepção</h3>
              <Field label="Local" name="reception_name" defaultValue={s.reception_name} hint="Deixe em branco se for no mesmo local" />
              <Field label="Endereço completo" name="reception_address" defaultValue={s.reception_address} />
              <Field label="Horário (texto)" name="reception_time" defaultValue={s.reception_time} placeholder="18h00" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude" name="reception_lat" defaultValue={s.reception_lat} step="any" />
                <Field label="Longitude" name="reception_lng" defaultValue={s.reception_lng} step="any" />
              </div>
            </div>
          </div>
        </Card>

        <Card title="Confirmação de presença (RSVP)">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rsvp_mode" className="admin-label">Modo</label>
              <select id="rsvp_mode" name="rsvp_mode" defaultValue={s.rsvp_mode} className="admin-input">
                <option value="closed">Fechado — somente convidados cadastrados</option>
                <option value="open">Aberto — qualquer pessoa pode confirmar</option>
              </select>
            </div>
            <Field label="Prazo para confirmar (opcional)" name="rsvp_deadline_local" type="datetime-local" defaultValue={s.rsvp_deadline ? isoToZonedLocal(s.rsvp_deadline, tz) : ""} />
            <Field label="Acompanhantes permitidos no modo aberto" name="open_rsvp_max_companions" type="number" defaultValue={s.open_rsvp_max_companions} />
            <label className="flex items-center gap-3 self-end pb-2 text-sm">
              <input type="checkbox" name="rsvp_allow_edit" defaultChecked={s.rsvp_allow_edit} className="h-5 w-5 accent-stone-900" />
              Permitir que o convidado altere a resposta
            </label>
          </div>
        </Card>

        <Card title="Privacidade e compartilhamento" description="Título e descrição aparecem na prévia do link no WhatsApp.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título do site" name="site_title" defaultValue={s.site_title} placeholder="Ana & Laura · 15 de maio de 2027" />
            <Field label="Descrição" name="site_description" defaultValue={s.site_description} />
            <div>
              <label htmlFor="og_photo_id" className="admin-label">Foto da prévia de compartilhamento</label>
              <select id="og_photo_id" name="og_photo_id" defaultValue={s.og_photo_id ?? ""} className="admin-input">
                <option value="">Usar a foto de capa</option>
                {((photos ?? []) as Pick<Photo, "id" | "caption" | "album">[]).map((p) => (
                  <option key={p.id} value={p.id}>{p.caption || `Foto ${p.id.slice(0, 6)}`} ({p.album})</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-3 self-end pb-2 text-sm">
              <input type="checkbox" name="allow_indexing" defaultChecked={s.allow_indexing} className="h-5 w-5 accent-stone-900" />
              Permitir que o site apareça no Google
            </label>
          </div>
        </Card>
      </ActionForm>

      <Card id="pix" title="Chave PIX" description="Os convidados pagam diretamente na sua conta. Teste o QR Code com o app do seu banco antes de divulgar.">
        <PixForm
          initial={{ type: s.pix_key_type ?? "cpf", key: s.pix_key, beneficiary: s.pix_beneficiary, city: s.pix_city }}
        />
      </Card>

      <Card title="Senha do manual dos padrinhos" description={hasPassword ? "O manual está protegido por senha." : "O manual está público. Defina uma senha para restringir o acesso."}>
        <ActionForm action={saveGodparentsPassword} resetOnSuccess submitLabel={hasPassword ? "Trocar senha" : "Definir senha"}>
          <div className="max-w-sm">
            <label htmlFor="gp-password" className="admin-label">Nova senha</label>
            <input id="gp-password" name="password" type="text" autoComplete="off" className="admin-input" />
            <p className="mt-1 text-xs text-stone-500">Envie aos padrinhos junto com o link {SITE_URL}/padrinhos</p>
          </div>
        </ActionForm>
        {hasPassword && (
          <ActionForm action={saveGodparentsPassword} submitLabel="Remover senha (tornar público)" confirm="Tornar o manual público?">
            <input type="hidden" name="remove" value="1" />
          </ActionForm>
        )}
      </Card>
    </div>
  );
}
