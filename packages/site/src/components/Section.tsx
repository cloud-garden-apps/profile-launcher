import React from "react";

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

export function Section({ title, children, id }: SectionProps & { id?: string }) {
  return (
    <section id={id} className="py-40 border-t border-black/5">
      <div className="mx-auto max-w-[1700px] px-8">
        <header className="mb-24">
          <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-black/20 block mb-4">
             {id ? `0${['services', 'reviews', 'gallery', 'contact'].indexOf(id) + 1}` : '—'}
          </span>
          <h2 className="font-serif text-9xl tracking-tighter text-black leading-none">
            {title}.
          </h2>
        </header>
        <div>
          {children}
        </div>
      </div>
    </section>
  );
}
