import { ResumeData } from '../types/resume';

/**
 * Deterministic ATS Scoring Engine
 * Breakdown:
 * - Keyword Match / JD Alignment (50%)
 * - Section Completeness (20%)
 * - Experience / Project Relevance (20%)
 * - ATS Safety Checks (10%)
 */

export interface ScoringResult {
    totalScore: number;
    breakdown: {
        keywords: number;
        sections: number;
        relevance: number;
        safety: number;
    };
    warnings: string[];
}

const STOPWORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'out', 'off',
    'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
    'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't',
    'can', 'will', 'just', 'don', 'should', 'now', 'i', 'me', 'my', 'myself', 'we', 'our',
    'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him',
    'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they',
    'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this',
    'that', 'these', 'those', 'am', 'do', 'does', 'did', 'has', 'have', 'had', 'having'
]);

/**
 * Extracts unique, meaningful keywords from a text.
 */
function getKeywords(text: string): string[] {
    if (!text) return [];
    const words = text.toLowerCase()
        .replace(/[^a-z0-9\s#\+]/g, ' ') // Preserve # and + for C#, C++
        .split(/\s+/)
        .filter(word => word.length > 2 && !STOPWORDS.has(word));
    return Array.from(new Set(words));
}

export function calculateATSScore(resume: ResumeData, jd: string): ScoringResult {
    const warnings: string[] = [];
    const result: ScoringResult = {
        totalScore: 0,
        breakdown: {
            keywords: 0,
            sections: 0,
            relevance: 0,
            safety: 0
        },
        warnings
    };

    if (!jd || jd.trim().length < 50) {
        warnings.push("Job description is too short for accurate matching.");
        return result;
    }

    const jdKeywords = getKeywords(jd);
    if (jdKeywords.length === 0) return result;

    // 1. Keyword Match (50%)
    const resumeFullText = [
        resume.fullName,
        resume.summary,
        resume.technicalSkills?.map(s => `${s.category} ${s.skills}`).join(' '),
        resume.experiences?.map(e => `${e.company} ${e.position} ${e.highlights.join(' ')}`).join(' '),
        resume.projects?.map(p => `${p.title} ${p.highlights.join(' ')}`).join(' '),
        resume.freelance?.map(f => `${f.project} ${f.highlights.join(' ')}`).join(' ')
    ].join(' ').toLowerCase();

    const matchedKeywords = jdKeywords.filter(kw => resumeFullText.includes(kw));
    const keywordDensity = matchedKeywords.length / jdKeywords.length;
    result.breakdown.keywords = Math.min(50, Math.round(keywordDensity * 50));

    // 2. Section Completeness (20%)
    let sectionCount = 0;
    const coreSections = [
        { val: resume.fullName, weight: 2 },
        { val: resume.email, weight: 2 },
        { val: (resume.experiences || []).length > 0, weight: 6 },
        { val: (resume.technicalSkills || []).length > 0, weight: 4 },
        { val: resume.summary, weight: 3 },
        { val: (resume.education || []).length > 0, weight: 3 }
    ];
    coreSections.forEach(s => {
        if (s.val) sectionCount += s.weight;
    });
    result.breakdown.sections = Math.min(20, sectionCount);
    if (sectionCount < 15) warnings.push("Key resume sections are missing or empty.");

    // 3. Experience / Project Relevance (20%)
    // Measure density of JD keywords specifically in experience/projects
    const relevanceText = [
        resume.experiences?.map(e => `${e.position} ${e.highlights.join(' ')}`).join(' '),
        resume.projects?.map(p => `${p.title} ${p.highlights.join(' ')}`).join(' ')
    ].join(' ').toLowerCase();

    const relevanceMatches = jdKeywords.filter(kw => relevanceText.includes(kw));
    const relevanceDensity = relevanceMatches.length / Math.max(1, jdKeywords.length);
    result.breakdown.relevance = Math.min(20, Math.round(relevanceDensity * 40)); // Boost relevance score weight locally

    // 4. ATS Safety (10%)
    let safetyScore = 10;
    
    // Keyword Stuffing Check
    const words = resumeFullText.split(/\s+/);
    const wordCounts: Record<string, number> = {};
    let maxStuffing = 0;
    words.forEach(w => {
        if (w.length > 3) {
            wordCounts[w] = (wordCounts[w] || 0) + 1;
            if (wordCounts[w] > maxStuffing) maxStuffing = wordCounts[w];
        }
    });
    if (maxStuffing > 15) {
        safetyScore -= 5;
        warnings.push("Potential keyword stuffing detected (excessive repetition).");
    }

    // Placeholder check
    if (resumeFullText.includes("your name") || resumeFullText.includes("email@example.com")) {
        safetyScore -= 3;
        warnings.push("Placeholder text detected (e.g., 'YOUR NAME').");
    }

    // Contact info presence
    if (!resume.email || !resume.phone) {
        safetyScore -= 2;
        warnings.push("Incomplete contact information.");
    }

    result.breakdown.safety = Math.max(0, safetyScore);

    // Final Score
    result.totalScore = Math.min(100, 
        result.breakdown.keywords + 
        result.breakdown.sections + 
        result.breakdown.relevance + 
        result.breakdown.safety
    );

    return result;
}
