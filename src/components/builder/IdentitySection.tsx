import React, { memo } from 'react';
import { User, Link as LinkIcon, Trash2 } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { InputField } from '../ui/InputField';
import { ResumeData } from '../../types/resume';

interface IdentitySectionProps {
    data: ResumeData;
    onUpdateField: (field: keyof ResumeData, value: any) => void;
    onAddLink: () => void;
    onUpdateLink: (id: string, updates: any) => void;
    onRemoveLink: (id: string) => void;
}

export const IdentitySection: React.FC<IdentitySectionProps> = memo(({
    data,
    onUpdateField,
    onAddLink,
    onUpdateLink,
    onRemoveLink
}) => {
    return (
        <SectionCard title="Identity" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField 
                    label="Full Name" 
                    value={data.fullName} 
                    onChange={(v: string) => onUpdateField('fullName', v)} 
                />
                <InputField 
                    label="Location" 
                    value={data.location} 
                    onChange={(v: string) => onUpdateField('location', v)} 
                />
                <InputField 
                    label="Email" 
                    value={data.email} 
                    onChange={(v: string) => onUpdateField('email', v)} 
                />
                <InputField 
                    label="Phone" 
                    value={data.phone} 
                    onChange={(v: string) => onUpdateField('phone', v)} 
                />
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.16em]">Links</span>
                    <button
                        onClick={onAddLink}
                        className="text-blue-600 text-[10px] font-semibold uppercase tracking-wide hover:text-blue-700 hover:underline underline-offset-2 transition-colors"
                    >
                        + Add Link
                    </button>
                </div>
                {(data.links || []).map(link => (
                    <div key={link.id} className="flex gap-2 mb-2 items-center">
                        <div className="flex-[2] bg-white border border-slate-200 rounded-lg flex items-center px-3 focus-within:border-blue-500 hover:border-slate-300 transition-colors">
                            <LinkIcon size={14} className="text-slate-300 mr-2 shrink-0" />
                            <input
                                className="w-full text-xs py-2.5 bg-transparent outline-none placeholder:text-slate-300"
                                value={link.url}
                                placeholder="https://..."
                                onChange={e => onUpdateLink(link.id, { url: e.target.value })}
                            />
                        </div>
                        <div className="flex-1 bg-white border border-slate-200 rounded-lg flex items-center px-3 focus-within:border-blue-500 hover:border-slate-300 transition-colors">
                            <input
                                className="w-full text-xs py-2.5 bg-transparent outline-none placeholder:text-slate-300"
                                value={link.label}
                                placeholder="Label"
                                onChange={e => onUpdateLink(link.id, { label: e.target.value })}
                            />
                        </div>
                        <button
                            onClick={() => onRemoveLink(link.id)}
                            className="text-slate-300 p-2 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
});
