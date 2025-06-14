export interface ResumeData {
  personalInfo: {
    name: string
    email: string
    phone: string
    location: string
    linkedin?: string
    portfolio?: string
    github?: string
    jobTitle: string
    jobDescription: string
  }
  summary: string
  experience: Array<{
    title: string
    company: string
    location: string
    startDate: string
    endDate: string
    description: string[]
    achievements: string[]
  }>
  education: Array<{
    degree: string
    school: string
    location: string
    graduationDate: string
    gpa?: string
    honors?: string[]
  }>
  skills: {
    technical: string[]
    soft: string[]
    languages?: string[]
    certifications?: string[]
  }
  projects?: Array<{
    name: string
    description: string
    technologies: string[]
    link?: string
  }>
  publications?: Array<{
    title: string
    authors: string
    journal?: string
    conference?: string
    year: string
    doi?: string
    link?: string
  }>
  training?: Array<{
    name: string
    provider: string
    completionDate: string
    expirationDate?: string
    credentialId?: string
    link?: string
  }>
}

export interface ResumeTemplate {
  id: string
  name: string
  description: string
  category: 'modern' | 'classic' | 'tech' | 'creative' | 'executive'
  atsOptimized: boolean
  generateHTML: (data: ResumeData) => string
  generateMarkdown: (data: ResumeData) => string
}

