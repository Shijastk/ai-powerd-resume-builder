import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import {
    Sparkles, User, Briefcase, Download, Mail, Trash2,
    PenTool, MessageSquare, Layers, Zap, Code,
    X, Check, Eye, Link as LinkIcon, Key, GraduationCap, ChevronUp, ChevronDown, EyeOff, Send, Copy
} from 'lucide-react';
import jsPDF from 'jspdf';
import { ResumeData } from '../types/resume';
import { PUBLIC_DATA, PRIVATE_DATA } from '../data/initialData';
import { InputField } from '../components/ui/InputField';
import { SectionCard } from '../components/ui/SectionCard';
import { ResumePreview } from '../components/ResumePreview';
import { LoadingScreen } from '../components/LoadingScreen';
import { Toast } from '../components/ui/Toast';

export const ResumeBuilder = () => {
    const [data, setData] = useState<ResumeData>(() => {
        const isAdmin = localStorage.getItem('is_admin') === 'true';
        return isAdmin ? PRIVATE_DATA : PUBLIC_DATA;
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [jobDescription, setJobDescription] = useState("");
    const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'cover'>('editor');
    const [coverLetter, setCoverLetter] = useState("");
    const [copied, setCopied] = useState(false);
    const [showLatexModal, setShowLatexModal] = useState(false);
    const [latexCode, setLatexCode] = useState("");
    const [scale, setScale] = useState(1);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [atsScore, setAtsScore] = useState<number | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
    const resumeRef = useRef<HTMLDivElement>(null);

    // Toast helper function
    const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000); // Auto-dismiss after 5 seconds
    };

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

    if (initialLoading) return <LoadingScreen />;

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const u = (form.elements.namedItem('username') as HTMLInputElement).value;
        const p = (form.elements.namedItem('password') as HTMLInputElement).value;

        if (u === 'shijas' && p === 'admin123') {
            localStorage.setItem('is_admin', 'true');
            setData(PRIVATE_DATA);
            setShowLoginModal(false);
            window.location.reload(); // Reload to refresh everything cleanly
        } else {
            showToast('Invalid credentials. Please try again.', 'error');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('is_admin');
        setData(PUBLIC_DATA);
        window.location.reload();
    };

    const handleManualKeySelection = async () => {
        // @ts-ignore
        if (window.aistudio?.openSelectKey) {
            // @ts-ignore
            await window.aistudio.openSelectKey();
        }
    };

    const updateItem = (key: keyof ResumeData, id: string, updates: any) => {
        setData(prev => ({
            ...prev,
            [key]: (prev[key] as any[]).map(item => item.id === id ? { ...item, ...updates } : item)
        }));
    };

    const addItem = (key: keyof ResumeData, template: any) => {
        const id = Math.random().toString(36).substr(2, 9);
        setData(prev => ({ ...prev, [key]: [{ ...template, id }, ...(prev[key] as any[])] }));
    };

    const checkAvailableModels = async () => {
        if (!process.env.API_KEY) return showToast("API Key missing! Please check your .env.local file.", 'error');
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.API_KEY}`);
            const data = await response.json();
            if (data.error) {
                showToast(`API Error: ${JSON.stringify(data.error)}`, 'error');
                return;
            }
            const modelNames = data.models?.map((m: any) => m.name) || [];
            console.log("Available Models:", modelNames);
            showToast(`Your API Key supports these models:

${modelNames.map((n: string) => n.replace('models/', '')).join('\n')}

Check console for details.`, 'success');
        } catch (e: any) {
            showToast("Failed to check models: " + e.message, 'error');
        }
    };

    const generateWithFallback = async (ai: GoogleGenAI, prompt: string, schema?: any) => {
        // Extensive list including new, stable, lite, and legacy models to maximize success chance.
        // corrected 'gemini-1.0-pro' to 'gemini-pro' as per API specs.
        const models = [
            'gemini-3-flash-preview',
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-pro'
        ];
        let lastError;

        for (const model of models) {
            try {
                return await ai.models.generateContent({
                    model,
                    contents: prompt,
                    config: schema ? {
                        responseMimeType: "application/json",
                        responseSchema: schema
                    } : undefined
                });
            } catch (e: any) {
                console.warn(`Model ${model} failed:`, e.message);
                lastError = e;

                if (e.message?.includes("PERMISSION_DENIED")) throw e;

                // Handle Rate Limits (429)
                if (e.message?.includes("429") || e.message?.includes("Quota exceeded")) {
                    // Check for DAILY bucket exhaustion (limit: 0)
                    if (e.message.includes("limit: 0") && e.message.includes("PerDay")) {
                        console.error(`Daily Quota Exceeded for ${model}. Moving to next...`);
                        continue;
                    }

                    console.log(`Rate limit on ${model}. Analyzing wait time...`);
                    const match = e.message.match(/retry in (\d+(\.\d+)?)s/);
                    const waitSeconds = match ? parseFloat(match[1]) + 2 : 10;

                    // If wait is too long (> 60s), it's faster to just try the next model than to wait.
                    if (waitSeconds > 60) {
                        console.warn(`Wait time ${waitSeconds}s is too long. Skipping ${model}...`);
                        continue;
                    }

                    console.log(`Waiting ${waitSeconds}s before retrying ${model}...`);
                    await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));

                    try {
                        return await ai.models.generateContent({
                            model,
                            contents: prompt,
                            config: schema ? {
                                responseMimeType: "application/json",
                                responseSchema: schema
                            } : undefined
                        });
                    } catch (retryError: any) {
                        console.warn(`Retry on ${model} also failed:`, retryError.message);
                        lastError = retryError;
                    }
                }
                // For 404s (Not Found), we naturally loop to the next model.
            }
        }

        // If we get here, ALL models failed. Let's diagnose!
        console.error("All fallback models failed. Diagnosing available models...");
        let available = [];
        try {
            // Re-use the fetch logic to get TRUTH
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.API_KEY}`);
            const data = await response.json();
            available = data.models?.map((m: any) => m.name.replace('models/', '')) || [];
        } catch (e) {
            console.error("Diagnostic check failed", e);
        }

        const diagMsg = `All AI models failed.

Your API Key supports: ${available.join(', ') || 'Unknown (Check Connection)'}

Errors encountered:
${models.map(m => `- ${m}: ${lastError?.message?.substring(0, 50)}...`).join('\n')}`;
        showToast(diagMsg, 'error');
        throw new Error(diagMsg);
    };
    const handleOptimizeATS = async () => {
        if (!process.env.API_KEY) {
            showToast("API Key is missing! Please check your .env.local file and ensure 'GEMINI_API_KEY' is set.", 'error');
            return;
        }
        if (!jobDescription) return showToast("Please paste a Job Description!", 'warning');
        setLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

            // Enhanced prompt for 95%+ ATS score optimization
            const prompt = `You are an ATS Optimization Expert. Transform this resume to achieve 95%+ ATS score against the job description.

STRICT REQUIREMENTS:
1. Extract ALL technical keywords, soft skills, and qualifications from JD
2. Integrate keywords naturally throughout the resume (Summary, Skills, Experience, Projects, Freelance)
3. Use action verbs from JD in experience/project highlights
4. Match job title variations if applicable
5. Preserve candidate's real experiences and accomplishments
6. Optimize for ATS parsing (proper formatting, no graphics)
7. Include specific technologies, tools, and methodologies from JD

CRITICAL LAYOUT RULE:
- **Skill Categories MUST be short** (Max 2-3 words).
  - BAD: "Frontend Frameworks & Libraries"
  - GOOD: "Frontend", "Libraries", "Backend", "Tools", "DevOps"

JOB DESCRIPTION: ${jobDescription}

CURRENT RESUME DATA: ${JSON.stringify(data)}

OPTIMIZATION FOCUS:
- **Summary**: Lead with JD keywords and required qualifications
- **Skills**: Align with JD technical requirements. **Keep categories concise.**
- **Experience**: Mirror JD language and responsibilities
- **Projects**: Connect to JD requirements with relevant tech
- **Freelance**: Update descriptions to highlight relevant experience

Return ONLY valid JSON matching the resume schema.`;

            const response = await generateWithFallback(ai, prompt, {
                type: Type.OBJECT,
                properties: {
                    fullName: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    technicalSkills: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                category: { type: Type.STRING, description: "Short category name (e.g. 'Frontend', 'Backend')" },
                                skills: { type: Type.STRING }
                            }
                        }
                    },
                    experiences: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                company: { type: Type.STRING },
                                position: { type: Type.STRING },
                                location: { type: Type.STRING },
                                year: { type: Type.STRING },
                                highlights: { type: Type.ARRAY, items: { type: Type.STRING } }
                            }
                        }
                    },
                    projects: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                subtitle: { type: Type.STRING },
                                techStack: { type: Type.STRING },
                                liveLink: { type: Type.STRING },
                                liveLinkLabel: { type: Type.STRING },
                                highlights: { type: Type.ARRAY, items: { type: Type.STRING } }
                            }
                        }
                    },
                    freelance: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                project: { type: Type.STRING },
                                role: { type: Type.STRING },
                                duration: { type: Type.STRING },
                                highlights: { type: Type.ARRAY, items: { type: Type.STRING } }
                            }
                        }
                    }
                },
                required: ["fullName", "summary", "technicalSkills", "experiences", "projects"]
            });

            if (response?.text) {
                const optimized = JSON.parse(response.text.trim());
                const processArray = (arr: any[]) => arr?.map(item => ({ ...item, id: item.id || Math.random().toString(36).substr(2, 9) })) || [];

                setData(prev => ({
                    ...prev,
                    fullName: optimized.fullName || prev.fullName,
                    summary: optimized.summary || prev.summary,
                    technicalSkills: optimized.technicalSkills || prev.technicalSkills,
                    experiences: processArray(optimized.experiences || prev.experiences),
                    projects: processArray(optimized.projects || prev.projects),
                    freelance: processArray(optimized.freelance || prev.freelance),
                }));

                setActiveTab('preview');
                showToast("✅ High-ATS Resume Generated!\n\nOptimized for 95%+ ATS score:\n• Keywords integrated naturally\n• Action verbs from JD used\n• Skills aligned with requirements\n• Experience tailored to role\n• Projects connected to JD\n\nReview the Preview tab.", 'success');
            }
        } catch (e: any) {
            console.error("Optimization failed:", e);
            if (e.message?.includes("PERMISSION_DENIED") || e.message?.includes("403")) {
                showToast("Permission Error. Please use the Key icon in the top right to select a valid API key.", 'error');
            } else if (e.message?.includes("429")) {
                if (e.message.includes("limit: 0")) {
                    showToast("Daily Quota Exceeded. You have used up your free allowance for today. Please try again tomorrow or use a different API key.", 'warning');
                } else {
                    showToast("Server busy (Rate Limit). Please wait a moment and try again.", 'warning');
                }
            } else {
                // Try to parse clean message if it's JSON
                let msg = e.message || "Unknown error";
                try {
                    const json = JSON.parse(msg.substring(msg.indexOf('{')));
                    if (json.error?.message) msg = json.error.message;
                } catch { }
                showToast(`Failed to optimize: ${msg}`, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const calculateATSScore = async () => {
        if (!jobDescription) return showToast("Please paste a Job Description to calculate ATS Score!", 'warning');
        setLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

            // Create a comprehensive resume text from the data
            const resumeText = `
                Full Name: ${data.fullName}
                Location: ${data.location}
                Email: ${data.email}
                Phone: ${data.phone}
                Links: ${data.links?.map(l => `${l.label}: ${l.url}`).join(', ')}
                Summary: ${data.summary}
                Technical Skills: ${data.technicalSkills?.map(s => `${s.category}: ${s.skills}`).join('; ')}
                Experience: ${data.experiences?.map(exp => `${exp.position} at ${exp.company} (${exp.year}). Details: ${exp.highlights?.join(', ')} `).join('; ')}
                Projects: ${data.projects?.map(proj => `${proj.title}. Tech: ${proj.techStack}. Details: ${proj.highlights?.join(', ')} `).join('; ')}
                Education: ${data.education?.map(edu => `${edu.degree} in ${edu.major} at ${edu.school} (${edu.year})`).join('; ')}
                Certifications: ${data.certifications?.map(cert => `${cert.name} from ${cert.issuer} (${cert.year})`).join('; ')}
                Freelance: ${data.freelance?.map(free => `${free.role} - ${free.project} (${free.duration}). Details: ${free.highlights?.join(', ')} `).join('; ')}
                Others: ${data.others?.map(other => `${other.title}: ${other.description}`).join('; ')}
            `;

            const prompt = `Evaluate this resume against the job description for ATS compatibility and HR appeal. Score from 0-100% based on:
            1. Keyword matching (40% of score) - Technical terms, skills, qualifications from JD
            2. Skills alignment (25% of score) - Relevance to job requirements
            3. Experience relevance (20% of score) - Past roles matching job expectations
            4. ATS formatting (15% of score) - Proper structure, no complex formatting
            
            RESUME TEXT: ${resumeText}
            
            JOB DESCRIPTION: ${jobDescription}
            
            Provide exact match percentage and suggest improvements.
            
            Respond with ONLY a number between 0 and 100, followed by a brief explanation of the score. Format: "SCORE: XX% - Explanation: [specific strengths and recommendations for improvement]"`;

            const response = await generateWithFallback(ai, prompt);

            if (response?.text) {
                const responseText = response.text.trim();
                // Extract score from response
                const scoreMatch = responseText.match(/SCORE:\s*(\d+)%|\b(\d+)%\b/);
                const score = scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2]) : 0;
                setAtsScore(score);
                showToast(`ATS Score: ${score}%\n\n${responseText}`, 'success');
            }
        } catch (e: any) {
            console.error("ATS Score calculation failed:", e);
            showToast("Failed to calculate ATS Score. Please try again.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCoverLetter = async () => {
        if (!jobDescription) return showToast("Please paste a Job Description!", 'warning');
        setLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

            // Build context from current resume data
            const resumeContext = `
Professional Summary: ${data.summary}
Top Skills: ${data.technicalSkills?.slice(0, 3).map(s => `${s.category}: ${s.skills}`).join('; ')}
Key Projects: ${data.projects?.slice(0, 2).map(p => p.title).join(', ')}
Recent Experience: ${data.experiences?.[0]?.position || ''} at ${data.experiences?.[0]?.company || ''}
            `.trim();

            const contactInfo = `Email: ${data.email}, Phone: ${data.phone}, Links: ${data.links?.map(l => l.url).join(', ')}`;

            const prompt = `Create an ATS-optimized, HR-appealing cover letter that achieves 95%+ ATS score and gets noticed by recruiters.

CANDIDATE INFO:
- Name: ${data.fullName}
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

Return complete cover email with subject line.`;

            const response = await generateWithFallback(ai, prompt);

            if (response?.text) {
                setCoverLetter(response.text);
            }
            setActiveTab('cover');
        } catch (e: any) {
            console.error("Cover letter failed:", e);
            if (e.message?.includes("429")) {
                showToast("Server busy (Rate Limit). Please wait a moment and try again.", 'warning');
            } else {
                showToast("Failed to generate cover letter. Please try again.", 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        const el = resumeRef.current;
        if (!el) return;
        setLoading(true);
        try {
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

            // Helper: Find all links and add them to PDF manually overlaying the image
            const addLinksToPdf = (pdf: jsPDF) => {
                const links = el.querySelectorAll('a');
                const containerRect = el.getBoundingClientRect();

                // PDF Page dimensions
                const pdfPageWidth = 210; // A4 width in mm
                const pdfPageHeight = 297; // A4 height in mm
                const marginTop = 10;
                const marginBottom = 15;
                const contentHeight = pdfPageHeight - marginTop - marginBottom;

                // Calculate scale factor: PDF Width (mm) / DOM Width (px)
                // This creates a standard conversion ratio regardless of screen zoom/transform
                const scaleFactor = pdfPageWidth / containerRect.width;

                links.forEach((link) => {
                    const rect = link.getBoundingClientRect();
                    const url = link.getAttribute('href');
                    if (!url) return;

                    // Calculate position relative to the container
                    const relTop = rect.top - containerRect.top;
                    const relLeft = rect.left - containerRect.left;

                    // Convert to mm using the proportional scale factor
                    const x = relLeft * scaleFactor;

                    // y position relative to the document top
                    const yTotal = relTop * scaleFactor;

                    // Calculate page and position
                    // Add very slight buffer (0.5) to page calc to handle edge cases
                    let page = 1 + Math.floor((yTotal - 0.5) / contentHeight);

                    // Calculate y position on the specific page
                    const yOnPage = (yTotal % contentHeight) + marginTop;

                    const w = rect.width * scaleFactor;
                    const h = rect.height * scaleFactor;

                    pdf.setPage(page);
                    pdf.link(x, yOnPage, w, h, { url });
                });
            };

            // Temporarily hide visual page breaks for PDF generation
            const breaks = el.querySelectorAll('.page-break-line');
            breaks.forEach(b => (b as HTMLElement).style.display = 'none');

            await doc.html(el, {
                callback: (pdf) => {
                    addLinksToPdf(pdf);
                    pdf.save(`${data.fullName.replace(/\s+/g, '_')}_Resume.pdf`);
                    breaks.forEach(b => (b as HTMLElement).style.display = 'flex');
                    setLoading(false);
                    showToast('✅ Resume PDF downloaded successfully!', 'success');
                },
                x: 0, y: 0, width: 210, windowWidth: 794,
                autoPaging: 'text', margin: [10, 0, 15, 0],
                html2canvas: { useCORS: true, backgroundColor: '#ffffff' }
            });
        } catch (e) {
            console.error("PDF failed:", e);
            const breaks = el?.querySelectorAll('.page-break-line');
            if (breaks) breaks.forEach(b => (b as HTMLElement).style.display = 'flex');
            setLoading(false);
            showToast('Failed to generate PDF. Please try again.', 'error');
        }
    };

    const handleCopyDraft = async () => {
        const plainText = coverLetter.replace(/[*]+/g, '');
        try {
            const html = coverLetter
                .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                .replace(/\n/g, '<br>');

            // @ts-ignore
            const data = [new ClipboardItem({
                "text/html": new Blob([html], { type: "text/html" }),
                "text/plain": new Blob([plainText], { type: "text/plain" })
            })];
            await navigator.clipboard.write(data);
        } catch (e) {
            console.error("Clipboard rich copy failed, falling back", e);
            await navigator.clipboard.writeText(plainText);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20 overflow-x-hidden">
            <nav className="fixed w-full top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                <div
                    className="flex items-center gap-4 cursor-pointer select-none group"
                    onDoubleClick={() => setShowLoginModal(true)}
                    title="Double click for admin login"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 rounded-full group-hover:opacity-40 transition-opacity"></div>
                        <img src="/favicon.svg" alt="Logo" className="w-10 h-10 drop-shadow-lg transform transition-transform group-hover:scale-105 group-hover:rotate-3" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black tracking-widest uppercase text-slate-900">LuxeCV <span className="text-blue-600">AI</span></h1>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            {localStorage.getItem('is_admin') === 'true' ? (
                                <><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Premium Unlocked</>
                            ) : 'Professional ATS Engine'}
                        </p>
                    </div>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    {[{ id: 'editor', icon: PenTool, label: 'Editor' }, { id: 'preview', icon: Eye, label: 'Preview' }, { id: 'cover', icon: Mail, label: 'Cover' }].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-5 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <tab.icon size={14} /> <span className="hidden xs:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={handleManualKeySelection} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Select API Key Manually">
                        <Key size={18} />
                    </button>
                    <button onClick={checkAvailableModels} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Test API Connection">
                        <Zap size={18} />
                    </button>
                    <button
                        onClick={async () => {
                            const { generateLatex } = await import('../utils/latexGenerator');
                            const code = generateLatex(data);
                            setLatexCode(code);
                            setShowLatexModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                        title="View LaTeX Code"
                    >
                        <Code size={18} />
                    </button>
                    <button onClick={downloadPDF} disabled={loading} className="bg-slate-900 text-white px-3 sm:px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50">
                        {loading ? <div className="animate-spin h-3 w-3 border-2 border-white/20 border-t-white rounded-full" /> : <Download size={16} />}
                        <span className="hidden sm:inline">{loading ? 'Processing' : 'Download PDF'}</span>
                    </button>
                </div>
            </nav>

            <main className="max-w-[1400px] mx-auto p-6 lg:p-12 pt-52 md:pt-32 mt-5">
                {activeTab === 'editor' && (
                    <div className="max-w-4xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-white/20 p-2 rounded-lg"><Sparkles size={20} /></div>
                                <h3 className="text-sm font-black uppercase tracking-widest">ATS Alignment Engine</h3>
                                {atsScore !== null && (
                                    <div className="ml-auto bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                                        ATS Score: {atsScore}%
                                    </div>
                                )}
                            </div>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste Job Description here... AI will extract ATS keywords and optimize your resume: Skills, Summary, Projects, Experience, and Cover Letter. Aim for 95%+ ATS Score!"
                                className="w-full h-40 bg-white/10 border border-white/20 rounded-2xl p-5 text-sm placeholder:text-white/40 outline-none focus:bg-white/20 transition-all mb-4 shadow-inner"
                            />
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <button onClick={handleOptimizeATS} disabled={loading} className="w-full sm:flex-1 py-3 sm:py-4 bg-white text-blue-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl disabled:opacity-50">
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="animate-spin h-3 w-3 border-2 border-blue-700/20 border-t-blue-700 rounded-full" />
                                            Optimizing...
                                        </span>
                                    ) : "Optimize Resume"}
                                </button>
                                <button onClick={calculateATSScore} disabled={loading} className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-green-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-green-500 transition-all shadow-xl disabled:opacity-50">
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="animate-spin h-3 w-3 border-2 border-white/20 border-t-white rounded-full" />
                                            Calculating...
                                        </span>
                                    ) : "ATS Score"}
                                </button>
                                <button onClick={handleGenerateCoverLetter} disabled={loading} className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-400 transition-all shadow-xl disabled:opacity-50">
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="animate-spin h-3 w-3 border-2 border-white/20 border-t-white rounded-full" />
                                            Generating...
                                        </span>
                                    ) : "Cover Email"}
                                </button>
                            </div>
                        </div>

                        <SectionCard title="Identity" icon={User}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Full Name" value={data.fullName} onChange={(v: string) => setData({ ...data, fullName: v })} />
                                <InputField label="Location" value={data.location} onChange={(v: string) => setData({ ...data, location: v })} />
                                <InputField label="Email" value={data.email} onChange={(v: string) => setData({ ...data, email: v })} />
                                <InputField label="Phone" value={data.phone} onChange={(v: string) => setData({ ...data, phone: v })} />
                            </div>
                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Links</span>
                                    <button onClick={() => addItem('links', { url: '', label: '' })} className="text-blue-600 text-[10px] font-bold uppercase hover:underline">+ Add</button>
                                </div>
                                {(data.links || []).map(link => (
                                    <div key={link.id} className="flex gap-2 mb-2 items-center">
                                        <div className="flex-[2] bg-white border border-slate-200 rounded-xl flex items-center px-3"><LinkIcon size={14} className="text-slate-300 mr-2" /><input className="w-full text-xs py-2 bg-transparent outline-none" value={link.url} placeholder="https://..." onChange={e => updateItem('links', link.id, { url: e.target.value })} /></div>
                                        <div className="flex-1 bg-white border border-slate-200 rounded-xl flex items-center px-3"><input className="w-full text-xs py-2 bg-transparent outline-none" value={link.label} placeholder="Label (e.g. LinkedIn)" onChange={e => updateItem('links', link.id, { label: e.target.value })} /></div>
                                        <button onClick={() => setData({ ...data, links: data.links.filter(l => l.id !== link.id) })} className="text-rose-400 p-2 hover:bg-rose-50 rounded-lg"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        {data.sections?.map((section, index) => {
                            const sectionProps = {
                                id: section.id,
                                title: section.title,
                                isVisible: section.isVisible,
                                isFirst: index === 0,
                                isLast: index === (data.sections?.length || 0) - 1,
                                onMoveUp: () => {
                                    const newSections = [...data.sections];
                                    [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
                                    setData({ ...data, sections: newSections });
                                },
                                onMoveDown: () => {
                                    const newSections = [...data.sections];
                                    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
                                    setData({ ...data, sections: newSections });
                                },
                                onToggleVisibility: () => {
                                    const newSections = [...data.sections];
                                    newSections[index].isVisible = !newSections[index].isVisible;
                                    setData({ ...data, sections: newSections });
                                },
                                onTitleChange: (v: string) => {
                                    const newSections = [...data.sections];
                                    newSections[index].title = v;
                                    setData({ ...data, sections: newSections });
                                }
                            };

                            switch (section.id) {
                                case 'summary':
                                    return (
                                        <SectionCard key={section.id} {...sectionProps} icon={MessageSquare}>
                                            <InputField isTextArea label="Profile Objective" value={data.summary} onChange={(v: string) => setData({ ...data, summary: v })} />
                                        </SectionCard>
                                    );
                                case 'technicalSkills':
                                    return (
                                        <SectionCard key={section.id} {...sectionProps} icon={Layers} onAdd={() => addItem('technicalSkills', { category: '', skills: '' })}>
                                            <div className="space-y-4">
                                                {(data.technicalSkills || []).map((s, idx) => (
                                                    <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl relative">
                                                        <button onClick={() => setData({ ...data, technicalSkills: data.technicalSkills.filter((_, i) => i !== idx) })} className="absolute top-2 right-2 text-slate-300 hover:text-rose-400"><X size={14} /></button>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <InputField label="Category" value={s.category} onChange={(v: string) => { const n = [...data.technicalSkills]; n[idx].category = v; setData({ ...data, technicalSkills: n }); }} />
                                                            <InputField label="Skills" value={s.skills} onChange={(v: string) => { const n = [...data.technicalSkills]; n[idx].skills = v; setData({ ...data, technicalSkills: n }); }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </SectionCard>
                                    );
                                case 'experiences':
                                    return (
                                        <SectionCard key={section.id} {...sectionProps} icon={Briefcase} onAdd={() => addItem('experiences', { company: '', position: '', location: '', year: '', highlights: [''] })}>
                                            <div className="space-y-6">
                                                {(data.experiences || []).map((exp) => (
                                                    <div key={exp.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl relative space-y-4">
                                                        <button onClick={() => setData({ ...data, experiences: data.experiences.filter(e => e.id !== exp.id) })} className="absolute top-4 right-4 text-slate-300 hover:text-rose-400"><Trash2 size={16} /></button>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <InputField label="Organization" value={exp.company} onChange={(v: string) => updateItem('experiences', exp.id, { company: v })} />
                                                            <InputField label="Duration" value={exp.year} onChange={(v: string) => updateItem('experiences', exp.id, { year: v })} />
                                                            <InputField label="Role" value={exp.position} onChange={(v: string) => updateItem('experiences', exp.id, { position: v })} />
                                                            <InputField label="Location" value={exp.location} onChange={(v: string) => updateItem('experiences', exp.id, { location: v })} />
                                                        </div>
                                                        <InputField isTextArea label="Bullets" value={exp.highlights?.join('\n')} onChange={(v: string) => updateItem('experiences', exp.id, { highlights: v.split('\n') })} />
                                                    </div>
                                                ))}
                                            </div>
                                        </SectionCard>
                                    );
                                case 'projects':
                                    return (
                                        <SectionCard key={section.id} {...sectionProps} icon={Code} onAdd={() => addItem('projects', { title: '', subtitle: '', techStack: '', liveLink: '', highlights: [''] })}>
                                            <div className="space-y-6">
                                                {(data.projects || []).map((proj) => (
                                                    <div key={proj.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl relative space-y-4">
                                                        <button onClick={() => setData({ ...data, projects: data.projects.filter(p => p.id !== proj.id) })} className="absolute top-4 right-4 text-slate-300 hover:text-rose-400"><Trash2 size={16} /></button>
                                                        <InputField label="Project Name" value={proj.title} onChange={(v: string) => updateItem('projects', proj.id, { title: v })} />
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <InputField label="Tech" value={proj.techStack} onChange={(v: string) => updateItem('projects', proj.id, { techStack: v })} />
                                                            <InputField label="Link URL" value={proj.liveLink} onChange={(v: string) => updateItem('projects', proj.id, { liveLink: v })} />
                                                            <InputField label="Link Label" value={proj.liveLinkLabel || ''} placeholder="e.g. Live Demo" onChange={(v: string) => updateItem('projects', proj.id, { liveLinkLabel: v })} />
                                                        </div>
                                                        <InputField isTextArea label="Details" value={proj.highlights?.join('\n')} onChange={(v: string) => updateItem('projects', proj.id, { highlights: v.split('\n') })} />
                                                    </div>
                                                ))}
                                            </div>
                                        </SectionCard>
                                    );
                                case 'freelance':
                                    return (
                                        <SectionCard key={section.id} {...sectionProps} icon={Briefcase} onAdd={() => addItem('freelance', { project: '', role: '', duration: '', highlights: [''] })}>
                                            <div className="space-y-6">
                                                {(data.freelance || []).map((free) => (
                                                    <div key={free.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl relative space-y-4">
                                                        <button onClick={() => setData({ ...data, freelance: data.freelance.filter(f => f.id !== free.id) })} className="absolute top-4 right-4 text-slate-300 hover:text-rose-400"><Trash2 size={16} /></button>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <InputField label="Project/Client" value={free.project} onChange={(v: string) => updateItem('freelance', free.id, { project: v })} />
                                                            <InputField label="Duration" value={free.duration} onChange={(v: string) => updateItem('freelance', free.id, { duration: v })} />
                                                        </div>
                                                        <InputField label="Role" value={free.role} onChange={(v: string) => updateItem('freelance', free.id, { role: v })} />
                                                        <InputField isTextArea label="Details" value={free.highlights?.join('\n')} onChange={(v: string) => updateItem('freelance', free.id, { highlights: v.split('\n') })} />
                                                    </div>
                                                ))}
                                            </div>
                                        </SectionCard>
                                    );
                                case 'certifications':
                                    return (
                                        <SectionCard key={section.id} {...sectionProps} icon={GraduationCap} onAdd={() => addItem('certifications', { name: '', issuer: '', year: '' })}>
                                            <div className="space-y-4">
                                                {(data.certifications || []).map((cert) => (
                                                    <div key={cert.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl relative">
                                                        <button onClick={() => setData({ ...data, certifications: data.certifications.filter(c => c.id !== cert.id) })} className="absolute top-2 right-2 text-slate-300 hover:text-rose-400"><Trash2 size={14} /></button>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <InputField label="Name" value={cert.name} onChange={(v: string) => updateItem('certifications', cert.id, { name: v })} />
                                                            <InputField label="Issuer" value={cert.issuer} onChange={(v: string) => updateItem('certifications', cert.id, { issuer: v })} />
                                                            <InputField label="Year" value={cert.year} onChange={(v: string) => updateItem('certifications', cert.id, { year: v })} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </SectionCard>
                                    );
                                case 'education':
                                    return (
                                        <SectionCard key={section.id} {...sectionProps} icon={GraduationCap} onAdd={() => addItem('education', { school: '', degree: '', major: '', year: '', result: '' })}>
                                            <div className="space-y-6">
                                                {(data.education || []).map((edu) => (
                                                    <div key={edu.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl relative space-y-4">
                                                        <button onClick={() => setData({ ...data, education: data.education.filter(e => e.id !== edu.id) })} className="absolute top-4 right-4 text-slate-300 hover:text-rose-400"><Trash2 size={16} /></button>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <InputField label="Institution" value={edu.school} onChange={(v: string) => updateItem('education', edu.id, { school: v })} />
                                                            <InputField label="Duration" value={edu.year} onChange={(v: string) => updateItem('education', edu.id, { year: v })} />
                                                            <InputField label="Degree" value={edu.degree} onChange={(v: string) => updateItem('education', edu.id, { degree: v })} />
                                                            <InputField label="Field of Study" value={edu.major} onChange={(v: string) => updateItem('education', edu.id, { major: v })} />
                                                            <InputField label="Grade/Result" value={edu.result} onChange={(v: string) => updateItem('education', edu.id, { result: v })} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </SectionCard>
                                    );
                                case 'others':
                                    return (
                                        <SectionCard key={section.id} {...sectionProps} icon={Zap} onAdd={() => addItem('others', { title: '', description: '' })}>
                                            <div className="space-y-4">
                                                {(data.others || []).map((item) => (
                                                    <div key={item.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl relative">
                                                        <button onClick={() => setData({ ...data, others: data.others.filter(o => o.id !== item.id) })} className="absolute top-2 right-2 text-slate-300 hover:text-rose-400"><X size={14} /></button>
                                                        <div className="space-y-4">
                                                            <InputField label="Title" placeholder="e.g. Volunteering" value={item.title} onChange={(v: string) => updateItem('others', item.id, { title: v })} />
                                                            <InputField isTextArea label="Description" value={item.description} onChange={(v: string) => updateItem('others', item.id, { description: v })} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </SectionCard>
                                    );
                                default: return null;
                            }
                        })}
                    </div>
                )}

                {activeTab === 'preview' && (
                    <div className="flex justify-center animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="preview-container w-full max-w-5xl bg-slate-200/40 rounded-[3rem] p-12 overflow-auto min-h-[calc(100vh-160px)] flex flex-col items-center">
                            <div className="shadow-2xl origin-top bg-white transition-transform duration-300" style={{ transform: `scale(${scale})`, width: '210mm' }}>
                                <ResumePreview ref={resumeRef} data={data} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'cover' && (
                    <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-3"><Mail size={20} className="text-blue-600" /><h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Cover Email Draft</h2></div>
                                {coverLetter && (
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => {
                                            // Extract subject (clean markdown if any)
                                            const subjectMatch = coverLetter.match(/^Subject:\s*(.+)/im);
                                            const subject = subjectMatch ? subjectMatch[1].replace(/[\*\_\#]/g, '').trim() : `Application for Role - ${data.fullName}`;

                                            // Prepare clean plain-text body
                                            let body = coverLetter
                                                .replace(/^Subject:.*$/im, '') // Remove subject line
                                                .replace(/^\s*[\*•-]\s+/gm, '<<<BULLET>>>') // Protect lists
                                                .replace(/[\*\#\_]/g, '') // Remove all remaining markdown (*, #, _)
                                                .replace(/<<<BULLET>>>/g, '\n   • ') // Restore bullets with indentation
                                                .replace(/([A-Z][a-z]+:)/g, '\n$1') // Ensure "Sincerely:", "Dear:", etc start on new lines if clustered
                                                .replace(/\n{3,}/g, '\n\n') // Collapse excessive white space
                                                .trim();

                                            window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                                        }} className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg">
                                            <Send size={14} /> Open Email
                                        </button>
                                        <button onClick={handleCopyDraft} className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${copied ? 'bg-green-600' : 'bg-slate-900'} text-white flex items-center gap-2`}>{copied ? <Check size={14} /> : 'Copy Rich Text'}</button>
                                    </div>
                                )}
                            </div>
                            <div className="p-10">
                                {!coverLetter ? <div className="text-center py-20 opacity-30 text-xs font-bold uppercase">Provide Job Description in Editor to Generate</div> : (
                                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 font-serif text-[11pt] leading-relaxed whitespace-pre-wrap">
                                        {coverLetter.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {showLatexModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-4xl h-[80vh] border border-slate-100 animate-in fade-in zoom-in duration-200 flex flex-col">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-lg font-black uppercase text-slate-800 tracking-wider flex items-center gap-3">
                                <Code size={24} className="text-blue-600" /> LaTeX Source Code
                            </h3>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={async () => {
                                        await navigator.clipboard.writeText(latexCode);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${copied ? 'bg-green-600' : 'bg-slate-900'} text-white flex items-center gap-2`}
                                >
                                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Code'}
                                </button>
                                <button onClick={() => setShowLatexModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                                    <X size={16} className="text-slate-500" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 relative">
                            <textarea
                                readOnly
                                value={latexCode}
                                className="w-full h-full p-6 bg-slate-900 text-slate-300 font-mono text-sm leading-relaxed resize-none outline-none"
                            />
                        </div>
                    </div>
                </div>
            )}

            {showLoginModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-sm border border-slate-100 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black uppercase text-slate-800 tracking-wider">Admin Access</h3>
                            <button onClick={() => setShowLoginModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                                <X size={16} className="text-slate-500" />
                            </button>
                        </div>
                        {localStorage.getItem('is_admin') === 'true' ? (
                            <div className="text-center space-y-6">
                                <div className="p-4 bg-green-50 text-green-700 rounded-2xl font-bold flex items-center justify-center gap-2">
                                    <Check size={20} /> Signed In as Admin
                                </div>
                                <button onClick={handleLogout} className="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors uppercase tracking-widest text-xs">
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Username</label>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl flex items-center px-3">
                                        <User size={16} className="text-slate-300" />
                                        <input name="username" className="w-full p-3 bg-transparent outline-none text-sm font-medium" placeholder="Enter username..." autoFocus />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Password</label>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl flex items-center px-3">
                                        <Key size={16} className="text-slate-300" />
                                        <input name="password" type="password" className="w-full p-3 bg-transparent outline-none text-sm font-medium" placeholder="••••••••" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors uppercase tracking-widest text-xs shadow-lg shadow-blue-500/30">
                                    Unlock Profile
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <style>{`.break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }`}</style>
        </div>
    );
};
