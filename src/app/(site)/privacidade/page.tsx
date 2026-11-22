import type { Metadata } from "next";
import Link from "next/link";
import { getPublicSiteData } from "@/lib/data/site";
import { themeToCssVars } from "@/lib/themes/css";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Política de privacidade" };

export default async function PrivacyPage() {
  const { settings, theme } = await getPublicSiteData();
  const names = `${settings.partner1_name} e ${settings.partner2_name}`;
  return (
    <div className="site" style={themeToCssVars(theme)}>
      <main className="mx-auto max-w-2xl px-5 py-16 leading-7">
        <Link href="/" className="text-xs uppercase tracking-[0.2em] opacity-80">← Voltar ao site</Link>
        <h1 className="heading-lg mt-8">Política de privacidade</h1>
        <div className="muted mt-8 space-y-5 text-sm sm:text-base">
          <p>
            Este site é pessoal e foi criado por {names} exclusivamente para a organização do casamento. Tratamos seus dados
            conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
          </p>
          <h2 className="font-heading text-2xl text-ink">Quais dados coletamos</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Confirmação de presença: nome, acompanhantes, restrições alimentares e observações.</li>
            <li>Presentes: nome, e-mail (opcional), presente escolhido e valor.</li>
            <li>Mural de recados: nome e mensagem (publicados somente após aprovação).</li>
          </ul>
          <h2 className="font-heading text-2xl text-ink">Como usamos</h2>
          <p>
            Apenas para planejar o evento, identificar os presentes recebidos e agradecer. Os dados não são vendidos nem
            compartilhados com terceiros e ficam acessíveis somente aos noivos.
          </p>
          <h2 className="font-heading text-2xl text-ink">Pagamentos</h2>
          <p>
            Os presentes são pagos via PIX diretamente na conta dos noivos, pelo aplicativo do seu banco. Este site não
            processa pagamentos e não armazena dados bancários.
          </p>
          <h2 className="font-heading text-2xl text-ink">Segurança e retenção</h2>
          <p>
            Os dados são armazenados com controle de acesso e excluídos após o encerramento das atividades relacionadas ao
            casamento. Para proteção contra spam, guardamos temporariamente um código anônimo derivado do endereço de conexão.
          </p>
          <h2 className="font-heading text-2xl text-ink">Seus direitos</h2>
          <p>
            Você pode solicitar a qualquer momento acesso, correção ou exclusão dos seus dados entrando em contato diretamente
            com os noivos.
          </p>
        </div>
      </main>
    </div>
  );
}
