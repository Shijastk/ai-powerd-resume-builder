import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Zap, ArrowRight, Sparkles, FileText, TrendingUp, CheckCircle2,
    Star, Users, Download, Wand2, PenLine, ShieldCheck
} from 'lucide-react';

export const LandingPage = () => {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Navbar */}
            <nav className="sticky w-full top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 h-16 flex items-center justify-between px-6 lg:px-12">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                        <Zap size={16} className="text-yellow-300 fill-yellow-300" />
                    </div>
                    <span className="font-black text-slate-900 tracking-tight text-lg">LuxeCV</span>
                </div>
                <div className="hidden md:flex items-center gap-9 text-sm font-medium text-slate-500">
                    <button onClick={() => navigate('/builder')} className="hover:text-slate-900 transition-colors">Home</button>
                    <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
                    <a href="#how" className="hover:text-slate-900 transition-colors">How it works</a>
                    <button onClick={() => navigate('/login')} className="hover:text-slate-900 transition-colors">Admin</button>
                </div>
                <button
                    onClick={() => navigate('/builder')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-600/25"
                >
                    Start Free
                </button>
            </nav>

            {/* Hero — fills viewport height minus the 4rem (h-16) navbar */}
            <section className="px-3 sm:px-4 py-4 min-h-[calc(100vh-4rem)] flex">
                <div className="w-full flex">
                    <div className="relative w-full flex flex-col rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-blue-500 overflow-hidden px-6 sm:px-10 lg:px-20 pt-12 pb-0">
                        {/* Decorative shapes */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="absolute -left-10 bottom-0 w-72 h-72 bg-white/5 rounded-3xl rotate-12" />
                            <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
                            <div className="absolute -right-16 bottom-10 w-72 h-72 bg-white/5 rounded-3xl -rotate-6" />
                        </div>

                        {/* Copy — single column, full width */}
                        <div className={`relative z-10 flex-1 flex flex-col justify-center text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                            {/* <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 border border-white/20 rounded-full text-white text-xs font-semibold tracking-wide mb-6 backdrop-blur-sm">
                                <Sparkles size={12} className="fill-yellow-300 text-yellow-300" />
                                <span>AI Resume Builder · v2.0</span>
                            </div> */}
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight mb-5 max-w-4xl mx-auto">
                                Elevate Your Career with LuxeCV
                            </h1>
                            <p className="text-white/80 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-8">
                                Streamline your job search with our intuitive, AI-powered resume platform.
                                Build clean, ATS-optimized resumes that get you noticed and hired.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                                <button
                                    onClick={() => navigate('/builder')}
                                    className="inline-flex items-center gap-2 bg-white text-blue-700 px-7 py-3.5 rounded-full font-bold transition-all active:scale-[0.98] shadow-xl shadow-blue-900/20 hover:bg-blue-50"
                                >
                                    <Wand2 size={18} />
                                    Start now — It's Free
                                </button>
                                <a
                                    href="#how"
                                    className="inline-flex items-center gap-2 text-white/90 hover:text-white px-5 py-3.5 rounded-full font-bold border border-white/25 hover:border-white/50 transition-all"
                                >
                                    See how it works <ArrowRight size={16} />
                                </a>
                            </div>
                        </div>

                        {/* Mockup cards — pinned to the bottom; lower portion spills past the
                            hero edge and is clipped by the card's overflow-hidden */}
                        <div className={`relative z-10 mt-8 -mb-12 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 items-end transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                            {/* Profile strength */}
                            <div className="bg-white rounded-2xl shadow-2xl shadow-blue-900/20 p-5 sm:mb-4">
                                <p className="text-[11px] font-semibold text-slate-400 mb-1">Profile Strength</p>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xl font-black text-slate-900">Strong</span>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+24%</span>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="h-1.5 w-full bg-blue-600 rounded-full" />
                                    <div className="h-1.5 w-2/3 bg-slate-200 rounded-full" />
                                </div>
                            </div>

                            {/* ATS Score — main, taller */}
                            <div className="bg-white rounded-2xl shadow-2xl shadow-blue-900/30 p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="bg-blue-600 p-1.5 rounded-lg">
                                        <TrendingUp size={14} className="text-white" />
                                    </div>
                                    <p className="text-[11px] font-semibold text-slate-500">ATS Overview</p>
                                </div>
                                <p className="text-[10px] text-slate-400 mb-0.5">Match Score</p>
                                <p className="text-3xl font-black text-slate-900 mb-3">94<span className="text-base text-slate-400"> / 100</span></p>
                                <svg viewBox="0 0 200 56" className="w-full h-12" preserveAspectRatio="none">
                                    <polyline
                                        points="0,45 30,38 60,42 90,25 120,30 150,14 180,20 200,8"
                                        fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                    />
                                </svg>
                            </div>

                            {/* AI suggestion */}
                            <div className="bg-white rounded-2xl shadow-2xl shadow-blue-900/20 p-5 sm:mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="bg-blue-100 p-1.5 rounded-lg">
                                        <Sparkles size={12} className="text-blue-600" />
                                    </div>
                                    <p className="text-[11px] font-semibold text-slate-500">AI Suggestion</p>
                                </div>
                                <div className="space-y-1.5 mb-3">
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full" />
                                    <div className="h-1.5 w-4/5 bg-slate-100 rounded-full" />
                                    <div className="h-1.5 w-3/5 bg-slate-100 rounded-full" />
                                </div>
                                <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold">
                                    <CheckCircle2 size={12} /> Applied
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="px-6 lg:px-12 pt-40 sm:pt-36 pb-20">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight max-w-md">
                            Unlock the Power of Your Career Data
                        </h2>
                        <button
                            onClick={() => navigate('/builder')}
                            className="self-start md:self-auto inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-600/25"
                        >
                            Try it Free <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {[
                            { icon: Users, value: '15k+', label: 'Resumes built & counting' },
                            { icon: TrendingUp, value: '92%', label: 'Interview success rate' },
                            { icon: Star, value: '4.9/5.0', label: 'Average user rating' },
                        ].map((stat, i) => (
                            <div key={i} className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50 transition-all">
                                <div className="shrink-0 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                                    <stat.icon size={20} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-slate-900 leading-none mb-1">{stat.value}</p>
                                    <p className="text-xs font-medium text-slate-400">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how" className="px-6 lg:px-12 py-20 bg-slate-50 border-y border-slate-100">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16 max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
                            How LuxeCV Simplifies Your Workflow
                        </h2>
                        <p className="text-slate-400">Three simple steps from a blank page to a polished, recruiter-ready resume.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                        {/* Mockup card */}
                        <div className="relative">
                            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6 max-w-sm mx-auto">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-[11px] text-slate-400">Welcome Back!</p>
                                        <p className="text-2xl font-black text-slate-900">John Carter</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Live Preview</span>
                                </div>
                                <div className="flex gap-2 mb-5 text-[11px] font-semibold">
                                    <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white">Editor</span>
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500">Templates</span>
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500">Export</span>
                                </div>
                                <div className="rounded-xl border border-slate-100 p-4 space-y-2.5">
                                    <div className="h-2.5 w-1/3 bg-slate-800 rounded" />
                                    <div className="h-px w-full bg-slate-100" />
                                    <div className="h-1.5 w-full bg-slate-100 rounded" />
                                    <div className="h-1.5 w-5/6 bg-slate-100 rounded" />
                                    <div className="h-1.5 w-4/6 bg-slate-100 rounded" />
                                    <div className="h-1.5 w-full bg-slate-100 rounded mt-3" />
                                    <div className="h-1.5 w-3/4 bg-slate-100 rounded" />
                                </div>
                            </div>
                            <div className="absolute -z-10 inset-0 bg-blue-600/10 rounded-3xl blur-2xl translate-y-6" />
                        </div>

                        {/* Steps */}
                        <div className="space-y-2">
                            {[
                                { n: '1', icon: PenLine, title: 'Add Your Details', desc: 'Fill in your experience, skills and education — or import an existing resume to get started in seconds.' },
                                { n: '2', icon: Sparkles, title: 'Let AI Polish It', desc: 'Generate compelling summaries and bullet points tailored to your target role with one click.' },
                                { n: '3', icon: Download, title: 'Export & Apply', desc: 'Download a pixel-perfect, ATS-friendly A4 PDF and start landing interviews.' },
                            ].map((step) => (
                                <div key={step.n} className="group flex gap-4 p-5 rounded-2xl hover:bg-white hover:shadow-lg hover:shadow-slate-200/60 transition-all">
                                    <div className="shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black">
                                        {step.n}
                                    </div>
                                    <div>
                                        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-1">
                                            <step.icon size={16} className="text-blue-600" /> {step.title}
                                        </h3>
                                        <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="px-6 lg:px-12 py-24">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16 max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
                            Everything you need to get hired
                        </h2>
                        <p className="text-slate-400">Intelligent, fast, and beautifully designed — a new standard in resume creation.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            { icon: Sparkles, title: 'AI-Powered Writing', desc: 'Let AI generate professional summaries and experience points tailored to your role.' },
                            { icon: ShieldCheck, title: 'ATS Optimized', desc: 'Rigorously tested against tracking systems so your resume reaches human eyes.' },
                            { icon: FileText, title: 'Live Real-time Preview', desc: 'See changes instantly. What you see is exactly what your final PDF will look like.' },
                            { icon: Download, title: 'One-Click PDF Export', desc: 'Download a high-quality, standardized A4 PDF. No watermarks, no hidden fees.' },
                            { icon: TrendingUp, title: 'Smart ATS Scoring', desc: 'Get an instant match score and actionable tips to improve every section.' },
                            { icon: Wand2, title: 'Beautiful Templates', desc: 'Clean, modern, recruiter-approved designs — no generic clutter.' },
                        ].map((f, i) => (
                            <div key={i} className="group p-7 bg-white border border-slate-200 rounded-2xl hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/40 transition-all">
                                <div className="mb-5 inline-flex w-12 h-12 items-center justify-center bg-blue-50 rounded-xl group-hover:bg-blue-600 transition-colors">
                                    <f.icon size={22} className="text-blue-600 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="px-4 sm:px-6 lg:px-12 pb-24">
                <div className="max-w-6xl mx-auto">
                    <div className="relative rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-blue-700 overflow-hidden px-8 py-16 text-center">
                        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                        <div className="relative z-10 max-w-2xl mx-auto">
                            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">Ready to build your dream resume?</h2>
                            <p className="text-white/80 mb-8">Join thousands of professionals landing interviews with LuxeCV. It's free to start.</p>
                            <button
                                onClick={() => navigate('/builder')}
                                className="inline-flex items-center gap-2 bg-white text-blue-700 px-7 py-3.5 rounded-full font-bold transition-all active:scale-[0.98] shadow-xl shadow-blue-900/20 hover:bg-blue-50"
                            >
                                <Wand2 size={18} /> Start Building Free
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-12 px-6 lg:px-12 border-t border-slate-800">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <Zap size={16} className="text-yellow-300 fill-yellow-300" />
                        </div>
                        <span className="text-sm">© 2026 LuxeCV AI. All rights reserved.</span>
                    </div>
                    <div className="flex gap-6 text-sm font-medium">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};
