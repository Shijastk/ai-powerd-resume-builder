import { ResumeData } from '../types/resume';

export const INITIAL_DATA: ResumeData = {
    fullName: "SHIJAS T K",
    email: "shijastk@gmail.com",
    phone: "+91 8943435546",
    location: "India",
    links: [
        { id: '1', url: 'linkedin.com/in/shijas', label: 'LinkedIn' },
        { id: '2', url: 'github.com/shijas', label: 'GitHub' }
    ],
    summary: "Results-oriented Software Engineer with over 2 years of experience building scalable web applications. Expert in full-stack development with a focus on high-performance cloud infrastructure and clean, maintainable code.",
    technicalSkills: [
        { category: "Languages", skills: "JavaScript (ES6+), TypeScript, Python, SQL" },
        { category: "Frameworks", skills: "React, Node.js, Express, Django, AWS" },
        { category: "Tools", skills: "Git, Firebase, MongoDB, JWT, UI/UX Design" }
    ],
    experiences: [
        {
            id: 'e1',
            company: "Bistux Solutions Pvt Ltd",
            position: "Senior UI Developer",
            location: "Remote",
            year: "2023 - Present",
            highlights: [
                "Led the migration of legacy monolith to microservices, improving scalability for 2M+ users.",
                "Converted 25+ design mockups into pixel-perfect responsive interfaces.",
                "Optimized frontend performance reducing load times by 40% using code-splitting."
            ]
        }
    ],
    projects: [
        {
            id: 'p1',
            title: "SkillSwap",
            subtitle: "Gamified Learning Platform",
            techStack: "MERN Stack",
            liveLink: "skillswap.example.com",
            highlights: [
                "Built a peer-to-peer skill exchange platform with real-time chat.",
                "Implemented XP-based leveling and achievement badges."
            ]
        }
    ],
    certifications: [
        { id: 'c1', name: "MERN Full-Stack Developer", issuer: "AdaCode Solutions", year: "2023" }
    ],
    education: [
        {
            id: 'ed1',
            school: "University of Calicut",
            degree: "Bachelor of Arts",
            major: "Sociology",
            year: "2024",
            result: "First Class"
        }
    ],
    freelance: [
        {
            id: 'f1',
            project: "E-Commerce Dashboard",
            role: "Frontend Developer",
            duration: "Nov 2023 - Jan 2024",
            highlights: [
                "Developed a responsive admin dashboard using React and Tailwind CSS.",
                "Integrated REST APIs for real-time sales data visualization."
            ]
        }
    ],
    others: [
        {
            id: 'o1',
            title: "Volunteering",
            description: "Coordinator for TechFest 2023, managing 50+ volunteers."
        }
    ],
    sections: [
        { id: "summary", title: "Professional Summary", isVisible: true },
        { id: "technicalSkills", title: "Technical Skills", isVisible: true },
        { id: "experiences", title: "Experience", isVisible: true },
        { id: "projects", title: "Key Projects", isVisible: true },
        { id: "freelance", title: "Freelance Projects", isVisible: true },
        { id: "education", title: "Education", isVisible: true },
        { id: "others", title: "Others", isVisible: true }
    ]
};
