import React, { useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    Mail, Key, Zap, Code, Download,
    Check, Send, Copy, X, PenTool, Eye,
    Trash2, ExternalLink
} from 'lucide-react';

import { useResumeBuilderState } from '../hooks/useResumeBuilderState';
import { useDebounce } from '../hooks/useDebounce';
import { aiService, apiKeyStore } from '../services/ai.service';
import { exportService } from '../services/export.service';
import { calculateATSScore as runLocalScorer, ScoringResult } from '../utils/atsScorer';

import { ATSEngine } from '../components/builder/ATSEngine';
import { IdentitySection } from '../components/builder/IdentitySection';
import { SummarySection } from '../components/builder/SummarySection';
import { SkillsSection } from '../components/builder/SkillsSection';
import { ExperienceSection } from '../components/builder/ExperienceSection';
import { ProjectsSection } from '../components/builder/ProjectsSection';
import { ListSection } from '../components/builder/ListSection';

import { ResumePreview } from '../components/ResumePreview';
import { LoadingScreen } from '../components/LoadingScreen';
import { Toast } from '../components/ui/Toast';
import { PUBLIC_DATA, PRIVATE_DATA } from '../data/initialData';

// Shared response schema for AI resume (re)generation — used by both
// "Optimize Resume" and "Apply Fixes & Regenerate".
const RESUME_RESPONSE_SCHEMA = {
    type: 'OBJECT',
    properties: {
        // NOTE: fullName is intentionally omitted — it's the candidate's identity, which the AI
        // never receives (see slimForAI) and must not invent. Including it as `required` made the
        // model fill it with the JD's job title (e.g. "Junior DevOps Engineer"). The frontend keeps
        // the real name and never reads fullName from the AI payload.
        summary: { type: 'STRING', maxLength: 700 },
        technicalSkills: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: { category: { type: 'STRING', maxLength: 40 }, skills: { type: 'STRING', maxLength: 300 } }
            }
        },
        // maxLength on the short fields (esp. `year`) is a hard backstop: it stops the model
        // from leaking chain-of-thought into a single field and blowing the whole output budget
        // (a MAX_TOKENS truncation that left the JSON unparseable — the "unreadable response" bug).
        experiences: { type: 'ARRAY', items: { type: 'OBJECT', properties: { company: { type: 'STRING', maxLength: 80 }, position: { type: 'STRING', maxLength: 80 }, location: { type: 'STRING', maxLength: 80 }, year: { type: 'STRING', maxLength: 40 }, highlights: { type: 'ARRAY', items: { type: 'STRING', maxLength: 220 } } } } },
        projects: { type: 'ARRAY', items: { type: 'OBJECT', properties: { title: { type: 'STRING', maxLength: 100 }, subtitle: { type: 'STRING', maxLength: 120 }, techStack: { type: 'STRING', maxLength: 200 }, liveLink: { type: 'STRING', maxLength: 200 }, liveLinkLabel: { type: 'STRING', maxLength: 60 }, highlights: { type: 'ARRAY', items: { type: 'STRING', maxLength: 200 } } } } },
        freelance: { type: 'ARRAY', items: { type: 'OBJECT', properties: { project: { type: 'STRING', maxLength: 100 }, role: { type: 'STRING', maxLength: 80 }, duration: { type: 'STRING', maxLength: 40 }, highlights: { type: 'ARRAY', items: { type: 'STRING', maxLength: 200 } } } } }
    },
    required: ["summary", "technicalSkills", "experiences", "projects"]
};

// ---------------------------------------------------------------------------
// AI payload normalizers + validation gateway (pure, module-scope so both the
// apply step and the pre-commit validator share the exact same cleaning logic).
// ---------------------------------------------------------------------------

