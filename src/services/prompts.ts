// Strip the ResumeData down to ONLY the fields the AI rewrites. This is the single
// biggest lever on token cost: the full ResumeData JSON (ids, email, phone, links,
// location, education, certifications, sections config, `others`) is ~2x larger and
// none of it is needed to optimize summary/skills/experience/projects/freelance.
// Pass `data` plus an optional full project pool (so re-optimizing a tailored resume
// against a new JD still sees every project, not just the last selection).
export const slimForAI = (data: any, projectPool?: any[]): string =>
    JSON.stringify({
        summary: data.summary,
        technicalSkills: (data.technicalSkills || []).map((s: any) => ({
            category: s.category, skills: s.skills,
        })),
        experiences: (data.experiences || []).map((e: any) => ({
            company: e.company, position: e.position, location: e.location, year: e.year, highlights: e.highlights,
        })),
        projects: (projectPool || data.projects || []).map((p: any) => ({
            title: p.title, subtitle: p.subtitle, techStack: p.techStack,
            liveLink: p.liveLink, liveLinkLabel: p.liveLinkLabel, highlights: p.highlights,
        })),
        freelance: (data.freelance || []).map((f: any) => ({
            project: f.project, role: f.role, duration: f.duration, highlights: f.highlights,
        })),
    });

