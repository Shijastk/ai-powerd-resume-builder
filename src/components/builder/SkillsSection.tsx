import React, { memo } from 'react';
import { Layers, X } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { InputField } from '../ui/InputField';

interface SkillsSectionProps {
    skills: { category: string; skills: string }[];
    onUpdate: (index: number, updates: any) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
    sectionProps: any;
}

export const SkillsSection: React.FC<SkillsSectionProps> = memo(({
    skills,
    onUpdate,
    onAdd,
    onRemove,
    sectionProps
}) => {
    return (
        <SectionCard {...sectionProps} icon={Layers} onAdd={onAdd}>
            <div className="space-y-4">
                {(skills || []).map((s, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg relative transition-colors hover:border-slate-300">
                        <button
                            onClick={() => onRemove(idx)}
                            className="absolute top-2.5 right-2.5 text-slate-300 hover:text-red-500 transition-colors"
                        >
                            <X size={14} />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField 
                                label="Category" 
                                value={s.category} 
                                onChange={(v: string) => onUpdate(idx, { category: v })} 
                            />
                            <InputField 
                                label="Skills" 
                                value={s.skills} 
                                onChange={(v: string) => onUpdate(idx, { skills: v })} 
                            />
                        </div>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
});
