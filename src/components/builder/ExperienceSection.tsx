import React, { memo } from 'react';
import { Briefcase, Trash2 } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { InputField } from '../ui/InputField';

interface ExperienceSectionProps {
    experiences: any[];
    onUpdate: (id: string, updates: any) => void;
    onAdd: () => void;
    onRemove: (id: string) => void;
    sectionProps: any;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = memo(({
    experiences,
    onUpdate,
    onAdd,
    onRemove,
    sectionProps
}) => {
    return (
        <SectionCard {...sectionProps} icon={Briefcase} onAdd={onAdd}>
            <div className="space-y-6">
                {(experiences || []).map((exp) => (
                    <div key={exp.id} className="p-5 bg-slate-50 border border-slate-200 rounded-lg relative space-y-4 transition-colors hover:border-slate-300">
                        <button
                            onClick={() => onRemove(exp.id)}
                            className="absolute top-3.5 right-3.5 text-slate-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField 
                                label="Organization" 
                                value={exp.company} 
                                onChange={(v: string) => onUpdate(exp.id, { company: v })} 
                            />
                            <InputField 
                                label="Duration" 
                                value={exp.year} 
                                onChange={(v: string) => onUpdate(exp.id, { year: v })} 
                            />
                            <InputField 
                                label="Role" 
                                value={exp.position} 
                                onChange={(v: string) => onUpdate(exp.id, { position: v })} 
                            />
                            <InputField 
                                label="Location" 
                                value={exp.location} 
                                onChange={(v: string) => onUpdate(exp.id, { location: v })} 
                            />
                        </div>
                        <InputField 
                            isTextArea 
                            label="Bullets" 
                            value={exp.highlights?.join('\n')} 
                            onChange={(v: string) => onUpdate(exp.id, { highlights: v.split('\n') })} 
                        />
                    </div>
                ))}
            </div>
        </SectionCard>
    );
});