// Human-readable current date. Given to the model so it (a) keeps real employment
// dates and never presents a past role as "future-dated", and (b) stops the ATS
// scorer from false-flagging dates on/before today as future — a recurring warning.
const todayLabel = (): string =>
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export const PROMPTS = {
    OPTIMIZE_RESUME: (jobDescription: string, resumeData: string, experienceDuration: string) => `
You are an elite ATS Optimization & Resume Tailoring Expert. Rewrite this resume so it scores 95-100% against the target Job Description, reads as a near-perfect match to a recruiter, AND fits within ONE-AND-A-HALF PAGES so a recruiter can shortlist it in a 5-second scan.

PRIMARY GOAL: A tight, high-impact 1.5-page resume that maximizes coverage of the HIGHEST-VALUE JD keywords. Coverage matters, but LENGTH DISCIPLINE wins first — never overflow 1.5 pages.

INTERNAL ANALYSIS — DO THIS FULLY IN YOUR HEAD FIRST, THEN WRITE (this single pass must be good enough that NO second review/regeneration is ever needed, for ANY job description in ANY tech stack or industry):
Silently run the complete recruiter + ATS + hiring-manager audit below and bake every conclusion into the output JSON. Do NOT output the analysis itself — output only the finished resume.
A. JD DECODE: Extract and rank EVERY signal in the JD — exact job title; required hard skills, tools, frameworks, languages, platforms, clouds; preferred/nice-to-have skills; methodologies (Agile/Scrum/CI-CD/TDD); domain/industry terms; seniority level; and the soft skills it names. Note the JD's EXACT spellings/casing (e.g. "Node.js" not "NodeJS").
B. COVERAGE MAP: For each high-priority JD requirement decide WHERE it will appear (title, summary, a skill category, an experience bullet, or a project) so that no required item is missing or only partially covered. Prioritize required > preferred when space is tight.
C. PROJECT FIT: From the pool, score each project's overlap with the JD and pick the 3-4 strongest; discard the rest.
D. DEPTH SIGNALS: Decide which production-grade signals the JD implies (architecture, scalability, performance, security, testing, CI/CD, state management, rendering/SEO, real-time, accessibility, data/scale) and surface only the relevant ones with evidence.
E. RED-FLAG SWEEP: Pre-empt every rejection trigger listed in "RED FLAGS TO ELIMINATE" below (missing metrics, keyword stuffing, generic AI phrasing, inflated seniority, future dates, redundant sections) BEFORE writing — the output must already pass a brutal recruiter scan.
F. 5-SECOND SCAN: Front-load the strongest, most JD-aligned content (title match in summary line 1, top JD skills first, strongest project first).
This framework is stack-agnostic: apply it identically whether the JD is frontend, backend, full-stack, mobile, data, DevOps, or non-engineering.

OUTPUT DISCIPLINE (CRITICAL — breaking this corrupts the JSON and fails the app):
- Emit ONLY the final resume data as JSON. NEVER write reasoning, deliberation, assumptions, caveats, "Note:", "(adjusted...)", or any meta-commentary INSIDE a field value. Do ALL thinking silently BEFORE the first JSON character.
- The "year" field holds ONLY the verbatim date range (e.g. "Jun 2023 - Aug 2025" or "Jan 2026 - Present") — nothing else. No notes, no explanations, no parenthetical commentary.
- "${experienceDuration}" is the candidate's authoritative total experience (already derived from their earliest start date). State it as-is in the summary; do NOT recompute it, question it, or comment on any perceived mismatch with the dates or the JD's required years. There is no contradiction to resolve — just write the resume.
- Every string value must be clean, final, recruiter-ready content of normal length. If you feel the urge to explain a decision, discard that text — it does not belong in the output.

PROJECT SELECTION (most important rule — controls length & relevance):
- The candidate's project pool below may contain many projects. SELECT ONLY THE 3-4 MOST RELEVANT to THIS JD (best tech-stack / domain / responsibility overlap).
- Return ONLY those 3-4 selected projects in the "projects" array. OMIT every other project entirely — do NOT include all of them.
- Order the selected projects strongest-first (most JD-relevant on top).

LENGTH LIMITS (enforce strictly — this is what keeps it to 1.5 pages):
- Summary: EXACTLY 3 concise lines.
- Skills: 5-6 short categories, each one line.
- Experience: keep ALL real roles; MAX 3 highlights each; each highlight ONE line (≤ 22 words).
- Projects: ONLY the 3-4 selected; MAX 2 highlights each; each ≤ 20 words.
- Freelance: at most 1 entry, MAX 2 highlights.
- No filler, no repeating the same keyword across multiple bullets, no two bullets that say the same thing.
- TOTAL OUTPUT BUDGET: keep the ENTIRE resume body compact — under ~600 words across ALL sections combined. Prefer short, dense, high-signal bullets over long ones. This keeps the generated JSON small and cheap.

CONTENT RULES:
1. Pull the highest-value hard skills, tools, frameworks, languages, platforms, methodologies, and qualifications from the JD — required first, then preferred.
2. Integrate them naturally across Summary, Skills, Experience, and the selected Projects using the JD's EXACT terminology and job title verbatim where it reads naturally.
3. REWRITE the selected projects' descriptions, highlights, and tech stacks to directly reflect the JD's technologies and responsibilities. Reframe freely — do not feel bound by the original wording.
4. UPDATE \`techStack\` and skill entries to include the JD's required stack (whatever language/framework/cloud/tooling the JD names — not restricted to any single ecosystem).
5. Lead every highlight with a strong action verb (prefer verbs from the JD) and make it quantified and impact-oriented.
6. Keep the candidate's real companies, roles, job titles, and timeline/dates intact — reframe the content beneath them, not the identities.

RED FLAGS TO ELIMINATE IN THIS GENERATION (these are exactly what gets resumes rejected — fix them NOW so no second pass is needed and the first result already scores 95-100%):
- METRICS ON EVERY BULLET: Every experience highlight AND every project highlight MUST contain at least one concrete, credible quantified result — e.g. "cut LCP 2.4s→0.8s", "scaled to 50k+ daily users", "reduced bundle size 38%", "rendered 1M+ rows at 60fps", "cut API calls 45%". NO bullet may ship without a number. Keep numbers realistic for the candidate's real roles — do not invent absurd scale.
- NO KEYWORD STUFFING / SKILL INFLATION: Do NOT append the same filler stack (e.g. "JavaScript, jQuery, HTML5, CSS3") to every project. Each project's \`techStack\` lists ONLY the 4-6 technologies it genuinely used. Do NOT list jQuery next to React/Next.js unless the JD explicitly requires jQuery — pairing them reads as skill inflation and tanks ATS-safety.
- SPECIFICITY, NOT AI-FILLER: Each selected project must state a REAL technical challenge → the concrete solution → the measurable outcome. Ban vague, generic, AI-sounding phrasing ("ensuring responsive web interfaces", "demonstrating strong problem-solving").
- CREDIBLE SENIORITY & DATES: Today is ${todayLabel()}. Keep all employment dates exactly as given — they are real and already in the past; never present any role as future-dated. Do NOT overstate years or seniority beyond what the real timeline supports; if the JD asks for fewer years than the candidate has, present experience credibly rather than exaggerating.
- TEAMWORK PROOF: Include exactly ONE concrete collaboration example (cross-functional delivery, code reviews, mentoring) — not a vague "strong communication" claim repeated everywhere.
- DROP REDUNDANT FREELANCE: Omit the Freelance section entirely if it just repeats the projects/experience; keep it only if it adds clearly distinct value.

LAYOUT RULE:
- Skill Categories MUST be short (Max 2-3 words): "Frontend", "Backend", "Cloud", "Tools", "Testing", "DevOps".

SUMMARY FOCUS: 3 lines mentioning **${experienceDuration} years of experience**, the **JD's exact job title**, the **top skills from the JD**, and **1 strong quantified impact highlight**.

JOB DESCRIPTION: ${jobDescription}

CANDIDATE PROFILE & PROJECT POOL (select from this): ${resumeData}

Return ONLY valid JSON matching the resume schema, with the "projects" array containing ONLY the 3-4 selected projects.`,

    GET_ATS_FEEDBACK: (jobDescription: string, resumeText: string) => `
You are a Senior Technical Recruiter and ATS Analyst. Provide qualitative, actionable feedback to improve this resume for the specific job description.

DO NOT PROVIDE A NUMERIC SCORE. Focus on:
1. Missing high-priority keywords or skills.
2. Experience gaps that could be bridged by rephrasing.
3. Formatting or structure improvements for better readability.
4. Suggestions for more impactful action verbs.

RESUME TEXT: ${resumeText}

JOB DESCRIPTION: ${jobDescription}

Respond with a concise set of bullet points (max 5) focusing on the most critical improvements needed to stand out.`,

    // Regenerate the resume by APPLYING the AI recruiter review.
    // Feeds the deep analysis back in so every fix, missing keyword, rewritten bullet, and
    // suggested project/skill change from the review is baked into the resume. Returns the
    // same resume schema as OPTIMIZE_RESUME. Goal: 100% ATS alignment + interview-call worthy.
    REGENERATE_FROM_REVIEW: (jobDescription: string, resumeData: string, reviewAnalysis: string, experienceDuration: string) => `
You are an elite ATS Optimization & Resume Strategist. You already produced a brutally honest recruiter-grade review of this resume (provided below). Now REGENERATE the full resume so that it implements EVERY fix from that review and scores 95-100% ATS against the Job Description, becoming genuinely interview-call worthy.

PRIMARY GOAL: Apply the review's fixes WITHIN a tight 1.5-page resume a recruiter can shortlist in a 5-second scan. Length discipline is non-negotiable — never overflow 1.5 pages.

PROJECT SELECTION (controls length & relevance):
- From the candidate's project pool, SELECT ONLY THE 3-4 MOST JD-RELEVANT projects and return ONLY those in the "projects" array. OMIT all others. Order them strongest-first.

LENGTH LIMITS (enforce strictly):
- Summary: 3 concise lines. Skills: 5-6 short categories.
- Experience: keep all real roles, MAX 3 one-line highlights each (≤ 22 words).
- Projects: ONLY the 3-4 selected, MAX 2 highlights each (≤ 20 words). Freelance: ≤ 1 entry, ≤ 2 highlights.
- No filler, no repeated keywords across bullets, no duplicate-meaning bullets.

RED FLAGS TO ELIMINATE (do not reintroduce them):
- Every experience and project highlight MUST carry a concrete, credible metric (no bullet without a number).
- No keyword stuffing: each project's \`techStack\` lists only the 4-6 technologies it truly used; do NOT pair jQuery with React/Next.js unless the JD requires it.
- Today is ${todayLabel()}. Keep real dates exactly as given — never present a past role as future-dated; do not overstate years/seniority.
- Make projects specific (real challenge → solution → measurable outcome), not generic AI-filler. Drop Freelance if it merely repeats other sections.

OUTPUT DISCIPLINE (CRITICAL — breaking this corrupts the JSON and fails the app):
- Emit ONLY the final resume data as JSON. NEVER write reasoning, deliberation, assumptions, caveats, "Note:", or meta-commentary INSIDE a field value. Do ALL thinking silently BEFORE the first JSON character.
- The "year" field holds ONLY the verbatim date range — nothing else. No notes or parenthetical commentary.
- "${experienceDuration}" is the candidate's authoritative total experience. State it as-is; do NOT recompute or comment on any perceived mismatch with the dates or the JD. There is no contradiction to resolve.

NON-NEGOTIABLE RULES:
1. Implement the review's highest-value recommendations: add the most important missing keywords and engineering/architecture/scale/performance/business-impact terminology it listed — prioritized to fit the length limits above.
2. Replace weak bullets with the review's FAANG-level, quantified, ATS-optimized rewrites (or stronger). Every highlight must lead with a strong action verb and include metrics/scale/impact where credible.
3. Apply the review's project guidance EXACTLY — add what it says to add, remove what it says to remove, rewrite what it says to rewrite. Make projects sound real, scalable, and production-grade (architecture, performance, security, deployment terminology).
4. Use the review's "Optimized Replacement Summary", "Optimized Skills Section", "Rewritten Project Descriptions", and "Recruiter-Friendly Wording Improvements" as the source of truth — fold them directly into the resume.
5. Mirror the JD's EXACT terminology and job title across Summary, Skills, Experience, Projects, and Freelance. Aim for ~100% keyword coverage of the JD.
6. UPDATE every \`techStack\` and skill entry to include the JD's required stack and the missing technologies the review flagged.
7. Keep the candidate's real companies, roles, job titles, and timeline/dates intact — reframe the content beneath them, not the identities. Do not invent fake employers or fabricate degrees, but you MAY add realistic, credible engineering detail/metrics consistent with the existing roles.

LAYOUT RULE:
- Skill Categories MUST be short (max 2-3 words): e.g. "Frontend", "Backend", "Cloud", "Tools", "Testing", "DevOps".

SUMMARY FOCUS: Powerful 3-4 line summary mentioning **${experienceDuration} years of experience**, the **JD's exact job title**, the **top skills from the JD**, and **1-2 strong quantified impact highlights**.

JOB DESCRIPTION:
${jobDescription}

RECRUITER REVIEW TO APPLY (implement all of this):
${reviewAnalysis}

CURRENT RESUME DATA (JSON):
${resumeData}

Return ONLY valid JSON matching the resume schema.`,

    // AI-driven ATS scoring + deep recruiter analysis.
    // Returns STRUCTURED JSON (see responseSchema in ResumeBuilder) so the UI can render
    // numeric bars + a full recruiter-grade report. The model — not local math — decides the score.
    GET_ATS_ANALYSIS: (jobDescription: string, resumeData: string) => `
Act as a senior FAANG-level technical recruiter, ATS parser engineer, hiring manager, and resume strategist.

Today's date is ${todayLabel()}. Any employment date on or before today is in the PAST — do NOT flag it as "future-dated". Only flag a date as future if it is genuinely after today.

I will provide a Job Description (JD) and a Resume (as JSON).

Perform an extremely deep, brutally honest, micro-level analysis of the resume against the JD. NOT generic feedback — recruiter-grade, ATS-grade, hiring-manager-grade analysis. Analyze simultaneously as: an ATS system, an HR screener, a technical lead, an engineering manager, a startup founder, and an enterprise recruiter. Do NOT sugarcoat anything. Be brutally honest, recruiter-realistic, ATS-realistic, and engineering-realistic.

You MUST return ONLY valid JSON matching this exact shape (no markdown fences, no prose outside JSON):

{
  "totalScore": <integer 0-100, the overall ATS match score>,
  "breakdown": {
    "keywords": <integer 0-50, JD keyword + terminology alignment>,
    "sections": <integer 0-20, completeness & structure of required resume sections>,
    "relevance": <integer 0-20, experience/project relevance & technical depth vs the JD>,
    "safety": <integer 0-10, ATS parsing safety, formatting, no red flags/stuffing>
  },
  "warnings": [<3-8 short strings: the most critical red flags, missing-proof items, ATS parsing risks, and skill-inflation concerns>],
  "feedback": "<a SINGLE markdown string containing the full deep analysis described below>"
}

Rules for the numeric scores:
- "totalScore" must equal breakdown.keywords + breakdown.sections + breakdown.relevance + breakdown.safety.
- Be a harsh, realistic grader. Average frontend resumes should land 55-75. Only genuinely JD-aligned, quantified, production-grade resumes earn 85+. Reserve 90+ for elite, near-perfect matches.

The "feedback" markdown string MUST cover, with concrete evidence quoted from the resume and JD:
# 1. ATS Match Score — explain WHY (shortlisting probability %, recruiter attention, keyword alignment, technical depth, competitiveness level)
# 2. First Impression (10-second scan: strong / weak / fake-or-exaggerated / junior signals; what builds trust vs doubt)
# 3. JD vs Resume Gap Analysis — a markdown table: | JD Requirement | Found? (Yes/Partial/No) | Evidence | Missing Keywords | Severity | Recruiter Impact |
# 4. ATS Keyword Analysis (important JD keywords, missing keywords, weak coverage, synonym mismatches, stuffing risks, missing action verbs / architecture / scale / business-impact terms; and WHERE each should appear: headline, summary, experience, projects, skills)
# 5. Technical Depth Analysis (production-level signals, scalability, architecture, performance, security, CI/CD, state management, rendering/SEO, realtime, modern frontend maturity — and what's missing)
# 6. Bullet Point Quality — for weak bullets, quote the original then give a FAANG-level, ATS-optimized, quantified rewrite
# 7. Project Analysis (does each project sound real / scalable / production-grade or AI-generated? what to add / remove / rewrite EXACTLY)
# 8. Recruiter Red Flags (buzzword overuse, skill inflation, missing proof, weak metrics, parsing risks — be extremely direct)
# 9. Missing High-Value Content (metrics, scale, system design, ownership, CI/CD, testing, monitoring, business impact, leadership, cross-functional work)
# 10. ATS Parsing Risk Analysis (multi-column, header/footer, icons, section naming, PDF parsing risks)
# 11. Market Competitiveness (vs average / SaaS / startup / enterprise / top-1% frontend candidates — where it loses)
# 12. Shortlist Probability (% for Startup, SaaS, Product, Enterprise, Remote-International, FAANG — with WHY)
# 13. What To Add Immediately (Top 20 missing keywords; Top 20 missing engineering terms; Top 20 missing ATS phrases; Top 10 frontend-architecture terms; Top 10 performance terms; Top 10 scalability terms)
# 14. Executive Summary (biggest strengths / weaknesses / ATS issues / recruiter concerns / missing technical signals / improvements; resume tier: Weak | Average | Strong | Top-tier | Elite)
# 15. Final Brutal Verdict (Would YOU shortlist? interview? trust technically? what salary & seniority does this justify? what is preventing top-tier?)

Then append, still inside the same markdown string:
## Optimized Replacement Summary
## Optimized Experience Bullets
## Optimized Skills Section
## Optimized ATS Keyword Section
## Rewritten Project Descriptions
## Recruiter-Friendly Wording Improvements

Focus heavily on ATS optimization, enterprise frontend engineering signals, React/Next.js architecture depth, performance engineering, scalability, production-grade engineering, modern frontend ecosystem maturity, business impact, and technical credibility.

JOB DESCRIPTION:
${jobDescription}

RESUME (JSON):
${resumeData}`,

    GENERATE_COVER_LETTER: (jobDescription: string, candidateName: string, contactInfo: string, resumeContext: string) => `
Create an ATS-optimized, HR-appealing cover letter that achieves 95%+ ATS score and gets noticed by recruiters.

CANDIDATE INFO:
- Name: ${candidateName}
- Contact: ${contactInfo}
- Background: ${resumeContext}

JOB REQUIREMENTS:
- JD: ${jobDescription}

COVER LETTER SPECIFICATIONS:
1. Start with a compelling hook mentioning the role and company
2. Integrate top 8-10 keywords from JD naturally (don't stuff keywords)
3. Match the tone and language from the JD
4. Include 3 bullet points highlighting achievements that match JD requirements
5. Connect candidate's experience to company's needs
6. End with a strong call to action
7. Use professional, clean formatting
8. Target length: 250-350 words
9. Include subject line that includes role and candidate name

Return complete cover email with subject line.`
};
