/**
 * Shared link helpers used by the resume preview and the PDF/LaTeX exporters.
 */

/** Adds a protocol to bare URLs so they are clickable. */
export const normalizeUrl = (url: string): string => {
    if (!url) return '';

    // already has protocol
    if (/^https?:\/\//i.test(url)) return url;

    // starts with www
    if (/^www\./i.test(url)) return `https://${url}`;

    // plain domain → add https://www.
    return `https://www.${url}`;
};

/** Human-friendly label for a link, inferred from the URL when no label is given. */
export const getLinkDisplay = (url: string, label?: string): string => {
    if (label) return label;
    if (!url) return 'Link';
    if (/linkedin\.com/i.test(url)) return 'LinkedIn';
    if (/github\.com/i.test(url)) return 'GitHub';
    return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
};
