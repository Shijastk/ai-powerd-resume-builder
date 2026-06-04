import jsPDF from 'jspdf';
import { generateLatex } from '../utils/latexGenerator';
import { getLinkDisplay, normalizeUrl } from '../utils/links';
import { ResumeData } from '../types/resume';

// ---- Page geometry (A4, millimetres) ----
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_L = 20;
const MARGIN_R = 20;
const MARGIN_T = 18;
const MARGIN_B = 15;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R; // 170mm

const LINE_FACTOR = 1.3;
const ptToMm = (pt: number) => pt * 0.3528;
const lineHeight = (size: number) => ptToMm(size) * LINE_FACTOR;

// Keep the PDF to at most this many pages by uniformly shrinking font sizes + vertical gaps.
const MAX_PAGES = 2;
const MIN_SCALE = 0.72; // don't shrink below this — readability floor (then it may exceed 2 pages)
const USABLE_H = PAGE_H - MARGIN_T - MARGIN_B; // 264mm of content height per sheet

// ---- Colours (RGB; jsPDF setTextColor is most reliable with numbers) ----
const BLACK: [number, number, number] = [0, 0, 0];
const BLUE: [number, number, number] = [37, 99, 235];
const RED: [number, number, number] = [220, 38, 38];

type Style = 'normal' | 'bold' | 'italic' | 'bolditalic';

/**
 * Builds a real, selectable (ATS-readable) text PDF directly from the resume
 * data using jsPDF's text APIs. Every line is positioned by hand, so there are
 * no html2canvas letter/word-spacing artifacts.
 */
