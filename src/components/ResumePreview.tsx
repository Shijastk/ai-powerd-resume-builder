import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ResumeData } from '../types/resume';
import { getLinkDisplay, normalizeUrl } from '../utils/links';

// ---- A4 geometry (matches the PDF exporter) ----
const PX_PER_MM = 96 / 25.4; // browsers render mm at 96dpi
const MARGIN_T = 18;
const MARGIN_B = 15;
const PAGE_CONTENT_PX = (297 - MARGIN_T - MARGIN_B) * PX_PER_MM; // usable height per sheet

// Keep the resume within this many pages by uniformly shrinking the content (font + spacing).
const MAX_PAGES = 2;
const MIN_SCALE = 0.72; // readability floor — below this we stop shrinking (may then exceed 2 pages)

// Shared base look for the resume sheets (kept identical to the old single-page preview).
const sheetBaseStyle: React.CSSProperties = {
    fontFamily: "'Computer Modern Serif', serif",
    lineHeight: 1.38,
    color: '#000000',
    letterSpacing: 'normal',
    wordSpacing: 'normal',
    textAlign: 'left',
};

type Block = { key: string; node: React.ReactNode };

const SectionHeading: React.FC<{ title: string }> = ({ title }) => (
    <div>
        <h2 className="text-[12pt] font-bold text-black uppercase tracking-tighter font-serif mb-0.5">{title}</h2>
        <div className="border-b-[0.5pt] border-black w-full mb-1.5"></div>
    </div>
);

const Bullets: React.FC<{ items?: string[] }> = ({ items }) => (
    <ul className="mt-1 space-y-0.5 list-disc pl-5 text-[11pt]">
        {(items || [])
            .filter((h) => h.trim())
            .map((h, j) => (
                <li key={j} className="text-black leading-snug">
                    {h}
                </li>
            ))}
    </ul>
);

