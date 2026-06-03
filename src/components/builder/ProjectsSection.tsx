import React, { memo } from 'react';
import { Code, Trash2 } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { InputField } from '../ui/InputField';

interface ProjectsSectionProps {
    projects: any[];
    onUpdate: (id: string, updates: any) => void;
    onAdd: () => void;
    onRemove: (id: string) => void;
    sectionProps: any;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = memo(({
    projects,
    onUpdate,
    onAdd,
    onRemove,
    sectionProps
}) => {
    return (
        <SectionCard {...sectionProps} icon={Code} onAdd={onAdd}>
            <div className="space-y-6">
                {(projects || []).map((proj) => (
                    <div key={proj.id} className="p-5 bg-slate-50 border border-slate-200 rounded-lg relative space-y-4 transition-colors hover:border-slate-300">
                        <button
                            onClick={() => onRemove(proj.id)}
                            className="absolute top-3.5 right-3.5 text-slate-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                        <InputField 
                            label="Project Name" 
                            value={proj.title} 
                            onChange={(v: string) => onUpdate(proj.id, { title: v })} 
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputField 
                                label="Tech" 
                                value={proj.techStack} 
                                onChange={(v: string) => onUpdate(proj.id, { techStack: v })} 
                            />
                            <InputField 
                                label="Link URL" 
                                value={proj.liveLink} 
                                onChange={(v: string) => onUpdate(proj.id, { liveLink: v })} 
                            />
                            <InputField 
                                label="Link Label" 
                                value={proj.liveLinkLabel || ''} 
                                placeholder="e.g. Live Demo" 
                                onChange={(v: string) => onUpdate(proj.id, { liveLinkLabel: v })} 
                            />
                        </div>
                        <InputField 
                            isTextArea 
                            label="Details" 
                            value={proj.highlights?.join('\n')} 
                            onChange={(v: string) => onUpdate(proj.id, { highlights: v.split('\n') })} 
                        />
                    </div>
                ))}
            </div>
        </SectionCard>
    );
});
