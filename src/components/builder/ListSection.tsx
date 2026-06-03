import React, { memo } from 'react';
import { GraduationCap, Trash2, X, Zap } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { InputField } from '../ui/InputField';

interface ListSectionProps {
    type: 'education' | 'certifications' | 'others' | 'freelance';
    items: any[];
    onUpdate: (id: string, updates: any) => void;
    onAdd: () => void;
    onRemove: (id: string) => void;
    sectionProps: any;
}

export const ListSection: React.FC<ListSectionProps> = memo(({
    type,
    items,
    onUpdate,
    onAdd,
    onRemove,
    sectionProps
}) => {
    const getIcon = () => {
        switch (type) {
            case 'education':
            case 'certifications': return GraduationCap;
            case 'others': return Zap;
            default: return GraduationCap;
        }
    };

    const renderItemFields = (item: any) => {
        switch (type) {
            case 'education':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Institution" value={item.school} onChange={(v: string) => onUpdate(item.id, { school: v })} />
                        <InputField label="Duration" value={item.year} onChange={(v: string) => onUpdate(item.id, { year: v })} />
                        <InputField label="Degree" value={item.degree} onChange={(v: string) => onUpdate(item.id, { degree: v })} />
                        <InputField label="Field of Study" value={item.major} onChange={(v: string) => onUpdate(item.id, { major: v })} />
                        <InputField label="Grade/Result" value={item.result} onChange={(v: string) => onUpdate(item.id, { result: v })} />
                    </div>
                );
            case 'certifications':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Name" value={item.name} onChange={(v: string) => onUpdate(item.id, { name: v })} />
                        <InputField label="Issuer" value={item.issuer} onChange={(v: string) => onUpdate(item.id, { issuer: v })} />
                        <InputField label="Year" value={item.year} onChange={(v: string) => onUpdate(item.id, { year: v })} />
                    </div>
                );
            case 'freelance':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Project/Client" value={item.project} onChange={(v: string) => onUpdate(item.id, { project: v })} />
                            <InputField label="Duration" value={item.duration} onChange={(v: string) => onUpdate(item.id, { duration: v })} />
                        </div>
                        <InputField label="Role" value={item.role} onChange={(v: string) => onUpdate(item.id, { role: v })} />
                        <InputField isTextArea label="Details" value={item.highlights?.join('\n')} onChange={(v: string) => onUpdate(item.id, { highlights: v.split('\n') })} />
                    </div>
                );
            case 'others':
                return (
                    <div className="space-y-4">
                        <InputField label="Title" placeholder="e.g. Volunteering" value={item.title} onChange={(v: string) => onUpdate(item.id, { title: v })} />
                        <InputField isTextArea label="Description" value={item.description} onChange={(v: string) => onUpdate(item.id, { description: v })} />
                    </div>
                );
            default: return null;
        }
    };

    return (
        <SectionCard {...sectionProps} icon={getIcon()} onAdd={onAdd}>
            <div className="space-y-6">
                {(items || []).map((item) => (
                    <div key={item.id} className="p-5 bg-slate-50 border border-slate-200 rounded-lg relative space-y-4 transition-colors hover:border-slate-300">
                        <button
                            onClick={() => onRemove(item.id)}
                            className="absolute top-3.5 right-3.5 text-slate-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                        {renderItemFields(item)}
                    </div>
                ))}
            </div>
        </SectionCard>
    );
});
