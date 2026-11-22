// Teste de ponta a ponta do fluxo principal (site público + painel).
// Requer o app rodando com um Supabase de testes e um usuário administrador.
//
// Uso:
//   BASE_URL=http://localhost:3100 ADMIN_EMAIL=... ADMIN_PASSWORD=... \
//   PHOTO=/caminho/foto.jpg node tests/e2e/smoke.mjs
//
// ATENÇÃO: cria dados de teste (convidados, pedidos, mensagens). Não rode em produção.

import assert from "node:assert/strict";
import { createRequire } from "node:module";

// resolve o Playwright do projeto ou o instalado globalmente (NODE_PATH)
const { chromium, devices } = createRequire(import.meta.url)("playwright");

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
const PHOTO = process.env.PHOTO;
const SHOTS = process.env.SHOTS_DIR;
if (!EMAIL || !PASSWORD) throw new Error("Defina ADMIN_EMAIL e ADMIN_PASSWORD");

const step = (name) => console.log(`\n▶ ${name}`);
const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });

/** Verifica o CRC16 do payload PIX (mesmo algoritmo do gerador). */
function validPix(payload) {
  const body = payload.slice(0, -4);
  let crc = 0xffff;
  for (let i = 0; i < body.length; i++) {
    crc ^= body.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return body.endsWith("6304") && crc.toString(16).toUpperCase().padStart(4, "0") === payload.slice(-4);
}

const browser = await chromium.launch();
const admin = await browser.newPage({ viewport: { width: 1366, height: 900 } });
admin.on("dialog", (d) => d.accept(d.type() === "prompt" ? "teste automatizado" : undefined));
const errors = [];
admin.on("pageerror", (e) => errors.push(`admin: ${e.message}`));

try {
  step("Login do painel");
  await admin.goto(`${BASE}/admin`);
  assert.match(admin.url(), /\/admin\/login/, "deveria redirecionar para o login");
  await admin.fill("#email", EMAIL);
  await admin.fill("#password", "senha-errada");
  await admin.click("button[type=submit]");
  await admin.getByText("E-mail ou senha incorretos").waitFor();
  await admin.fill("#password", PASSWORD);
  await admin.click("button[type=submit]");
  await admin.waitForURL(`${BASE}/admin`);
  await shot(admin, "01-dashboard");

  step("Configurar chave PIX");
  await admin.goto(`${BASE}/admin/configuracoes`);
  await admin.selectOption("#pix_key_type", "email");
  await admin.fill("#pix_key", "noivos@exemplo.com");
  await admin.fill("#pix_beneficiary", "Ana e Laura");
  await admin.fill("#pix_city", "São Paulo");
  await admin.getByAltText("QR Code PIX de teste").waitFor();
  await admin.getByRole("button", { name: "Salvar chave PIX" }).click();
  await admin.getByText("Chave PIX salva ✓").waitFor();

  step("Senha do manual dos padrinhos");
  await admin.fill("#gp-password", "padrinhos2027");
  await admin.getByRole("button", { name: /Definir senha|Trocar senha/ }).click();
  await admin.getByText(/manual protegido/).waitFor();

  step("Família e convidado (RSVP fechado)");
  await admin.goto(`${BASE}/admin/convidados?aba=grupos`);
  const familyName = `Família Teste ${Date.now() % 10000}`;
  await admin.fill("input[aria-label='Nome da família']", familyName);
  await admin.getByRole("button", { name: "Adicionar família" }).click();
  const famItem = admin.locator("li", { hasText: familyName });
  await famItem.waitFor();
  const code = (await famItem.locator("span.font-mono").innerText()).trim();
  assert.match(code, /^[A-Z0-9]{6}$/);
  await admin.goto(`${BASE}/admin/convidados`);
    await admin.fill("#new-name", "Convidado Teste da Silva");
  await admin.selectOption("#new-family", { label: familyName });
  await admin.fill("#new-comp", "1");
  await admin.getByRole("button", { name: "Adicionar", exact: true }).click();
  await admin.getByText("Convidado adicionado ✓").waitFor();

  if (PHOTO) {
    step("Upload de fotografia (galeria)");
    await admin.goto(`${BASE}/admin/fotos`);
    await admin.selectOption("#upload-album", "gallery");
    await admin.setInputFiles("input[type=file]", PHOTO);
    await admin.locator("li", { hasText: "✓" }).first().waitFor({ timeout: 30000 });
    await admin.waitForTimeout(1500);
    await admin.goto(`${BASE}/admin/fotos?album=gallery`);
    assert.ok((await admin.locator("ul img").count()) >= 1, "foto não apareceu na biblioteca");
    await shot(admin, "02-fotos");
  }

  step("Editor visual: tema Romântico floral + publicar");
  await admin.goto(`${BASE}/admin/editor?aba=aparencia`);
  await admin.getByRole("button", { name: /Romântico floral/ }).click();
  const frame = admin.frameLocator("iframe[title='Pré-visualização do site']");
  await frame.locator(".site").first().waitFor();
  await admin.waitForTimeout(800);
  const previewBg = await frame.locator(".site").first().evaluate((el) => getComputedStyle(el).getPropertyValue("--c-primary").trim());
  assert.equal(previewBg, "#b56576", "pré-visualização não refletiu o tema");
  await admin.getByRole("button", { name: "Conteúdo" }).click();
  await admin.selectOption("#section-select", "hero");
  await admin.getByLabel("Frase personalizada").fill("Frase publicada pelo teste automatizado");
  await shot(admin, "03-editor");
  await admin.getByRole("button", { name: "Publicar" }).click();
  await admin.getByText("Site publicado ✓").waitFor();

  step("Site público reflete a publicação");
  const guest = await browser.newPage({ ...devices["iPhone 13"] });
  guest.on("pageerror", (e) => errors.push(`site: ${e.message}`));
  await guest.goto(BASE);
  await guest.getByText("Frase publicada pelo teste automatizado").waitFor();
  const primary = await guest.locator(".site").first().evaluate((el) => getComputedStyle(el).getPropertyValue("--c-primary").trim());
  assert.equal(primary, "#b56576");
  await shot(guest, "04-site-mobile");

  step("Presente: gerar PIX (pendente)");
  const card = guest.locator("article", { hasText: "Noite em hotel" });
  await card.getByRole("button", { name: "Presentear" }).click();
  await guest.fill("#pix-name", "Madrinha Teste");
  await guest.check("input[name=consent]");
  await guest.waitForTimeout(1600); // tempo mínimo antispam
  await guest.getByRole("button", { name: "Continuar para o PIX" }).click();
  const code0 = guest.locator("#pix-code");
  await code0.waitFor();
  const payload = await code0.inputValue();
  assert.ok(validPix(payload), "payload PIX com CRC inválido");
  assert.ok(payload.includes("5406600.00"), "valor do presente ausente no PIX");
  assert.ok(payload.includes("noivos@exemplo.com"), "chave PIX ausente");
  await guest.getByAltText(/QR Code PIX/).waitFor();
  await shot(guest, "05-pix");
  await guest.getByRole("button", { name: "Já fiz o PIX" }).click();
  await guest.getByText("Obrigado!").waitFor();

  step("Concorrência: o mesmo presente único não pode ser escolhido de novo");
  await guest.reload();
  await guest.locator("article", { hasText: "Noite em hotel" }).getByRole("button", { name: "Indisponível" }).waitFor();

  step("Painel: pagamento pendente → confirmar manualmente");
  await admin.goto(`${BASE}/admin/pagamentos?status=PENDING`);
  const row = admin.locator("tr", { hasText: "Madrinha Teste" });
  await row.waitFor();
  await row.getByRole("button", { name: "Confirmar pagamento" }).click();
  await admin.goto(`${BASE}/admin/pagamentos?status=PAID`);
  await admin.locator("tr", { hasText: "Madrinha Teste" }).getByRole("button", { name: "Histórico" }).click();
  await admin.getByText("Solicitação criada pelo convidado").waitFor();
  await shot(admin, "06-pagamentos");
  const csv = await admin.request.get(`${BASE}/admin/export/pagamentos`);
  assert.equal(csv.status(), 200);
  assert.match(await csv.text(), /Madrinha Teste;.*Noite em hotel;600,00;Pago/);

  step("RSVP pelo link do convite");
  await guest.goto(`${BASE}/?convite=${code}#rsvp`);
  await guest.getByText("Convidado Teste da Silva").waitFor({ timeout: 15000 });
  await guest.locator("label", { hasText: "Sim, estarei lá" }).click();
  await guest.selectOption("#rsvp-0-count", "1");
  await guest.fill("input[aria-label='Nome do acompanhante 1']", "Acompanhante Teste");
  await guest.fill("#rsvp-0-diet", "Vegetariano");
  await guest.locator("#rsvp input[name=consent]").check();
  await guest.waitForTimeout(1600);
  await guest.getByRole("button", { name: "Enviar confirmação" }).click();
  await guest.getByText("Resposta registrada!").waitFor();

  step("Mural de recados");
  await guest.fill("#msg-name", "Tia Teste");
  await guest.fill("#msg-text", "Felicidades ao casal! (teste)");
  await guest.locator("#recados input[name=consent]").check();
  await guest.waitForTimeout(1600);
  await guest.getByRole("button", { name: "Enviar mensagem" }).click();
  await guest.getByText(/aparecerá aqui assim que os noivos aprovarem/).waitFor();

  step("Painel: confirmações e moderação");
  await admin.goto(`${BASE}/admin/confirmacoes`);
  await admin.locator("tr", { hasText: "Convidado Teste da Silva" }).getByText("Acompanhante Teste").waitFor();
  await admin.goto(`${BASE}/admin/mensagens`);
  await admin.locator("li", { hasText: "Tia Teste" }).getByRole("button", { name: "Aprovar e publicar" }).click();
  await admin.waitForTimeout(800);
  await guest.goto(`${BASE}/#recados`);
  await guest.getByText("Felicidades ao casal! (teste)").waitFor();

  step("Manual dos padrinhos protegido por senha");
  await guest.goto(`${BASE}/padrinhos`);
  await guest.fill("#gp-pass", "errada");
  await guest.getByRole("button", { name: "Entrar" }).click();
  await guest.getByText("Senha incorreta.").waitFor();
  await guest.fill("#gp-pass", "padrinhos2027");
  await guest.getByRole("button", { name: "Entrar" }).click();
  await guest.getByRole("heading", { name: "Horários" }).waitFor();

  step("Dashboard");
  await admin.goto(`${BASE}/admin`);
  await shot(admin, "07-dashboard");

  assert.deepEqual(errors, [], `erros de JavaScript: ${errors.join(" | ")}`);
  console.log("\n✅ Fluxo completo OK");
} catch (e) {
  await shot(admin, "zz-falha-admin").catch(() => {});
  console.error("\n❌", e);
  if (errors.length) console.error("Erros de JS:", errors);
  process.exitCode = 1;
} finally {
  await browser.close();
}
