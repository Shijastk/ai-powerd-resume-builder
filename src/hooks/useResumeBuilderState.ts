import { useState, useCallback } from 'react';
import { ResumeData } from '../types/resume';
import { PUBLIC_DATA, PRIVATE_DATA } from '../data/initialData';

export const useResumeBuilderState = () => {
    const [data, setData] = useState<ResumeData>(() => {
        const isAdmin = localStorage.getItem('is_admin') === 'true';
        return isAdmin ? PRIVATE_DATA : PUBLIC_DATA;
    });

    const [loading, setLoading] = useState(false);
    const [jobDescription, setJobDescription] = useState("");
    const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'cover'>('editor');
    const [atsScore, setAtsScore] = useState<number | null>(null);
    const [coverLetter, setCoverLetter] = useState("");
    
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    }, []);

    const updateItem = useCallback((key: keyof ResumeData, id: string, updates: any) => {
        setData(prev => ({
            ...prev,
            [key]: (prev[key] as any[]).map(item => item.id === id ? { ...item, ...updates } : item)
        }));
    }, []);

    const addItem = useCallback((key: keyof ResumeData, template: any) => {
        const id = Math.random().toString(36).substr(2, 9);
        setData(prev => ({ 
            ...prev, 
            [key]: [{ ...template, id }, ...(prev[key] as any[])] 
        }));
    }, []);

    const removeItem = useCallback((key: keyof ResumeData, id: string) => {
        setData(prev => ({
            ...prev,
            [key]: (prev[key] as any[]).filter(item => item.id !== id)
        }));
    }, []);

    const moveSection = useCallback((index: number, direction: 'up' | 'down') => {
        setData(prev => {
            const newSections = [...prev.sections];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= newSections.length) return prev;
            
            [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
            return { ...prev, sections: newSections };
        });
    }, []);

    const toggleSectionVisibility = useCallback((index: number) => {
        setData(prev => {
            const newSections = [...prev.sections];
            newSections[index] = { ...newSections[index], isVisible: !newSections[index].isVisible };
            return { ...prev, sections: newSections };
        });
    }, []);

    const updateSectionTitle = useCallback((index: number, title: string) => {
        setData(prev => {
            const newSections = [...prev.sections];
            newSections[index] = { ...newSections[index], title };
            return { ...prev, sections: newSections };
        });
    }, []);

    return {
        data,
        setData,
        loading,
        setLoading,
        jobDescription,
        setJobDescription,
        activeTab,
        setActiveTab,
        atsScore,
        setAtsScore,
        coverLetter,
        setCoverLetter,
        toast,
        showToast,
        updateItem,
        addItem,
        removeItem,
        moveSection,
        toggleSectionVisibility,
        updateSectionTitle
    };
};
