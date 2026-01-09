export interface SectionConfig {
    id: string;
    title: string;
    isVisible: boolean;
}

export interface ResumeData {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    links: { id: string; url: string; label: string }[];
    summary: string;
    technicalSkills: { category: string; skills: string }[];
    experiences: { id: string; company: string; position: string; location: string; year: string; highlights: string[] }[];
    projects: { id: string; title: string; subtitle: string; techStack: string; liveLink: string; highlights: string[] }[];
    certifications: { id: string; name: string; issuer: string; year: string }[];
    education: { id: string; school: string; degree: string; major: string; year: string; result: string }[];
    freelance: { id: string; project: string; role: string; duration: string; highlights: string[] }[];
    others: { id: string; title: string; description: string }[];
    sections: SectionConfig[];
}