// Your Resume Template (Based on the image you showed me)
export const yourResumeTemplate: ResumeTemplate = {
  id: 'your-resume-style',
  name: 'Classic Resume Style',
  description: 'Clean, professional template mimicking traditional academic resume layouts',
  category: 'classic',
  atsOptimized: true,
  
  generateHTML: (data: ResumeData) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.personalInfo.name} - Resume</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Times New Roman', Times, serif;
            color: #000;
            background: #ffffff;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.75in;
            font-size: 11pt;
            line-height: 1.5;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 1px solid #000;
        }
        
        .name {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .contact {
            font-size: 10pt;
            line-height: 1.3;
        }
        
        .contact-line {
            margin: 2px 0;
        }
        
        .section-title {
            font-size: 12pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 25px;
            margin-bottom: 12px;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
            letter-spacing: 0.5px;
        }
        
        .section-title:first-of-type {
            margin-top: 0;
        }
        
        .summary {
            text-align: justify;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        
        .job {
            margin-bottom: 20px;
        }
        
        .job-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 3px;
        }
        
        .job-title {
            font-weight: bold;
            font-size: 11pt;
        }
        
        .job-date-location {
            font-size: 10pt;
            font-style: italic;
            text-align: right;
            white-space: nowrap;
        }
        
        .job-company {
            font-style: italic;
            margin-bottom: 8px;
        }
        
        .job-description {
            margin-left: 20px;
            padding-left: 0;
        }
        
        .job-description li {
            margin-bottom: 4px;
            text-align: justify;
        }
        
        .education-item {
            margin-bottom: 15px;
        }
        
        .education-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 3px;
        }
        
        .degree {
            font-weight: bold;
        }
        
        .edu-date-location {
            font-size: 10pt;
            font-style: italic;
            text-align: right;
            white-space: nowrap;
        }
        
        .school {
            font-style: italic;
            margin-bottom: 5px;
        }
        
        .edu-details {
            margin-left: 20px;
            padding-left: 0;
        }
        
        .edu-details li {
            margin-bottom: 3px;
            font-size: 10pt;
        }
        
        .skills-section {
            margin-bottom: 15px;
        }
        
        .skills-category {
            margin-bottom: 8px;
        }
        
        .skills-label {
            font-weight: bold;
            display: inline;
        }
        
        .skills-list {
            display: inline;
        }
        
        .projects-section {
            margin-bottom: 20px;
        }
        
        .project-item {
            margin-bottom: 15px;
        }
        
        .project-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 3px;
        }
        
        .project-name {
            font-weight: bold;
        }
        
        .project-tech {
            font-size: 10pt;
            font-style: italic;
            margin-top: 5px;
        }
        
        @media print {
            body { 
                padding: 0.5in;
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="name">${data.personalInfo.name}</div>
        <div class="contact">
            <div class="contact-line">${data.personalInfo.location}</div>
            <div class="contact-line">${data.personalInfo.email} • ${data.personalInfo.phone}</div>
            ${data.personalInfo.linkedin || data.personalInfo.github ? `
            <div class="contact-line">
                ${data.personalInfo.linkedin ? `LinkedIn: ${data.personalInfo.linkedin.replace('https://linkedin.com/in/', '').replace('https://www.linkedin.com/in/', '')}` : ''}
                ${data.personalInfo.linkedin && data.personalInfo.github ? ' • ' : ''}
                ${data.personalInfo.github ? `GitHub: ${data.personalInfo.github.replace('https://github.com/', '').replace('https://www.github.com/', '')}` : ''}
            </div>
            ` : ''}
        </div>
    </div>

    ${data.summary ? `
    <div class="section-title">Summary</div>
    <div class="summary">${data.summary}</div>
    ` : ''}

    <div class="section-title">Education</div>
    ${data.education.map(edu => `
        <div class="education-item">
            <div class="education-header">
                <div class="degree">${edu.degree}</div>
                <div class="edu-date-location">${edu.graduationDate}</div>
            </div>
            <div class="school">${edu.school}, ${edu.location}</div>
            ${edu.gpa || (edu.honors && edu.honors.length > 0) ? `
            <ul class="edu-details">
                ${edu.gpa ? `<li>GPA: ${edu.gpa}</li>` : ''}
                ${edu.honors && edu.honors.length > 0 ? `<li>Relevant Coursework: ${edu.honors.join(', ')}</li>` : ''}
            </ul>
            ` : ''}
        </div>
    `).join('')}

    <div class="section-title">Skills</div>
    <div class="skills-section">
        <div class="skills-category">
            <span class="skills-label">Technical Skills: </span>
            <span class="skills-list">${data.skills.technical.join(', ')}</span>
        </div>
        <div class="skills-category">
            <span class="skills-label">Soft Skills: </span>
            <span class="skills-list">${data.skills.soft.join(', ')}</span>
        </div>
        ${data.skills.languages && data.skills.languages.length > 0 ? `
        <div class="skills-category">
            <span class="skills-label">Languages: </span>
            <span class="skills-list">${data.skills.languages.join(', ')}</span>
        </div>
        ` : ''}
        ${data.skills.certifications && data.skills.certifications.length > 0 ? `  
        <div class="skills-category">
            <span class="skills-label">Certifications: </span>
            <span class="skills-list">${data.skills.certifications.join(', ')}</span>
        </div>
        ` : ''}
    </div>

    <div class="section-title">Experience</div>
    ${data.experience.map(job => `
        <div class="job">
            <div class="job-header">
                <div class="job-title">${job.title}</div>
                <div class="job-date-location">${job.startDate} – ${job.endDate}</div>
            </div>
            <div class="job-company">${job.company}, ${job.location}</div>
            <ul class="job-description">
                ${job.description.map(item => `<li>${item}</li>`).join('')}
                ${job.achievements.map(ach => `<li>${ach}</li>`).join('')}
            </ul>
        </div>
    `).join('')}

    ${data.publications && data.publications.length > 0 ? `
    <div class="section-title">Publications</div>
    ${data.publications.map(pub => `
        <div class="job">
            <div class="job-header">
                <div class="job-title">${pub.title}</div>
                <div class="job-date-location">${pub.year}</div>
            </div>
            <div class="job-company">${pub.authors}</div>
            <div class="job-company">${pub.journal || pub.conference || ''}</div>
            ${pub.doi ? `<div class="job-company">DOI: ${pub.doi}</div>` : ''}
            ${pub.link ? `<div class="job-location-date">Link: ${pub.link}</div>` : ''}
        </div>
    `).join('')}
    ` : ''}

    ${data.training && data.training.length > 0 ? `
    <div class="section-title">Training & Certifications</div>
    ${data.training.map(training => `
        <div class="job">
            <div class="job-header">
                <div class="job-title">${training.name}</div>
                <div class="job-location-date">${training.completionDate}</div>
            </div>
            <div class="job-company">${training.provider}</div>
            ${training.expirationDate ? `<div class="job-location-date" style="margin-bottom: 8px;">Expires: ${training.expirationDate}</div>` : ''}
            ${training.credentialId ? `<div class="job-location-date">Credential ID: ${training.credentialId}</div>` : ''}
            ${training.link ? `<div class="job-location-date">Verification: ${training.link}</div>` : ''}
        </div>
    `).join('')}
    ` : ''}

</body>
</html>
    `
  },

  generateMarkdown: (data: ResumeData) => {
    return `
# ${data.personalInfo.name}
${data.personalInfo.email} | ${data.personalInfo.phone} | ${data.personalInfo.location}${data.personalInfo.github ? ` | ${data.personalInfo.github}` : ''}${data.personalInfo.linkedin ? ` | ${data.personalInfo.linkedin}` : ''}${data.personalInfo.portfolio ? ` | ${data.personalInfo.portfolio}` : ''}

## PROFESSIONAL SUMMARY
${data.summary}

## PROFESSIONAL EXPERIENCE
${data.experience.map(job => `
**${job.title} | ${job.company}**
${job.startDate} - ${job.endDate} | ${job.location}
${job.description.map(item => `- ${item}`).join('\n')}
${job.achievements.map(ach => `- ${ach}`).join('\n')}
`).join('\n')}

## EDUCATION
${data.education.map(edu => `
**${edu.degree}**
${edu.school}${edu.location ? `, ${edu.location}` : ''} | ${edu.graduationDate}
${edu.gpa ? `GPA: ${edu.gpa}` : ''}
`).join('\n')}

## SKILLS
- Technical: ${data.skills.technical.join(', ')}
- Soft Skills: ${data.skills.soft.join(', ')}
${data.skills.languages && data.skills.languages.length > 0 ? `- Languages: ${data.skills.languages.join(', ')}` : ''}
${data.skills.certifications && data.skills.certifications.length > 0 ? `- Certifications: ${data.skills.certifications.join(', ')}` : ''}

${data.publications && data.publications.length > 0 ? `## PUBLICATIONS
${data.publications.map(pub => `
**${pub.title}**
${pub.authors} | ${pub.journal || pub.conference} | ${pub.year}
${pub.doi ? `DOI: ${pub.doi}` : ''}${pub.link ? `\nLink: ${pub.link}` : ''}
`).join('\n')}` : ''}

${data.training && data.training.length > 0 ? `## TRAINING & CERTIFICATIONS
${data.training.map(training => `
**${training.name}**
${training.provider} | Completed: ${training.completionDate}
${training.expirationDate ? `Expires: ${training.expirationDate}` : ''}${training.credentialId ? `\nCredential ID: ${training.credentialId}` : ''}${training.link ? `\nVerification: ${training.link}` : ''}
`).join('\n')}` : ''}
`
  }
}

// Modern Template (Clean, contemporary design)
export const modernTemplate: ResumeTemplate = {
  id: 'modern-template',
  name: 'Modern',
  description: 'Soft, elegant design with modern typography and sophisticated layouts',
  category: 'modern',
  atsOptimized: true,
  
  generateHTML: (data: ResumeData) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.personalInfo.name} - Resume</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #334155;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0;
            font-size: 11pt;
            line-height: 1.6;
            min-height: 100vh;
        }
        
        .container {
            background: #ffffff;
            box-shadow: 0 20px 60px rgba(0,0,0,0.08);
            border-radius: 0 0 24px 24px;
            overflow: hidden;
            min-height: 100vh;
        }
        
        .header {
            background: linear-gradient(135deg, #e0e7ff 0%, #f0f9ff 50%, #fef7cd 100%);
            padding: 60px 50px 50px;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -20%;
            width: 200px;
            height: 200px;
            background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
            border-radius: 50%;
        }
        
        .header::after {
            content: '';
            position: absolute;
            bottom: -30%;
            left: -10%;
            width: 150px;
            height: 150px;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%);
            border-radius: 50%;
        }
        
        .name {
            font-size: 42pt;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
            position: relative;
            z-index: 2;
        }
        
        .title {
            font-size: 18pt;
            font-weight: 400;
            color: #64748b;
            margin-bottom: 30px;
            position: relative;
            z-index: 2;
        }
        
        .contact {
            display: flex;
            flex-wrap: wrap;
            gap: 24px;
            font-size: 10pt;
            position: relative;
            z-index: 2;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #475569;
            background: rgba(255, 255, 255, 0.7);
            padding: 8px 16px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .content {
            padding: 50px;
        }
        
        .section-title {
            font-size: 16pt;
            font-weight: 600;
            color: #1e293b;
            margin-top: 40px;
            margin-bottom: 20px;
            padding-bottom: 12px;
            position: relative;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%);
            border-radius: 2px;
        }
        
        .section-title:first-of-type {
            margin-top: 0;
        }
        
        .summary {
            background: linear-gradient(135deg, #fefcbf 0%, #f0fff4 100%);
            padding: 28px;
            border-radius: 16px;
            border: 1px solid #e4e4e7;
            margin-bottom: 30px;
            font-style: italic;
            line-height: 1.7;
            color: #374151;
            position: relative;
            overflow: hidden;
        }
        
        .summary::before {
            content: '"';
            position: absolute;
            top: 10px;
            left: 20px;
            font-size: 48pt;
            color: #d1d5db;
            font-family: serif;
            opacity: 0.3;
        }
        
        .job {
            margin-bottom: 32px;
            padding: 28px;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.04);
            border: 1px solid #f1f5f9;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .job::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
        }
        
        .job-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
            flex-wrap: wrap;
            gap: 12px;
        }
        
        .job-title {
            font-weight: 600;
            font-size: 14pt;
            color: #1e293b;
            line-height: 1.3;
        }
        
        .job-company {
            font-weight: 500;
            color: #8b5cf6;
            font-size: 12pt;
            margin-top: 4px;
        }
        
        .job-meta {
            text-align: right;
            color: #64748b;
            font-size: 10pt;
            background: #f8fafc;
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .job-description {
            margin-top: 16px;
            padding-left: 0;
        }
        
        .job-description li {
            margin-bottom: 8px;
            list-style: none;
            position: relative;
            padding-left: 24px;
            line-height: 1.5;
            color: #475569;
        }
        
        .job-description li::before {
            content: '→';
            position: absolute;
            left: 0;
            color: #8b5cf6;
            font-weight: 600;
            font-size: 12pt;
        }
        
        .education-item {
            margin-bottom: 24px;
            padding: 24px;
            background: linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%);
            border-radius: 16px;
            border: 1px solid #e0f2fe;
            position: relative;
        }
        
        .education-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%);
            border-radius: 0 4px 4px 0;
        }
        
        .degree {
            font-weight: 600;
            font-size: 12pt;
            color: #1e293b;
            margin-bottom: 4px;
        }
        
        .school {
            color: #0ea5e9;
            font-weight: 500;
            font-size: 11pt;
            margin-bottom: 8px;
        }
        
        .edu-meta {
            color: #64748b;
            font-size: 10pt;
            line-height: 1.4;
        }
        
        .skills-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
            margin-top: 20px;
        }
        
        .skill-group {
            background: #ffffff;
            padding: 24px;
            border-radius: 16px;
            border: 1px solid #f1f5f9;
            box-shadow: 0 2px 12px rgba(0,0,0,0.03);
        }
        
        .skill-group h4 {
            color: #1e293b;
            font-weight: 600;
            margin-bottom: 16px;
            font-size: 11pt;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .skill-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .skill-tag {
            background: linear-gradient(135deg, #e0e7ff 0%, #f0f9ff 100%);
            color: #4338ca;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 9pt;
            font-weight: 500;
            border: 1px solid #c7d2fe;
            transition: all 0.3s ease;
        }
        
        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 24px;
            margin-top: 20px;
        }
        
        .project-item {
            background: #ffffff;
            padding: 24px;
            border-radius: 16px;
            border: 1px solid #f1f5f9;
            box-shadow: 0 2px 12px rgba(0,0,0,0.03);
            position: relative;
            overflow: hidden;
        }
        
        .project-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        
        .project-name {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 12px;
            font-size: 11pt;
        }
        
        .project-description {
            color: #64748b;
            margin-bottom: 16px;
            line-height: 1.5;
            font-size: 10pt;
        }
        
        .project-tech {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .tech-tag {
            background: #fef3c7;
            color: #92400e;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 8pt;
            border: 1px solid #fde68a;
            font-weight: 500;
        }
        
        @media print {
            body { 
                background: #ffffff;
                padding: 0;
                min-height: auto;
            }
            .container {
                box-shadow: none;
                border-radius: 0;
            }
            .header {
                background: #f8fafc !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="name">${data.personalInfo.name}</div>
            <div class="title">${data.personalInfo.jobTitle || 'Professional'}</div>
            <div class="contact">
                <div class="contact-item">✉️ ${data.personalInfo.email}</div>
                <div class="contact-item">📱 ${data.personalInfo.phone}</div>
                <div class="contact-item">📍 ${data.personalInfo.location}</div>
                ${data.personalInfo.linkedin ? `<div class="contact-item">💼 LinkedIn</div>` : ''}
                ${data.personalInfo.github ? `<div class="contact-item">💻 GitHub</div>` : ''}
                ${data.personalInfo.portfolio ? `<div class="contact-item">🌐 Portfolio</div>` : ''}
            </div>
        </div>
        
        <div class="content">
            ${data.summary ? `
            <div class="section-title">Professional Summary</div>
            <div class="summary">${data.summary}</div>
            ` : ''}

            <div class="section-title">Professional Experience</div>
            ${data.experience.map(job => `
                <div class="job">
                    <div class="job-header">
                        <div>
                            <div class="job-title">${job.title}</div>
                            <div class="job-company">${job.company}</div>
                        </div>
                        <div class="job-meta">
                            <div>${job.startDate} - ${job.endDate}</div>
                            <div>${job.location}</div>
                        </div>
                    </div>
                    <ul class="job-description">
                        ${job.description.map(item => `<li>${item}</li>`).join('')}
                        ${job.achievements.map(ach => `<li>${ach}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}

            <div class="section-title">Education</div>
            ${data.education.map(edu => `
                <div class="education-item">
                    <div class="degree">${edu.degree}</div>
                    <div class="school">${edu.school}</div>
                    <div class="edu-meta">${edu.location} | ${edu.graduationDate}</div>
                    ${edu.gpa ? `<div class="edu-meta">GPA: ${edu.gpa}</div>` : ''}
                    ${edu.honors && edu.honors.length > 0 ? `<div class="edu-meta">${edu.honors.join(', ')}</div>` : ''}
                </div>
            `).join('')}

            <div class="section-title">Skills</div>
            <div class="skills-container">
                <div class="skill-group">
                    <h4>💻 Technical Skills</h4>
                    <div class="skill-tags">
                        ${data.skills.technical.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
                <div class="skill-group">
                    <h4>🎯 Soft Skills</h4>
                    <div class="skill-tags">
                        ${data.skills.soft.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
                ${data.skills.languages && data.skills.languages.length > 0 ? `
                <div class="skill-group">
                    <h4>🌐 Languages</h4>
                    <div class="skill-tags">
                        ${data.skills.languages.map(lang => `<span class="skill-tag">${lang}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
                ${data.skills.certifications && data.skills.certifications.length > 0 ? `
                <div class="skill-group">
                    <h4>🏆 Certifications</h4>
                    <div class="skill-tags">
                        ${data.skills.certifications.map(cert => `<span class="skill-tag">${cert}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>

            ${data.projects && data.projects.length > 0 ? `
            <div class="section-title">Projects</div>
            <div class="projects-grid">
                ${data.projects.map(project => `
                    <div class="project-item">
                        <div class="project-name">${project.name}</div>
                        <div class="project-description">${project.description}</div>
                        <div class="project-tech">
                            ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            ${data.publications && data.publications.length > 0 ? `
            <div class="section-title">Publications</div>
            ${data.publications.map(pub => `
                <div class="education-item">
                    <div class="degree">${pub.title}</div>
                    <div class="school">${pub.authors}</div>
                    <div class="edu-meta">${pub.journal || pub.conference} | ${pub.year}</div>
                    ${pub.doi ? `<div class="edu-meta">DOI: ${pub.doi}</div>` : ''}
                </div>
            `).join('')}
            ` : ''}

            ${data.training && data.training.length > 0 ? `
            <div class="section-title">Training & Certifications</div>
            ${data.training.map(training => `
                <div class="education-item">
                    <div class="degree">${training.name}</div>
                    <div class="school">${training.provider}</div>
                    <div class="edu-meta">Completed: ${training.completionDate}</div>
                    ${training.credentialId ? `<div class="edu-meta">Credential ID: ${training.credentialId}</div>` : ''}
                </div>
            `).join('')}
            ` : ''}
        </div>
    </div>
</body>
</html>
    `
  },

  generateMarkdown: (data: ResumeData) => {
    return `
# ${data.personalInfo.name}
${data.personalInfo.email} | ${data.personalInfo.phone} | ${data.personalInfo.location}${data.personalInfo.github ? ` | ${data.personalInfo.github}` : ''}${data.personalInfo.linkedin ? ` | ${data.personalInfo.linkedin}` : ''}${data.personalInfo.portfolio ? ` | ${data.personalInfo.portfolio}` : ''}

## PROFESSIONAL SUMMARY
${data.summary}

## PROFESSIONAL EXPERIENCE
${data.experience.map(job => `
**${job.title} | ${job.company}**
${job.startDate} - ${job.endDate} | ${job.location}
${job.description.map(item => `- ${item}`).join('\n')}
${job.achievements.map(ach => `- ${ach}`).join('\n')}
`).join('\n')}

## EDUCATION
${data.education.map(edu => `
**${edu.degree}**
${edu.school}${edu.location ? `, ${edu.location}` : ''} | ${edu.graduationDate}
${edu.gpa ? `GPA: ${edu.gpa}` : ''}
`).join('\n')}

## SKILLS
- Technical: ${data.skills.technical.join(', ')}
- Soft Skills: ${data.skills.soft.join(', ')}
${data.skills.languages && data.skills.languages.length > 0 ? `- Languages: ${data.skills.languages.join(', ')}` : ''}
${data.skills.certifications && data.skills.certifications.length > 0 ? `- Certifications: ${data.skills.certifications.join(', ')}` : ''}

${data.projects && data.projects.length > 0 ? `## PROJECTS
${data.projects.map(project => `**${project.name}**\n${project.description}\nTechnologies: ${project.technologies.join(', ')}`).join('\n\n')}` : ''}

${data.publications && data.publications.length > 0 ? `## PUBLICATIONS
${data.publications.map(pub => `
**${pub.title}**
${pub.authors} | ${pub.journal || pub.conference} | ${pub.year}
${pub.doi ? `DOI: ${pub.doi}` : ''}${pub.link ? `\nLink: ${pub.link}` : ''}
`).join('\n')}` : ''}

${data.training && data.training.length > 0 ? `## TRAINING & CERTIFICATIONS
${data.training.map(training => `
**${training.name}**
${training.provider} | Completed: ${training.completionDate}
${training.expirationDate ? `Expires: ${training.expirationDate}` : ''}${training.credentialId ? `\nCredential ID: ${training.credentialId}` : ''}${training.link ? `\nVerification: ${training.link}` : ''}
`).join('\n')}` : ''}
`
  }
}

// Modern Tech Template (Dark theme with terminal styling)
export const modernTechTemplate: ResumeTemplate = {
  id: 'modern-tech',
  name: 'Modern Tech',
  description: 'Dark theme with code-style formatting, perfect for developers and tech professionals',
  category: 'tech',
  atsOptimized: true,
  
  generateHTML: (data: ResumeData) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.personalInfo.name} - Resume</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { 
            background: #1a202c;
            margin: 0;
            padding: 0;
        }
        body { 
            font-family: 'Fira Code', 'Monaco', 'Consolas', monospace; 
            line-height: 1.6; 
            color: #e2e8f0; 
            background: #1a202c;
            max-width: none; 
            margin: 0;
            padding: 0;
            font-size: 10pt;
            width: 100vw;
            min-height: 100vh;
        }
        
        .terminal {
            background: #2d3748;
            border-radius: 0;
            padding: 20px;
            border: none;
            box-shadow: none;
            min-height: 100vh;
        }
        
        .terminal-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #4a5568;
        }
        
        .terminal-dots {
            display: flex;
            gap: 6px;
            margin-right: 15px;
        }
        
        .dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }
        
        .dot.red { background: #f56565; }
        .dot.yellow { background: #ed8936; }
        .dot.green { background: #48bb78; }
        
        .terminal-title {
            color: #a0aec0;
            font-size: 12pt;
        }
        
        .prompt {
            color: #68d391;
            font-weight: bold;
        }
        
        .command {
            color: #63b3ed;
        }
        
        .output {
            color: #e2e8f0;
            margin-left: 20px;
        }
        
        .name {
            font-size: 20pt;
            font-weight: bold;
            color: #68d391;
            margin-bottom: 5px;
        }
        
        .contact {
            color: #a0aec0;
            margin-bottom: 15px;
        }
        
        .contact a {
            color: #63b3ed;
            text-decoration: none;
        }
        
        .section {
            margin-bottom: 20px;
        }
        
        .job {
            margin-bottom: 15px;
            background: #2a2e3a;
            padding: 15px;
            border-radius: 6px;
            border-left: 3px solid #63b3ed;
        }
        
        .job-title {
            color: #68d391;
            font-weight: bold;
            font-size: 11pt;
        }
        
        .company {
            color: #63b3ed;
            font-weight: 600;
        }
        
        .job-meta {
            color: #a0aec0;
            font-size: 9pt;
            margin: 5px 0;
        }
        
        .job-description li {
            margin-bottom: 4px;
            color: #e2e8f0;
            list-style: none;
            position: relative;
            padding-left: 15px;
        }
        
        .job-description li::before {
            content: '>';
            position: absolute;
            left: 0;
            color: #68d391;
            font-weight: bold;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .skill-group {
            background: #2a2e3a;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #4a5568;
        }
        
        .skill-group h4 {
            color: #f6ad55;
            margin-bottom: 8px;
            font-size: 10pt;
        }
        
        .skill-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        
        .skill-tag {
            background: #4a5568;
            color: #e2e8f0;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 8pt;
            border: 1px solid #68d391;
        }
        
        .education-item {
            background: #2a2e3a;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 10px;
            border-left: 3px solid #f6ad55;
        }
        
        .degree {
            color: #68d391;
            font-weight: bold;
        }
        
        .school {
            color: #63b3ed;
            margin-top: 2px;
        }
        
        .edu-details {
            color: #a0aec0;
            font-size: 9pt;
            margin-top: 4px;
        }
        
        .edu-details li {
            margin-bottom: 2px;
            list-style-type: disc;
        }
        
        @media print {
            html {
                background: #1a202c !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            body { 
                background: #1a202c !important; 
                color: #e2e8f0 !important; 
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                max-width: none !important;
            }
            .terminal {
                background: #2d3748 !important;
                border: none !important;
                margin: 0 !important;
                padding: 20px !important;
                min-height: 100vh !important;
            }
            .name { color: #68d391 !important; }
            .job { background: #2a2e3a !important; }
            .skill-group { background: #2a2e3a !important; }
            .education-item { background: #2a2e3a !important; }
            .skill-tag { background: #4a5568 !important; }
        }
    </style>
</head>
<body>
    <div class="terminal">
        <div class="terminal-header">
            <div class="terminal-dots">
                <div class="dot red"></div>
                <div class="dot yellow"></div>
                <div class="dot green"></div>
            </div>
            <div class="terminal-title">resume.sh - ${data.personalInfo.name}</div>
        </div>
        
        <div class="section">
            <div class="prompt">$ </div><span class="command">cat personal_info.txt</span>
            <div class="output">
                <div class="name">${data.personalInfo.name}</div>
                <div class="contact">
                    📧 ${data.personalInfo.email} | 📱 ${data.personalInfo.phone} | 📍 ${data.personalInfo.location}
                    ${data.personalInfo.github ? `<br>🔗 <a href="${data.personalInfo.github}">GitHub</a>` : ''}
                    ${data.personalInfo.linkedin ? ` | <a href="${data.personalInfo.linkedin}">LinkedIn</a>` : ''}
                    ${data.personalInfo.portfolio ? ` | <a href="${data.personalInfo.portfolio}">Portfolio</a>` : ''}
                </div>
            </div>
        </div>

        ${data.summary ? `
        <div class="section">
            <div class="prompt">$ </div><span class="command">cat professional_summary.md</span>
            <div class="output">${data.summary}</div>
        </div>
        ` : ''}

        <div class="section">
            <div class="prompt">$ </div><span class="command">cat education.txt</span>
            <div class="output">
                ${data.education.map(edu => `
                    <div class="education-item">
                        <div class="degree">${edu.degree}</div>
                        <div class="school">${edu.school}${edu.location ? `, ${edu.location}` : ''}</div>
                        <div class="edu-details">${edu.graduationDate} ${edu.gpa ? `• GPA: ${edu.gpa}` : ''}</div>
                        ${edu.honors ? `<div class="edu-details">${edu.honors.join(', ')}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <div class="prompt">$ </div><span class="command">ls skills/</span>
            <div class="output">
                <div class="skills-grid">
                    <div class="skill-group">
                        <h4>💻 Technical</h4>
                        <div class="skill-tags">
                            ${data.skills.technical.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                    ${data.skills.soft.length > 0 ? `
                    <div class="skill-group">
                        <h4>🎯 Soft Skills</h4>
                        <div class="skill-tags">
                            ${data.skills.soft.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                    ${data.skills.languages && data.skills.languages.length > 0 ? `
                    <div class="skill-group">
                        <h4>🌐 Languages</h4>
                        <div class="skill-tags">
                            ${data.skills.languages.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                    ${data.skills.certifications && data.skills.certifications.length > 0 ? `
                    <div class="skill-group">
                        <h4>🏆 Certifications</h4>
                        <div class="skill-tags">
                            ${data.skills.certifications.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>

        <div class="section">
            <div class="prompt">$ </div><span class="command">cat professional_experience.log</span>
            <div class="output">
                ${data.experience.map(job => `
                    <div class="job">
                        <div class="job-title">${job.title}</div>
                        <div class="company">${job.company}</div>
                        <div class="job-meta">${job.startDate} - ${job.endDate} | ${job.location}</div>
                        <ul class="job-description">
                            ${job.description.map(item => `<li>${item}</li>`).join('')}
                            ${job.achievements.map(achievement => `<li><strong>Achievement:</strong> ${achievement}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        </div>

        ${data.publications && data.publications.length > 0 ? `
        <div class="section">
            <div class="prompt">$ </div><span class="command">cat publications.bib</span>
            <div class="output">
                ${data.publications.map(pub => `
                    <div class="job">
                        <div class="job-title">${pub.title}</div>
                        <div class="company">${pub.authors}</div>
                        <div class="job-meta">${pub.journal || pub.conference} | ${pub.year}</div>
                        ${pub.doi ? `<div class="job-meta">DOI: ${pub.doi}</div>` : ''}
                        ${pub.link ? `<div class="job-meta">Link: <a href="${pub.link}" style="color: #63b3ed;">${pub.link}</a></div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${data.training && data.training.length > 0 ? `
        <div class="section">
            <div class="prompt">$ </div><span class="command">ls certifications/</span>
            <div class="output">
                ${data.training.map(training => `
                    <div class="job">
                        <div class="job-title">${training.name}</div>
                        <div class="company">${training.provider}</div>
                        <div class="job-meta">Completed: ${training.completionDate}</div>
                        ${training.expirationDate ? `<div class="job-meta">Expires: ${training.expirationDate}</div>` : ''}
                        ${training.credentialId ? `<div class="job-meta">Credential ID: ${training.credentialId}</div>` : ''}
                        ${training.link ? `<div class="job-meta">Verification: <a href="${training.link}" style="color: #63b3ed;">${training.link}</a></div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    </div>
</body>
</html>
    `
  },

  generateMarkdown: (data: ResumeData) => {
    return `
# ${data.personalInfo.name}
${data.personalInfo.email} | ${data.personalInfo.phone} | ${data.personalInfo.location}${data.personalInfo.github ? ` | ${data.personalInfo.github}` : ''}${data.personalInfo.linkedin ? ` | ${data.personalInfo.linkedin}` : ''}${data.personalInfo.portfolio ? ` | ${data.personalInfo.portfolio}` : ''}

## PROFESSIONAL SUMMARY
${data.summary}

## PROFESSIONAL EXPERIENCE
${data.experience.map(job => `
**${job.title} | ${job.company}**
${job.startDate} - ${job.endDate} | ${job.location}
${job.description.map(item => `- ${item}`).join('\n')}
${job.achievements.map(ach => `- ${ach}`).join('\n')}
`).join('\n')}

## EDUCATION
${data.education.map(edu => `
**${edu.degree}**
${edu.school}${edu.location ? `, ${edu.location}` : ''} | ${edu.graduationDate}
${edu.gpa ? `GPA: ${edu.gpa}` : ''}
`).join('\n')}

## SKILLS
- Technical: ${data.skills.technical.join(', ')}
- Soft Skills: ${data.skills.soft.join(', ')}
${data.skills.languages && data.skills.languages.length > 0 ? `- Languages: ${data.skills.languages.join(', ')}` : ''}
${data.skills.certifications && data.skills.certifications.length > 0 ? `- Certifications: ${data.skills.certifications.join(', ')}` : ''}

${data.projects && data.projects.length > 0 ? `## PROJECTS
${data.projects.map(project => `**${project.name}**\n${project.description}\nTechnologies: ${project.technologies.join(', ')}`).join('\n\n')}` : ''}

${data.publications && data.publications.length > 0 ? `## PUBLICATIONS
${data.publications.map(pub => `
**${pub.title}**
${pub.authors} | ${pub.journal || pub.conference} | ${pub.year}
${pub.doi ? `DOI: ${pub.doi}` : ''}${pub.link ? `\nLink: ${pub.link}` : ''}
`).join('\n')}` : ''}

${data.training && data.training.length > 0 ? `## TRAINING & CERTIFICATIONS
${data.training.map(training => `
**${training.name}**
${training.provider} | Completed: ${training.completionDate}
${training.expirationDate ? `Expires: ${training.expirationDate}` : ''}${training.credentialId ? `\nCredential ID: ${training.credentialId}` : ''}${training.link ? `\nVerification: ${training.link}` : ''}
`).join('\n')}` : ''}
`
  }
}

// Executive Leadership Template (Sophisticated and formal)
export const executiveLeadershipTemplate: ResumeTemplate = {
  id: 'executive-leadership',
  name: 'Executive Leadership',
  description: 'Sophisticated, luxurious design with elegant typography for C-level executives and senior leadership',
  category: 'executive',
  atsOptimized: true,
  
  generateHTML: (data: ResumeData) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.personalInfo.name} - Executive Resume</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Source+Sans+Pro:wght@300;400;500;600&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #1a1a1a;
            background: linear-gradient(135deg, #f7f5f3 0%, #f0f0f0 100%);
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0;
            font-size: 11pt;
            line-height: 1.7;
            min-height: 100vh;
        }
        
        .container {
            background: #ffffff;
            box-shadow: 0 25px 80px rgba(0,0,0,0.15);
            min-height: 100vh;
            position: relative;
            overflow: hidden;
        }
        
        .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #8b5a3c 0%, #d4af37 50%, #8b5a3c 100%);
        }
        
        .header {
            background: linear-gradient(135deg, #faf8f5 0%, #f5f2ed 100%);
            padding: 60px 60px 40px;
            border-bottom: 2px solid #e8e3dd;
            position: relative;
        }
        
        .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 60px;
            right: 60px;
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, #d4af37 50%, transparent 100%);
        }
        
        .name {
            font-family: 'Playfair Display', serif;
            font-size: 48pt;
            font-weight: 600;
            color: #2c1810;
            margin-bottom: 12px;
            letter-spacing: -0.5px;
            line-height: 1.1;
        }
        
        .title {
            font-size: 20pt;
            font-weight: 300;
            color: #8b5a3c;
            margin-bottom: 30px;
            font-style: italic;
            letter-spacing: 0.5px;
        }
        
        .contact {
            display: flex;
            flex-wrap: wrap;
            gap: 30px;
            font-size: 10pt;
            color: #5a5a5a;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 10px;
            background: rgba(212, 175, 55, 0.08);
            padding: 10px 18px;
            border-radius: 25px;
            border: 1px solid rgba(212, 175, 55, 0.2);
            font-weight: 500;
        }
        
        .content {
            padding: 50px 60px 60px;
        }
        
        .section-title {
            font-family: 'Playfair Display', serif;
            font-size: 18pt;
            font-weight: 600;
            color: #2c1810;
            margin-top: 45px;
            margin-bottom: 25px;
            position: relative;
            letter-spacing: 0.5px;
        }
        
        .section-title:first-of-type {
            margin-top: 0;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 0;
            width: 80px;
            height: 2px;
            background: linear-gradient(90deg, #d4af37 0%, #8b5a3c 100%);
        }
        
        .summary {
            background: linear-gradient(135deg, #fefdfb 0%, #f9f6f0 100%);
            border: 1px solid #e8e3dd;
            border-left: 5px solid #d4af37;
            padding: 35px;
            border-radius: 12px;
            font-style: italic;
            font-size: 12pt;
            line-height: 1.8;
            color: #3a3a3a;
            margin-bottom: 35px;
            position: relative;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        
        .summary::before {
            content: '"';
            position: absolute;
            top: 15px;
            left: 25px;
            font-family: 'Playfair Display', serif;
            font-size: 60pt;
            color: #d4af37;
            opacity: 0.2;
            line-height: 1;
        }
        
        .job {
            margin-bottom: 40px;
            padding: 32px;
            background: linear-gradient(135deg, #ffffff 0%, #fefdfb 100%);
            border: 1px solid #f0ebe3;
            border-radius: 12px;
            box-shadow: 0 6px 25px rgba(0,0,0,0.06);
            position: relative;
        }
        
        .job::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 5px;
            height: 100%;
            background: linear-gradient(135deg, #8b5a3c 0%, #d4af37 100%);
            border-radius: 5px 0 0 5px;
        }
        
        .job-header {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #f0ebe3;
        }
        
        .job-title {
            font-family: 'Playfair Display', serif;
            font-weight: 600;
            font-size: 16pt;
            color: #2c1810;
            margin-bottom: 6px;
            line-height: 1.2;
        }
        
        .job-company {
            font-weight: 600;
            color: #8b5a3c;
            font-size: 12pt;
            margin-bottom: 8px;
        }
        
        .job-meta {
            color: #6a6a6a;
            font-size: 10pt;
            font-weight: 500;
            background: #f8f5f0;
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            border: 1px solid #ede6db;
        }
        
        .job-description {
            padding-left: 0;
            margin-top: 16px;
        }
        
        .job-description li {
            margin-bottom: 10px;
            list-style: none;
            position: relative;
            padding-left: 28px;
            line-height: 1.6;
            color: #444444;
        }
        
        .job-description li::before {
            content: '▶';
            position: absolute;
            left: 0;
            color: #d4af37;
            font-size: 10pt;
            top: 2px;
        }
        
        .education-item {
            margin-bottom: 28px;
            padding: 28px;
            background: linear-gradient(135deg, #faf8f5 0%, #f5f2ed 100%);
            border: 1px solid #e8e3dd;
            border-radius: 12px;
            position: relative;
        }
        
        .education-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 5px;
            height: 100%;
            background: linear-gradient(135deg, #6b9bd2 0%, #4a90c8 100%);
            border-radius: 5px 0 0 5px;
        }
        
        .degree {
            font-family: 'Playfair Display', serif;
            font-weight: 600;
            font-size: 13pt;
            color: #2c1810;
            margin-bottom: 8px;
        }
        
        .school {
            color: #4a90c8;
            font-weight: 600;
            font-size: 11pt;
            margin-bottom: 8px;
        }
        
        .edu-meta {
            color: #6a6a6a;
            font-size: 10pt;
            line-height: 1.5;
            font-weight: 500;
        }
        
        .skills-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 28px;
            margin-top: 25px;
        }
        
        .skill-group {
            background: linear-gradient(135deg, #ffffff 0%, #fefdfb 100%);
            padding: 28px;
            border: 1px solid #f0ebe3;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.04);
        }
        
        .skill-group h4 {
            font-family: 'Playfair Display', serif;
            color: #2c1810;
            font-weight: 600;
            margin-bottom: 18px;
            font-size: 12pt;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .skill-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
        }
        
        .skill-tag {
            background: linear-gradient(135deg, #f8f5f0 0%, #f0ebe3 100%);
            color: #8b5a3c;
            padding: 10px 18px;
            border-radius: 25px;
            font-size: 9pt;
            font-weight: 600;
            border: 1px solid #e8e3dd;
            transition: all 0.3s ease;
        }
        
        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 28px;
            margin-top: 25px;
        }
        
        .project-item {
            background: linear-gradient(135deg, #ffffff 0%, #fefdfb 100%);
            padding: 28px;
            border: 1px solid #f0ebe3;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.04);
            position: relative;
        }
        
        .project-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 5px;
            height: 100%;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            border-radius: 5px 0 0 5px;
        }
        
        .project-name {
            font-family: 'Playfair Display', serif;
            font-weight: 600;
            color: #2c1810;
            margin-bottom: 12px;
            font-size: 12pt;
        }
        
        .project-description {
            color: #5a5a5a;
            margin-bottom: 18px;
            line-height: 1.6;
            font-size: 10pt;
        }
        
        .project-tech {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .tech-tag {
            background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
            color: #ea580c;
            padding: 6px 14px;
            border-radius: 15px;
            font-size: 8pt;
            font-weight: 600;
            border: 1px solid #fdba74;
        }
        
        @media print {
            body { 
                background: #ffffff;
                padding: 0;
                min-height: auto;
            }
            .container {
                box-shadow: none;
            }
            .header {
                background: #faf8f5 !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="name">${data.personalInfo.name}</div>
            <div class="title">${data.personalInfo.jobTitle || 'Executive Leader'}</div>
            <div class="contact">
                <div class="contact-item">✉️ ${data.personalInfo.email}</div>
                <div class="contact-item">📞 ${data.personalInfo.phone}</div>
                <div class="contact-item">📍 ${data.personalInfo.location}</div>
                ${data.personalInfo.linkedin ? `<div class="contact-item">💼 LinkedIn</div>` : ''}
                ${data.personalInfo.github ? `<div class="contact-item">💻 GitHub</div>` : ''}
                ${data.personalInfo.portfolio ? `<div class="contact-item">🌐 Portfolio</div>` : ''}
            </div>
        </div>
        
        <div class="content">
            ${data.summary ? `
            <div class="section-title">Executive Summary</div>
            <div class="summary">${data.summary}</div>
            ` : ''}
            
            <div class="section-title">Professional Experience</div>
            ${data.experience.map(job => `
                <div class="job">
                    <div class="job-header">
                        <div class="job-title">${job.title}</div>
                        <div class="job-company">${job.company}</div>
                        <div class="job-meta">${job.startDate} - ${job.endDate} | ${job.location}</div>
                    </div>
                    <ul class="job-description">
                        ${job.description.map(item => `<li>${item}</li>`).join('')}
                        ${job.achievements.map(ach => `<li>${ach}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
            
            <div class="section-title">Education</div>
            ${data.education.map(edu => `
                <div class="education-item">
                    <div class="degree">${edu.degree}</div>
                    <div class="school">${edu.school}</div>
                    <div class="edu-meta">${edu.location} | ${edu.graduationDate}</div>
                    ${edu.gpa ? `<div class="edu-meta">GPA: ${edu.gpa}</div>` : ''}
                    ${edu.honors && edu.honors.length > 0 ? `<div class="edu-meta">${edu.honors.join(', ')}</div>` : ''}
                </div>
            `).join('')}
            
            <div class="section-title">Core Competencies</div>
            <div class="skills-container">
                <div class="skill-group">
                    <h4>💼 Leadership Skills</h4>
                    <div class="skill-tags">
                        ${data.skills.technical.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
                <div class="skill-group">
                    <h4>🎯 Strategic Skills</h4>
                    <div class="skill-tags">
                        ${data.skills.soft.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
                ${data.skills.languages && data.skills.languages.length > 0 ? `
                <div class="skill-group">
                    <h4>🌐 Languages</h4>
                    <div class="skill-tags">
                        ${data.skills.languages.map(lang => `<span class="skill-tag">${lang}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
                ${data.skills.certifications && data.skills.certifications.length > 0 ? `
                <div class="skill-group">
                    <h4>🏆 Certifications</h4>
                    <div class="skill-tags">
                        ${data.skills.certifications.map(cert => `<span class="skill-tag">${cert}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>

            ${data.projects && data.projects.length > 0 ? `
            <div class="section-title">Key Initiatives</div>
            <div class="projects-grid">
                ${data.projects.map(project => `
                    <div class="project-item">
                        <div class="project-name">${project.name}</div>
                        <div class="project-description">${project.description}</div>
                        <div class="project-tech">
                            ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            ${data.publications && data.publications.length > 0 ? `
            <div class="section-title">Publications</div>
            ${data.publications.map(pub => `
                <div class="education-item">
                    <div class="degree">${pub.title}</div>
                    <div class="school">${pub.authors}</div>
                    <div class="edu-meta">${pub.journal || pub.conference} | ${pub.year}</div>
                    ${pub.doi ? `<div class="edu-meta">DOI: ${pub.doi}</div>` : ''}
                </div>
            `).join('')}
            ` : ''}

            ${data.training && data.training.length > 0 ? `
            <div class="section-title">Professional Development</div>
            ${data.training.map(training => `
                <div class="education-item">
                    <div class="degree">${training.name}</div>
                    <div class="school">${training.provider}</div>
                    <div class="edu-meta">Completed: ${training.completionDate}</div>
                    ${training.credentialId ? `<div class="edu-meta">Credential ID: ${training.credentialId}</div>` : ''}
                </div>
            `).join('')}
            ` : ''}
        </div>
    </div>
</body>
</html>
    `
  },

  generateMarkdown: (data: ResumeData) => {
    return `
# ${data.personalInfo.name}
${data.personalInfo.email} | ${data.personalInfo.phone} | ${data.personalInfo.location}${data.personalInfo.github ? ` | ${data.personalInfo.github}` : ''}${data.personalInfo.linkedin ? ` | ${data.personalInfo.linkedin}` : ''}${data.personalInfo.portfolio ? ` | ${data.personalInfo.portfolio}` : ''}

## PROFESSIONAL SUMMARY
${data.summary}

## PROFESSIONAL EXPERIENCE
${data.experience.map(job => `
**${job.title} | ${job.company}**
${job.startDate} - ${job.endDate} | ${job.location}
${job.description.map(item => `- ${item}`).join('\n')}
${job.achievements.map(ach => `- ${ach}`).join('\n')}
`).join('\n')}

## EDUCATION
${data.education.map(edu => `
**${edu.degree}**
${edu.school}${edu.location ? `, ${edu.location}` : ''} | ${edu.graduationDate}
${edu.gpa ? `GPA: ${edu.gpa}` : ''}
`).join('\n')}

## SKILLS
- Technical: ${data.skills.technical.join(', ')}
- Soft Skills: ${data.skills.soft.join(', ')}
${data.skills.languages && data.skills.languages.length > 0 ? `- Languages: ${data.skills.languages.join(', ')}` : ''}
${data.skills.certifications && data.skills.certifications.length > 0 ? `- Certifications: ${data.skills.certifications.join(', ')}` : ''}

${data.projects && data.projects.length > 0 ? `## PROJECTS
${data.projects.map(project => `**${project.name}**\n${project.description}\nTechnologies: ${project.technologies.join(', ')}`).join('\n\n')}` : ''}

${data.publications && data.publications.length > 0 ? `## PUBLICATIONS
${data.publications.map(pub => `
**${pub.title}**
${pub.authors} | ${pub.journal || pub.conference} | ${pub.year}
${pub.doi ? `DOI: ${pub.doi}` : ''}${pub.link ? `\nLink: ${pub.link}` : ''}
`).join('\n')}` : ''}

${data.training && data.training.length > 0 ? `## TRAINING & CERTIFICATIONS
${data.training.map(training => `
**${training.name}**
${training.provider} | Completed: ${training.completionDate}
${training.expirationDate ? `Expires: ${training.expirationDate}` : ''}${training.credentialId ? `\nCredential ID: ${training.credentialId}` : ''}${training.link ? `\nVerification: ${training.link}` : ''}
`).join('\n')}` : ''}
`
  }
}

// Creative Template (Artistic and elegant design)
export const creativeTemplate: ResumeTemplate = {
  id: 'creative-template',
  name: 'Creative',
  description: 'Artistic, elegant design with soft colors and creative layouts for creative professionals',
  category: 'creative',
  atsOptimized: true,
  
  generateHTML: (data: ResumeData) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.personalInfo.name} - Creative Resume</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Dancing+Script:wght@400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #2d3748;
            background: radial-gradient(circle at top right, #fdf2f8 0%, #f8fafc 30%, #f0f9ff 70%, #f5f3ff 100%);
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0;
            font-size: 11pt;
            line-height: 1.6;
            min-height: 100vh;
        }
        
        .container {
            background: #ffffff;
            box-shadow: 0 20px 60px rgba(0,0,0,0.12);
            border-radius: 32px;
            overflow: hidden;
            min-height: 100vh;
            position: relative;
            margin: 20px;
        }
        
        .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(90deg, #ec4899 0%, #8b5cf6 25%, #06b6d4 50%, #10b981 75%, #f59e0b 100%);
        }
        
        .side-panel {
            position: absolute;
            left: 0;
            top: 0;
            width: 35%;
            height: 100%;
            background: linear-gradient(145deg, #fdf2f8 0%, #f8fafc 50%, #eff6ff 100%);
            padding: 50px 40px;
            z-index: 1;
        }
        
        .side-panel::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 2px;
            height: 100%;
            background: linear-gradient(180deg, #ec4899 0%, #8b5cf6 25%, #06b6d4 50%, #10b981 75%, #f59e0b 100%);
        }
        
        .main-content {
            margin-left: 35%;
            padding: 50px 50px 60px;
            min-height: 100vh;
        }
        
        .profile-section {
            text-align: center;
            margin-bottom: 40px;
            position: relative;
        }
        
        .name {
            font-family: 'Dancing Script', cursive;
            font-size: 36pt;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 8px;
            letter-spacing: 1px;
            background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .title {
            font-size: 14pt;
            font-weight: 500;
            color: #6b7280;
            margin-bottom: 25px;
            letter-spacing: 0.5px;
        }
        
        .contact-section {
            margin-bottom: 35px;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            padding: 10px 16px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 20px;
            border: 1px solid rgba(139, 92, 246, 0.1);
            backdrop-filter: blur(10px);
            font-size: 9pt;
            color: #4a5568;
        }
        
        .sidebar-section {
            margin-bottom: 35px;
        }
        
        .sidebar-title {
            font-family: 'Dancing Script', cursive;
            font-size: 20pt;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 18px;
            text-align: center;
            background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .skill-item {
            margin-bottom: 15px;
        }
        
        .skill-name {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 6px;
            font-size: 10pt;
        }
        
        .skill-bar {
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 20px;
            overflow: hidden;
            border: 1px solid rgba(139, 92, 246, 0.1);
        }
        
        .skill-fill {
            height: 100%;
            background: linear-gradient(90deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%);
            border-radius: 20px;
            transition: width 2s ease;
        }
        
        .section-title {
            font-family: 'Dancing Script', cursive;
            font-size: 24pt;
            font-weight: 600;
            color: #1a202c;
            margin-top: 40px;
            margin-bottom: 25px;
            position: relative;
            background: linear-gradient(135deg, #10b981 0%, #f59e0b 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .section-title:first-of-type {
            margin-top: 0;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 0;
            width: 100px;
            height: 3px;
            background: linear-gradient(90deg, #10b981 0%, #f59e0b 100%);
            border-radius: 2px;
        }
        
        .summary {
            background: linear-gradient(135deg, #fef7ff 0%, #f0f9ff 100%);
            border: 2px solid transparent;
            background-clip: padding-box;
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            font-style: italic;
            line-height: 1.7;
            color: #4a5568;
            position: relative;
            box-shadow: 0 8px 30px rgba(139, 92, 246, 0.1);
        }
        
        .summary::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%);
            border-radius: 22px;
            z-index: -1;
        }
        
        .job {
            margin-bottom: 35px;
            padding: 28px;
            background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%);
            border-radius: 20px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.06);
            border: 1px solid #f7fafc;
            position: relative;
            overflow: hidden;
        }
        
        .job::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 6px;
            height: 100%;
            background: linear-gradient(180deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%);
            border-radius: 0 20px 20px 0;
        }
        
        .job-title {
            font-weight: 700;
            font-size: 15pt;
            color: #1a202c;
            margin-bottom: 6px;
            line-height: 1.3;
        }
        
        .job-company {
            font-weight: 600;
            color: #8b5cf6;
            font-size: 12pt;
            margin-bottom: 8px;
        }
        
        .job-meta {
            color: #6b7280;
            font-size: 10pt;
            margin-bottom: 16px;
            background: #f8fafc;
            padding: 8px 16px;
            border-radius: 15px;
            display: inline-block;
            border: 1px solid #e2e8f0;
        }
        
        .job-description {
            padding-left: 0;
            margin-top: 16px;
        }
        
        .job-description li {
            margin-bottom: 8px;
            list-style: none;
            position: relative;
            padding-left: 28px;
            line-height: 1.5;
            color: #4a5568;
        }
        
        .job-description li::before {
            content: '✨';
            position: absolute;
            left: 0;
            top: 0;
            font-size: 12pt;
        }
        
        .education-item {
            margin-bottom: 25px;
            padding: 25px;
            background: linear-gradient(135deg, #f0f9ff 0%, #fef7ff 100%);
            border-radius: 20px;
            border: 1px solid #e0f2fe;
            position: relative;
            box-shadow: 0 4px 20px rgba(6, 182, 212, 0.08);
        }
        
        .education-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 6px;
            height: 100%;
            background: linear-gradient(180deg, #06b6d4 0%, #10b981 100%);
            border-radius: 20px 0 0 20px;
        }
        
        .degree {
            font-weight: 700;
            font-size: 13pt;
            color: #1a202c;
            margin-bottom: 6px;
        }
        
        .school {
            color: #0891b2;
            font-weight: 600;
            font-size: 11pt;
            margin-bottom: 8px;
        }
        
        .edu-meta {
            color: #6b7280;
            font-size: 10pt;
            line-height: 1.4;
        }
        
        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
            margin-top: 20px;
        }
        
        .project-item {
            background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%);
            padding: 25px;
            border-radius: 20px;
            border: 1px solid #f7fafc;
            box-shadow: 0 6px 25px rgba(0,0,0,0.05);
            position: relative;
            overflow: hidden;
            transition: transform 0.3s ease;
        }
        
        .project-item:hover {
            transform: translateY(-5px);
        }
        
        .project-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 6px;
            height: 100%;
            background: linear-gradient(180deg, #f59e0b 0%, #ef4444 100%);
            border-radius: 0 20px 20px 0;
        }
        
        .project-name {
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 12px;
            font-size: 12pt;
        }
        
        .project-description {
            color: #6b7280;
            margin-bottom: 16px;
            line-height: 1.5;
            font-size: 10pt;
        }
        
        .project-tech {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .tech-tag {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            color: #d97706;
            padding: 6px 14px;
            border-radius: 15px;
            font-size: 8pt;
            font-weight: 600;
            border: 1px solid #fcd34d;
        }
        
        @media print {
            body { 
                background: #ffffff;
                padding: 0;
                min-height: auto;
            }
            .container {
                box-shadow: none;
                border-radius: 0;
                margin: 0;
            }
            .side-panel {
                background: #f8fafc !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
        }
        
        @media (max-width: 768px) {
            .side-panel {
                position: relative;
                width: 100%;
                height: auto;
            }
            .main-content {
                margin-left: 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="side-panel">
            <div class="profile-section">
                <div class="name">${data.personalInfo.name}</div>
                <div class="title">${data.personalInfo.jobTitle || 'Creative Professional'}</div>
            </div>
            
            <div class="contact-section">
                <div class="sidebar-title">Contact</div>
                <div class="contact-item">✉️ ${data.personalInfo.email}</div>
                <div class="contact-item">📱 ${data.personalInfo.phone}</div>
                <div class="contact-item">📍 ${data.personalInfo.location}</div>
                ${data.personalInfo.linkedin ? `<div class="contact-item">💼 LinkedIn</div>` : ''}
                ${data.personalInfo.github ? `<div class="contact-item">💻 GitHub</div>` : ''}
                ${data.personalInfo.portfolio ? `<div class="contact-item">🌐 Portfolio</div>` : ''}
            </div>
            
            <div class="sidebar-section">
                <div class="sidebar-title">Skills</div>
                ${data.skills.technical.slice(0, 6).map((skill, index) => `
                    <div class="skill-item">
                        <div class="skill-name">${skill}</div>
                        <div class="skill-bar">
                            <div class="skill-fill" style="width: ${90 - index * 5}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            ${data.skills.languages && data.skills.languages.length > 0 ? `
            <div class="sidebar-section">
                <div class="sidebar-title">Languages</div>
                ${data.skills.languages.map((lang, index) => `
                    <div class="skill-item">
                        <div class="skill-name">${lang}</div>
                        <div class="skill-bar">
                            <div class="skill-fill" style="width: ${85 - index * 10}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}
        </div>
        
        <div class="main-content">
            ${data.summary ? `
            <div class="section-title">About Me</div>
            <div class="summary">${data.summary}</div>
            ` : ''}
            
            <div class="section-title">Experience</div>
            ${data.experience.map(job => `
                <div class="job">
                    <div class="job-title">${job.title}</div>
                    <div class="job-company">${job.company}</div>
                    <div class="job-meta">${job.startDate} - ${job.endDate} | ${job.location}</div>
                    <ul class="job-description">
                        ${job.description.map(item => `<li>${item}</li>`).join('')}
                        ${job.achievements.map(ach => `<li>${ach}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
            
            <div class="section-title">Education</div>
            ${data.education.map(edu => `
                <div class="education-item">
                    <div class="degree">${edu.degree}</div>
                    <div class="school">${edu.school}</div>
                    <div class="edu-meta">${edu.location} | ${edu.graduationDate}</div>
                    ${edu.gpa ? `<div class="edu-meta">GPA: ${edu.gpa}</div>` : ''}
                    ${edu.honors && edu.honors.length > 0 ? `<div class="edu-meta">${edu.honors.join(', ')}</div>` : ''}
                </div>
            `).join('')}
            
            ${data.projects && data.projects.length > 0 ? `
            <div class="section-title">Projects</div>
            <div class="projects-grid">
                ${data.projects.map(project => `
                    <div class="project-item">
                        <div class="project-name">${project.name}</div>
                        <div class="project-description">${project.description}</div>
                        <div class="project-tech">
                            ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            ${data.publications && data.publications.length > 0 ? `
            <div class="section-title">Publications</div>
            ${data.publications.map(pub => `
                <div class="education-item">
                    <div class="degree">${pub.title}</div>
                    <div class="school">${pub.authors}</div>
                    <div class="edu-meta">${pub.journal || pub.conference} | ${pub.year}</div>
                    ${pub.doi ? `<div class="edu-meta">DOI: ${pub.doi}</div>` : ''}
                </div>
            `).join('')}
            ` : ''}

            ${data.training && data.training.length > 0 ? `
            <div class="section-title">Certifications</div>
            ${data.training.map(training => `
                <div class="education-item">
                    <div class="degree">${training.name}</div>
                    <div class="school">${training.provider}</div>
                    <div class="edu-meta">Completed: ${training.completionDate}</div>
                    ${training.credentialId ? `<div class="edu-meta">Credential ID: ${training.credentialId}</div>` : ''}
                </div>
            `).join('')}
            ` : ''}
        </div>
    </div>
</body>
</html>
    `
  },

  generateMarkdown: (data: ResumeData) => {
    return `
# ${data.personalInfo.name}
**${data.personalInfo.jobTitle || 'Creative Professional'}**

✉️ ${data.personalInfo.email} | 📱 ${data.personalInfo.phone} | 📍 ${data.personalInfo.location}${data.personalInfo.linkedin ? ` | 💼 LinkedIn` : ''}${data.personalInfo.github ? ` | 💻 GitHub` : ''}${data.personalInfo.portfolio ? ` | 🌐 Portfolio` : ''}

${data.summary ? `## About Me\n${data.summary}\n` : ''}

## Experience
${data.experience.map(job => `
**${job.title} | ${job.company}**
${job.startDate} - ${job.endDate} | ${job.location}
${job.description.map(item => `✨ ${item}`).join('\n')}
${job.achievements.map(ach => `✨ ${ach}`).join('\n')}
`).join('\n')}

## Education
${data.education.map(edu => `
**${edu.degree}**
${edu.school} | ${edu.location} | ${edu.graduationDate}
${edu.gpa ? `GPA: ${edu.gpa}` : ''}
${edu.honors && edu.honors.length > 0 ? edu.honors.join(', ') : ''}
`).join('\n')}

## Skills
- **Technical:** ${data.skills.technical.join(', ')}
- **Soft Skills:** ${data.skills.soft.join(', ')}
${data.skills.languages && data.skills.languages.length > 0 ? `- **Languages:** ${data.skills.languages.join(', ')}` : ''}
${data.skills.certifications && data.skills.certifications.length > 0 ? `- **Certifications:** ${data.skills.certifications.join(', ')}` : ''}

${data.projects && data.projects.length > 0 ? `## Projects\n${data.projects.map(project => `**${project.name}**\n${project.description}\nTechnologies: ${project.technologies.join(', ')}`).join('\n\n')}` : ''}

${data.publications && data.publications.length > 0 ? `## Publications
${data.publications.map(pub => `
**${pub.title}**
${pub.authors} | ${pub.journal || pub.conference} | ${pub.year}
${pub.doi ? `DOI: ${pub.doi}` : ''}${pub.link ? `\nLink: ${pub.link}` : ''}
`).join('\n')}` : ''}

${data.training && data.training.length > 0 ? `## Certifications
${data.training.map(training => `
**${training.name}**
${training.provider} | Completed: ${training.completionDate}
${training.expirationDate ? `Expires: ${training.expirationDate}` : ''}${training.credentialId ? `\nCredential ID: ${training.credentialId}` : ''}${training.link ? `\nVerification: ${training.link}` : ''}
`).join('\n')}` : ''}
`
  }
}

// All available templates
export const allTemplates: ResumeTemplate[] = [
  yourResumeTemplate,
  modernTemplate,
  modernTechTemplate,
  executiveLeadershipTemplate,
  creativeTemplate
]

// Helper functions
export const getTemplateById = (id: string): ResumeTemplate | undefined => {
  return allTemplates.find(template => template.id === id)
}

export const getTemplatesByCategory = (category: string): ResumeTemplate[] => {
  return allTemplates.filter(template => template.category === category)
}

export const optimizeResumeForJob = (
  resumeData: ResumeData, 
  jobDescription: string, 
  templateId: string = 'your-resume-style'
): { optimizedData: ResumeData; suggestions: string[] } => {
  // Check both HTML and LaTeX templates
  const htmlTemplate = getTemplateById(templateId)
  
  // Import LaTeX templates to check if it's a LaTeX template
  let isLatexTemplate = false
  try {
    const { getLatexTemplate } = require('./latex-templates')
    const latexTemplate = getLatexTemplate(templateId)
    if (latexTemplate) {
      isLatexTemplate = true
    }
  } catch (error) {
    // LaTeX templates module might not be available, continue with HTML templates only
  }
  
  // If neither HTML nor LaTeX template found, throw error
  if (!htmlTemplate && !isLatexTemplate) {
    throw new Error(`Template with id ${templateId} not found`)
  }

  // Extract keywords from job description
  const jobKeywords = extractJobKeywords(jobDescription)
  
  // Create optimized version
  const optimizedData = { ...resumeData }
  const suggestions: string[] = []

  // Add relevant keywords to skills if missing
  jobKeywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase()
    const hasKeyword = resumeData.skills.technical.some(skill => 
      skill.toLowerCase().includes(keywordLower)
    ) || resumeData.skills.soft.some(skill => 
      skill.toLowerCase().includes(keywordLower)
    )

    if (!hasKeyword) {
      suggestions.push(`Consider adding "${keyword}" to your skills if you have experience with it`)
    }
  })

  return { optimizedData, suggestions }
}

const extractJobKeywords = (jobDescription: string): string[] => {
  const commonTechKeywords = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker',
    'Kubernetes', 'Git', 'Agile', 'Scrum', 'Machine Learning', 'AI', 'Data Science',
    'TypeScript', 'Angular', 'Vue.js', 'MongoDB', 'PostgreSQL', 'Redis', 'GraphQL'
  ]

  return commonTechKeywords.filter(keyword => 
    jobDescription.toLowerCase().includes(keyword.toLowerCase())
  )
} 