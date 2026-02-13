import React from "react";
import { pagePath, pageTitle } from "../lib/site-config.js";
import type { PageKey, SiteData } from "../types.js";

type LayoutProps = {
  data: SiteData;
  currentPage: PageKey;
  enabledPages: PageKey[];
  children: React.ReactNode;
};

export function Layout({ data, currentPage, enabledPages, children }: LayoutProps) {
  const business = data.business;
  const theme = data.theme ?? {};
  const primary = theme.primaryColor ?? "#254336";
  const accent = theme.accentColor ?? "#6b8f71";
  const bg = theme.neutralBackground ?? "#f9f8f4";

  return (
    <div className="min-h-screen text-slate-900" style={{ backgroundColor: bg }}>
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-[min(1100px,92%)] flex-wrap items-center justify-between gap-4 py-4">
          <a href="/" className="text-sm font-semibold tracking-wide" style={{ color: primary }}>
            {business.name}
          </a>
          <nav className="flex flex-wrap gap-3 text-sm">
            {enabledPages.map((page) => (
              <a
                key={page}
                href={pagePath(page)}
                aria-current={page === currentPage ? "page" : undefined}
                className={page === currentPage ? "font-semibold underline underline-offset-4" : ""}
                style={{ color: page === currentPage ? primary : "#334155" }}
              >
                {pageTitle(page)}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-14 border-t border-slate-200 bg-white">
        <div className="mx-auto w-[min(1100px,92%)] py-8 text-sm text-slate-700">
          <p className="font-semibold" style={{ color: primary }}>
            {business.name}
          </p>
          <p className="mt-1">
            {business.phone}
            {business.email ? ` · ${business.email}` : ""}
          </p>
          <p className="mt-1">
            {business.address.street}, {business.address.locality} {business.address.state}{" "}
            {business.address.postCode}
          </p>
          <p className="mt-3 text-xs" style={{ color: accent }}>
            Built with ProfileLauncher
          </p>
        </div>
      </footer>
    </div>
  );
}
