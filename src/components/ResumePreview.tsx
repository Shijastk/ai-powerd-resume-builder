import React from 'react';
import { ResumeData } from '../types/resume';
import { ResumeSection } from './ResumeSection';

const normalizeUrl = (url: string) => {
    if (!url) return '';

    // already has protocol
    if (/^https?:\/\//i.test(url)) return url;

    // starts with www
    if (/^www\./i.test(url)) return `https://${url}`;

    // plain domain → add https://www.
    return `https://www.${url}`;
};


export const ResumePreview = React.forwardRef<HTMLDivElement, { data: ResumeData }>(({ data }, ref) => (
    <div
        ref={ref}
        id="resume-a4-page"
        className="bg-white text-black mx-auto"
        style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '0mm 20mm 15mm 20mm',
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            fontFamily: "'Times New Roman', Times, serif",
            display: 'flex',
            flexDirection: 'column',
            lineHeight: '1.45',
            textAlign: 'left',
            wordSpacing: 'normal',
            letterSpacing: 'normal'
        }}
    >


        {/* Header Section */}
        <header
            className="mb-6"
            style={{
                textAlign: 'center',
                wordSpacing: 'normal',
                letterSpacing: 'normal',
            }}
        >
            <h1 className="text-[28pt] font-bold uppercase mb-1 leading-none">
                {data.fullName}
            </h1>

            <div className="text-[10.5pt] mb-1">
                <span>{data.location}</span>
                <span className="mx-2">|</span>
                <span>{data.phone}</span>
                <span className="mx-2">|</span>
                <a
                    href={`mailto:${data.email}`}
                    style={{ wordSpacing: 'normal' }}
                    className="text-blue-600 no-underline hover:underline"
                >
                    {data.email}
                </a>
            </div>

            <div
                className="text-[10.5pt]"
                style={{ wordSpacing: 'normal', letterSpacing: 'normal' }}
            >
                {(data.links || []).map((link, idx) => (
                    <React.Fragment key={link.id}>
                        <a
                            href={
                                normalizeUrl(link.url)
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                wordSpacing: 'normal',
                                letterSpacing: 'normal',
                                textAlign: 'left',
                            }}
                            className="text-blue-600 no-underline hover:underline italic"
                        >
                            {link.label || link.url?.replace(/^https?:\/\//, '')}
                        </a>
                        {idx < data.links.length - 1 && (
                            <span className="mx-2">|</span>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </header>

        <div className="space-y-4 flex-1">
            {data.sections.map((section) => {
                if (!section.isVisible) return null;

                switch (section.id) {
                    case 'summary':
                        return data.summary ? (
                            <ResumeSection key={section.id} title={section.title}>
                                <p className="text-[11pt] leading-snug text-black">
                                    {data.summary}
                                </p>
                            </ResumeSection>
                        ) : null;


                    case 'experiences':
                        return (data.experiences || []).length > 0 ? (
                            <ResumeSection key={section.id} title={section.title}>
                                {data.experiences.map((exp) => (
                                    <div key={exp.id} className="mb-5 last:mb-0 break-inside-avoid">
                                        <div className="flex justify-between items-baseline font-bold text-[11pt]">
                                            <span>{exp.company}</span>
                                            <span className="shrink-0 ml-4">{exp.year}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline italic text-[11pt] mb-1">
                                            <span>{exp.position}</span>
                                            <span className="shrink-0 ml-4">{exp.location}</span>
                                        </div>
                                        <ul className="mt-1.5 space-y-1 list-disc pl-5 text-[11pt]">
                                            {(exp.highlights || []).filter(h => h.trim()).map((h, j) => (
                                                <li key={j} className="text-black leading-snug">{h}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </ResumeSection>
                        ) : null;

                    case 'technicalSkills':
                        return (data.technicalSkills || []).length > 0 ? (
                            <ResumeSection key={section.id} title={section.title}>
                                <div className="space-y-1.5">
                                    {data.technicalSkills.map((s, i) => (
                                        <div key={i} className="text-[11pt] flex gap-2 items-start leading-snug">
                                            <span className="font-bold text-black min-w-[125pt] text-left">{s.category}:</span>
                                            <span className="text-black flex-1">{s.skills}</span>
                                        </div>
                                    ))}
                                </div>
                            </ResumeSection>
                        ) : null;

                    case 'projects':
                        return (data.projects || []).length > 0 ? (
                            <ResumeSection key={section.id} title={section.title}>
                                {data.projects.map((proj) => (
                                    <div key={proj.id} className="mb-6 last:mb-0 break-inside-avoid">
                                        <div className="flex justify-between items-baseline gap-4 mb-1">
                                            <span className="font-bold text-[11pt] text-black uppercase">{proj.title}</span>
                                            <span className="text-[10pt] italic shrink-0 text-right" style={{ wordSpacing: 'normal', letterSpacing: 'normal', textAlign: 'right' }}>
                                                {proj.liveLink ? (
                                                    <a
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline whitespace-nowrap mt-[-5px]"
                                                        style={{ wordSpacing: 'normal', letterSpacing: 'normal', display: 'inline-block', }}
                                                        href={normalizeUrl(proj.liveLink)}
                                                    >
                                                        {proj.liveLinkLabel || normalizeUrl(proj.liveLink).replace(/^https?:\/\//, '')}
                                                    </a>
                                                ) : proj.subtitle}
                                            </span>
                                        </div>
                                        {proj.techStack && <div className="text-[10pt] italic mb-1.5">({proj.techStack})</div>}
                                        <ul className="mt-1.5 space-y-1 list-disc pl-5 text-[11pt]">
                                            {(proj.highlights || []).filter(h_1 => h_1.trim()).map((h_2, j_1) => (
                                                <li key={j_1} className="text-black leading-snug">{h_2}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </ResumeSection>
                        ) : null;

                    case 'freelance':
                        return (data.freelance || []).length > 0 ? (
                            <ResumeSection key={section.id} title={section.title}>
                                {data.freelance.map((free) => (
                                    <div key={free.id} className="mb-5 last:mb-0 break-inside-avoid">
                                        <div className="flex justify-between items-baseline font-bold text-[11pt]">
                                            <span>{free.project}</span>
                                            <span className="shrink-0 ml-4">{free.duration}</span>
                                        </div>
                                        <div className="italic text-[11pt] mb-1">
                                            <span>{free.role}</span>
                                        </div>
                                        <ul className="mt-1.5 space-y-1 list-disc pl-5 text-[11pt]">
                                            {(free.highlights || []).filter(h => h.trim()).map((h, j) => (
                                                <li key={j} className="text-black leading-snug">{h}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </ResumeSection>
                        ) : null;

                    case 'certifications':
                        return (data.certifications || []).length > 0 ? (
                            <ResumeSection key={section.id} title={section.title}>
                                <div className="space-y-2">
                                    {data.certifications.map((cert) => (
                                        <div key={cert.id} className="flex justify-between items-baseline text-[11pt] break-inside-avoid">
                                            <div className="flex-1">
                                                <span className="font-bold text-black">{cert.name}</span>
                                                <span className="mx-1 text-black">-</span>
                                                <span className="text-black italic">{cert.issuer}</span>
                                            </div>
                                            <span className="font-bold text-black shrink-0 ml-4">{cert.year}</span>
                                        </div>
                                    ))}
                                </div>
                            </ResumeSection>
                        ) : null;



                    case 'education':
                        return (data.education || []).length > 0 ? (
                            <ResumeSection key={section.id} title={section.title}>
                                {data.education.map((edu) => (
                                    <div key={edu.id} className="mb-4 last:mb-0 break-inside-avoid">
                                        <div className="flex justify-between items-baseline font-bold text-[11pt]">
                                            <span>{edu.school}</span>
                                            <span className="shrink-0 ml-4">{edu.year}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline italic text-[11pt]">
                                            <span>{edu.degree} in {edu.major}</span>
                                            <span className="shrink-0 ml-4">{edu.result}</span>
                                        </div>
                                    </div>
                                ))}
                            </ResumeSection>
                        ) : null;

                    case 'others':
                        return (data.others || []).length > 0 ? (
                            <ResumeSection key={section.id} title={section.title}>
                                <div className="space-y-3">
                                    {data.others.map((item) => (
                                        <div key={item.id} className="break-inside-avoid">
                                            <span className="font-bold text-[11pt] text-black mr-2">{item.title}:</span>
                                            <span className="text-[11pt] text-black leading-snug">{item.description}</span>
                                        </div>
                                    ))}
                                </div>
                            </ResumeSection>
                        ) : null;

                    default: return null;
                }
            })}
        </div>
    </div>
));
