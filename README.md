# AI-Powered Resume Builder

A modern, AI-enhanced resume building application built with React, TypeScript, and Tailwind CSS. This tool helps users create professional, **ATS-optimized** resumes with the power of Gemini AI for intelligent keyword extraction and content generation.

## 🚀 Features

### 🎯 **Advanced ATS Optimization**
- **Intelligent Keyword Extraction**: Automatically extracts relevant keywords from job descriptions
- **Smart Skills Addition**: Adds missing skills from the JD to your technical skills section
- **Professional Summary Optimization**: Rewrites your summary with top 5-7 ATS keywords from the JD
- **Project Description Enhancement**: Updates project highlights with JD-relevant terminology
- **Experience Optimization**: Refines experience bullets to align with job requirements
- **Freelance Work Updates**: Adapts freelance descriptions to emphasize JD-relevant skills
- **ATS Score Calculator**: Get an objective 0-100% score showing how well your resume matches the JD

### ✉️ **AI-Powered Cover Letters**
- **Keyword-Rich Cover Emails**: Generates ATS-friendly cover letters with keywords from the JD
- **Targeted Content**: Highlights specific achievements that match job requirements
- **Email Integration**: One-click email draft with clean formatting
- **Rich Text Copy**: Copy formatted text directly to email clients

### 📝 **Resume Management**
- **Real-time Preview**: See your resume changes instantly as you edit
- **Customizable Sections**: Easily manage sections like Experience, Education, Projects, Skills, Freelance, and more
- **Section Reordering**: Drag and drop sections to customize your resume layout
- **Dynamic Visibility**: Show/hide sections as needed
- **Custom Section Titles**: Rename any section to fit your needs

### 📄 **Export Options**
- **PDF Export**: Download high-quality, ATS-friendly A4 PDFs with clickable links
- **LaTeX Export**: Generate LaTeX source code for advanced customization
- **Clean Design**: Modern layout optimized for both ATS systems and human readers

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS
- **AI Integration**: Google Gemini AI (with fallback model support)
- **PDF Generation**: jsPDF with html2canvas
- **Build Tool**: Vite

## 🏃‍♂️ Run Locally

**Prerequisites:** Node.js (v16 or higher recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Shijastk/ai-powerd-resume-builder.git
    cd ai-powerd-resume-builder
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory and add your Gemini API key:
    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## 📊 How to Use ATS Optimization

1. **Paste Job Description**: Copy the job posting you're applying for and paste it in the "ATS Alignment Engine" text area
2. **Click "Create"**: The AI will analyze the JD and optimize your entire resume with relevant keywords
3. **Review Changes**: Check the Preview tab to see how your resume has been enhanced with ATS keywords
4. **Calculate ATS Score**: Click "ATS Score" to get an objective assessment (0-100%)
5. **Generate Cover Letter**: Click "Generate Cover Email" for a keyword-rich cover letter
6. **Download PDF**: Export your optimized resume as a professional PDF

### What Gets Optimized:
- ✅ **Professional Summary** - Rewritten with top ATS keywords
- ✅ **Technical Skills** - New relevant skills added from JD
- ✅ **Projects** - Descriptions enhanced with JD terminology
- ✅ **Experience** - Highlights refined with job-specific keywords
- ✅ **Freelance Work** - Updated to match JD requirements
- ✅ **Cover Letter** - Generated with ATS keywords and targeted achievements

## 📄 License

This project is licensed under the MIT License.

