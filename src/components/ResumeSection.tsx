import React from 'react';

export const ResumeSection = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <section className="mb-6">
        <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <h2 className="text-[12pt] font-bold text-black uppercase tracking-tight font-serif mb-2">
                {title}
            </h2>
            <div className="border-b-[0.5pt] border-black w-full mb-2"></div>
        </div>
        <div className="text-black font-serif">
            {children}
        </div>
    </section>
);
