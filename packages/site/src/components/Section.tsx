import React from "react";

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

export function Section({ title, children }: SectionProps) {
  return (
    <section className="py-12">
      <div className="mx-auto w-[min(1100px,92%)]">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {children}
      </div>
    </section>
  );
}
