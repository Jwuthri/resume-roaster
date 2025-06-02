import { ResumeData } from './resume-templates'

export const sampleResumeData: ResumeData = {
  personalInfo: {
    name: "Alex Johnson",
    email: "alex.johnson@email.com",
    phone: "(555) 123-4567",
    location: "San Francisco, CA",
    linkedin: "https://linkedin.com/in/alex-johnson",
    github: "https://github.com/alexjohnson",
    portfolio: "https://alexjohnson.dev",
    jobTitle: "AI Strategy Advisor",
    jobDescription: "AI Strategy Advisor and Machine Learning Engineer"
  },
  summary: "Experienced AI Strategy Advisor and Machine Learning Engineer with expertise in developing scalable AI solutions, leading cross-functional teams, and implementing strategic AI initiatives across various industries.",
  experience: [
    {
      title: "Founding Engineer",
      company: "TechFlow AI",
      location: "San Mateo, CA",
      startDate: "June 2023",
      endDate: "Present",
      description: [
        "Building AI Sales Engineer assistant that integrates into Zoom calls and Slack to answer technical product questions in real-time.",
        "Fine-tuning large language models (LLMs) for video analysis and video call intelligence.",
        "Developed domain-specific pipelines and prompt-engineering strategies for production-quality inference.",
        "Designed scalable back-end systems for real-time model inference and data collection in Python."
      ],
      achievements: []
    },
    {
      title: "AI Strategy Advisor",
      company: "Various Startups (Consulting)",
      location: "San Francisco, CA",
      startDate: "Dec 2023",
      endDate: "Present",
      description: [
        "Designed and implemented AI transformation roadmaps for 4+ early-stage startups, reducing operational costs by 30%",
        "Developed custom GPT-based workflow automation solutions that eliminated 15-20 hours of weekly manual work for client teams across marketing, customer support, and content creation",
        "Advised on strategic implementation of computer vision systems for a retail analytics startup, resulting in 25% improvement in inventory management",
        "Created AI readiness assessment framework to identify high-impact, low-implementation-cost opportunities, prioritizing initiatives with measurable ROI"
      ],
      achievements: []
    },
    {
      title: "Machine Learning Engineer",
      company: "CustomerCare Pro",
      location: "San Francisco, CA",
      startDate: "Sept 2019",
      endDate: "Aug 2023",
      description: [
        "Led development of high-performance ML microservices handling millions of daily queries with sub-100ms latency for a customer support platform.",
        "Architected and deployed multilingual NLP models for sentiment analysis and intent detection, increasing automated response accuracy by 37%",
        "Implemented text summarization and named entity recognition models specialized for e-commerce, reducing support agent resolution time by 42%",
        "Designed scalable machine translation pipeline based on transformer models supporting 12+ languages for international customer communications",
        "Optimized model inference through techniques like quantization and efficient algorithms, reducing infrastructure costs by 23% while maintaining accuracy",
        "Developed and maintained an English/French next-word prediction system with 250ms response time, improving agent typing efficiency by 38%"
      ],
      achievements: []
    },
    {
      title: "Data Scientist",
      company: "AutoTech Solutions",
      location: "Paris, France",
      startDate: "Jan 2017",
      endDate: "Aug 2019",
      description: [
        "Developed predictive models for automotive manufacturing optimization",
        "Implemented machine learning algorithms for quality control and defect detection",
        "Created data pipelines for real-time analytics and reporting dashboards"
      ],
      achievements: []
    }
  ],
  education: [
    {
      degree: "M.S in Computer Science",
      school: "Stanford University",
      location: "Stanford, CA",
      graduationDate: "Sept 2015 – May 2017",
      gpa: "3.9/4.0",
      honors: ["Machine Learning", "Artificial Intelligence", "Data Mining"]
    },
    {
      degree: "B.S in Computer Engineering",
      school: "UC Berkeley",
      location: "Berkeley, CA",
      graduationDate: "Sept 2011 – May 2015",
      gpa: "3.7/4.0",
      honors: ["Algorithms", "Software Engineering", "Computer Systems"]
    }
  ],
  skills: {
    technical: [
      "Python", "JavaScript", "TypeScript",
      "PostgreSQL", "AWS", "GCP", "Docker", "Apache Spark", "Kubernetes", "Terraform",
      "TensorFlow", "PyTorch", "Scikit-learn", "Hugging Face", "OpenAI API"
    ],
    soft: [
      "Leadership", "Strategic Planning", "Cross-functional Collaboration", "Technical Communication", "Project Management"
    ],
    languages: ["English (Native)", "French (Fluent)", "Spanish (Conversational)"],
    certifications: ["AWS Certified Solutions Architect", "Google Cloud Professional ML Engineer"]
  },
  projects: [
    {
      name: "AI Sales Assistant Platform",
      description: "Real-time AI assistant for technical sales calls with Zoom and Slack integration, serving 500+ sales teams",
      technologies: ["Python", "TensorFlow", "Zoom API", "Slack API", "Docker", "Kubernetes"],
      link: "https://github.com/alexjohnson/ai-sales-assistant"
    },
    {
      name: "Multilingual Customer Support AI",
      description: "NLP pipeline for automated customer support in 12+ languages, processing 1M+ queries daily",
      technologies: ["PyTorch", "Hugging Face", "Docker", "Kubernetes", "PostgreSQL", "Redis"],
      link: "https://github.com/alexjohnson/multilingual-support-ai"
    },
    {
      name: "Computer Vision Quality Control",
      description: "Real-time defect detection system for manufacturing with 99.2% accuracy",
      technologies: ["OpenCV", "TensorFlow", "Python", "FastAPI", "Docker"],
      link: "https://github.com/alexjohnson/cv-quality-control"
    }
  ]
} 