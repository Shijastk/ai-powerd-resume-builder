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
        <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-[100] font-sans">
            <div className="bg-white p-12 rounded-[2rem] shadow-2xl flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500 max-w-sm w-full mx-4 border border-slate-100">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                    <div className="bg-gradient-to-tr from-slate-900 to-slate-800 p-5 rounded-2xl shadow-xl relative transform transition-transform hover:scale-105 duration-300">
                        <Sparkles size={40} className="text-yellow-400 animate-pulse" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-blue-600 p-1.5 rounded-lg border-4 border-white shadow-lg">
                        <Loader2 size={16} className="text-white animate-spin" />
                    </div>
                </div>

                <div className="text-center space-y-2 w-full">
                    <h2 className="text-xl font-black tracking-widest uppercase text-slate-900">LuxeCV AI</h2>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${Math.min(100, progress)}%` }}
                        />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase pt-2 animate-fade-in transition-opacity duration-300 min-h-[15px]">
                        {quotes[quoteIndex]}
                    </p>
                </div>
            </div>

            <div className="absolute bottom-8 text-slate-400 text-[10px] font-medium tracking-wider uppercase opacity-50">
                Powered by Gemini 1.5 Pro
            </div>
        </div>
    );
};