const Header: React.FC<{ data: ResumeData }> = ({ data }) => (
    <header className="mb-4" style={{ textAlign: 'center' }}>
        <h1 className="text-[24pt] font-bold uppercase mb-1 leading-none">{data.fullName}</h1>
        <div className="text-[10.5pt] mb-1">
            <span>{data.location}</span>
            <span className="mx-2">|</span>
            <span>{data.phone}</span>
            <span className="mx-2">|</span>
            <a href={`mailto:${data.email}`} className="text-blue-600 no-underline hover:underline">
                {data.email}
            </a>
        </div>
        <div className="text-[10.5pt]">
            {(data.links || []).map((link, idx) => (
                <React.Fragment key={link.id}>
                    <a
                        href={normalizeUrl(link.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 no-underline hover:underline italic"
                    >
                        {getLinkDisplay(link.url, link.label)}
                    </a>
                    {idx < data.links.length - 1 && <span className="mx-2">|</span>}
                </React.Fragment>
            ))}
        </div>
    </header>
);

/**
 * Flattens the resume into an ordered list of atomic blocks. Each section becomes
 * a heading-block (heading + its first entry, so the heading never orphans) followed
 * by one block per remaining entry. Blocks are the smallest unit the paginator moves
 * between pages, mirroring how the PDF breaks between entries.
 */
const buildBlocks = (data: ResumeData): Block[] => {
    const blocks: Block[] = [{ key: 'header', node: <Header data={data} /> }];

    data.sections.forEach((section) => {
        if (!section.isVisible) return;

        const entries: React.ReactNode[] = [];

        switch (section.id) {
            case 'summary':
                if (!data.summary) return;
                entries.push(<p className="text-[11pt] leading-snug text-black mb-2">{data.summary}</p>);
                break;

            case 'experiences':
                (data.experiences || []).forEach((exp) =>
                    entries.push(
                        <div className="mb-3.5">
                            <div className="flex justify-between items-baseline font-bold text-[11pt]">
                                <p className=" text-left tracking-tighter">{exp.company}</p>
                                <span className="shrink-0 ml-4">{exp.year}</span>
                            </div>
                            <div className="flex justify-between items-baseline italic text-[11pt] mb-1">
                                <span>{exp.position}</span>
                                <span className="shrink-0 ml-4">{exp.location}</span>
                            </div>
                            <Bullets items={exp.highlights} />
                        </div>
                    )
                );
                break;

            case 'technicalSkills':
                (data.technicalSkills || []).forEach((s) =>
                    entries.push(
                        <div className="text-[11pt] flex gap-1.5 items-start leading-snug mb-0.5">
                            <span className="font-bold text-black whitespace-nowrap text-left">{s.category}:</span>
                            <span className="text-black flex-1">{s.skills}</span>
                        </div>
                    )
                );
                break;

            case 'projects':
                (data.projects || []).forEach((proj) =>
                    entries.push(
                        <div className="mb-3">
                            <div className="flex justify-between items-baseline gap-4 mb-1">
                                <span className="font-bold text-[11pt] text-black uppercase">{proj.title}</span>
                                <span className="text-[10pt] italic shrink-0 text-right">
                                    {proj.liveLink ? (
                                        <a
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline whitespace-nowrap"
                                            href={normalizeUrl(proj.liveLink)}
                                        >
                                            {getLinkDisplay(proj.liveLink, proj.liveLinkLabel)}
                                        </a>
                                    ) : (
                                        proj.subtitle
                                    )}
                                </span>
                            </div>
                            {proj.techStack && <div className="text-[10pt] italic mb-1.5">({proj.techStack})</div>}
                            <Bullets items={proj.highlights} />
                        </div>
                    )
                );
                break;

            case 'freelance':
                (data.freelance || []).forEach((free) =>
                    entries.push(
                        <div className="mb-3.5">
                            <div className="flex justify-between items-baseline font-bold text-[11pt]">
                                <span>{free.project}</span>
                                <span className="shrink-0 ml-4">{free.duration}</span>
                            </div>
                            <div className="italic text-[11pt] mb-1">
                                <span>{free.role}</span>
                            </div>
                            <Bullets items={free.highlights} />
                        </div>
                    )
                );
                break;

            case 'certifications':
                (data.certifications || []).forEach((cert) =>
                    entries.push(
                        <div className="flex justify-between items-baseline text-[11pt] mb-2">
                            <div className="flex-1">
                                <span className="font-bold text-black">{cert.name}</span>
                                <span className="mx-1 text-black">-</span>
                                <span className="text-black italic">{cert.issuer}</span>
                            </div>
                            <span className="font-bold text-black shrink-0 ml-4">{cert.year}</span>
                        </div>
                    )
                );
                break;

            case 'education':
                (data.education || []).forEach((edu) =>
                    entries.push(
                        <div className="mb-3">
                            <div className="flex justify-between items-baseline font-bold text-[11pt]">
                                <span>{edu.school}</span>
                                <span className="shrink-0 ml-4">{edu.year}</span>
                            </div>
                            <div className="flex justify-between items-baseline italic text-[11pt]">
                                <span>
                                    {edu.degree} in {edu.major}
                                </span>
                                <span className="shrink-0 ml-4">{edu.result}</span>
                            </div>
                        </div>
                    )
                );
                break;

            case 'others':
                (data.others || []).forEach((item) =>
                    entries.push(
                        <div className="mb-3">
                            <span className="font-bold text-[11pt] text-black mr-2">{item.title}:</span>
                            <span className="text-[11pt] text-black leading-snug">{item.description}</span>
                        </div>
                    )
                );
                break;
        }

        if (!entries.length) return;

        // First block keeps the heading together with the first entry.
        blocks.push({
            key: `${section.id}-head`,
            node: (
                <div>
                    <SectionHeading title={section.title} />
                    {entries[0]}
                </div>
            ),
        });
        entries.slice(1).forEach((node, i) => blocks.push({ key: `${section.id}-${i}`, node }));
    });

    return blocks;
};

/** Greedily packs blocks (by measured height) into A4-page-sized buckets. */
const paginate = (heights: number[]): number[][] => {
    const pages: number[][] = [];
    let current: number[] = [];
    let used = 0;
    heights.forEach((h, i) => {
        if (current.length && used + h > PAGE_CONTENT_PX) {
            pages.push(current);
            current = [];
            used = 0;
        }
        current.push(i);
        used += h;
    });
    if (current.length) pages.push(current);
    return pages.length ? pages : [[]];
};

export const ResumePreview = React.forwardRef<HTMLDivElement, { data: ResumeData }>(({ data }, ref) => {
    const blocks = useMemo(() => buildBlocks(data), [data]);
    const measureRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [pages, setPages] = useState<number[][]>(() => [blocks.map((_, i) => i)]);
    const [scale, setScale] = useState(1);

    useLayoutEffect(() => {
        // Heights are measured at the natural (unscaled) 170mm content width.
        const heights = blocks.map((_, i) => measureRefs.current[i]?.offsetHeight || 0);
        const total = heights.reduce((a, b) => a + b, 0);
        const target = MAX_PAGES * PAGE_CONTENT_PX;
        // Shrink only when the natural content overflows the page budget. Shrinking the font also
        // wraps more text per line, so the rendered result is always a little shorter than this
        // estimate — it never overflows MAX_PAGES.
        const s = total > target ? Math.max(MIN_SCALE, target / total) : 1;
        setScale(s);
        setPages(paginate(heights.map((h) => h * s)));
    }, [blocks]);

    // `display: flow-root` makes each wrapper contain its children's margins so
    // offsetHeight reflects the block's true rendered height (margins included).
    const blockWrapper: React.CSSProperties = { display: 'flow-root' };

    return (
        <div ref={ref} className="flex flex-col items-center gap-8">
            {/* Off-screen measuring pass at the exact A4 content width (170mm). */}
            <div
                aria-hidden
                className="tracking-tighter"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '170mm',
                    visibility: 'hidden',
                    pointerEvents: 'none',
                    zIndex: -1,
                    ...sheetBaseStyle,
                }}
            >
                {blocks.map((b, i) => (
                    <div key={b.key} ref={(el) => (measureRefs.current[i] = el)} style={blockWrapper}>
                        {b.node}
                    </div>
                ))}
            </div>

            {/* Real A4 sheets. */}
            {pages.map((pageIdxs, pi) => (
                <div
                    key={pi}
                    className="bg-white shadow-2xl tracking-tighter"
                    style={{
                        width: '210mm',
                        height: '297mm',
                        padding: '18mm 20mm 15mm 20mm',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        ...sheetBaseStyle,
                    }}
                >
                    {/* Uniform shrink-to-fit: scale the content down and widen it by 1/scale so it
                        still fills the 170mm column (font + spacing shrink, width is preserved). */}
                    <div
                        style={
                            scale < 1
                                ? { transform: `scale(${scale})`, transformOrigin: 'top left', width: `${100 / scale}%` }
                                : undefined
                        }
                    >
                        {pageIdxs.map((i) => (
                            <div key={blocks[i].key} style={blockWrapper}>
                                {blocks[i].node}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
});
