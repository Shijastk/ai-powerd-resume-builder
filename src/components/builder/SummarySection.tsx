import React, { memo } from 'react';
import { MessageSquare } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { InputField } from '../ui/InputField';

interface SummarySectionProps {
    value: string;
    onChange: (value: string) => void;
    sectionProps: any;
}

export const SummarySection: React.FC<SummarySectionProps> = memo(({
    value,
    onChange,
    sectionProps
}) => {
    return (
        <SectionCard {...sectionProps} icon={MessageSquare}>
            <InputField 
                isTextArea 
                label="Profile Objective" 
                value={value} 
                onChange={onChange} 
            />
        </SectionCard>
    );
});
