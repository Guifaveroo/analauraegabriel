"use client";

import { useEffect, useState } from "react";

export type NavItem = { href: string; label: string };

export function Nav({ items, monogram }: { items: NavItem[]; monogram: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        solid ? "bg-bg/95 text-ink shadow-[0_1px_0_rgba(0,0,0,0.06)] backdrop-blur" : "bg-transparent text-white"
      }`}
    >
      <nav aria-label="Menu principal" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href="#inicio" className="font-heading text-2xl tracking-wide" onClick={() => setOpen(false)}>
          {monogram}
        </a>

        <ul className="hidden items-center gap-7 lg:flex">
          {items.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="text-[0.7rem] font-medium uppercase tracking-[0.22em] opacity-90 transition hover:opacity-100 hover:text-primary">
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="-mr-2 flex h-11 w-11 items-center justify-center lg:hidden"
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-3 w-6">
            <span className={`absolute left-0 top-0 h-px w-6 bg-current transition ${open ? "translate-y-1.5 rotate-45" : ""}`} />
            <span className={`absolute bottom-0 left-0 h-px w-6 bg-current transition ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
          </span>
        </button>
      </nav>

      <div
        id="menu-mobile"
        className={`fixed inset-x-0 bottom-0 top-16 bg-bg text-ink transition-all duration-500 lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <ul className="flex h-full flex-col items-center justify-center gap-6 pb-16">
          {items.map((item, i) => (
            <li key={item.href} style={{ transitionDelay: open ? `${80 + i * 40}ms` : "0ms" }} className={`transition duration-500 ${open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
              <a href={item.href} onClick={() => setOpen(false)} className="font-heading text-3xl">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
