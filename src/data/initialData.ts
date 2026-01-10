import { ResumeData } from '../types/resume';

export const INITIAL_DATA: ResumeData = {
    fullName: "SHIJAS T K",
    email: "shijasmuhammed573@gmail.com",
    phone: "+91 8943435546",
    location: "India",

    links: [
        {
            id: '1',
            url: 'https://www.linkedin.com/in/shijas-tk',
            label: 'LinkedIn'
        },
        {
            id: '2',
            url: 'https://github.com/Shijastk',
            label: 'GitHub'
        },
        {
            id: '3',
            url: 'https://shijasresume2025.vercel.app/',
            label: 'Portfolio'
        }
    ],

    summary:
        "Frontend-focused Full-Stack Developer with 2+ years of hands-on experience building scalable, real-world web applications using React, TypeScript, and modern UI frameworks. Strong experience in AI-powered platforms, resume automation, real-time systems, and event management solutions. Passionate about clean architecture, performance optimization, and user-centric design.",

    technicalSkills: [
        {
            category: "Languages",
            skills: "JavaScript (ES6+), TypeScript, HTML5, CSS3, SQL"
        },
        {
            category: "Frontend",
            skills: "React.js, Vite, Tailwind CSS, Material UI (MUI), Bootstrap"
        },
        {
            category: "Backend & APIs",
            skills: "Node.js, Express.js, REST APIs, Firebase"
        },
        {
            category: "State & Tools",
            skills: "Redux Toolkit, Git, GitLab, JWT, Axios"
        },
        {
            category: "Other",
            skills: "AI Integration (Gemini), Resume Automation, PDF Generation, UI/UX Implementation"
        }
    ],

    experiences: [
        {
            id: 'e1',
            company: "Bistux Solutions Pvt Ltd",
            position: "Frontend Developer",
            location: "Remote",
            year: "2024 - 2025",
            highlights: [
                "Developed and maintained scalable React applications using TypeScript and Material UI.",
                "Worked with Redux Toolkit and REST APIs to manage complex application state.",
                "Collaborated with backend teams to integrate secure authentication and real-time features.",
                "Improved UI performance and code maintainability through component optimization."
            ]
        }
    ],

    projects: [
        {
            id: 'p1',
            title: "AI-Powered Resume & Cover Email Builder",
            subtitle: "Smart Resume Automation Platform",
            techStack: "React, TypeScript, Gemini AI, Tailwind CSS",
            liveLink: "https://ai-powerd-resume-builder.vercel.app/",
            highlights: [
                "AI-generated resumes and cover emails based on job descriptions.",
                "Full customization of sections, content, and ordering.",
                "Direct email sending feature for job applications.",
                "ATS-friendly resume layout with real-time preview and export."
            ]
        },
        {
            id: 'p2',
            title: "SkillSwap",
            subtitle: "Skill Exchange & Learning Platform",
            techStack: "MERN Stack, Socket.io",
            liveLink: "https://skillsync-frontend-theta.vercel.app/",
            highlights: [
                "Built a peer-to-peer skill exchange platform with real-time chat.",
                "Implemented skill matching, profile management, and learning requests.",
                "Designed a scalable frontend architecture using React and Tailwind CSS."
            ]
        },
        {
            id: 'p3',
            title: "Intensia Arts Fest Management Platform",
            subtitle: "College-Level Event Management System",
            techStack: "React, Firebase, Tailwind CSS",
            liveLink: "https://intensia-arts-fest.vercel.app/",
            highlights: [
                "Developed a complete arts fest management system for event coordination.",
                "Real-time score entry, result publishing, and team-wise ranking.",
                "Admin dashboard for data entry and live result preview.",
                "Optimized for mobile and large-screen displays."
            ]
        }
    ],

    certifications: [
        {
            id: 'c1',
            name: "Full-Stack Development (React Focused)",
            issuer: "AdaCode Solutions",
            year: "2024"
        }
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
            id: 'f2',
            project: "Ice Cream Brand Website",
            role: "Frontend Developer",
            duration: "2025",
            highlights: [
                "Built a modern promotional website for an ice cream brand.",
                "Implemented product showcase sections with clean UI and smooth navigation."
            ]
        },
        {
            id: 'f3',
            project: "EZFresh Traders – Business Management Software",
            role: "Frontend Developer",
            duration: "2025",
            highlights: [
                "Developed a web-based software solution for trader operations and data management.",
                "Integrated dashboards and forms for daily business workflow."
            ]
        }
    ],
    others: [],

    sections: [
        { id: "summary", title: "Professional Summary", isVisible: true },
        { id: "technicalSkills", title: "Technical Skills", isVisible: true },
        { id: "projects", title: "Projects", isVisible: true },
        { id: "experiences", title: "Experience", isVisible: true },
        { id: "freelance", title: "Freelance Work", isVisible: true },
        { id: "education", title: "Education", isVisible: true },
    ]
};
