import React from 'react';

interface ResumeSectionProps {
    title: string;
    children?: React.ReactNode;
}

export const ResumeSection: React.FC<ResumeSectionProps> = ({ title, children }) => (
    <section className="mb-6">
        <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <h2 className="text-[12pt] font-bold text-black uppercase tracking-tighter font-serif mb-0.5">
                {title}
            </h2>
            <div className="border-b-[0.5pt] border-black w-full mb-2"></div>
        </div>
        <div className="text-black font-serif">
            {children}
        </div>
    </section>
);
