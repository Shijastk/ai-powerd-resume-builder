import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import {
    Sparkles, User, Briefcase, Download, Mail, Trash2,
    PenTool, MessageSquare, Layers, Zap, Code,
    X, Check, Eye, Link as LinkIcon, Key, GraduationCap, ChevronUp, ChevronDown, EyeOff, Send
} from 'lucide-react';
import jsPDF from 'jspdf';
import { ResumeData } from '../types/resume';
import { PUBLIC_DATA, PRIVATE_DATA } from '../data/initialData';
import { InputField } from '../components/ui/InputField';
import { SectionCard } from '../components/ui/SectionCard';
import { ResumePreview } from '../components/ResumePreview';
import { LoadingScreen } from '../components/LoadingScreen';

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
    const [scale, setScale] = useState(1);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const resumeRef = useRef<HTMLDivElement>(null);

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
            alert('Invalid credentials');
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

    const handleOptimizeATS = async () => {
        if (!jobDescription) return alert("Please paste a Job Description!");
        setLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Tailor this resume for JD: "${jobDescription}". Data: ${JSON.stringify(data)}. Add 3-4 NEW professional projects matching JD skills. Return valid JSON matching schema.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            fullName: { type: Type.STRING },
                            summary: { type: Type.STRING },
                            technicalSkills: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { category: { type: Type.STRING }, skills: { type: Type.STRING } } } },
                            experiences: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { company: { type: Type.STRING }, position: { type: Type.STRING }, location: { type: Type.STRING }, year: { type: Type.STRING }, highlights: { type: Type.ARRAY, items: { type: Type.STRING } } } } },
                            projects: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, subtitle: { type: Type.STRING }, techStack: { type: Type.STRING }, liveLink: { type: Type.STRING }, highlights: { type: Type.ARRAY, items: { type: Type.STRING } } } } }
                        },
                        required: ["fullName", "summary", "experiences", "projects"]
                    }
                }
            });

            if (response.text) {
                const optimized = JSON.parse(response.text.trim());
                const processArray = (arr: any[]) => arr?.map(item => ({ ...item, id: item.id || Math.random().toString(36).substr(2, 9) })) || [];

                setData(prev => ({
                    ...prev,
                    ...optimized,
                    experiences: processArray(optimized.experiences || prev.experiences),
                    projects: processArray(optimized.projects || prev.projects),
                    technicalSkills: optimized.technicalSkills || prev.technicalSkills,
                }));
                setActiveTab('preview');
            }
        } catch (e: any) {
            console.error("Optimization failed:", e);
            if (e.message?.includes("PERMISSION_DENIED") || e.message?.includes("403")) {
                alert("Permission Error. Please use the Key icon in the top right to select a valid API key.");
            } else {
                alert("Failed to optimize. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCoverLetter = async () => {
        if (!jobDescription) return alert("Please paste a Job Description!");
        setLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const contactInfo = `Email: ${data.email}, Phone: ${data.phone}, Links: ${data.links?.map(l => l.url).join(', ')}`;
            const prompt = `Candidate: ${data.fullName}. Contact Info: ${contactInfo}. JD: ${jobDescription}. Write a professional cover email draft. Use bolding (markdown **) for key skills and achievements. INTEGRATE the candidate's phone number and links naturally into the signature or header. DO NOT use placeholders like "[Phone]" or "[Link]" - use the actual data provided.`;
            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
            if (response.text) {
                setCoverLetter(response.text);
            }
            setActiveTab('cover');
        } catch (e: any) {
            console.error("Cover letter failed:", e);
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
                const scale = 0.264583; // px to mm conversion (approx 96 DPI)

                // Content settings matching doc.html config
                const pageHeight = 297;
                const marginTop = 10;
                const marginBottom = 15;
                const contentHeight = pageHeight - marginTop - marginBottom;

                links.forEach((link) => {
                    const rect = link.getBoundingClientRect();
                    const url = link.getAttribute('href');
                    if (!url) return;

                    // Calculate position relative to the container
                    const relTop = rect.top - containerRect.top;
                    const relLeft = rect.left - containerRect.left;

                    // Convert to mm
                    // x position: starts at left margin (0) in doc.html setup below, plus relative left
                    const x = relLeft * scale;

                    // y position: relative top * scale
                    const yTotal = relTop * scale;

                    // Determine page number (1-based)
                    // This creates a rough estimate. For complex layouts with 'avoid-break', exact sync is hard,
                    // but for header links (most common), they are safely on Page 1.
                    let page = 1 + Math.floor(yTotal / contentHeight);

                    // Calculate y position on that specific page
                    // We must add marginTop because doc.html starts rendering content at y=marginTop
                    const yOnPage = (yTotal % contentHeight) + marginTop;

                    const w = rect.width * scale;
                    const h = rect.height * scale;

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
                    className="flex items-center gap-3 cursor-pointer select-none"
                    onDoubleClick={() => setShowLoginModal(true)}
                    title="Double click for admin login"
                >
                    <div className={`bg-slate-900 p-2 rounded-xl text-white shadow-xl rotate-3 transition-colors ${localStorage.getItem('is_admin') ? 'bg-indigo-600' : ''}`}>
                        <Zap size={20} className="text-yellow-400" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black tracking-widest uppercase">LaTeX Architect <span className="text-blue-600">AI</span></h1>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                            {localStorage.getItem('is_admin') === 'true' ? 'Premium Unlocked' : 'Professional ATS Engine'}
                        </p>
                    </div>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    {[{ id: 'editor', icon: PenTool, label: 'Editor' }, { id: 'preview', icon: Eye, label: 'Preview' }, { id: 'cover', icon: Mail, label: 'Cover' }].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={handleManualKeySelection} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Select API Key Manually">
                        <Key size={18} />
                    </button>
                    <button onClick={downloadPDF} disabled={loading} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50">
                        {loading ? <div className="animate-spin h-3 w-3 border-2 border-white/20 border-t-white rounded-full" /> : <Download size={16} />}
                        {loading ? 'Processing' : 'Download PDF'}
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
                            </div>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste Job Description here... Gemini will tailor sections and generate 3-4 professional projects to match."
                                className="w-full h-40 bg-white/10 border border-white/20 rounded-2xl p-5 text-sm placeholder:text-white/40 outline-none focus:bg-white/20 transition-all mb-4 shadow-inner"
                            />
                            <div className="flex gap-4">
                                <button onClick={handleOptimizeATS} disabled={loading} className="flex-1 py-4 bg-white text-blue-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl disabled:opacity-50">
                                    {loading ? "Engineering..." : "Auto-Tailor Content"}
                                </button>
                                <button onClick={handleGenerateCoverLetter} disabled={loading} className="px-8 py-4 bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-400 transition-all shadow-xl disabled:opacity-50">
                                    {loading ? "Writing..." : "Generate Cover Email"}
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
                                        <div className="flex-1 bg-white border border-slate-200 rounded-xl flex items-center px-3"><LinkIcon size={14} className="text-slate-300 mr-2" /><input className="w-full text-xs py-2 bg-transparent outline-none" value={link.url} placeholder="linkedin.com/in/user" onChange={e => updateItem('links', link.id, { url: e.target.value })} /></div>
                                        <button onClick={() => setData({ ...data, links: data.links.filter(l => l.id !== link.id) })} className="text-rose-400 p-2 hover:bg-rose-50 rounded-lg"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        {data.sections?.map((section, index) => {
                            const sectionProps = {
                                key: section.id,
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
                                        <SectionCard {...sectionProps} icon={MessageSquare}>
                                            <InputField isTextArea label="Profile Objective" value={data.summary} onChange={(v: string) => setData({ ...data, summary: v })} />
                                        </SectionCard>
                                    );
                                case 'technicalSkills':
                                    return (
                                        <SectionCard {...sectionProps} icon={Layers} onAdd={() => addItem('technicalSkills', { category: '', skills: '' })}>
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
                                        <SectionCard {...sectionProps} icon={Briefcase} onAdd={() => addItem('experiences', { company: '', position: '', location: '', year: '', highlights: [''] })}>
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
                                        <SectionCard {...sectionProps} icon={Code} onAdd={() => addItem('projects', { title: '', subtitle: '', techStack: '', liveLink: '', highlights: [''] })}>
                                            <div className="space-y-6">
                                                {(data.projects || []).map((proj) => (
                                                    <div key={proj.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl relative space-y-4">
                                                        <button onClick={() => setData({ ...data, projects: data.projects.filter(p => p.id !== proj.id) })} className="absolute top-4 right-4 text-slate-300 hover:text-rose-400"><Trash2 size={16} /></button>
                                                        <InputField label="Project Name" value={proj.title} onChange={(v: string) => updateItem('projects', proj.id, { title: v })} />
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <InputField label="Tech" value={proj.techStack} onChange={(v: string) => updateItem('projects', proj.id, { techStack: v })} />
                                                            <InputField label="Link" value={proj.liveLink} onChange={(v: string) => updateItem('projects', proj.id, { liveLink: v })} />
                                                        </div>
                                                        <InputField isTextArea label="Details" value={proj.highlights?.join('\n')} onChange={(v: string) => updateItem('projects', proj.id, { highlights: v.split('\n') })} />
                                                    </div>
                                                ))}
                                            </div>
                                        </SectionCard>
                                    );
                                case 'freelance':
                                    return (
                                        <SectionCard {...sectionProps} icon={Briefcase} onAdd={() => addItem('freelance', { project: '', role: '', duration: '', highlights: [''] })}>
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
                                case 'education':
                                    return (
                                        <SectionCard {...sectionProps} icon={GraduationCap} onAdd={() => addItem('education', { school: '', degree: '', major: '', year: '', result: '' })}>
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
                                        <SectionCard {...sectionProps} icon={Zap} onAdd={() => addItem('others', { title: '', description: '' })}>
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
                                            const subject = `Application for Role - ${data.fullName}`;
                                            const body = coverLetter.replace(/[*]+/g, ''); // Strip all markdown stars for plain text
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

            <style>{`.break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }`}</style>
        </div>
    );
};
