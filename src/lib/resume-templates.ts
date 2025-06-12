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
  description: 'Clean, professional academic-style resume with precise formatting and typography',
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
            font-family: 'Times New Roman', serif;
            color: #000;
            background: #fff;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.75in;
            font-size: 11pt;
            line-height: 1.4;
        }
        
        .last-updated {
            text-align: right;
            font-size: 9pt;
            color: #999;
            font-style: italic;
            margin-bottom: 30px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 35px;
        }
        
        .name {
            font-size: 32pt;
            font-weight: bold;
            margin-bottom: 15px;
            letter-spacing: 2px;
        }
        
        .contact {
            font-size: 11pt;
            color: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .section-title {
            font-size: 14pt;
            font-weight: bold;
            margin-top: 25px;
            margin-bottom: 12px;
            border-bottom: 1px solid #000;
            padding-bottom: 3px;
        }
        
        .summary {
            margin-bottom: 20px;
            text-align: justify;
            line-height: 1.5;
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
            font-size: 12pt;
        }
        
        .job-location-date {
            font-style: italic;
            font-size: 11pt;
            color: #333;
        }
        
        .job-company {
            font-style: italic;
            font-size: 11pt;
            margin-bottom: 8px;
        }
        
        .job-description {
            margin-left: 20px;
            padding-left: 0;
        }
        
        .job-description li {
            margin-bottom: 4px;
            list-style-type: disc;
            line-height: 1.3;
        }
        
        .edu-section {
            margin-bottom: 20px;
        }
        
        .edu-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 3px;
        }
        
        .school-name {
            font-weight: bold;
            font-size: 12pt;
        }
        
        .edu-date {
            font-style: italic;
            font-size: 11pt;
            color: #333;
        }
        
        .degree {
            font-style: italic;
            font-size: 11pt;
            margin-bottom: 5px;
        }
        
        .edu-details {
            margin-left: 20px;
        }
        
        .edu-details li {
            margin-bottom: 2px;
            list-style-type: disc;
        }
        
        .tech-section {
            margin-bottom: 15px;
        }
        
        .tech-category {
            margin-bottom: 8px;
        }
        
        .tech-label {
            font-weight: bold;
            display: inline;
        }
        
        .tech-list {
            display: inline;
            margin-left: 5px;
        }
        
        @media print {
            body { 
                padding: 0.5in;
            }
        }
    </style>
