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
  generateHTML: (data: ResumeData, jobDescription?: string) => string
  generateMarkdown: (data: ResumeData, jobDescription?: string) => string
}

// Your Resume Template (Based on the image you showed me)
export const yourResumeTemplate: ResumeTemplate = {
  id: 'your-resume-style',
  name: 'Classic Resume Style',
  description: 'Clean, professional academic-style resume with precise formatting and typography',
  category: 'classic',
  atsOptimized: true,
  
  generateHTML: (data: ResumeData, jobDescription?: string) => {
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
            background: white;
            margin: 0;
            padding: 0;
        }
        body { 
            font-family: 'Times New Roman', serif; 
            line-height: 1.4; 
            color: #000000; 
            max-width: 8.5in; 
            margin: 0 auto; 
            padding: 0.75in;
            background: white;
            font-size: 11pt;
        }
        
        .last-updated {
            text-align: right;
            font-size: 9pt;
            color: #666;
            font-style: italic;
            margin-bottom: 15px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 25px;
        }
        
        .name {
            font-size: 28pt;
            font-weight: bold;
            margin-bottom: 12px;
            letter-spacing: 1px;
        }
        
        .contact-info {
            font-size: 11pt;
            color: #000;
            margin-bottom: 8px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 15px;
        }
        
        .contact-info .icon {
            font-size: 10pt;
            margin-right: 3px;
        }
        
        .contact-links {
            font-size: 11pt;
            color: #0066cc;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 15px;
        }
        
        .contact-links a {
            color: #0066cc;
            text-decoration: none;
        }
        
        .contact-links .icon {
            font-size: 10pt;
            margin-right: 3px;
        }
        
        .section {
            margin-bottom: 20px;
        }
        
        .section-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 10px;
            padding-bottom: 3px;
            border-bottom: 1px solid #000;
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
            font-size: 12pt;
        }
        
        .date-range {
            font-style: italic;
            font-size: 11pt;
            color: #333;
        }
        
        .school {
            font-style: italic;
            font-size: 11pt;
            margin-bottom: 3px;
        }
        
        .education-details {
            font-size: 11pt;
            margin-left: 20px;
        }
        
        .education-details li {
            margin-bottom: 2px;
            list-style-type: disc;
        }
        
        .technologies-section {
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
        
        .ml-frameworks {
            margin-bottom: 8px;
        }
        
        .ml-frameworks .tech-label {
            font-weight: bold;
        }
        
        .job {
            margin-bottom: 18px;
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
        
        .job-location {
            font-style: italic;
            font-size: 11pt;
            color: #333;
        }
        
        .company-date {
            font-style: italic;
            font-size: 11pt;
            color: #333;
            margin-bottom: 8px;
        }
        
        .job-description {
            margin-left: 20px;
            padding-left: 0;
        }
        
        .job-description li {
            margin-bottom: 4px;
            list-style-type: disc;
            font-size: 11pt;
            line-height: 1.3;
        }
        
        .page-number {
            text-align: center;
            font-size: 10pt;
            color: #666;
            margin-top: 30px;
            font-style: italic;
        }
        
        .publication-item {
            margin-bottom: 15px;
        }
        
        .publication-title {
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 3px;
        }
        
        .publication-authors {
            font-style: italic;
            font-size: 11pt;
            margin-bottom: 3px;
        }
        
        .publication-venue {
            font-size: 11pt;
            color: #333;
        }
        
        .publication-venue a {
            color: #0066cc;
            text-decoration: none;
        }
        
        .training-item {
            margin-bottom: 15px;
        }
        
        .training-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 3px;
        }
        
        .training-name {
            font-weight: bold;
            font-size: 12pt;
        }
        
        .training-date {
            font-style: italic;
            font-size: 11pt;
            color: #333;
        }
        
        .training-provider {
            font-style: italic;
            font-size: 11pt;
            margin-bottom: 3px;
        }
        
        .training-details {
            font-size: 11pt;
            color: #333;
        }
        
        .training-details a {
            color: #0066cc;
            text-decoration: none;
        }
        
        @media print {
            html {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            body { 
                background: white !important; 
                color: #000000 !important; 
                padding: 0.5in !important;
            }
            .page-number { 
                position: fixed; 
                bottom: 0.3in; 
                left: 50%; 
                transform: translateX(-50%); 
            }
        }
    </style>
</head>
<body>    
    <div class="header">
        <div class="name">${data.personalInfo.name}</div>
        <div class="contact-info">
            <span><span class="icon">📍</span>${data.personalInfo.location}</span>
            <span><span class="icon">✉</span>${data.personalInfo.email}</span>
            <span><span class="icon">📱</span>${data.personalInfo.phone}</span>
        </div>
        <div class="contact-links">
            ${data.personalInfo.linkedin ? `<span><span class="icon">💼</span><a href="${data.personalInfo.linkedin}">${data.personalInfo.linkedin.replace('https://', '').replace('http://', '')}</a></span>` : ''}
            ${data.personalInfo.github ? `<span><span class="icon">🔗</span><a href="${data.personalInfo.github}">${data.personalInfo.github.replace('https://', '').replace('http://', '')}</a></span>` : ''}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Education</div>
        ${data.education.map(edu => `
            <div class="education-item">
                <div class="education-header">
                    <div class="degree">${edu.school}</div>
                    <div class="date-range">${edu.graduationDate}</div>
                </div>
                <div class="school">${edu.degree}</div>
                ${edu.gpa || edu.honors ? `
                <ul class="education-details">
                    ${edu.gpa ? `<li><strong>GPA:</strong> ${edu.gpa}</li>` : ''}
                    ${edu.honors && edu.honors.length > 0 ? `<li><strong>Coursework:</strong> ${edu.honors.join(', ')}</li>` : ''}
                </ul>
                ` : ''}
            </div>
        `).join('')}
    </div>

    <div class="section">
        <div class="section-title">Technologies</div>
        <div class="technologies-section">
            <div class="tech-category">
                <span class="tech-label">Languages:</span>
                <span class="tech-list">${data.skills.technical.filter(skill => 
                    ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'TypeScript', 'Go', 'Rust', 'PHP', 'Ruby', 'R', 'MATLAB', 'SQL'].some(lang => 
                        skill.toLowerCase().includes(lang.toLowerCase())
                    )
                ).join(', ')}</span>
            </div>
            <div class="tech-category">
                <span class="tech-label">Technologies:</span>
                <span class="tech-list">${data.skills.technical.filter(skill => 
                    !['Python', 'JavaScript', 'Java', 'C++', 'C#', 'TypeScript', 'Go', 'Rust', 'PHP', 'Ruby', 'R', 'MATLAB', 'SQL'].some(lang => 
                        skill.toLowerCase().includes(lang.toLowerCase())
                    ) && !['TensorFlow', 'PyTorch', 'Scikit-learn', 'Hugging-face'].some(ml => 
                        skill.toLowerCase().includes(ml.toLowerCase())
                    )
                ).join(', ')}</span>
            </div>
            <div class="ml-frameworks">
                <span class="tech-label">ML Frameworks:</span>
                <span class="tech-list">${data.skills.technical.filter(skill => 
                    ['TensorFlow', 'PyTorch', 'Scikit-learn', 'Hugging-face', 'Keras', 'XGBoost', 'LightGBM'].some(ml => 
                        skill.toLowerCase().includes(ml.toLowerCase())
                    )
                ).join(', ')}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Experience</div>
        ${data.experience.map(job => `
            <div class="job">
                <div class="job-header">
                    <div class="job-title">${job.title}</div>
                    <div class="job-location">${job.location}</div>
                </div>
                <div class="company-date">${job.company} ${job.startDate} – ${job.endDate}</div>
                <ul class="job-description">
                    ${job.description.map(item => `<li>${item}</li>`).join('')}
                    ${job.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                </ul>
            </div>
        `).join('')}
    </div>

    ${data.publications && data.publications.length > 0 ? `
    <div class="section">
        <div class="section-title">Publications</div>
        ${data.publications.map(pub => `
            <div class="publication-item">
                <div class="publication-title">${pub.title}</div>
                <div class="publication-authors">${pub.authors}</div>
                <div class="publication-venue">
                    ${pub.journal ? pub.journal : pub.conference || ''} (${pub.year})
                    ${pub.doi ? ` • DOI: ${pub.doi}` : ''}
                    ${pub.link ? ` • <a href="${pub.link}" target="_blank">Link</a>` : ''}
                </div>
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${data.training && data.training.length > 0 ? `
    <div class="section">
        <div class="section-title">Training & Certifications</div>
        ${data.training.map(cert => `
            <div class="training-item">
                <div class="training-header">
                    <div class="training-name">${cert.name}</div>
                    <div class="training-date">${cert.completionDate}</div>
                </div>
                <div class="training-provider">${cert.provider}</div>
                ${cert.expirationDate || cert.credentialId || cert.link ? `
                <div class="training-details">
                    ${cert.expirationDate ? `Expires: ${cert.expirationDate}` : ''}
                    ${cert.credentialId ? ` • ID: ${cert.credentialId}` : ''}
                    ${cert.link ? ` • <a href="${cert.link}" target="_blank">Verify</a>` : ''}
                </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

</body>
</html>
    `
  },

  generateMarkdown: (data: ResumeData, jobDescription?: string) => {
    return `

# ${data.personalInfo.name}

📍 ${data.personalInfo.location} ✉ ${data.personalInfo.email} 📱 ${data.personalInfo.phone}
${data.personalInfo.linkedin ? `💼 ${data.personalInfo.linkedin}` : ''} ${data.personalInfo.github ? `🔗 ${data.personalInfo.github}` : ''}

## Education

${data.education.map(edu => `
**${edu.school}** *${edu.graduationDate}*
${edu.degree}
${edu.gpa ? `• **GPA:** ${edu.gpa}` : ''}
${edu.honors && edu.honors.length > 0 ? `• **Coursework:** ${edu.honors.join(', ')}` : ''}
`).join('\n')}

## Technologies

**Languages:** ${data.skills.technical.filter(skill => 
    ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'TypeScript', 'Go', 'Rust', 'PHP', 'Ruby', 'R', 'MATLAB', 'SQL'].some(lang => 
        skill.toLowerCase().includes(lang.toLowerCase())
    )
).join(', ')}

**Technologies:** ${data.skills.technical.filter(skill => 
    !['Python', 'JavaScript', 'Java', 'C++', 'C#', 'TypeScript', 'Go', 'Rust', 'PHP', 'Ruby', 'R', 'MATLAB', 'SQL'].some(lang => 
        skill.toLowerCase().includes(lang.toLowerCase())
    ) && !['TensorFlow', 'PyTorch', 'Scikit-learn', 'Hugging-face'].some(ml => 
        skill.toLowerCase().includes(ml.toLowerCase())
    )
).join(', ')}

**ML Frameworks:** ${data.skills.technical.filter(skill => 
    ['TensorFlow', 'PyTorch', 'Scikit-learn', 'Hugging-face', 'Keras', 'XGBoost', 'LightGBM'].some(ml => 
        skill.toLowerCase().includes(ml.toLowerCase())
    )
).join(', ')}

## Experience

${data.experience.map(job => `
### \`${job.title}\` @ **${job.company}**
\`\`\`
${job.startDate} - ${job.endDate} | ${job.location}
\`\`\`

${job.description.map(item => `- ${item}`).join('\n')}

${job.achievements.length > 0 ? `
**🏆 Key Achievements:**
${job.achievements.map(achievement => `- ✨ ${achievement}`).join('\n')}
` : ''}
`).join('\n')}

${data.projects && data.projects.length > 0 ? `
## Projects

${data.projects.map(project => `
### \`${project.name}\`
${project.description}

**🔧 Technologies:** \`${project.technologies.join('`, `')}\`
${project.link ? `**🔗 Link:** ${project.link}` : ''}
`).join('\n')}
` : ''}

${data.publications && data.publications.length > 0 ? `
## Publications

${data.publications.map(pub => `
### ${pub.title}
**Authors:** ${pub.authors}
**Published in:** ${pub.journal ? pub.journal : pub.conference || ''} (${pub.year})
${pub.doi ? `**DOI:** ${pub.doi}` : ''}
${pub.link ? `**Link:** [View Publication](${pub.link})` : ''}
`).join('\n')}
` : ''}

${data.training && data.training.length > 0 ? `
## Training & Certifications

${data.training.map(cert => `
### ${cert.name}
**Provider:** ${cert.provider}
**Completed:** ${cert.completionDate}
${cert.expirationDate ? `**Expires:** ${cert.expirationDate}` : ''}
${cert.credentialId ? `**Credential ID:** ${cert.credentialId}` : ''}
${cert.link ? `**Verify:** [View Certificate](${cert.link})` : ''}
`).join('\n')}
` : ''}

## Education

${data.education.map(edu => `
### **${edu.degree}**
\`${edu.school}\` | ${edu.location} | ${edu.graduationDate}
${edu.gpa ? `📊 **GPA:** ${edu.gpa}` : ''}
${edu.honors ? `🏅 **Honors:** ${edu.honors.join(', ')}` : ''}
`).join('\n')}

