import { ResumeData } from '../types/resume';

const escape = (str: string | undefined) => {
    if (!str) return '';
    return str
        .replace(/\\/g, '\\textbackslash{}')
        .replace(/([&%$#_{}])/g, '\\$1')
        .replace(/~/g, '\\textasciitilde{}')
        .replace(/\^/g, '\\textasciicircum{}')
        .replace(/"/g, "''");
};

const getLinkDisplay = (url: string, label?: string) => {
    if (label) return escape(label);
    if (url.includes('linkedin.com')) return 'LinkedIn';
    if (url.includes('github.com')) return 'GitHub';
    return 'Live Link';
};

export const generateLatex = (data: ResumeData): string => {
    const header = `
\\documentclass[a4paper,11pt]{article}
\\usepackage[left=20mm, right=20mm, top=20mm, bottom=20mm]{geometry}
\\usepackage{enumitem}
\\usepackage[colorlinks=true, urlcolor=blue, linkcolor=blue]{hyperref}
\\usepackage{titlesec}
\\usepackage{xcolor}

\\pagestyle{empty}
\\setcounter{secnumdepth}{0}

% Custom section styling
\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{12pt}{6pt}

% Custom list styling
\\setlist[itemize]{left=0pt, itemsep=1pt, parsep=0pt, topsep=1pt}

\\begin{document}

\\begin{center}
    {\\huge\\bfseries ${escape(data.fullName).toUpperCase()}} \\\\[4pt]
    ${escape(data.location)} | ${escape(data.phone)} | \\href{mailto:${data.email}}{${escape(data.email)}}
    ${data.links && data.links.length > 0 ? '\\\\' : ''}
    ${data.links?.map(l => `\\href{${l.url}}{${getLinkDisplay(l.url, l.label)}}`).join(' | ')}
\\end{center}

\\vspace{10pt}
`;

    let content = '';

    // Iterate through sections based on the order in data.sections
    data.sections.forEach(section => {
        if (!section.isVisible) return;

        switch (section.id) {
            case 'summary':
                if (data.summary) {
                    content += `
\\section*{${section.title.toUpperCase()}}
${escape(data.summary)}
`;
                }
                break;

            case 'experiences':
                if (data.experiences && data.experiences.length > 0) {
                    content += `
\\section*{${section.title.toUpperCase()}}
`;
                    data.experiences.forEach(exp => {
                        content += `
\\noindent \\textbf{${escape(exp.company)}} \\hfill \\textbf{${escape(exp.year)}} \\\\
\\textit{${escape(exp.position)}${exp.location ? ` -- ${escape(exp.location)}` : ''}}
\\begin{itemize}
    ${(exp.highlights || []).filter(h => h.trim()).map(h => `\\item ${escape(h)}`).join('\n    ')}
\\end{itemize}
\\vspace{6pt}
`;
                    });
                }
                break;

            case 'technicalSkills':
                if (data.technicalSkills && data.technicalSkills.length > 0) {
                    content += `
\\section*{${section.title.toUpperCase()}}
\\begin{itemize}[leftmargin=*, label={}]
`;
                    data.technicalSkills.forEach(skill => {
                        content += `    \\item \\textbf{${escape(skill.category)}:} ${escape(skill.skills)}\n`;
                    });
                    content += `\\end{itemize}\n`;
                }
                break;

            case 'projects':
                if (data.projects && data.projects.length > 0) {
                    content += `
\\section*{${section.title.toUpperCase()}}
`;
                    data.projects.forEach(proj => {
                        const linkPart = proj.liveLink ? `\\href{${proj.liveLink}}{${getLinkDisplay(proj.liveLink, proj.liveLinkLabel)}}` : escape(proj.subtitle);
                        content += `
\\noindent \\textbf{${escape(proj.title)}} \\hfill \\textit{${linkPart}} \\\\
\\textit{${escape(proj.techStack ? `(${proj.techStack})` : '')}}
\\begin{itemize}
    ${(proj.highlights || []).filter(h => h.trim()).map(h => `\\item ${escape(h)}`).join('\n    ')}
\\end{itemize}
\\vspace{6pt}
`;
                    });
                }
                break;

            case 'freelance':
                if (data.freelance && data.freelance.length > 0) {
                    content += `
\\section*{${section.title.toUpperCase()}}
`;
                    data.freelance.forEach(free => {
                        content += `
\\noindent \\textbf{${escape(free.project)}} \\hfill \\textbf{${escape(free.duration)}} \\\\
\\textit{${escape(free.role)}}
\\begin{itemize}
    ${(free.highlights || []).filter(h => h.trim()).map(h => `\\item ${escape(h)}`).join('\n    ')}
\\end{itemize}
\\vspace{6pt}
`;
                    });
                }
                break;

            case 'education':
                if (data.education && data.education.length > 0) {
                    content += `
\\section*{${section.title.toUpperCase()}}
`;
                    data.education.forEach(edu => {
                        content += `
\\noindent \\textbf{${escape(edu.school)}} \\hfill \\textbf{${escape(edu.year)}} \\\\
\\textit{${escape(edu.degree)} in ${escape(edu.major)}} \\hfill ${escape(edu.result)}
\\vspace{6pt}
`;
                    });
                }
                break;

            case 'others':
                if (data.others && data.others.length > 0) {
                    content += `
\\section*{${section.title.toUpperCase()}}
\\begin{itemize}[leftmargin=*, label={}]
`;
                    data.others.forEach(item => {
                        content += `    \\item \\textbf{${escape(item.title)}:} ${escape(item.description)}\n`;
                    });
                    content += `\\end{itemize}\n`;
                }
                break;
        }
    });

    const footer = `
\\end{document}
`;

    return (header + content + footer).trim();
};
