// Gera supabase/migrations/0004_seed.sql a partir dos conteúdos padrão em TypeScript.
// Uso: node scripts/generate-seed.mts
import { writeFileSync } from "node:fs";
import { DEFAULT_SECTIONS, DEFAULT_GIFTS } from "../src/lib/content/defaults.ts";
import { DEFAULT_THEME } from "../src/lib/themes/presets.ts";

const q = (v: unknown) => `'${String(v).replace(/'/g, "''")}'`;
const json = (v: unknown) => `${q(JSON.stringify(v))}::jsonb`;

const lines: string[] = [
  "-- =====================================================================",
  "-- Dados iniciais (gerado por scripts/generate-seed.mts — não editar à mão).",
  "-- Pode ser executado mais de uma vez: só insere o que ainda não existe.",
  "-- =====================================================================",
  "",
  "insert into public.wedding_settings (id, wedding_at, ceremony_name, ceremony_address, ceremony_time,",
  "  reception_name, reception_address, reception_time)",
  "values (1, '2027-05-15 16:00:00-03', 'Igreja Nossa Senhora do Carmo', 'Rua Exemplo, 100 - Centro, São Paulo - SP', '16h00',",
  "  'Espaço Jardim das Flores', 'Avenida Exemplo, 2000 - Jardins, São Paulo - SP', '18h00')",
  "on conflict (id) do nothing;",
  "",
  "insert into public.wedding_private (id) values (1) on conflict (id) do nothing;",
  "",
  "do $$",
  "declare v_theme uuid;",
  "begin",
  "  if (select active_theme_id from public.wedding_settings where id = 1) is null then",
  `    insert into public.wedding_themes (name, base_preset, tokens) values ('Tema do site', ${q(DEFAULT_THEME.id)}, ${json(DEFAULT_THEME.tokens)})`,
  "    returning id into v_theme;",
  "    update public.wedding_settings set active_theme_id = v_theme where id = 1;",
  "  end if;",
  "end $$;",
  "",
];

for (const [key, s] of Object.entries(DEFAULT_SECTIONS)) {
  lines.push(
    `insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values (${q(key)}, ${s.position}, ${q(s.nav_label)}, ${s.show_in_nav}, ${json(s.content)}) on conflict (key) do nothing;`,
  );
}

lines.push("", "insert into public.gifts (name, category, price, mode, quantity, description, position)", "select * from (values");
lines.push(
  DEFAULT_GIFTS.map(
    (g, i) =>
      `  (${q(g.name)}, ${q(g.category)}, ${g.price}::numeric, ${q(g.mode)}::public.gift_mode, ${g.quantity ?? "null"}::int, ${q(g.description)}, ${i})`,
  ).join(",\n"),
);
lines.push(") as v where not exists (select 1 from public.gifts);", "");

writeFileSync(new URL("../supabase/migrations/0004_seed.sql", import.meta.url), lines.join("\n"));
console.log("0004_seed.sql gerado");
