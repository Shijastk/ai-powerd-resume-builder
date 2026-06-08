import { ResumeData } from '../types/resume';

export const PRIVATE_DATA: ResumeData = {
    fullName: "Shijas T K",
    email: "shijasmuhammed573@gmail.com",
    phone: "+91 8943435546",
    location: "Kerala, India",

    links: [
        { id: '1', url: 'https://www.linkedin.com/in/shijas-tk/', label: 'LinkedIn' },
        { id: '2', url: 'https://github.com/Shijastk', label: 'GitHub' },
        { id: '3', url: 'https://www.shijastk.in/', label: 'Portfolio' }
    ],

    summary: "Results-driven Frontend Engineer with over 3 years of professional experience designing, developing, and optimizing scalable SaaS platforms, enterprise UI systems, and high-traffic applications. Expert across React, Next.js, and TypeScript, with a proven track record of architecting modular codebases using Feature-Sliced Design (FSD). Adept at scaling design systems with Tailwind CSS, Material UI (MUI), and Bootstrap, backed by full-stack MERN engineering and automated CI/CD pipelines across GitHub and GitLab.",

    technicalSkills: [
        { category: "Languages", skills: "JavaScript (ES6+), TypeScript, HTML5, CSS3" },
        { category: "Frontend", skills: "React.js, Next.js" },
        { category: "Styling", skills: "Tailwind CSS, Material UI (MUI), Bootstrap, Sass / SCSS, CSS Modules, Framer Motion" },
        { category: "Architecture", skills: "Feature-Sliced Design (FSD), Reusable Component Design, Redux Toolkit, Context API" },
        { category: "Backend & APIs", skills: "Node.js, Express.js, MongoDB, RESTful APIs, WebSockets" },
        { category: "Version Control & DevOps", skills: "GitHub, GitLab, CI/CD Pipelines, Vercel, Core Web Vitals Optimization" }
    ],

    experiences: [
        {
            id: 'e1', company: "Latelogic", position: "Frontend Engineer", location: "Remote", year: "Jan 2026 - Present",
            highlights: [
                "Architect modular, ultra-scalable client-side systems using Feature-Sliced Design (FSD) layers (App, Processes, Pages, Widgets, Features, Entities, Shared) to enforce clean decoupling of code.",
                "Design and scale high-performance enterprise dashboard products built entirely with Tailwind CSS, establishing custom utility classes and design tokens for uniform styling.",
                "Manage source control, code reviews, and enterprise release tagging within an agile GitLab workflow, integrating automated performance checks on merge requests.",
                "Optimize critical client-side rendering bottlenecks and Core Web Vitals to maximize loading speeds across heavy data-rich layouts."
            ]
        },
        {
            id: 'e2', company: "Bistux Solutions", position: "Frontend Developer / Engineer", location: "Remote", year: "Jun 2023 - Aug 2025",
            highlights: [
                "Contributed as a core frontend developer on 'Ainvox', an enterprise-grade cloud telephony SaaS platform built entirely on Material UI (MUI), customizing complex themes, tokens, and dense data-grid layouts.",
                "Built and maintained responsive UI modules leveraging specialized layouts, components, and real-time mapping state integrations.",
                "Collaborated on GitHub-centric team workflows, maintaining precise branching models, issue tracking, and automated deployment checks."
            ]
        }
    ],

    projects: [
        {
            id: 'p1', title: "Ainvox", subtitle: "Enterprise Cloud Telephony SaaS Dashboard", techStack: "React.js, TypeScript, Material UI (MUI), Redux Toolkit, WebSockets", liveLink: "https://ainvox.com/", liveLinkLabel: "Live Site",
            highlights: [
                "Engineered the platform UI completely using Material UI (MUI), building a custom nested theme engine that instantly adapts to high-density operational viewports.",
                "Overrode default MUI components to map complex real-time active call state streams seamlessly via WebSockets without triggering erratic layout re-renders.",
                "Designed a custom, reusable Data-Grid with server-side processing for parsing millions of call-log index rows."
            ]
        },
        {
            id: 'p2', title: "SkillSync", subtitle: "Peer-to-Peer Skill Marketplace Platform", techStack: "React.js, TypeScript, Tailwind CSS, Redux Toolkit, RESTful APIs", liveLink: "https://skillsync-frontend-theta.vercel.app/", liveLinkLabel: "Live Demo",
            highlights: [
                "Architected the frontend repository using modular, component-driven principles to guarantee high maintainability.",
                "Leveraged Tailwind CSS utility compositions to construct highly responsive profile cards and discovery feeds, reducing overall production CSS asset size.",
                "Integrated global application state with Redux Toolkit to track profile availability dates, filter selections, and listing states."
            ]
        },
        {
            id: 'p3', title: "AI-Powered Resume Builder", subtitle: "Dynamic Content Parsing Utility Application", techStack: "Next.js, TypeScript, Tailwind CSS, AI API Integration", liveLink: "https://ai-powerd-resume-builder.vercel.app/", liveLinkLabel: "Live Demo",
            highlights: [
                "Developed dynamic UI templates managed entirely via Tailwind configuration variables, enabling live template rendering on runtime data updates.",
                "Built client-side data parsers to sanitize user-typed parameters into structured JSON objects, converting them directly into ATS-optimized resume blocks."
            ]
        },
        {
            id: 'p4', title: "Intensia Arts Fest Platform", subtitle: "High-Traffic Festival Management & Live Ticketing System", techStack: "Next.js, TypeScript, SCSS, Framer Motion, RESTful APIs", liveLink: "https://intensia-arts-fest.vercel.app/", liveLinkLabel: "Live Demo",
            highlights: [
                "Crafted a custom design structure using SCSS variables, modular mixins, and deep nesting layers to separate aesthetic themes from functional application layouts.",
                "Combined SCSS keyframes and Framer Motion behaviors to orchestrate responsive multi-step booking wizards that did not penalize the browser main thread."
            ]
        },
        {
            id: 'p5', title: "Parceler", subtitle: "Real-Time Fleet & Logistics Tracking Interface", techStack: "React.js, Geolocation APIs, WebSockets, CSS Modules, GitLab CI/CD", liveLink: "https://parceler.com/", liveLinkLabel: "Live Site",
            highlights: [
                "Isolated live visual components using native CSS Modules to guarantee zero global style pollution during continuous telemetry updates.",
                "Managed the layout streaming pipelines entirely inside a GitLab repository using dedicated build-test-deploy automated runner setups."
            ]
        },
        {
            id: 'p6', title: "TransferBay", subtitle: "File-Sharing & Asset Distribution SaaS Platform", techStack: "Next.js, TypeScript, Tailwind CSS, Cloud Asset Storage APIs, Node.js", liveLink: "https://transferbay.com/", liveLinkLabel: "Live Site",
            highlights: [
                "Optimized asset upload layers via asynchronous stream rendering to process massive multi-gigabyte client packets cleanly.",
                "Leveraged Tailwind dark-mode variants to build a sleek interface that automatically mirrors client operating system preferences."
            ]
        },
        {
            id: 'p7', title: "FujiPic", subtitle: "Photography Recipe & Preset Marketplace", techStack: "React.js, Vanilla CSS, JavaScript (ES6+), Cloud Firestore", liveLink: "https://fujipic.com/", liveLinkLabel: "Live Site",
            highlights: [
                "Engineered the platform layout without heavy libraries, using Vanilla CSS custom properties to manage visual rendering pipelines and component structure.",
                "Maintained minimal layout shift indexes by initializing image skeleton cards directly within custom style declarations."
            ]
        },
        {
            id: 'p8', title: "Enterprise E-Commerce Hub", subtitle: "Full-Featured Dynamic E-Commerce Ecosystem", techStack: "MERN, React.js, Bootstrap, Sass, Express.js, MongoDB", liveLink: "", liveLinkLabel: "Internal Staging",
            highlights: [
                "Constructed the complete UI platform using Bootstrap responsive flex rows and container structures to achieve cross-browser accessibility.",
                "Overrode default Bootstrap layout models using SCSS configuration templates to inject branding color patterns precisely."
            ]
        }
    ],

    certifications: [
        { id: 'c1', name: "Certified MERN Stack Developer", issuer: "Adacode Solutions", year: "2023" }
    ],

    education: [
        { id: 'ed1', school: "Calicut University", degree: "Bachelor of Arts", major: "Sociology", year: "2021 - 2023", result: "" }
    ],

    freelance: [
        {
            id: 'f1', project: "Freelance / Independent Development", role: "Freelance Frontend Engineer & Project Developer", duration: "Concurrent",
            highlights: [
                "Engineered production-ready commercial platforms, including a full-scale e-commerce system built completely on Bootstrap and SCSS for optimized responsive breakpoints.",
                "Integrated complex RESTful endpoints, maintained cross-browser pixel perfection via modular native CSS implementations, and set up independent deployment flows."
            ]
        }
    ],

    others: [],

    sections: [
        { id: "summary", title: "Professional Summary", isVisible: true },
        { id: "technicalSkills", title: "Technical Skills", isVisible: true },
        { id: "experiences", title: "Experience", isVisible: true },
        { id: "projects", title: "Projects", isVisible: true },
        { id: "freelance", title: "Freelance Work", isVisible: true },
        { id: "education", title: "Education", isVisible: true },
        { id: "certifications", title: "Certifications", isVisible: true },
        { id: "others", title: "Others", isVisible: true },
    ]
};

export const PUBLIC_DATA: ResumeData = {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    links: [],
    summary: "",
    technicalSkills: [],
    experiences: [],
    projects: [],
    certifications: [],
    education: [],
    freelance: [],
    others: [],
    sections: [
        { id: "summary", title: "Professional Summary", isVisible: true },
        { id: "technicalSkills", title: "Technical Skills", isVisible: true },
        { id: "experiences", title: "Experience", isVisible: true },
        { id: "projects", title: "Projects", isVisible: true },
        { id: "freelance", title: "Freelance Work", isVisible: true },
        { id: "education", title: "Education", isVisible: true },
        { id: "certifications", title: "Certifications", isVisible: true },
        { id: "others", title: "Others", isVisible: true },
    ]
};