</head>
<body>
    <div class="last-updated">Last updated in ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
    
    <div class="header">
        <div class="name">${data.personalInfo.name}</div>
        <div class="contact">
            <div class="contact-item">📍 ${data.personalInfo.location}</div>
            <div class="contact-item">✉ ${data.personalInfo.email}</div>
            <div class="contact-item">📱 ${data.personalInfo.phone}</div>
            ${data.personalInfo.linkedin ? `<div class="contact-item">💼 ${data.personalInfo.linkedin.replace('https://linkedin.com/in/', '').replace('https://www.linkedin.com/in/', '')}</div>` : ''}
            ${data.personalInfo.github ? `<div class="contact-item">🔗 ${data.personalInfo.github.replace('https://github.com/', '').replace('https://www.github.com/', '')}</div>` : ''}
        </div>
    </div>

    ${data.summary ? `
    <div class="section-title">Professional Summary</div>
    <div class="summary">${data.summary}</div>
    ` : ''}

    <div class="section-title">Education</div>
    ${data.education.map(edu => `
        <div class="edu-section">
            <div class="edu-header">
                <div class="school-name">${edu.school}</div>
                <div class="edu-date">${edu.graduationDate}</div>
            </div>
            <div class="degree">${edu.degree}</div>
            ${edu.gpa || (edu.honors && edu.honors.length > 0) ? `
            <ul class="edu-details">
                ${edu.gpa ? `<li><strong>GPA:</strong> ${edu.gpa}</li>` : ''}
                ${edu.honors && edu.honors.length > 0 ? `<li><strong>Coursework:</strong> ${edu.honors.join(', ')}</li>` : ''}
            </ul>
            ` : ''}
        </div>
    `).join('')}

    <div class="section-title">Skills</div>
    <div class="tech-section">
        <div class="tech-category">
            <span class="tech-label">Technical:</span>
            <span class="tech-list">${data.skills.technical.join(', ')}</span>
        </div>
        <div class="tech-category">
            <span class="tech-label">Soft Skills:</span>
            <span class="tech-list">${data.skills.soft.join(', ')}</span>
        </div>
        ${data.skills.languages && data.skills.languages.length > 0 ? `
        <div class="tech-category">
            <span class="tech-label">Languages:</span>
            <span class="tech-list">${data.skills.languages.join(', ')}</span>
        </div>
        ` : ''}
        ${data.skills.certifications && data.skills.certifications.length > 0 ? `
        <div class="tech-category">
            <span class="tech-label">Certifications:</span>
            <span class="tech-list">${data.skills.certifications.join(', ')}</span>
        </div>
        ` : ''}
    </div>

    <div class="section-title">Experience</div>
    ${data.experience.map(job => `
        <div class="job">
            <div class="job-header">
                <div class="job-title">${job.title}</div>
                <div class="job-location-date">${job.location}</div>
            </div>
            <div class="job-company">${job.company}</div>
            <div class="job-location-date" style="margin-bottom: 8px;">${job.startDate} – ${job.endDate}</div>
            <ul class="job-description">
                ${job.description.map(item => `<li>${item}</li>`).join('')}
                ${job.achievements.map(ach => `<li>${ach}</li>`).join('')}
            </ul>
        </div>
    `).join('')}

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
`
  }
}

// Executive Leadership Template (Sophisticated and formal)
export const executiveLeadershipTemplate: ResumeTemplate = {
  id: 'executive-leadership',
  name: 'Executive Leadership',
  description: 'Sophisticated, formal design for C-level executives and senior leadership positions',
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
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            color: #2c3e50;
            background: #fff;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.75in;
            font-size: 11pt;
        }
        .name {
            font-size: 28pt;
            font-weight: normal;
            color: #2c3e50;
            margin-bottom: 8px;
            letter-spacing: 1.5px;
            text-transform: uppercase;
        }
        .contact {
            font-size: 11pt;
            color: #7f8c8d;
            margin-bottom: 18px;
        }
        .section-title {
            font-size: 13pt;
            font-weight: normal;
            margin-top: 28px;
            margin-bottom: 8px;
            letter-spacing: 1px;
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 2px;
            text-transform: uppercase;
            color: #2c3e50;
        }
        .summary {
            margin-bottom: 18px;
            font-style: italic;
            color: #34495e;
        }
        .job {
            margin-bottom: 16px;
        }
        .job-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
        }
        .job-meta {
            font-size: 10pt;
            color: #95a5a6;
            margin-bottom: 2px;
        }
        .job-description {
            margin-left: 18px;
            margin-bottom: 0;
        }
        .edu-item {
            margin-bottom: 10px;
        }
        .degree {
            font-weight: bold;
            color: #2c3e50;
        }
        .edu-meta {
            font-size: 10pt;
            color: #7f8c8d;
        }
        .skills-list {
            margin-left: 0;
            padding-left: 0;
            list-style: none;
        }
        .skills-list li {
            display: inline-block;
            margin-right: 18px;
        }
    </style>
</head>
<body>
    <div class="name">${data.personalInfo.name}</div>
    <div class="contact">
        ${data.personalInfo.email} | ${data.personalInfo.phone} | ${data.personalInfo.location}
        ${data.personalInfo.github ? `| ${data.personalInfo.github}` : ''}
        ${data.personalInfo.linkedin ? `| ${data.personalInfo.linkedin}` : ''}
        ${data.personalInfo.portfolio ? `| ${data.personalInfo.portfolio}` : ''}
    </div>
    <div class="section-title">Professional Summary</div>
    <div class="summary">${data.summary}</div>
    <div class="section-title">Professional Experience</div>
    ${data.experience.map(job => `
        <div class="job">
            <div class="job-header">
                <span>${job.title} | ${job.company}</span>
                <span>${job.startDate} - ${job.endDate} | ${job.location}</span>
            </div>
            <ul class="job-description">
                ${job.description.map(item => `<li>${item}</li>`).join('')}
                ${job.achievements.map(ach => `<li>${ach}</li>`).join('')}
            </ul>
        </div>
    `).join('')}
    <div class="section-title">Education</div>
    ${data.education.map(edu => `
        <div class="edu-item">
            <div class="degree">${edu.degree}</div>
            <div class="edu-meta">${edu.school}${edu.location ? `, ${edu.location}` : ''} | ${edu.graduationDate}</div>
            ${edu.gpa ? `<div class="edu-meta">GPA: ${edu.gpa}</div>` : ''}
        </div>
    `).join('')}
    <div class="section-title">Skills</div>
    <div><strong>Technical:</strong> ${data.skills.technical.join(', ')}</div>
    <div><strong>Soft Skills:</strong> ${data.skills.soft.join(', ')}</div>
    ${data.skills.languages && data.skills.languages.length > 0 ? `<div><strong>Languages:</strong> ${data.skills.languages.join(', ')}</div>` : ''}
    ${data.skills.certifications && data.skills.certifications.length > 0 ? `<div><strong>Certifications:</strong> ${data.skills.certifications.join(', ')}</div>` : ''}
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
`
  }
}

// All available templates
export const allTemplates: ResumeTemplate[] = [
  yourResumeTemplate,
  modernTechTemplate,
  executiveLeadershipTemplate
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