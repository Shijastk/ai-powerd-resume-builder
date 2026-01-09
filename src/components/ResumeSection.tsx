import React from 'react';

export const ResumeSection = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <section className="mb-6 break-inside-avoid">
        <h2 className="text-[12pt] font-bold text-black uppercase tracking-tight font-serif border-b-[0.5pt] border-black pb-1.5 mb-3">
            {title}
        </h2>
        <div className="text-black font-serif">
            {children}
        </div>
    </section>
);
