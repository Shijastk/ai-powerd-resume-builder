import React from 'react';

export const InputField = ({ label, value, onChange, placeholder = "", isTextArea = false }: any) => (
    <div className="flex flex-col gap-1.5 w-full">
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.16em]">{label}</label>
        {isTextArea ? (
            <textarea
                value={value}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 hover:border-slate-300 transition-colors min-h-[120px] resize-none placeholder:text-slate-300"
            />
        ) : (
            <input
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 hover:border-slate-300 transition-colors placeholder:text-slate-300"
            />
        )}
    </div>
);
