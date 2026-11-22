import { requireAdmin } from "@/lib/auth";
import { loadGuestsData, rsvpStats } from "@/lib/admin/queries";
import { PageHeader, StatCard, EmptyState, Badge, FilterTabs } from "@/components/admin/ui";
import { ActionButton, ActionForm } from "@/components/admin/ActionForm";
import { bulkAddGuests, deleteGroup, regenerateInviteCode, saveGroup } from "@/app/admin/actions/guests";
import { SITE_URL } from "@/lib/env";
import { GuestForm } from "./GuestForm";
import { GuestRowActions } from "./GuestRowActions";
import { CopyButton } from "@/components/admin/CopyButton";

type Search = { aba?: string; q?: string; familia?: string; grupo?: string; resposta?: string };

export default async function GuestsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const { guests, groups, responses } = await loadGuestsData(supabase);
  const stats = rsvpStats(guests, responses);
  const families = groups.filter((g) => g.type === "family");
  const categories = groups.filter((g) => g.type === "category");
  const byGuest = new Map(responses.filter((r) => r.guest_id).map((r) => [r.guest_id!, r]));
  const groupName = new Map(groups.map((g) => [g.id, g.name]));
  const tab = sp.aba === "grupos" ? "grupos" : "lista";

  const q = (sp.q ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const filtered = guests.filter((g) => {
    if (q && !g.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q)) return false;
    if (sp.familia && g.family_id !== sp.familia) return false;
    if (sp.grupo && g.category_id !== sp.grupo) return false;
    const r = byGuest.get(g.id);
    if (sp.resposta === "sim" && !r?.attending) return false;
    if (sp.resposta === "nao" && (!r || r.attending)) return false;
    if (sp.resposta === "sem" && r) return false;
    return true;
  });

  const exportQuery = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "aba") as [string, string][]).toString();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Convidados"
        description="Cadastre convidados, organize por famílias e grupos e envie o link de convite de cada família."
        actions={<a href={`/admin/export/convidados${exportQuery ? `?${exportQuery}` : ""}`} className="admin-btn admin-btn-secondary">Exportar CSV</a>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Total" value={stats.totalGuests} />
        <StatCard label="Confirmados" value={stats.confirmed} tone="success" />
        <StatCard label="Ausentes" value={stats.absent} />
        <StatCard label="Sem resposta" value={stats.noResponse} tone="warning" />
        <StatCard label="Pessoas confirmadas" value={stats.people} />
      </div>

      <FilterTabs base="/admin/convidados" param="aba" current={tab === "grupos" ? "grupos" : ""} options={[{ value: "", label: "Lista de convidados", count: guests.length }, { value: "grupos", label: "Famílias e grupos", count: groups.length }]} />

      {tab === "lista" ? (
        <>
          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <section className="admin-card p-5">
              <h2 className="font-semibold">Adicionar convidado</h2>
              <div className="mt-4">
                <GuestForm families={families} categories={categories} />
              </div>
            </section>
            <details className="admin-card p-5">
              <summary className="cursor-pointer font-semibold">+ Cadastro rápido (vários nomes)</summary>
              <ActionForm action={bulkAddGuests} resetOnSuccess submitLabel="Adicionar todos" className="mt-4 space-y-3">
                <div>
                  <label htmlFor="bulk-names" className="admin-label">Um nome por linha</label>
                  <textarea id="bulk-names" name="names" rows={5} className="admin-input" placeholder={"Maria Silva\nJoão Souza"} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select name="family_id" className="admin-input" aria-label="Família">
                    <option value="">Família…</option>
                    {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <select name="category_id" className="admin-input" aria-label="Grupo">
                    <option value="">Grupo…</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input name="max_companions" type="number" min={0} max={20} defaultValue={0} className="admin-input" aria-label="Acompanhantes" title="Acompanhantes permitidos" />
                </div>
              </ActionForm>
            </details>
          </div>

          <form className="admin-card mb-4 grid gap-2 p-3 sm:grid-cols-5" action="/admin/convidados">
            <input name="q" defaultValue={sp.q} placeholder="Buscar por nome" className="admin-input sm:col-span-2" aria-label="Buscar" />
            <select name="familia" defaultValue={sp.familia ?? ""} className="admin-input" aria-label="Família">
              <option value="">Todas as famílias</option>
              {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <select name="grupo" defaultValue={sp.grupo ?? ""} className="admin-input" aria-label="Grupo">
              <option value="">Todos os grupos</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-2">
              <select name="resposta" defaultValue={sp.resposta ?? ""} className="admin-input" aria-label="Resposta">
                <option value="">Todas</option>
                <option value="sim">Confirmados</option>
                <option value="nao">Ausentes</option>
                <option value="sem">Sem resposta</option>
              </select>
              <button type="submit" className="admin-btn">Filtrar</button>
            </div>
          </form>

          {filtered.length === 0 ? (
            <EmptyState>Nenhum convidado encontrado.</EmptyState>
          ) : (
            <div className="admin-card overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="p-3">Nome</th>
                    <th className="p-3">Família</th>
                    <th className="p-3">Grupo</th>
                    <th className="p-3 text-center">Acomp.</th>
                    <th className="p-3">Resposta</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filtered.map((g) => {
                    const r = byGuest.get(g.id);
                    return (
                      <tr key={g.id} className="align-top">
                        <td className="p-3">
                          <p className="font-medium">{g.name}</p>
                          {(g.phone || g.email) && <p className="text-xs text-stone-500">{[g.phone, g.email].filter(Boolean).join(" · ")}</p>}
                        </td>
                        <td className="p-3 text-stone-600">{g.family_id ? groupName.get(g.family_id) : "—"}</td>
                        <td className="p-3 text-stone-600">{g.category_id ? groupName.get(g.category_id) : "—"}</td>
                        <td className="p-3 text-center tabular-nums">{g.max_companions}</td>
                        <td className="p-3">
                          {r ? (
                            <Badge tone={r.attending ? "yes" : "no"}>{r.attending ? `Sim${r.companions.length ? ` +${r.companions.length}` : ""}` : "Não"}</Badge>
                          ) : (
                            <Badge tone="none">Sem resposta</Badge>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <GuestRowActions guest={g} families={families} categories={categories} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="admin-card p-5">
            <h2 className="font-semibold">Famílias</h2>
            <p className="mb-4 text-xs text-stone-500">Cada família tem um link de convite para o RSVP (modo fechado).</p>
            <ActionForm action={saveGroup} resetOnSuccess submitLabel="Adicionar família" className="mb-5">
              <input type="hidden" name="type" value="family" />
              <input name="name" placeholder="Ex.: Família Silva" className="admin-input" aria-label="Nome da família" required />
            </ActionForm>
            {families.length === 0 ? (
              <p className="text-sm text-stone-500">Nenhuma família cadastrada.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {families.map((f) => {
                  const link = `${SITE_URL}/?convite=${f.invite_code}#rsvp`;
                  return (
                    <li key={f.id} className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{f.name}</p>
                          <p className="text-xs text-stone-500">
                            {guests.filter((g) => g.family_id === f.id).length} membro(s) · código <span className="font-mono">{f.invite_code}</span>
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <CopyButton text={link} label="Copiar link" />
                          <ActionButton action={regenerateInviteCode.bind(null, f.id)} confirm="Gerar um novo código? O link antigo deixará de funcionar." className="admin-btn admin-btn-secondary !min-h-8 !px-2 text-xs" title="Gerar novo código">↻</ActionButton>
                          <ActionButton action={deleteGroup.bind(null, f.id)} confirm="Excluir a família? Os convidados continuarão cadastrados, sem família." className="admin-btn admin-btn-danger !min-h-8 !px-2 text-xs">Excluir</ActionButton>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          <section className="admin-card p-5">
            <h2 className="font-semibold">Grupos</h2>
            <p className="mb-4 text-xs text-stone-500">Categorias livres para organizar (ex.: Amigos da faculdade, Trabalho).</p>
            <ActionForm action={saveGroup} resetOnSuccess submitLabel="Adicionar grupo" className="mb-5">
              <input type="hidden" name="type" value="category" />
              <input name="name" placeholder="Ex.: Amigos da faculdade" className="admin-input" aria-label="Nome do grupo" required />
            </ActionForm>
            {categories.length === 0 ? (
              <p className="text-sm text-stone-500">Nenhum grupo cadastrado.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {categories.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-3">
                    <span>
                      {c.name} <span className="text-xs text-stone-500">({guests.filter((g) => g.category_id === c.id).length})</span>
                    </span>
                    <ActionButton action={deleteGroup.bind(null, c.id)} confirm="Excluir o grupo?" className="admin-btn admin-btn-danger !min-h-8 !px-2 text-xs">Excluir</ActionButton>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
