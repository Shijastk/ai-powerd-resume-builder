import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles, Wand2 } from 'lucide-react';

export const LandingPage = () => {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 flex items-center justify-between px-6 lg:px-12">
                <div className="flex items-center gap-3">
                    <img src="/favicon.svg" alt="LuxeCV Logo" className="w-8 h-8 drop-shadow-md" />
                    <span className="font-extrabold text-lg text-slate-900 tracking-tight">LuxeCV<span className="text-blue-600">.</span></span>
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                    <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        Admin Login
                    </button>
                    <button
                        onClick={() => navigate('/builder')}
                        className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-900/20"
                    >
                        Launch App
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 lg:px-12 max-w-7xl mx-auto relative">
                {/* Background Gradient Mesh */}
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-40 left-0 -translate-x-12 w-[400px] h-[400px] bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
                    <div className={`transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-bold uppercase tracking-wider mb-6">
                            <Sparkles size={12} />
                            <span>v2.0 Now Available</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-sans font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
                            Craft your perfect resume <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">in minutes.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                            Build professional, ATS-optimized resumes with AI-driven content generation.
                            No generic templates—just clean, modern design that gets you hired.
                        </p>
                    </div>

                    <div className={`flex flex-col md:flex-row items-center justify-center gap-4 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <button
                            onClick={() => navigate('/builder')}
                            className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Wand2 size={20} />
                            Start Building Free
                        </button>
                        <button className="w-full md:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all hover:border-slate-300 flex items-center justify-center gap-2">
                            View Templates
                        </button>
                    </div>

                    {/* Stats / Social Proof */}
                    <div className={`pt-12 flex items-center justify-center gap-8 md:gap-16 text-slate-400 grayscale transition-all duration-1000 delay-500 ${isVisible ? 'opacity-50' : 'opacity-0'}`}>
                        {/* Placeholder logos/stats */}
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-black text-slate-900">15k+</span>
                            <span className="text-xs font-bold uppercase tracking-widest">Resumes Built</span>
                        </div>
                        <div className="w-px h-10 bg-slate-200"></div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-black text-slate-900">92%</span>
                            <span className="text-xs font-bold uppercase tracking-widest">Success Rate</span>
                        </div>
                        <div className="w-px h-10 bg-slate-200"></div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-black text-slate-900">ATS</span>
                            <span className="text-xs font-bold uppercase tracking-widest">Optimized</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Showcase Grid (No Icon Cards) */}
            <section id="features" className="py-24 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Why LuxeCV?</h2>
                        <p className="text-slate-500 max-w-xl mx-auto">Experience a new standard in document creation. Intelligent, fast, and beautifully designed.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="group p-8 bg-slate-50 rounded-[2rem] hover:bg-slate-100 transition-colors cursor-default border border-transparent hover:border-slate-200">
                            <div className="mb-6 inline-flex p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <Sparkles className="text-blue-600" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">AI-Powered Writing</h3>
                            <p className="text-slate-500 leading-relaxed text-sm">
                                Struggle with words? Let Gemini AI generate compelling professional summaries and experience points tailored to your role.
                            </p>
                            <div className="mt-6 flex items-center gap-2 text-blue-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform duration-300">
                                <span>Try it out</span> <ArrowRight size={14} />
                            </div>
                        </div>

                        {/* Feature 2 (Span 2 cols on lg) */}
                        <div className="group p-8 bg-slate-900 text-white rounded-[2rem] lg:col-span-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center h-full">
                                <div className="flex-1 space-y-4">
                                    <div className="inline-flex px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-blue-200 border border-white/10">ATS Friendly</div>
                                    <h3 className="text-2xl font-bold">Beat the Robots</h3>
                                    <p className="text-slate-300 leading-relaxed">
                                        Our templates are rigorously tested against Applicant Tracking Systems to ensure your resume never gets filtered out before a human sees it.
                                    </p>
                                </div>
                                <div className="flex-1 w-full bg-white/10 rounded-xl p-6 border border-white/10 backdrop-blur-sm">
                                    <div className="space-y-3 opacity-60">
                                        <div className="h-2 w-3/4 bg-white/50 rounded-full"></div>
                                        <div className="h-2 w-1/2 bg-white/30 rounded-full"></div>
                                        <div className="h-2 w-2/3 bg-white/30 rounded-full"></div>
                                    </div>
                                    <div className="mt-6 flex gap-3 text-emerald-400 text-xs font-bold items-center">
                                        <CheckCircle2 size={16} /> <span>Scorable & Parsable</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="group p-8 bg-blue-50 rounded-[2rem] border border-blue-100 hover:shadow-lg hover:shadow-blue-100/50 transition-all">
                            <div className="h-full flex flex-col">
                                <h3 className="text-xl font-bold text-blue-900 mb-3">Live Real-time Preview</h3>
                                <p className="text-blue-700/70 leading-relaxed text-sm flex-1">
                                    See your changes instantly. No more guessing how the final PDF will look. What you see is exactly what you get.
                                </p>
                                <div className="mt-6 bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                                    <div className="flex gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                    </div>
                                    <div className="h-12 bg-slate-50 rounded w-full"></div>
                                </div>
                            </div>
                        </div>

                        {/* Feature 4 */}
                        <div className="group p-8 bg-slate-50 rounded-[2rem] hover:bg-slate-100 transition-colors cursor-default border border-transparent hover:border-slate-200 lg:col-span-2">
                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">One-Click PDF Export</h3>
                                    <p className="text-slate-500 leading-relaxed text-sm mb-6">
                                        Download a high-quality, standardized A4 PDF ready for application. No watermarks, no hidden fees.
                                    </p>
                                    <button onClick={() => navigate('/builder')} className="text-slate-900 font-bold border-b-2 border-slate-900 hover:text-blue-600 hover:border-blue-600 transition-colors pb-0.5">Start Writing Now</button>
                                </div>
                                <div className="flex-1 flex justify-center">
                                    <div className="w-48 h-64 bg-white shadow-xl rounded-lg border border-slate-100 rotate-3 group-hover:rotate-6 transition-transform duration-500 p-4 space-y-2">
                                        <div className="h-2 w-1/3 bg-slate-200 rounded"></div>
                                        <div className="h-px w-full bg-slate-100 my-2"></div>
                                        <div className="space-y-1">
                                            <div className="h-1 w-full bg-slate-100 rounded"></div>
                                            <div className="h-1 w-5/6 bg-slate-100 rounded"></div>
                                            <div className="h-1 w-4/6 bg-slate-100 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-12 px-6 lg:px-12 border-t border-slate-800">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-sm">
                        © 2026 LuxeCV AI. All rights reserved.
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