// Render the resume into a jsPDF doc. `scale` uniformly multiplies every font size and vertical
// gap so the whole resume can be compressed to fit a page budget. In `measure` mode no page breaks
// are inserted, so the returned `height` is the resume's true single-column content height (used to
// derive the scale before the real render).
const buildResumePdf = (data: ResumeData, scale = 1, measure = false): { doc: jsPDF; height: number } => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    let y = MARGIN_T;

    const fs = (n: number) => n * scale;   // scaled font size (pt)
    const gap = (mm: number) => mm * scale; // scaled vertical gap (mm)

    const setColor = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);

    /** Break to a new page if `h` mm won't fit in the remaining content area (disabled while measuring). */
    const ensureSpace = (h: number) => {
        if (measure) return;
        if (y + h > PAGE_H - MARGIN_B) {
            doc.addPage();
            y = MARGIN_T;
        }
    };

    /** Centered single line. */
    const drawCenter = (text: string, size: number, style: Style) => {
        const lh = lineHeight(size);
        ensureSpace(lh);
        y += lh;
        doc.setFont('times', style);
        doc.setFontSize(size);
        setColor(BLACK);
        doc.text(text, PAGE_W / 2, y, { align: 'center' });
    };

    type Segment = { text: string; url?: string; style?: Style; color?: [number, number, number] };

    /** Centered row of "a | b | c" segments, any of which may be a clickable link. */
    const drawCenteredSegments = (segments: Segment[], size: number, sep = '   |   ') => {
        if (!segments.length) return;
        const lh = lineHeight(size);
        ensureSpace(lh);
        y += lh;
        doc.setFontSize(size);
        const widthOf = (seg: Segment) => {
            doc.setFont('times', seg.style || 'normal');
            return doc.getTextWidth(seg.text);
        };
        doc.setFont('times', 'normal');
        const sepW = doc.getTextWidth(sep);
        const widths = segments.map(widthOf);
        const total = widths.reduce((a, b) => a + b, 0) + sepW * (segments.length - 1);
        let x = PAGE_W / 2 - total / 2;
        segments.forEach((seg, i) => {
            doc.setFont('times', seg.style || 'normal');
            doc.setFontSize(size);
            setColor(seg.color || BLACK);
            if (seg.url) doc.textWithLink(seg.text, x, y, { url: seg.url });
            else doc.text(seg.text, x, y);
            x += widths[i];
            if (i < segments.length - 1) {
                doc.setFont('times', 'normal');
                setColor(BLACK);
                doc.text(sep, x, y);
                x += sepW;
            }
        });
        setColor(BLACK);
    };

    /** Wrapped paragraph starting at x. */
    const writeWrapped = (text: string, x: number, maxW: number, size: number, style: Style = 'normal') => {
        if (!text) return;
        doc.setFont('times', style);
        doc.setFontSize(size);
        const lines: string[] = doc.splitTextToSize(text, maxW);
        lines.forEach((line) => {
            const lh = lineHeight(size);
            ensureSpace(lh);
            y += lh;
            doc.setFont('times', style);
            doc.setFontSize(size);
            setColor(BLACK);
            doc.text(line, x, y);
        });
    };

    /** Left text + right-aligned text on one baseline (right side may be a link). */
    const leftRight = (
        left: string,
        right: string,
        size: number,
        opts: {
            leftStyle?: Style;
            rightStyle?: Style;
            leftColor?: [number, number, number];
            rightColor?: [number, number, number];
            rightUrl?: string;
        } = {}
    ) => {
        const { leftStyle = 'bold', rightStyle = 'bold', leftColor, rightColor, rightUrl } = opts;
        const lh = lineHeight(size);
        ensureSpace(lh);
        y += lh;
        doc.setFontSize(size);
        if (left) {
            doc.setFont('times', leftStyle);
            setColor(leftColor || BLACK);
            doc.text(left, MARGIN_L, y);
        }
        if (right) {
            doc.setFont('times', rightStyle);
            doc.setFontSize(size);
            const w = doc.getTextWidth(right);
            const rx = PAGE_W - MARGIN_R - w;
            if (rightUrl) {
                setColor(BLUE);
                doc.textWithLink(right, rx, y, { url: rightUrl });
            } else {
                setColor(rightColor || BLACK);
                doc.text(right, rx, y);
            }
        }
        setColor(BLACK);
    };

    /** Bulleted, wrapped highlight list. */
    const bullets = (items: string[] | undefined) => {
        const size = fs(11);
        const textX = MARGIN_L + 4;
        const maxW = CONTENT_W - 4;
        (items || [])
            .filter((h) => h && h.trim())
            .forEach((h) => {
                doc.setFont('times', 'normal');
                doc.setFontSize(size);
                const lines: string[] = doc.splitTextToSize(h.trim(), maxW);
                lines.forEach((line, i) => {
                    const lh = lineHeight(size);
                    ensureSpace(lh);
                    y += lh;
                    doc.setFont('times', 'normal');
                    doc.setFontSize(size);
                    setColor(BLACK);
                    if (i === 0) doc.text('•', MARGIN_L, y);
                    doc.text(line, textX, y);
                });
            });
    };

    /** Section heading + underline rule. Keeps the title from orphaning. */
    const sectionTitle = (title: string) => {
        const size = fs(12);
        ensureSpace(lineHeight(size) + gap(6));
        y += gap(3); // gap above the section
        const lh = lineHeight(size);
        y += lh;
        doc.setFont('times', 'bold');
        doc.setFontSize(size);
        setColor(BLACK);
        doc.text(title.toUpperCase(), MARGIN_L, y);
        y += gap(1.5);
        doc.setLineWidth(0.2);
        doc.setDrawColor(0, 0, 0);
        doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
        y += gap(2);
    };

    // ---------------- Header ----------------
    drawCenter((data.fullName || '').toUpperCase(), fs(20), 'bold');
    y += gap(1);

    const contact: Segment[] = [];
    if (data.location) contact.push({ text: data.location });
    if (data.phone) contact.push({ text: data.phone });
    if (data.email) contact.push({ text: data.email, url: `mailto:${data.email}`, color: BLUE });
    drawCenteredSegments(contact, fs(10.5));

    const linkSegments: Segment[] = (data.links || [])
        .filter((l) => l.url)
        .map((l) => ({
            text: getLinkDisplay(l.url, l.label),
            url: normalizeUrl(l.url),
            style: 'italic' as Style,
            color: BLUE,
        }));
    drawCenteredSegments(linkSegments, fs(10.5));

    y += gap(3);

    // ---------------- Sections (respect order + visibility) ----------------
    data.sections.forEach((section) => {
        if (!section.isVisible) return;

        switch (section.id) {
            case 'summary':
                if (data.summary) {
                    sectionTitle(section.title);
                    writeWrapped(data.summary, MARGIN_L, CONTENT_W, fs(11));
                }
                break;

            case 'experiences':
                if (data.experiences?.length) {
                    sectionTitle(section.title);
                    data.experiences.forEach((exp) => {
                        ensureSpace(lineHeight(fs(11)) * 2);
                        leftRight(exp.company, exp.year, fs(11), { leftColor: BLACK });
                        if (exp.position || exp.location)
                            leftRight(exp.position, exp.location, fs(11), { leftStyle: 'italic', rightStyle: 'italic' });
                        bullets(exp.highlights);
                        y += gap(2);
                    });
                }
                break;

            case 'technicalSkills':
                if (data.technicalSkills?.length) {
                    sectionTitle(section.title);
                    const labelGap = 2;
                    data.technicalSkills.forEach((s) => {
                        doc.setFontSize(fs(11));
                        doc.setFont('times', 'bold');
                        const labelW = doc.getTextWidth(`${s.category}:`) + labelGap;
                        const textX = MARGIN_L + labelW;
                        const maxW = CONTENT_W - labelW;
                        doc.setFont('times', 'normal');
                        const lines: string[] = doc.splitTextToSize(s.skills || '', maxW);
                        (lines.length ? lines : ['']).forEach((line, i) => {
                            const lh = lineHeight(fs(11));
                            ensureSpace(lh);
                            y += lh;
                            setColor(BLACK);
                            if (i === 0) {
                                doc.setFont('times', 'bold');
                                doc.text(`${s.category}:`, MARGIN_L, y);
                            }
                            doc.setFont('times', 'normal');
                            doc.text(line, textX, y);
                        });
                        y += gap(1);
                    });
                }
                break;

            case 'projects':
                if (data.projects?.length) {
                    sectionTitle(section.title);
                    data.projects.forEach((proj) => {
                        ensureSpace(lineHeight(fs(11)) * 2);
                        const rightLabel = proj.liveLink
                            ? getLinkDisplay(proj.liveLink, proj.liveLinkLabel)
                            : proj.subtitle || '';
                        leftRight(proj.title.toUpperCase(), rightLabel, fs(11), {
                            leftStyle: 'bold',
                            rightStyle: 'italic',
                            rightUrl: proj.liveLink ? normalizeUrl(proj.liveLink) : undefined,
                        });
                        if (proj.techStack) writeWrapped(`(${proj.techStack})`, MARGIN_L, CONTENT_W, fs(10), 'italic');
                        bullets(proj.highlights);
                        y += gap(2);
                    });
                }
                break;

            case 'freelance':
                if (data.freelance?.length) {
                    sectionTitle(section.title);
                    data.freelance.forEach((free) => {
                        ensureSpace(lineHeight(fs(11)) * 2);
                        leftRight(free.project, free.duration, fs(11));
                        if (free.role) writeWrapped(free.role, MARGIN_L, CONTENT_W, fs(11), 'italic');
                        bullets(free.highlights);
                        y += gap(2);
                    });
                }
                break;

            case 'certifications':
                if (data.certifications?.length) {
                    sectionTitle(section.title);
                    data.certifications.forEach((cert) => {
                        const lh = lineHeight(fs(11));
                        ensureSpace(lh);
                        y += lh;
                        doc.setFontSize(fs(11));
                        setColor(BLACK);
                        let x = MARGIN_L;
                        doc.setFont('times', 'bold');
                        doc.text(cert.name, x, y);
                        x += doc.getTextWidth(cert.name);
                        doc.setFont('times', 'normal');
                        doc.text('  —  ', x, y);
                        x += doc.getTextWidth('  —  ');
                        doc.setFont('times', 'italic');
                        doc.text(cert.issuer, x, y);
                        if (cert.year) {
                            doc.setFont('times', 'bold');
                            const yw = doc.getTextWidth(cert.year);
                            doc.text(cert.year, PAGE_W - MARGIN_R - yw, y);
                        }
                        y += gap(1);
                    });
                }
                break;

            case 'education':
                if (data.education?.length) {
                    sectionTitle(section.title);
                    data.education.forEach((edu) => {
                        ensureSpace(lineHeight(fs(11)) * 2);
                        leftRight(edu.school, edu.year, fs(11));
                        const deg = [edu.degree, edu.major].filter(Boolean).join(' in ');
                        if (deg || edu.result)
                            leftRight(deg, edu.result, fs(11), { leftStyle: 'italic', rightStyle: 'normal' });
                        y += gap(2);
                    });
                }
                break;

            case 'others':
                if (data.others?.length) {
                    sectionTitle(section.title);
                    data.others.forEach((item) => {
                        const size = fs(11);
                        const label = `${item.title}: `;
                        doc.setFont('times', 'bold');
                        doc.setFontSize(size);
                        const labelW = doc.getTextWidth(label);
                        doc.setFont('times', 'normal');
                        const lines: string[] = doc.splitTextToSize(item.description || '', CONTENT_W - labelW);
                        (lines.length ? lines : ['']).forEach((line, i) => {
                            const lh = lineHeight(size);
                            ensureSpace(lh);
                            y += lh;
                            setColor(BLACK);
                            if (i === 0) {
                                doc.setFont('times', 'bold');
                                doc.text(label, MARGIN_L, y);
                                doc.setFont('times', 'normal');
                                doc.text(line, MARGIN_L + labelW, y);
                            } else {
                                doc.setFont('times', 'normal');
                                doc.text(line, MARGIN_L, y);
                            }
                        });
                        y += gap(2);
                    });
                }
                break;
        }
    });

    return { doc, height: y - MARGIN_T };
};

// Derive the largest scale (≤1) that keeps the resume within MAX_PAGES, by measuring its natural
// single-column height. Shrinking font size also wraps more text per line, so the real render is
// always a little shorter than this estimate — i.e. it never overflows the budget.
const fitScale = (data: ResumeData): number => {
    const { height } = buildResumePdf(data, 1, true);
    if (height <= MAX_PAGES * USABLE_H) return 1;
    return Math.max(MIN_SCALE, (MAX_PAGES * USABLE_H) / height);
};

export const exportService = {
    /**
     * Generates and downloads a real text-based (ATS-readable) PDF of the resume.
     */
    async downloadPDF(data: ResumeData, fileName: string): Promise<void> {
        const { doc } = buildResumePdf(data, fitScale(data));
        doc.save(fileName);
    },

    /**
     * Generates LaTeX code for the resume
     */
    generateLatexCode(data: ResumeData): string {
        return generateLatex(data);
    },
};
