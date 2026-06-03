import React, { memo } from 'react';
import { Sparkles, Wand2 } from 'lucide-react';
import { ScoringResult } from '../../utils/atsScorer';

interface ATSEngineProps {
    jobDescription: string;
    onJDChange: (value: string) => void;
    onOptimize: () => void;
    onCalculateScore: () => void;
    onApplyFixes: () => void;
    onGenerateCoverLetter: () => void;
    loading: boolean;
    atsScore: number | null;
    atsBreakdown: ScoringResult | null;
    atsFeedback: string;
}

export const ATSEngine: React.FC<ATSEngineProps> = memo(({
    jobDescription,
    onJDChange,
    onOptimize,
    onCalculateScore,
    onApplyFixes,
    onGenerateCoverLetter,
    loading,
    atsScore,
    atsBreakdown,
    atsFeedback
}) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="h-[3px] bg-blue-600 w-full" />
                <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-slate-200 bg-slate-50/70">
                    <span className="grid place-items-center w-7 h-7 rounded-lg bg-blue-600 text-white shrink-0">
                        <Sparkles size={15} />
                    </span>
                    <div className="min-w-0">
                        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-800 leading-tight">ATS Alignment Engine</h3>
                        <p className="text-[10px] text-slate-400 leading-tight">Tailor your resume to the job description</p>
                    </div>
                    {atsScore !== null && (
                        <div className="ml-auto flex items-baseline gap-1 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                            <span className="text-sm font-bold text-blue-700 leading-none">{atsScore}</span>
                            <span className="text-[10px] font-semibold text-blue-500">%</span>
                        </div>
                    )}
                </div>
                <div className="p-4">
                    <textarea
                        value={jobDescription}
                        onChange={(e) => onJDChange(e.target.value)}
                        placeholder="Paste the job description here — the AI extracts ATS keywords and optimizes your Skills, Summary, Projects, Experience and Cover Letter. Aim for 95%+."
                        className="w-full h-36 bg-white border border-slate-200 rounded-lg p-3.5 text-sm text-slate-900 placeholder:text-slate-300 outline-none focus:border-blue-500 hover:border-slate-300 transition-colors mb-3 resize-none leading-relaxed"
                    />
                    <button
                        onClick={onOptimize}
                        disabled={loading}
                        className="w-full py-3 mb-2.5 bg-blue-600 text-white rounded-lg text-[11px] font-semibold uppercase tracking-[0.14em] hover:bg-blue-700 transition-colors disabled:opacity-40"
                    >
                        {loading ? "Optimizing…" : "Optimize Resume"}
                    </button>
                    <div className="grid grid-cols-2 gap-2.5">
                        <button
                            onClick={onCalculateScore}
                            disabled={loading}
                            className="py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-[11px] font-semibold uppercase tracking-[0.12em] hover:border-slate-900 hover:text-slate-900 transition-colors disabled:opacity-40"
                        >
                            {loading ? "Analyzing…" : "Score"}
                        </button>
                        <button
                            onClick={onGenerateCoverLetter}
                            disabled={loading}
                            className="py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-[11px] font-semibold uppercase tracking-[0.12em] hover:border-slate-900 hover:text-slate-900 transition-colors disabled:opacity-40"
                        >
                            {loading ? "Writing…" : "Cover Letter"}
                        </button>
                    </div>
                </div>
            </div>

            {atsBreakdown && (
                <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <h4 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 mb-5">
                            AI Score Breakdown
                        </h4>
                        <div className="space-y-4">
                            <ScoreBar label="JD Keyword Match" score={atsBreakdown.breakdown.keywords} max={50} />
                            <ScoreBar label="Section Completeness" score={atsBreakdown.breakdown.sections} max={20} />
                            <ScoreBar label="Experience Relevance" score={atsBreakdown.breakdown.relevance} max={20} />
                            <ScoreBar label="ATS Safety Checks" score={atsBreakdown.breakdown.safety} max={10} />
                        </div>

                        {atsBreakdown.warnings.length > 0 && (
                            <div className="mt-6 pt-5 border-t border-slate-200">
                                <h5 className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400 mb-3">Critical Warnings</h5>
                                <ul className="space-y-2">
                                    {atsBreakdown.warnings.map((w, i) => (
                                        <li key={i} className="text-[11px] text-slate-600 flex gap-2 items-start">
                                            <span className="mt-0.5 text-amber-500">•</span> {w}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                        <h4 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600 mb-4">
                            AI Recruiter Analysis
                        </h4>
                        <div className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-y-auto pr-1">
                            {atsFeedback || "Analyze your resume to get AI-powered, recruiter-grade improvement suggestions based on the job description."}
                        </div>

                        {atsFeedback && atsFeedback.length > 50 && (
                            <button
                                onClick={onApplyFixes}
                                disabled={loading}
                                className="mt-5 w-full py-3 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold uppercase tracking-[0.14em] flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-40"
                            >
                                <Wand2 size={14} />
                                {loading ? "Regenerating…" : "Apply Fixes & Regenerate Resume"}
                            </button>
                        )}
                        <p className="mt-2 text-[10px] text-slate-400 text-center leading-snug">
                            Rebuilds your resume with all the fixes &amp; missing keywords above for a 100%-ATS, interview-ready result.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
});

const ScoreBar = ({ label, score, max }: { label: string, score: number, max: number }) => (
    <div className="space-y-1.5">
        <div className="flex justify-between items-end">
            <span className="text-[11px] font-medium text-slate-700">{label}</span>
            <span className="text-[10px] font-mono text-slate-400">{score}/{max}</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
                className="h-full bg-blue-600 rounded-full transition-all duration-700"
                style={{ width: `${(score / max) * 100}%` }}
            />
        </div>
    </div>
);
