import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar · Painel dos noivos", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <div className="admin flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="admin-card w-full max-w-sm p-8 shadow-sm">
        <p className="text-center font-admin-serif text-4xl">♡</p>
        <h1 className="mt-2 text-center font-admin-serif text-3xl">Painel dos noivos</h1>
        <p className="mt-2 text-center text-sm text-stone-500">Entre com o e-mail e senha cadastrados.</p>
        {erro === "sem-permissao" && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">Este usuário não tem acesso ao painel.</p>
        )}
        <LoginForm />
      </div>
    </div>
  );
}
