"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/admin/login/actions";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "◫" },
  { href: "/admin/editor", label: "Editar meu site", icon: "✎" },
  { href: "/admin/personalizacao", label: "Personalização", icon: "◐" },
  { href: "/admin/fotos", label: "Fotografias", icon: "▣" },
  { href: "/admin/convidados", label: "Convidados", icon: "☺" },
  { href: "/admin/confirmacoes", label: "Confirmações", icon: "✓" },
  { href: "/admin/presentes", label: "Lista de presentes", icon: "❦" },
  { href: "/admin/pagamentos", label: "Pagamentos", icon: "$" },
  { href: "/admin/mensagens", label: "Mensagens", icon: "✉" },
  { href: "/admin/configuracoes", label: "Configurações", icon: "⚙" },
];

export function Sidebar({ couple, pendingMessages }: { couple: string; pendingMessages: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Menu do painel" className="flex flex-1 flex-col gap-0.5">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition ${
            isActive(item.href) ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-200/60 hover:text-stone-900"
          }`}
        >
          <span aria-hidden className="w-5 text-center text-base opacity-80">{item.icon}</span>
          <span className="flex-1">{item.label}</span>
          {item.href === "/admin/mensagens" && pendingMessages > 0 && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[0.65rem] font-bold text-white">{pendingMessages}</span>
          )}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="mt-6 space-y-1 border-t border-stone-200 pt-4">
      <a href="/" target="_blank" rel="noopener" className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm text-stone-600 hover:bg-stone-200/60">
        <span aria-hidden className="w-5 text-center">↗</span> Ver site publicado
      </a>
      <form action={signOut}>
        <button type="submit" className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-stone-600 hover:bg-stone-200/60">
          <span aria-hidden className="w-5 text-center">⎋</span> Sair
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* barra superior no celular */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-stone-200 bg-[#f7f5f1]/95 px-4 backdrop-blur lg:hidden">
        <span className="font-admin-serif text-xl">{couple}</span>
        <button type="button" onClick={() => setOpen(true)} className="flex h-11 w-11 items-center justify-center text-xl" aria-label="Abrir menu">
          ☰
        </button>
      </div>

      {/* gaveta no celular */}
      <div className={`fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`}>
        <div className={`absolute inset-0 bg-black/30 transition ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
        <aside className={`absolute inset-y-0 left-0 flex w-72 flex-col bg-[#f7f5f1] p-4 shadow-xl transition-transform ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="mb-6 flex items-center justify-between px-3 pt-2">
            <span className="font-admin-serif text-2xl">{couple}</span>
            <button type="button" onClick={() => setOpen(false)} className="h-10 w-10 text-2xl" aria-label="Fechar menu">×</button>
          </div>
          {nav}
          {footer}
        </aside>
      </div>

      {/* menu lateral fixo no desktop */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-stone-200 p-4 lg:flex">
        <div className="mb-8 px-3 pt-3">
          <p className="font-admin-serif text-2xl leading-tight">{couple}</p>
          <p className="text-xs text-stone-500">Painel dos noivos</p>
        </div>
        {nav}
        {footer}
      </aside>
    </>
  );
}
