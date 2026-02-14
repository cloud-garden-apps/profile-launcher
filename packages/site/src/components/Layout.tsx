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

  return (
    <div className="min-h-screen bg-white">
      {/* Absolute Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] px-8 py-10 mix-blend-difference pointer-events-none">
        <div className="mx-auto flex max-w-[1700px] items-center justify-between pointer-events-auto">
          <a href="/" className="font-serif text-3xl font-normal tracking-tight text-white hover:italic transition-all">
            {business.name.split(' ').slice(0, 1).join(' ')}.
          </a>

          <nav className="hidden lg:flex items-center gap-12 text-white">
            {['Services', 'Reviews', 'Gallery', 'Contact'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-[10px] uppercase font-bold tracking-[0.3em] hover:opacity-50 transition-opacity"
              >
                {item}
              </a>
            ))}
          </nav>

          <a
            href="#contact"
            className="hidden lg:block border border-white px-8 py-3 text-[10px] uppercase font-bold tracking-[0.3em] text-white hover:bg-white hover:text-black transition-all"
          >
            Inquire
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Simplified Footer */}
      <footer className="bg-black py-40 text-white selection:bg-white selection:text-black">
        <div className="mx-auto max-w-[1400px] px-8">
          <div className="grid grid-cols-1 gap-32 lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-8xl leading-[0.85] tracking-tight mb-20 italic">
                A refined <br /> approach.
              </h2>
              <div className="space-y-4 text-white/40 font-light text-lg">
                 <p className="max-w-md">{business.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-16">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-white/30 block mb-10">Connect</span>
                <div className="space-y-4 font-light text-lg">
                   <p>{business.phone}</p>
                   <p className="opacity-60">{business.address.street}, {business.address.locality}</p>
                   <p className="opacity-60">{business.address.state} {business.address.postCode}</p>
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-white/30 block mb-10">Availability</span>
                <div className="space-y-2 text-sm font-light opacity-60">
                  {business.hours.map(h => (
                    <div key={h.day} className="flex justify-between border-b border-white/10 pb-2">
                      <span>{h.day}</span>
                      <span>{h.open} – {h.close}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-40 pt-10 border-t border-white/5 flex justify-between items-center opacity-30 text-[9px] uppercase font-bold tracking-[0.4em]">
            <p>&copy; {new Date().getFullYear()} {business.name}.</p>
            <p>Built with ProfileLauncher.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