// Truncate a short field at the first leaked meta-commentary marker, e.g.
// "Parceler (DevOps Focus Adaptation)(Note: ...)" -> "Parceler". Leaves legitimate
// parentheticals like "AWS (ECS, Fargate)" untouched (no commentary keyword inside).
const stripNotes = (s: any): string => {
    if (typeof s !== 'string') return '';
    const markers = [
        /\(\s*note\s*:/i, /\bnote\s*:/i, /\(\s*disclaimer/i,
        /\([^)]*\b(?:focus\s+)?adaptation\b/i, /\([^)]*candidate profile/i,
        /\([^)]*profile data/i, /\([^)]*original (?:project|was)/i,
        /\([^)]*being adapted/i,
    ];
    let cut = -1;
    for (const re of markers) {
        const m = s.match(re);
        if (m && m.index !== undefined && (cut === -1 || m.index < cut)) cut = m.index;
    }
    const out = cut >= 0 ? s.slice(0, cut) : s;
    return out.replace(/\s*[-–—(]\s*$/, '').trim();
};

// Normalize highlights into a clean array of non-empty strings (accepts array OR
// newline string OR missing). Returns [] when nothing usable is present.
const cleanHighlights = (h: any): string[] => {
    const arr = Array.isArray(h) ? h : typeof h === 'string' ? h.split('\n') : [];
    return arr
        .map((x: any) => stripNotes(typeof x === 'string' ? x : String(x ?? '')))
        .filter((x: string) => x.trim().length > 0);
};

// Skills can come back as {skills: "a, b"} or {skills: ["a","b"]}; flatten to a string.
const cleanSkills = (skills: any, prev: any[]): any[] => {
    if (!Array.isArray(skills)) return prev;
    const out = skills
        .filter((s: any) => s && (s.category || s.skills))
        .map((s: any) => ({
            category: stripNotes(s.category),
            skills: Array.isArray(s.skills) ? s.skills.join(', ') : stripNotes(s.skills),
        }));
    return out.length ? out : prev;
};

// Match a (rewritten) generated project title back to an original pool project so we can
// back-fill dropped fields and restore the canonical name. Match by leading token because
// the projects come back as a re-ordered SUBSET.
const normTitle = (t: any) => stripNotes(t).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
// Match a generated project title back to the original pool entry it was rewritten from.
// Uses EXACT word comparisons (full normalized title, then the brand first-word) — never
// substring `startsWith`, which wrongly conflated e.g. "AI-Powered…" (first word "ai") with
// "Ainvox" because "ainvox".startsWith("ai"). That collision gave two distinct projects the
// same base id + title, so they rendered identically and edited in lockstep.
// `used` (optional) holds pool ids already claimed this pass, enforcing a one-to-one match so a
// single pool project can never back two generated ones.
const matchPrevProject = (genTitle: string, pool: any[], used?: Set<string>): any | undefined => {
    const g = normTitle(genTitle);
    if (!g) return undefined;
    const gFirst = g.split(' ')[0];
    const free = (p: any) => !used || !used.has(p.id);
    // 1) Exact normalized-title match wins.
    const exact = pool.find(p => free(p) && normTitle(p.title) === g);
    if (exact) return exact;
    // 2) Otherwise the AI kept the brand name but reworded the rest — match on an exact first word.
    return pool.find(p => {
        if (!free(p)) return false;
        const n = normTitle(p.title);
        return !!n && n.split(' ')[0] === gFirst;
    });
};

// Parse the AI's JSON response. Throws a friendly error so a malformed/truncated payload
// surfaces as a toast (and triggers the retry-with-mutation) rather than a raw SyntaxError.
const parseAIResume = (text: string): any => {
    try {
        return JSON.parse((text || '').trim());
    } catch {
        throw new Error("AI returned an unreadable response.");
    }
};

const wordCount = (s: any): number => stripNotes(s).split(/\s+/).filter(Boolean).length;

// Validation gateway: inspect a parsed AI resume for the failure modes that corrupt the UI —
// empty bullets, unpopulated arrays, headings that bleed into sentences, renamed/hallucinated
// project names, and date fields stuffed with prose. Returns the concrete issues so the caller
// can fire ONE silent corrective retry before the data ever reaches the editor. `pool` is the
// original project pool (to confirm names stayed static).
const validateAIResume = (parsed: any, pool: any[] = []): { ok: boolean; issues: string[] } => {
    const issues: string[] = [];
    if (!parsed || typeof parsed !== 'object') return { ok: false, issues: ["Response was not a JSON object."] };

    if (!stripNotes(parsed.summary)) issues.push("The summary is empty.");

    const skills = Array.isArray(parsed.technicalSkills) ? parsed.technicalSkills.filter((s: any) => s && (s.category || s.skills)) : [];
    if (!skills.length) issues.push("The technicalSkills array is empty.");
    for (const s of skills) {
        if (wordCount(s.category) > 5) issues.push(`Skill category "${stripNotes(s.category)}" is longer than 5 words — it must be a 2-5 word label.`);
    }

    const experiences = Array.isArray(parsed.experiences) ? parsed.experiences : [];
    if (!experiences.length) issues.push("The experiences array is empty.");
    experiences.forEach((e: any, i: number) => {
        const label = stripNotes(e?.position) || stripNotes(e?.company) || `#${i + 1}`;
        if (!cleanHighlights(e?.highlights).length) issues.push(`Experience "${label}" has no highlights — every role needs at least one quantified bullet.`);
        if (wordCount(e?.position) > 5) issues.push(`Experience position "${stripNotes(e?.position)}" is longer than 5 words.`);
        if (wordCount(e?.company) > 5) issues.push(`Experience company "${stripNotes(e?.company)}" is longer than 5 words.`);
        const year = stripNotes(e?.year);
        if (year && (wordCount(year) > 5 || !/\d|present/i.test(year))) issues.push(`Experience "${label}" has an invalid "year" ("${year}") — it must contain only a date range.`);
    });

    const projects = Array.isArray(parsed.projects) ? parsed.projects : [];
    if (!projects.length) issues.push("The projects array is empty.");
    if (projects.length > 4) issues.push(`Returned ${projects.length} projects — select ONLY the 3-4 most relevant.`);
    projects.forEach((p: any, i: number) => {
        const title = stripNotes(p?.title);
        const label = title || `#${i + 1}`;
        if (!cleanHighlights(p?.highlights).length) issues.push(`Project "${label}" has no highlights.`);
        if (wordCount(title) > 5) issues.push(`Project title "${title}" is longer than 5 words — a title is a name, not a sentence.`);
        if (pool.length && title && !matchPrevProject(title, pool)) {
            issues.push(`Project "${title}" does not match any real project name — keep project names exactly as provided.`);
        }
    });

    return { ok: issues.length === 0, issues };
};

export const ResumeBuilder = () => {
    const {
        data, setData,
        loading, setLoading,
        jobDescription, setJobDescription,
        atsScore, setAtsScore,
        coverLetter, setCoverLetter,
        toast, showToast,
        updateItem, addItem, removeItem,
        moveSection, toggleSectionVisibility, updateSectionTitle
    } = useResumeBuilderState();

    // Tabs are driven by the route (/builder/editor | /builder/preview | /builder/cover)
    const navigate = useNavigate();
    const { tab } = useParams<{ tab: string }>();
    const VALID_TABS = ['editor', 'preview', 'cover'] as const;
    type Tab = typeof VALID_TABS[number];
    const activeTab: Tab = (VALID_TABS.includes(tab as Tab) ? tab : 'editor') as Tab;
    const setActiveTab = useCallback((next: Tab) => navigate(`/builder/${next}`), [navigate]);

    const debouncedData = useDebounce(data, activeTab === 'preview' ? 250 : 0);

    const [initialLoading, setInitialLoading] = React.useState(true);
    const [scale, setScale] = React.useState(1);
    const [showLoginModal, setShowLoginModal] = React.useState(false);
    const [showApiKeyModal, setShowApiKeyModal] = React.useState(false);
    const [apiKeyInput, setApiKeyInput] = React.useState("");
    const [hasApiKey, setHasApiKey] = React.useState(apiKeyStore.isConfigured());
    const [showLatexModal, setShowLatexModal] = React.useState(false);
    const [latexCode, setLatexCode] = React.useState("");
    const [copied, setCopied] = React.useState(false);
    
    const resumeRef = useRef<HTMLDivElement>(null);

    // Full project pool, grow-only. Each AI optimize returns ONLY the 3-4 projects it
    // selected for that JD, which trims data.projects. We retain the fullest pool here so
    // re-optimizing against a NEW JD can still pick from every project, not just the last
    // selection. (Sent to the AI as the candidate's selectable pool.)
    const projectPoolRef = useRef(data.projects || []);
    useEffect(() => {
        if ((data.projects?.length || 0) > projectPoolRef.current.length) {
            projectPoolRef.current = data.projects;
        }
    }, [data.projects]);

    useEffect(() => {
        const timer = setTimeout(() => setInitialLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            const container = document.querySelector('.preview-container');
            if (container) {
                const containerWidth = container.clientWidth - 48;
                const targetWidth = 794;
                setScale(Math.min(1, containerWidth / targetWidth));
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [activeTab]);

    const [atsBreakdown, setAtsBreakdown] = React.useState<ScoringResult | null>(null);
    const [atsFeedback, setAtsFeedback] = React.useState<string>("");

    // Years of experience derived from the earliest experience year (e.g. "5+").
    const getExperienceDuration = useCallback(() => {
        let minYear = new Date().getFullYear();
        data.experiences?.forEach(exp => {
            const match = exp.year?.match(/(\d{4})/);
            if (match && parseInt(match[1]) < minYear) minYear = parseInt(match[1]);
        });
        return `${new Date().getFullYear() - minYear}+`;
    }, [data.experiences]);

    // Merge an AI-generated resume payload into state (re-using existing item ids where present).
    // The model output is treated as UNTRUSTED: it sometimes leaks reasoning into field values
    // ("Project (DevOps Focus Adaptation)(Note: ...)"), returns highlights as a string instead of
    // an array, or omits highlights/techStack entirely. This normalizer cleans and back-fills the
    // payload so a messy generation never corrupts the editor.
    const applyGeneratedResume = useCallback((optimized: any) => {
        const newId = () => Math.random().toString(36).substr(2, 9);

        setData(prev => {
            const pool = projectPoolRef.current?.length ? projectPoolRef.current : (prev.projects || []);

            // Experiences keep their real order, so back-fill empty bullets by index.
            const experiences = Array.isArray(optimized.experiences) && optimized.experiences.length
                ? optimized.experiences.map((gen: any, i: number) => {
                    const base = prev.experiences?.[i];
                    const highlights = cleanHighlights(gen.highlights);
                    return {
                        ...base, ...gen,
                        id: gen.id || base?.id || newId(),
                        company: stripNotes(gen.company) || base?.company || '',
                        position: stripNotes(gen.position) || base?.position || '',
                        location: typeof gen.location === 'string' ? gen.location : base?.location || '',
                        year: stripNotes(gen.year) || base?.year || '',
                        highlights: highlights.length ? highlights : (base?.highlights || []),
                    };
                })
                : prev.experiences;

            // Track pool entries already claimed so two generated projects can't both bind to the
            // same original (which previously duplicated its id + title across both).
            const usedProjectIds = new Set<string>();
            const projects = Array.isArray(optimized.projects) && optimized.projects.length
                ? optimized.projects.map((gen: any) => {
                    const title = stripNotes(gen.title);
                    const base = matchPrevProject(title, pool, usedProjectIds);
                    if (base?.id) usedProjectIds.add(base.id);
                    const highlights = cleanHighlights(gen.highlights);
                    return {
                        ...base, ...gen,
                        id: gen.id || base?.id || newId(),
                        // Project names are static facts: restore the original pool name whenever we
                        // can match it, so the AI can never rename a project (it may only rewrite the
                        // supporting content). Fall back to the generated title only for unmatched ones.
                        title: base?.title || title || '',
                        techStack: stripNotes(gen.techStack) || base?.techStack || '',
                        liveLink: gen.liveLink || base?.liveLink || '',
                        liveLinkLabel: stripNotes(gen.liveLinkLabel) || base?.liveLinkLabel || '',
                        highlights: highlights.length ? highlights : (base?.highlights || []),
                    };
                })
                : prev.projects;

            // Final guard: duplicate ids (e.g. the AI echoing the same gen.id twice) make the editor
            // update two cards in lockstep — force every project id unique.
            const seenProjectIds = new Set<string>();
            (projects || []).forEach((p: any) => {
                if (!p.id || seenProjectIds.has(p.id)) p.id = newId();
                seenProjectIds.add(p.id);
            });

            const freelance = Array.isArray(optimized.freelance) && optimized.freelance.length
                ? optimized.freelance.map((gen: any, i: number) => {
                    const base = prev.freelance?.[i];
                    const highlights = cleanHighlights(gen.highlights);
                    return {
                        ...base, ...gen,
                        id: gen.id || base?.id || newId(),
                        project: stripNotes(gen.project) || base?.project || '',
                        role: stripNotes(gen.role) || base?.role || '',
                        duration: stripNotes(gen.duration) || base?.duration || '',
                        highlights: highlights.length ? highlights : (base?.highlights || []),
                    };
                })
                : prev.freelance;

            return {
                ...prev,
                // fullName is the candidate's identity — the AI never sees it (not in slimForAI) and
                // must NOT set it, so always keep the real name. (This is what was getting replaced
                // by the JD job title.)
                fullName: prev.fullName,
                summary: stripNotes(optimized.summary) || prev.summary,
                technicalSkills: cleanSkills(optimized.technicalSkills, prev.technicalSkills),
                experiences,
                projects,
                freelance,
            };
        });
    }, [setData]);

    // AI Orchestration
    // Generate a resume, validate it, and on a 200-OK-but-invalid payload (empty bullets, renamed
    // projects, headings bleeding into sentences, unreadable JSON) fire ONE silent corrective retry
    // before the data ever reaches the editor — so the user no longer has to click "regenerate" by
    // hand. `buildPrompt` returns the base OPTIMIZE / REGENERATE prompt. Returns the parsed resume
    // plus a `clean` flag (false = retried but still imperfect, applied best-effort).
    const generateValidatedResume = useCallback(async (buildPrompt: () => string): Promise<{ parsed: any; clean: boolean }> => {
        const { PROMPTS } = await import('../services/prompts');
        const pool = projectPoolRef.current?.length ? projectPoolRef.current : (data.projects || []);
        const basePrompt = buildPrompt();

        // thinkingBudget 0 = single pass (the in-prompt INTERNAL ANALYSIS still steers it); 4096
        // output tokens fits the full resume JSON; the service auto-escalates the cap on MAX_TOKENS.
        const runOnce = async (prompt: string) => {
            const response = await aiService.generateWithFallback(prompt, RESUME_RESPONSE_SCHEMA, 4096, 0);
            const parsed = parseAIResume(response?.text || '');
            return { parsed, ...validateAIResume(parsed, pool) };
        };

        // First pass. A thrown error (timeout / unreadable JSON / all-models-failed) is caught so the
        // mutation retry still gets its chance.
        let first: { parsed: any; ok: boolean; issues: string[] } | null = null;
        let firstError: any;
        try { first = await runOnce(basePrompt); } catch (e) { firstError = e; }
        if (first?.ok) return { parsed: first.parsed, clean: true };

        // Silent retry-with-mutation: feed the exact validation issues (or a generic reminder for a
        // network/parse failure) back into the prompt and try once more.
        const issues = first?.issues?.length
            ? first.issues
            : ["The previous response was unreadable or incomplete — return one complete, valid resume JSON object."];
        try {
            const second = await runOnce(PROMPTS.CORRECTION_OVERRIDE(basePrompt, issues));
            if (second.ok) return { parsed: second.parsed, clean: true };
            return { parsed: second.parsed ?? first?.parsed, clean: false };
        } catch (e) {
            if (first?.parsed) return { parsed: first.parsed, clean: false };
            throw firstError || e;
        }
    }, [data]);

    const handleOptimizeATS = useCallback(async () => {
        if (!jobDescription) return showToast("Please paste a Job Description!", 'warning');
        setLoading(true);
        try {
            const { PROMPTS, slimForAI } = await import('../services/prompts');
            const { parsed, clean } = await generateValidatedResume(() =>
                PROMPTS.OPTIMIZE_RESUME(jobDescription, slimForAI(data, projectPoolRef.current), getExperienceDuration()));

            applyGeneratedResume(parsed);
            setActiveTab('preview');
            showToast(
                clean ? "✅ High-ATS Resume Generated!" : "✅ Resume generated — a few fields were auto-corrected, please review.",
                clean ? 'success' : 'warning'
            );
        } catch (e: any) {
            showToast(`Failed to optimize: ${e.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [jobDescription, data, getExperienceDuration, generateValidatedResume, applyGeneratedResume, setActiveTab, showToast, setLoading]);

    // Regenerate the resume by applying the AI recruiter review (all fixes + missing keywords).
    const handleApplyReviewFixes = useCallback(async () => {
        if (!jobDescription) return showToast("Please paste a Job Description!", 'warning');
        if (!atsFeedback || atsFeedback.length < 50) {
            return showToast("Run \"Score\" first to generate the AI review, then apply fixes.", 'warning');
        }
        setLoading(true);
        try {
            const { PROMPTS, slimForAI } = await import('../services/prompts');
            const { parsed, clean } = await generateValidatedResume(() =>
                PROMPTS.REGENERATE_FROM_REVIEW(jobDescription, slimForAI(data, projectPoolRef.current), atsFeedback, getExperienceDuration()));

            applyGeneratedResume(parsed);
            setActiveTab('preview');
            showToast(
                clean ? "✅ Resume regenerated with all review fixes applied! Re-run Score to verify."
                      : "✅ Resume regenerated — a few fields were auto-corrected, please review. Re-run Score to verify.",
                clean ? 'success' : 'warning'
            );
        } catch (e: any) {
            showToast(`Failed to apply fixes: ${e.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [jobDescription, data, atsFeedback, getExperienceDuration, generateValidatedResume, applyGeneratedResume, setActiveTab, showToast, setLoading]);

    const calculateATSScore = useCallback(async () => {
        if (!jobDescription) return showToast("Please paste a Job Description!", 'warning');

        setLoading(true);
        try {
            // AI-driven score + deep recruiter analysis (the AI decides the score, not local math).
            const { PROMPTS, slimForAI } = await import('../services/prompts');
            const prompt = PROMPTS.GET_ATS_ANALYSIS(jobDescription, slimForAI(data, projectPoolRef.current));

            const response = await aiService.generateWithFallback(prompt, {
                type: 'OBJECT',
                properties: {
                    totalScore: { type: 'INTEGER' },
                    breakdown: {
                        type: 'OBJECT',
                        properties: {
                            keywords: { type: 'INTEGER' },
                            sections: { type: 'INTEGER' },
                            relevance: { type: 'INTEGER' },
                            safety: { type: 'INTEGER' }
                        },
                        required: ["keywords", "sections", "relevance", "safety"]
                    },
                    warnings: { type: 'ARRAY', items: { type: 'STRING' } },
                    feedback: { type: 'STRING' }
                },
                required: ["totalScore", "breakdown", "warnings", "feedback"]
            });

            let parsed: any;
            try {
                parsed = JSON.parse(response.text.trim());
            } catch {
                throw new Error("AI returned an unreadable response.");
            }

            const b = parsed.breakdown || {};
            const result: ScoringResult = {
                totalScore: Math.min(100, Math.max(0, Math.round(parsed.totalScore ?? 0))),
                breakdown: {
                    keywords: Math.min(50, Math.max(0, Math.round(b.keywords ?? 0))),
                    sections: Math.min(20, Math.max(0, Math.round(b.sections ?? 0))),
                    relevance: Math.min(20, Math.max(0, Math.round(b.relevance ?? 0))),
                    safety: Math.min(10, Math.max(0, Math.round(b.safety ?? 0)))
                },
                warnings: Array.isArray(parsed.warnings) ? parsed.warnings : []
            };

            setAtsBreakdown(result);
            setAtsScore(result.totalScore);
            setAtsFeedback(parsed.feedback || "No detailed feedback returned. Please try again.");
            showToast(`AI ATS Score: ${result.totalScore}%`, 'success');
        } catch (e: any) {
            // Fallback to the deterministic local scorer so the user always gets a number.
            console.error("AI scoring failed, falling back to local scorer:", e);
            const result = runLocalScorer(data, jobDescription);
            setAtsBreakdown(result);
            setAtsScore(result.totalScore);
            setAtsFeedback("AI analysis temporarily unavailable — showing a local keyword-based score. Please try again for the full recruiter analysis.");
            showToast(`ATS Score (local fallback): ${result.totalScore}%`, 'warning');
        } finally {
            setLoading(false);
        }
    }, [jobDescription, data, setAtsScore, showToast, setLoading]);

    const handleGenerateCoverLetter = useCallback(async () => {
        if (!jobDescription) return showToast("Please paste a Job Description!", 'warning');
        setLoading(true);
        try {
            const { PROMPTS } = await import('../services/prompts');
            const resumeContext = `${data.summary} ${data.technicalSkills?.[0]?.skills || ''}`;
            const contactInfo = `Email: ${data.email}, Phone: ${data.phone}`;
            const prompt = PROMPTS.GENERATE_COVER_LETTER(jobDescription, data.fullName, contactInfo, resumeContext);

            const response = await aiService.generateWithFallback(prompt);
            if (response?.text) {
                setCoverLetter(response.text);
                setActiveTab('cover');
            }
        } catch (e: any) {
            showToast("Failed to generate cover letter.", 'error');
        } finally {
            setLoading(false);
        }
    }, [jobDescription, data, setCoverLetter, setActiveTab, showToast, setLoading]);

    // Open the API key modal, prefilled with any key the user already saved.
    const openApiKeyModal = useCallback(() => {
        setApiKeyInput(apiKeyStore.get() || "");
        setShowApiKeyModal(true);
    }, []);

    // Persist the user's own Gemini key, then verify it actually works before closing.
    const handleSaveApiKey = useCallback(async () => {
        const trimmed = apiKeyInput.trim();
        if (!trimmed) return showToast("Please paste your Gemini API key.", 'warning');

        apiKeyStore.set(trimmed);
        setHasApiKey(true);
        setLoading(true);
        try {
            await aiService.checkAvailableModels();
            setShowApiKeyModal(false);
            showToast("✅ API key saved & verified! You can now generate.", 'success');
        } catch (e: any) {
            showToast(`Key saved, but the test call failed: ${e?.message || 'invalid key'}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [apiKeyInput, showToast, setLoading]);

    const handleClearApiKey = useCallback(() => {
        apiKeyStore.clear();
        setApiKeyInput("");
        setHasApiKey(apiKeyStore.isConfigured());
        showToast("API key removed from this browser.", 'info');
    }, [showToast]);

    const downloadPDF = useCallback(async () => {
        setLoading(true);
        try {
            await exportService.downloadPDF(data, `${data.fullName.replace(/\s+/g, '_')}_Resume.pdf`);
            showToast('✅ Resume PDF downloaded successfully!', 'success');
        } catch (e) {
            showToast('Failed to generate PDF.', 'error');
        } finally {
            setLoading(false);
        }
    }, [data, showToast, setLoading]);

    if (initialLoading) return <LoadingScreen />;

    const renderFormSections = () => (
        <>
            <IdentitySection
                data={data}
                onUpdateField={(f, v) => setData({ ...data, [f]: v })}
                onAddLink={() => addItem('links', { url: '', label: '' })}
                onUpdateLink={(id, upd) => updateItem('links', id, upd)}
                onRemoveLink={(id) => removeItem('links', id)}
            />

            {data.sections?.map((section, index) => {
                const sectionProps = {
                    id: section.id,
                    title: section.title,
                    isVisible: section.isVisible,
                    isFirst: index === 0,
                    isLast: index === (data.sections?.length || 0) - 1,
                    onMoveUp: () => moveSection(index, 'up'),
                    onMoveDown: () => moveSection(index, 'down'),
                    onToggleVisibility: () => toggleSectionVisibility(index),
                    onTitleChange: (v: string) => updateSectionTitle(index, v)
                };

                switch (section.id) {
                    case 'summary':
                        return <SummarySection key={section.id} value={data.summary} onChange={(v) => setData({ ...data, summary: v })} sectionProps={sectionProps} />;
                    case 'technicalSkills':
                        return <SkillsSection key={section.id} skills={data.technicalSkills} onUpdate={(idx, upd) => { const n = [...data.technicalSkills]; n[idx] = { ...n[idx], ...upd }; setData({ ...data, technicalSkills: n }); }} onAdd={() => addItem('technicalSkills', { category: '', skills: '' })} onRemove={(idx) => { const n = [...data.technicalSkills]; n.splice(idx, 1); setData({ ...data, technicalSkills: n }); }} sectionProps={sectionProps} />;
                    case 'experiences':
                        return <ExperienceSection key={section.id} experiences={data.experiences} onUpdate={updateItem.bind(null, 'experiences')} onAdd={() => addItem('experiences', { company: '', position: '', location: '', year: '', highlights: [''] })} onRemove={removeItem.bind(null, 'experiences')} sectionProps={sectionProps} />;
                    case 'projects':
                        return <ProjectsSection key={section.id} projects={data.projects} onUpdate={updateItem.bind(null, 'projects')} onAdd={() => addItem('projects', { title: '', subtitle: '', techStack: '', liveLink: '', highlights: [''] })} onRemove={removeItem.bind(null, 'projects')} sectionProps={sectionProps} />;
                    case 'education':
                    case 'certifications':
                    case 'freelance':
                    case 'others':
                        return (
                            <ListSection
                                key={section.id}
                                type={section.id as any}
                                items={(data as any)[section.id]}
                                onUpdate={updateItem.bind(null, section.id as any)}
                                onAdd={() => {
                                    const templates: any = {
                                        education: { school: '', degree: '', major: '', year: '', result: '' },
                                        certifications: { name: '', issuer: '', year: '' },
                                        freelance: { project: '', role: '', duration: '', highlights: [''] },
                                        others: { title: '', description: '' }
                                    };
                                    addItem(section.id as any, templates[section.id]);
                                }}
                                onRemove={removeItem.bind(null, section.id as any)}
                                sectionProps={sectionProps}
                            />
                        );
                    default: return null;
                }
            })}
        </>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-16 overflow-x-clip text-slate-900">
            <nav className="fixed w-full top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex flex-wrap md:flex-nowrap items-center md:justify-between gap-3">
                <div className="order-1 flex items-center gap-3 cursor-pointer select-none" onDoubleClick={() => setShowLoginModal(true)}>
                    <img src="/favicon.svg" alt="Logo" className="w-9 h-9" />
                    <div>
                        <Link className="text-sm font-bold tracking-[0.18em] uppercase text-slate-900" to={"/"}>LuxeCV</Link>
                        <p className="text-[9px] font-medium text-slate-400 uppercase max-w-24 xs:max-w-[100%] truncate">
                            {localStorage.getItem('is_admin') === 'true' ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Premium Unlocked</> : 'Professional ATS Engine'}
                        </p>
                    </div>
                </div>

                <div className="order-3 md:order-2 w-full md:w-auto flex justify-center">
                    <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
                        {[{ id: 'editor', icon: PenTool, label: 'Editor' }, { id: 'preview', icon: Eye, label: 'Preview' }, { id: 'cover', icon: Mail, label: 'Cover' }].map(t => (
                            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors border-r border-slate-200 last:border-r-0 ${activeTab === t.id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
                                <t.icon size={13} /> <span>{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="order-2 md:order-3 ml-auto md:ml-0 flex items-center gap-1 sm:gap-2">
                    <button onClick={openApiKeyModal} className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors" title={hasApiKey ? "API Key configured — click to change" : "Add your Gemini API Key"}>
                        <Key size={17} />
                        <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    </button>
                    <button onClick={async () => {
                        setLoading(true);
                        try {
                            const models = await aiService.checkAvailableModels();
                            showToast(`Connected! Available: ${models.slice(0, 3).join(', ')}...`, 'success');
                        } catch (e) { showToast("Connection failed.", "error"); }
                        finally { setLoading(false); }
                    }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors" title="Test Connection">
                        <Zap size={17} />
                    </button>
                    <button onClick={async () => {
                        const { generateLatex } = await import('../utils/latexGenerator');
                        setLatexCode(generateLatex(data));
                        setShowLatexModal(true);
                    }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors" title="View LaTeX">
                        <Code size={17} />
                    </button>
                    <button onClick={downloadPDF} disabled={loading} className="bg-slate-900 text-white px-3 sm:px-5 py-2.5 rounded-lg text-[11px] font-semibold uppercase tracking-[0.14em] whitespace-nowrap flex items-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-40">
                        {loading ? <div className="animate-spin h-3 w-3 border-2 border-white/20 border-t-white rounded-full" /> : <Download size={15} />}
                        <span className="hidden lg:inline">Download PDF</span>
                    </button>
                </div>
            </nav>

            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 pt-32 md:pt-24">
                {activeTab === 'editor' && (
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)] gap-6 lg:gap-8 items-start animate-in fade-in duration-300">
                        {/* Left: ATS Alignment Engine (sticky) */}
                        <div className="w-full lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1 builder-scroll">
                            <ATSEngine
                                jobDescription={jobDescription}
                                onJDChange={setJobDescription}
                                onOptimize={handleOptimizeATS}
                                onCalculateScore={calculateATSScore}
                                onApplyFixes={handleApplyReviewFixes}
                                onGenerateCoverLetter={handleGenerateCoverLetter}
                                loading={loading}
                                atsScore={atsScore}
                                atsBreakdown={atsBreakdown}
                                atsFeedback={atsFeedback}
                            />
                        </div>

                        {/* Right: resume information / form */}
                        <div className="w-full space-y-5 lg:pb-12">
                            {renderFormSections()}
                        </div>
                    </div>
                )}

                {activeTab === 'preview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)] gap-6 lg:gap-8 items-start animate-in fade-in duration-300">
                        {/* Left: editable inputs — desktop only (live edit while previewing) */}
                        <div className="hidden lg:block lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1 builder-scroll space-y-5">
                            {renderFormSections()}
                        </div>

                        {/* Right: live resume preview */}
                        <div className="flex justify-center w-full">
                            <div className="preview-container w-full max-w-5xl bg-slate-100 border border-slate-200 rounded-xl p-6 sm:p-10 overflow-auto min-h-[calc(100vh-9rem)] flex flex-col items-center">
                                <div className="origin-top transition-transform duration-200" style={{ transform: `scale(${scale})` }}>
                                    <ResumePreview ref={resumeRef} data={debouncedData} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'cover' && (
                    <div className="max-w-3xl mx-auto w-full animate-in fade-in duration-300">
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
                                <div className="flex items-center gap-2.5">
                                    <span className="grid place-items-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600"><Mail size={15} /></span>
                                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-800">Cover Email Draft</h2>
                                </div>
                                {coverLetter && (
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => {/* ... (existing email logic) ... */}} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] rounded-lg bg-white border border-slate-300 text-slate-700 flex items-center gap-2 hover:border-slate-900 hover:text-slate-900 transition-colors">
                                            <Send size={13} /> Open Email
                                        </button>
                                        <button onClick={async () => {
                                            const plainText = coverLetter.replace(/[*]+/g, '');
                                            await navigator.clipboard.writeText(plainText);
                                            setCopied(true); setTimeout(() => setCopied(false), 2000);
                                        }} className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] rounded-lg transition-colors ${copied ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'} text-white flex items-center gap-2`}>{copied ? <Check size={13} /> : 'Copy Text'}</button>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 sm:p-8">
                                {!coverLetter ? <div className="text-center py-20 text-slate-300 text-[11px] font-semibold uppercase tracking-[0.16em]">Provide a Job Description to Generate</div> : (
                                    <div className="bg-slate-50 p-6 sm:p-8 rounded-lg border border-slate-200 font-serif text-[11pt] leading-relaxed whitespace-pre-wrap text-slate-800">
                                        {coverLetter.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {showApiKeyModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white p-7 rounded-2xl border border-slate-200 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] flex items-center gap-2.5 text-slate-900">
                                <span className="grid place-items-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600"><Key size={15} /></span>
                                Gemini API Key
                            </h3>
                            <button onClick={() => setShowApiKeyModal(false)} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                                <X size={15} className="text-slate-500" />
                            </button>
                        </div>

                        <p className="text-[12px] leading-relaxed text-slate-500 mb-4">
                            Add your own Google Gemini API key to generate resumes. It's stored only in this browser and sent directly to Google — never to our servers.
                        </p>

                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 mb-4 uppercase tracking-[0.1em]"
                        >
                            <ExternalLink size={13} /> Get a free API key
                        </a>

                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSaveApiKey(); }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.16em] block mb-1.5">Your API Key</label>
                                <input
                                    type="password"
                                    autoFocus
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                    className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none text-sm font-mono focus:border-blue-500 hover:border-slate-300 transition-colors"
                                    placeholder="AIza..."
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors uppercase tracking-[0.14em] text-[11px] flex items-center justify-center gap-2 disabled:opacity-40"
                                >
                                    {loading ? <div className="animate-spin h-3 w-3 border-2 border-white/20 border-t-white rounded-full" /> : <Check size={15} />}
                                    Save & Verify
                                </button>
                                {hasApiKey && (
                                    <button
                                        type="button"
                                        onClick={handleClearApiKey}
                                        disabled={loading}
                                        className="py-3 px-4 bg-white border border-red-300 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors uppercase tracking-[0.14em] text-[11px] flex items-center gap-2 disabled:opacity-40"
                                        title="Remove saved key"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showLatexModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 w-full max-w-4xl h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] flex items-center gap-2.5 text-slate-900"><span className="grid place-items-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600"><Code size={15} /></span> LaTeX Source</h3>
                            <button onClick={() => setShowLatexModal(false)} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"><X size={15} /></button>
                        </div>
                        <textarea readOnly value={latexCode} className="flex-1 p-5 bg-slate-900 text-slate-200 font-mono text-sm rounded-xl resize-none outline-none" />
                    </div>
                </div>
            )}

            {showLoginModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white p-7 rounded-2xl border border-slate-200 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-semibold uppercase text-slate-900 tracking-[0.14em]">Admin Access</h3>
                            <button onClick={() => setShowLoginModal(false)} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                                <X size={15} className="text-slate-500" />
                            </button>
                        </div>
                        {localStorage.getItem('is_admin') === 'true' ? (
                            <div className="text-center space-y-5">
                                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm">
                                    <Check size={18} /> Signed In as Admin
                                </div>
                                <button onClick={() => { localStorage.removeItem('is_admin'); setData(PUBLIC_DATA); window.location.reload(); }} className="w-full py-3 bg-white border border-red-300 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors uppercase tracking-[0.14em] text-[11px]">
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const u = (e.target as any).username.value;
                                const p = (e.target as any).password.value;
                                if (u === import.meta.env.VITE_ADMIN_USER && p === import.meta.env.VITE_ADMIN_PASS) {
                                    localStorage.setItem('is_admin', 'true');
                                    setData(PRIVATE_DATA);
                                    setShowLoginModal(false);
                                    window.location.reload();
                                } else { showToast("Invalid login", "error"); }
                            }} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.16em] block mb-1.5">Username</label>
                                    <input name="username" className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none text-sm focus:border-blue-500 hover:border-slate-300 transition-colors" placeholder="Enter username..." />
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.16em] block mb-1.5">Password</label>
                                    <input name="password" type="password" className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none text-sm focus:border-blue-500 hover:border-slate-300 transition-colors" placeholder="••••••••" />
                                </div>
                                <button type="submit" className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors uppercase tracking-[0.14em] text-[11px]">
                                    Unlock Profile
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setData({ ...data })} />}
        </div>
    );
};