`
  }
}

// Modern Tech Template (Completely different - dark theme with code styling)
export const modernTechTemplate: ResumeTemplate = {
  id: 'modern-tech',
  name: 'Modern Tech',
  description: 'Dark theme with code-style formatting, perfect for developers and tech professionals',
  category: 'tech',
  atsOptimized: true,
  
  generateHTML: (data: ResumeData, jobDescription?: string) => {
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
        
        .section-title {
            color: #f6ad55;
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 10px;
            border-left: 3px solid #f6ad55;
            padding-left: 10px;
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
            .section-title { color: #f6ad55 !important; }
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

        <div class="section">
            <div class="prompt">$ </div><span class="command">cat summary.md</span>
            <div class="output">${data.summary}</div>
        </div>

        <div class="section">
            <div class="prompt">$ </div><span class="command">ls skills/</span>
            <div class="output">
                <div class="skills-grid">
                    <div class="skill-group">
                        <h4>💻 Languages</h4>
                        <div class="skill-tags">
                            ${data.skills.technical.filter(skill => 
                                ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin'].some(lang => 
                                    skill.toLowerCase().includes(lang.toLowerCase())
                                )
                            ).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                    <div class="skill-group">
                        <h4>🛠️ Tools & Frameworks</h4>
                        <div class="skill-tags">
                            ${data.skills.technical.filter(skill => 
                                !['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin'].some(lang => 
                                    skill.toLowerCase().includes(lang.toLowerCase())
                                )
                            ).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                    ${data.skills.soft.length > 0 ? `
                    <div class="skill-group">
                        <h4>🎯 Core Skills</h4>
                        <div class="skill-tags">
                            ${data.skills.soft.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>

        <div class="section">
            <div class="prompt">$ </div><span class="command">cat experience.log</span>
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

        ${data.projects && data.projects.length > 0 ? `
        <div class="section">
            <div class="prompt">$ </div><span class="command">ls projects/</span>
            <div class="output">
                ${data.projects.map(project => `
                    <div class="job">
                        <div class="job-title">${project.name} ${project.link ? `<a href="${project.link}" style="color: #63b3ed;">🔗</a>` : ''}</div>
                        <div class="project-desc-creative">${project.description}</div>
                        <div class="project-tech-creative">
                            ${project.technologies.map(tech => `<span class="skill-tag">${tech}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <div class="section">
            <div class="prompt">$ </div><span class="command">cat education.txt</span>
            <div class="output">
                ${data.education.map(edu => `
                    <div class="education-item">
                        <div class="degree">${edu.degree}</div>
                        <div class="school">${edu.school}, ${edu.location}</div>
                        <div class="edu-details">${edu.graduationDate} ${edu.gpa ? `• GPA: ${edu.gpa}` : ''}</div>
                        ${edu.honors ? `<div class="edu-details">${edu.honors.join(', ')}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>

        ${data.publications && data.publications.length > 0 ? `
        <div class="section">
            <div class="prompt">$ </div><span class="command">cat publications.bib</span>
            <div class="output">
                ${data.publications.map(pub => `
                    <div class="education-item">
                        <div class="degree">${pub.title}</div>
                        <div class="school">${pub.authors}</div>
                        <div class="edu-details">
                            ${pub.journal ? pub.journal : pub.conference || ''} (${pub.year})
                            ${pub.doi ? ` • DOI: ${pub.doi}` : ''}
                            ${pub.link ? ` • <a href="${pub.link}" style="color: #63b3ed;">🔗 Link</a>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${data.training && data.training.length > 0 ? `
        <div class="section">
            <div class="prompt">$ </div><span class="command">ls certifications/</span>
            <div class="output">
                ${data.training.map(cert => `
                    <div class="education-item">
                        <div class="degree">${cert.name}</div>
                        <div class="school">${cert.provider}</div>
                        <div class="edu-details">
                            Completed: ${cert.completionDate}
                            ${cert.expirationDate ? ` • Expires: ${cert.expirationDate}` : ''}
                            ${cert.credentialId ? ` • ID: ${cert.credentialId}` : ''}
                            ${cert.link ? ` • <a href="${cert.link}" style="color: #63b3ed;">🔗 Verify</a>` : ''}
                        </div>
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

  generateMarkdown: (data: ResumeData, jobDescription?: string) => {
    return `# ${data.personalInfo.name}
## ${data.personalInfo.jobTitle || 'Software Developer'}

\`\`\`
${data.personalInfo.email} | ${data.personalInfo.phone} | ${data.personalInfo.location}
${data.personalInfo.github ? `GitHub: ${data.personalInfo.github}` : ''}
${data.personalInfo.linkedin ? `LinkedIn: ${data.personalInfo.linkedin}` : ''}
${data.personalInfo.portfolio ? `Portfolio: ${data.personalInfo.portfolio}` : ''}
\`\`\`

## Summary

\`\`\`javascript
const summary = "${data.summary}";
\`\`\`

## Technical Skills

\`\`\`json
{
  "languages": [${data.skills.technical.filter(skill => 
    ['JavaScript', 'Python', 'Java', 'C++', 'C#', 'TypeScript', 'Go', 'Rust', 'PHP', 'Ruby'].some(lang => 
      skill.toLowerCase().includes(lang.toLowerCase())
    )
  ).map(skill => `"${skill}"`).join(', ')}],
  "frameworks": [${data.skills.technical.filter(skill => 
    !['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby'].some(lang => 
      skill.toLowerCase().includes(lang.toLowerCase())
    )
  ).map(skill => `"${skill}"`).join(', ')}],
  "soft_skills": [${data.skills.soft.map(skill => `"${skill}"`).join(', ')}]
}
\`\`\`

## Experience

${data.experience.map(job => `
### \`${job.title}\` @ **${job.company}**
\`\`\`
${job.startDate} - ${job.endDate} | ${job.location}
\`\`\`

${job.description.map(item => `- ${item}`).join('\n')}

${job.achievements.length > 0 ? `
**🏆 Key Achievements:**
${job.achievements.map(achievement => `- ✨ ${achievement}`).join('\n')}
` : ''}
`).join('\n')}

${data.projects && data.projects.length > 0 ? `
## Projects

${data.projects.map(project => `
### \`${project.name}\`
${project.description}

**🔧 Technologies:** \`${project.technologies.join('`, `')}\`
${project.link ? `**🔗 Link:** ${project.link}` : ''}
`).join('\n')}
` : ''}

## Education

${data.education.map(edu => `
### **${edu.degree}**
\`${edu.school}\` | ${edu.location} | ${edu.graduationDate}
${edu.gpa ? `📊 **GPA:** ${edu.gpa}` : ''}
${edu.honors ? `🏅 **Honors:** ${edu.honors.join(', ')}` : ''}
`).join('\n')}

${data.publications && data.publications.length > 0 ? `
## Publications

${data.publications.map(pub => `
### ${pub.title}
**Authors:** ${pub.authors}
**Published in:** ${pub.journal ? pub.journal : pub.conference || ''} (${pub.year})
${pub.doi ? `**DOI:** ${pub.doi}` : ''}
${pub.link ? `**Link:** [View Publication](${pub.link})` : ''}
`).join('\n')}
` : ''}

${data.training && data.training.length > 0 ? `
## Training & Certifications

${data.training.map(cert => `
### ${cert.name}
**Provider:** ${cert.provider}
**Completed:** ${cert.completionDate}
${cert.expirationDate ? `**Expires:** ${cert.expirationDate}` : ''}
${cert.credentialId ? `**Credential ID:** ${cert.credentialId}` : ''}
${cert.link ? `**Verify:** [View Certificate](${cert.link})` : ''}
`).join('\n')}
` : ''}
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
  
  generateHTML: (data: ResumeData, jobDescription?: string) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.personalInfo.name} - Executive Resume</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { 
            background: white;
            margin: 0;
            padding: 0;
        }
        body { 
            font-family: 'Georgia', 'Times New Roman', serif; 
            line-height: 1.6; 
            color: #2c3e50; 
            max-width: 8.5in; 
            margin: 0 auto; 
            padding: 0.75in;
            background: white;
            font-size: 11pt;
        }
        
        .letterhead {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px 0;
            border-top: 3px solid #2c3e50;
            border-bottom: 1px solid #bdc3c7;
            position: relative;
        }
        
        .letterhead::before {
            content: '';
            position: absolute;
            top: -3px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 3px;
            background: #3498db;
        }
        
        .name-executive { 
            font-size: 28pt;
            font-weight: normal; 
            color: #2c3e50; 
            margin-bottom: 10px;
            letter-spacing: 1.5px;
            text-transform: uppercase;
        }
        
        .executive-title { 
            font-size: 14pt;
            color: #7f8c8d; 
            margin-bottom: 20px;
            font-style: italic;
            font-weight: 300;
        }
        
        .contact-executive {
            font-size: 11pt;
            color: #7f8c8d;
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 25px;
        }
        
        .contact-executive a {
            color: #3498db;
            text-decoration: none;
        }
        
        .section-executive {
            margin-bottom: 35px;
        }
        
        .section-title-executive { 
            font-size: 16pt;
            font-weight: normal; 
            color: #2c3e50; 
            margin-bottom: 20px;
            text-align: center;
            position: relative;
            padding-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .section-title-executive::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 1px;
            background: #34495e;
        }
        
        .executive-summary { 
            font-size: 12pt;
            line-height: 1.8;
            text-align: justify;
            font-style: italic;
            color: #34495e;
            padding: 0 40px;
            margin-bottom: 20px;
            border-left: 3px solid #3498db;
            padding-left: 30px;
        }
        
        .job-executive { 
            margin-bottom: 30px;
            padding-bottom: 25px;
            border-bottom: 1px solid #ecf0f1;
        }
        
        .job-executive:last-child {
            border-bottom: none;
        }
        
        .job-title-executive { 
            font-size: 14pt;
            font-weight: bold; 
            color: #2c3e50; 
            margin-bottom: 5px;
        }
        
        .company-executive { 
            font-size: 12pt;
            color: #3498db; 
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .job-meta-executive { 
            font-size: 10pt;
            color: #95a5a6; 
            font-style: italic;
            margin-bottom: 15px;
        }
        
        .achievements-executive {
            margin-top: 15px;
        }
        
        .achievements-executive li { 
            margin-bottom: 8px;
            color: #34495e;
            font-size: 11pt;
            list-style-type: none;
            position: relative;
            padding-left: 25px;
        }
        
        .achievements-executive li::before {
            content: '▸';
            position: absolute;
            left: 0;
            color: #3498db;
            font-size: 12pt;
            font-weight: bold;
        }
        
        .key-accomplishments {
            margin: 20px 0;
            padding-left: 20px;
            border-left: 3px solid #e74c3c;
        }
        
        .key-accomplishments h4 {
            color: #2c3e50;
            margin-bottom: 12px;
            font-size: 12pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .skills-executive {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 40px;
            margin-top: 20px;
        }
        
        .skill-category-executive {
            padding: 0;
        }
        
        .skill-category-executive h4 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 13pt;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #3498db;
            padding-bottom: 8px;
        }
        
        .skill-list-executive {
            color: #34495e;
            font-size: 11pt;
            line-height: 1.8;
            text-align: left;
        }
        
        .education-executive {
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 1px solid #ecf0f1;
        }
        
        .education-executive:last-child {
            border-bottom: none;
        }
        
        .degree-executive {
            font-weight: 700;
            color: #2c3e50;
            font-size: 14pt;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        
        .school-executive {
            color: #3498db;
            font-size: 12pt;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .edu-location-executive {
            color: #7f8c8d;
            font-size: 11pt;
            font-style: italic;
            margin-bottom: 8px;
        }
        
        .edu-details-executive {
            font-size: 11pt;
            color: #34495e;
            line-height: 1.6;
            padding-left: 20px;
        }
        
        .edu-details-executive .gpa {
            font-weight: 600;
            color: #27ae60;
        }
        
        .edu-details-executive .honors {
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid #ecf0f1;
            font-style: italic;
        }
        
        @media print {
            html {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            body { 
                background: white !important;
                padding: 0.5in !important; 
            }
            .name-executive { font-size: 24pt; }
            .section-title-executive { font-size: 14pt; }
        }
    </style>
</head>
<body>
    <div class="letterhead">
        <div class="name-executive">${data.personalInfo.name}</div>
        <div class="executive-title">Senior Executive Leader</div>
        <div class="contact-executive">
            <span>${data.personalInfo.email}</span>
            <span>${data.personalInfo.phone}</span>
            <span>${data.personalInfo.location}</span>
            ${data.personalInfo.linkedin ? `<a href="${data.personalInfo.linkedin}">LinkedIn Profile</a></span>` : ''}
        </div>
    </div>

    <div class="section-executive">
        <div class="section-title-executive">Executive Summary</div>
        <div class="executive-summary">${data.summary}</div>
    </div>

    <div class="section-executive">
        <div class="section-title-executive">Leadership Experience</div>
        ${data.experience.map(job => `
            <div class="job-executive">
                <div class="job-title-executive">${job.title}</div>
                <div class="company-executive">${job.company}</div>
                <div class="job-meta-executive">${job.startDate} - ${job.endDate} • ${job.location}</div>
                <ul class="achievements-executive">
                    ${job.description.map(item => `<li>${item}</li>`).join('')}
                </ul>
                ${job.achievements.length > 0 ? `
                <div class="key-accomplishments">
                    <h4>Key Accomplishments</h4>
                    <ul class="achievements-executive">
                        ${job.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
        `).join('')}
    </div>

    <div class="section-executive">
        <div class="section-title-executive">Core Competencies</div>
        <div class="skills-executive">
            <div class="skill-category-executive">
                <h4>Leadership & Strategy</h4>
                <div class="skill-list-executive">
                    ${data.skills.soft.join(' • ')}
                </div>
            </div>
            <div class="skill-category-executive">
                <h4>Technical Expertise</h4>
                <div class="skill-list-executive">
                    ${data.skills.technical.join(' • ')}
                </div>
            </div>
        </div>
    </div>

    <div class="section-executive">
        <div class="section-title-executive">Education & Credentials</div>
        ${data.education.map(edu => `
            <div class="education-executive">
                <div class="degree-executive">${edu.degree}</div>
                <div class="school-executive">${edu.school}</div>
                <div class="edu-location-executive">${edu.location}</div>
                <div class="edu-details-executive">
                    <div><strong>Graduation:</strong> ${edu.graduationDate}</div>
                    ${edu.gpa ? `<div><strong>GPA:</strong> <span class="gpa">${edu.gpa}</span></div>` : ''}
                    ${edu.honors && edu.honors.length > 0 ? `<div class="honors"><strong>Coursework:</strong> ${edu.honors.join(', ')}</div>` : ''}
                </div>
            </div>
        `).join('')}
    </div>

    ${data.publications && data.publications.length > 0 ? `
    <div class="section-executive">
        <div class="section-title-executive">Publications</div>
        ${data.publications.map(pub => `
            <div class="education-executive">
                <div class="degree-executive">${pub.title}</div>
                <div class="school-executive">${pub.authors}</div>
                <div class="edu-location-executive">
                    ${pub.journal ? pub.journal : pub.conference || ''} (${pub.year})
                </div>
                <div class="edu-details-executive">
                    ${pub.doi ? `<div><strong>DOI:</strong> ${pub.doi}</div>` : ''}
                    ${pub.link ? `<div><strong>Link:</strong> <a href="${pub.link}" style="color: #3498db;">View Publication</a></div>` : ''}
                </div>
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${data.training && data.training.length > 0 ? `
    <div class="section-executive">
        <div class="section-title-executive">Professional Development</div>
        ${data.training.map(cert => `
            <div class="education-executive">
                <div class="degree-executive">${cert.name}</div>
                <div class="school-executive">${cert.provider}</div>
                <div class="edu-details-executive">
                    <div><strong>Completed:</strong> ${cert.completionDate}</div>
                    ${cert.expirationDate ? `<div><strong>Expires:</strong> ${cert.expirationDate}</div>` : ''}
                    ${cert.credentialId ? `<div><strong>Credential ID:</strong> ${cert.credentialId}</div>` : ''}
                    ${cert.link ? `<div><strong>Verify:</strong> <a href="${cert.link}" style="color: #3498db;">View Certificate</a></div>` : ''}
                </div>
            </div>
        `).join('')}
    </div>
    ` : ''}
</body>
</html>
    `
  },

  generateMarkdown: (data: ResumeData, jobDescription?: string) => {
    return `# ${data.personalInfo.name}
## Senior Executive Leader

**${data.personalInfo.email}** | **${data.personalInfo.phone}** | **${data.personalInfo.location}**
${data.personalInfo.linkedin ? `[LinkedIn Profile](${data.personalInfo.linkedin})` : ''}

---

## Executive Summary

*${data.summary}*

---

## Leadership Experience

${data.experience.map(job => `
### ${job.title}
**${job.company}** | ${job.startDate} - ${job.endDate} • ${job.location}

${job.description.map(item => `🔹 ${item}`).join('\n')}

${job.achievements.length > 0 ? `
**🏆 Key Achievements:**
${job.achievements.map(achievement => `◆ ${achievement}`).join('\n')}
` : ''}
`).join('\n')}

---

## Core Competencies

### Leadership & Strategy
${data.skills.soft.join(' • ')}

### Technical Expertise  
${data.skills.technical.join(' • ')}

---

## Education & Credentials

${data.education.map(edu => `
### **${edu.degree}**
\`${edu.school}\` | ${edu.location} | ${edu.graduationDate}
${edu.gpa ? `📊 **GPA:** ${edu.gpa}` : ''}
${edu.honors ? `🏅 **Honors:** ${edu.honors.join(', ')}` : ''}
`).join('\n')}

${data.publications && data.publications.length > 0 ? `
---

## Publications

${data.publications.map(pub => `
### ${pub.title}
**Authors:** ${pub.authors}
**Published in:** ${pub.journal ? pub.journal : pub.conference || ''} (${pub.year})
${pub.doi ? `**DOI:** ${pub.doi}` : ''}
${pub.link ? `**Link:** [View Publication](${pub.link})` : ''}
`).join('\n')}
` : ''}

${data.training && data.training.length > 0 ? `
---

## Professional Development

${data.training.map(cert => `
### ${cert.name}
**Provider:** ${cert.provider}
**Completed:** ${cert.completionDate}
${cert.expirationDate ? `**Expires:** ${cert.expirationDate}` : ''}
${cert.credentialId ? `**Credential ID:** ${cert.credentialId}` : ''}
${cert.link ? `**Verify:** [View Certificate](${cert.link})` : ''}
`).join('\n')}
` : ''}
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