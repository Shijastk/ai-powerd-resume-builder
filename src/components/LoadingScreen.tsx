import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

const quotes = [
    "Crafting your professional story...",
    "Aligning with ATS algorithms...",
    "Polishing your achievements...",
    "Designing for impact...",
    "Optimizing for success..."
];

export const LoadingScreen = () => {
    const [progress, setProgress] = useState(0);
    const [quoteIndex, setQuoteIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) return 100;
                return prev + Math.random() * 5;
            });
        }, 100);

        const quoteInterval = setInterval(() => {
            setQuoteIndex(prev => (prev + 1) % quotes.length);
        }, 800);

        return () => {
            clearInterval(interval);
            clearInterval(quoteInterval);
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center z-[100] font-sans text-white">
            <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
                <div className="relative group">
                    <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-30 rounded-full group-hover:opacity-50 transition-opacity duration-500 animate-pulse"></div>
                    <img src="/favicon.svg" alt="LuxeCV Logo" className="w-24 h-24 drop-shadow-2xl relative z-10" />
                </div>

                <div className="text-center space-y-6 max-w-xs w-full">
                    <h2 className="text-3xl font-black tracking-[0.2em] uppercase drop-shadow-lg">
                        LuxeCV<span className="text-blue-400">.</span>
                    </h2>

                    <div className="space-y-3">
                        <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                style={{ width: `${Math.min(100, progress)}%` }}
                            />
                        </div>
                        <p className="text-[10px] font-bold text-blue-200/60 uppercase tracking-widest animate-pulse">
                            {quotes[quoteIndex]}
                        </p>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-10 flex flex-col items-center gap-2 opacity-50">
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-blue-200">
                    <Sparkles size={12} className="text-blue-400" />
                    <span>Powered by Gemini 1.5 Pro</span>
                </div>
            </div>
        </div>
    );
};
