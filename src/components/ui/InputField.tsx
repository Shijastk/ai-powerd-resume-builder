import React from 'react';

export const InputField = ({ label, value, onChange, placeholder = "", isTextArea = false }: any) => (
    <div className="flex flex-col gap-1 w-full">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>
        {isTextArea ? (
            <textarea
                value={value}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                className="w-full px-4 py-3 bg-white text-black border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm min-h-[120px] resize-none"
            />
        ) : (
            <input
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                className="w-full px-4 py-3 bg-white text-black border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
        )}
    </div>
);
