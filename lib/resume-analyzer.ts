// @ts-ignore
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

const SKILL_CATEGORIES: Record<string, string[]> = {
    "Programming Languages": ["python", "java", "javascript", "c++", "ruby", "php", "swift", "kotlin", "r", "matlab", "typescript", "go", "rust"],
    "Web Development": ["html", "css", "react", "angular", "vue", "node.js", "django", "flask", "asp.net", "next.js", "express", "tailwind"],
    "Database": ["sql", "mysql", "postgresql", "mongodb", "oracle", "redis", "elasticsearch", "firebase", "dynamodb"],
    "Cloud": ["aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins", "circleci"],
    "Machine Learning": ["tensorflow", "pytorch", "scikit-learn", "keras", "opencv", "nlp", "computer vision", "pandas", "numpy"],
    "Tools": ["git", "github", "gitlab", "jira", "confluence", "slack", "postman", "swagger", "figma", "vscode"],
    "Soft Skills": ["leadership", "communication", "teamwork", "problem solving", "analytical", "project management", "agile", "scrum"]
};

const JOB_ROLES: Record<string, { required_skills: string[], good_to_have: string[], experience_keywords: string[] }> = {
    "Software Engineer": {
        "required_skills": ["python", "java", "javascript", "sql", "git", "algorithms", "data structures"],
        "good_to_have": ["docker", "kubernetes", "aws", "ci/cd", "agile", "react", "node.js"],
        "experience_keywords": ["development", "implementation", "testing", "debugging", "optimization"]
    },
    "Data Scientist": {
        "required_skills": ["python", "r", "sql", "machine learning", "statistics", "data analysis"],
        "good_to_have": ["tensorflow", "pytorch", "big data", "spark", "tableau", "pandas"],
        "experience_keywords": ["analysis", "modeling", "visualization", "research", "prediction"]
    },
    "Web Developer": {
        "required_skills": ["html", "css", "javascript", "react", "node.js", "responsive design"],
        "good_to_have": ["typescript", "vue", "angular", "webpack", "sass", "next.js"],
        "experience_keywords": ["frontend", "backend", "full-stack", "web applications", "apis"]
    },
    "DevOps Engineer": {
        "required_skills": ["linux", "aws", "docker", "kubernetes", "jenkins", "terraform"],
        "good_to_have": ["python", "ansible", "prometheus", "elk stack", "nginx", "bash"],
        "experience_keywords": ["automation", "deployment", "monitoring", "infrastructure", "security"]
    }
};

export async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType === 'application/pdf') {
        const data = await pdf(buffer);
        return data.text;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    }
    return "";
}

export function extractSkills(text: string) {
    const skills: Record<string, string[]> = {};
    const textLower = text.toLowerCase();

    for (const [category, skillList] of Object.entries(SKILL_CATEGORIES)) {
        const foundSkills: string[] = [];
        for (const skill of skillList) {
            // Use word boundary regex to avoid partial matches (e.g. "java" in "javascript")
            // Escape special chars in skill name if any (like c++)
            const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
            // Special handling for C++ or C# which might not match \b correctly at end
            // But for simplicity, let's try basic regex first.
            // Actually \b matches between \w and \W. '+' is \W. So "c++" \b matches "c" boundary? No.
            // "c++" is tricky with \b.
            // Let's just use simple includes for now for special cases, or improved regex.

            if (regex.test(textLower) || textLower.includes(skill)) {
                // Simple include is risky (e.g. "go" in "google"). 
                // But user's python code used `re.search(r'\b' + re.escape(skill) + r'\b', text_lower)`
                // So I should stick to that.
                if (new RegExp(`\\b${escapedSkill}\\b`, 'i').test(textLower)) {
                    if (!foundSkills.includes(skill)) foundSkills.push(skill);
                } else if ((skill === 'c++' || skill === 'c#') && textLower.includes(skill)) {
                    if (!foundSkills.includes(skill)) foundSkills.push(skill);
                }
            }
        }
        if (foundSkills.length > 0) {
            skills[category] = foundSkills;
        }
    }
    return skills;
}

export function analyzeExperience(text: string) {
    const experiencePatterns = [
        /\b(\d+)\s*(?:\+\s*)?years?\b/gi,
        /\b(\d{4})\s*-\s*(?:present|current|now|\d{4})\b/gi,
        /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}\b/gi
    ];

    const matches: string[] = [];
    for (const pattern of experiencePatterns) {
        const found = text.match(pattern);
        if (found) matches.push(...found);
    }
    return matches;
}

export function analyzeEducation(text: string) {
    const educationPatterns = [
        /\b(?:bachelor|master|phd|b\.?tech|m\.?tech|b\.?e|m\.?e|b\.?sc|m\.?sc)\b/gi,
        /\buniversity\b/gi,
        /\bcollege\b/gi,
        /\bdegree\b/gi
    ];

    const matches: string[] = [];
    for (const pattern of educationPatterns) {
        const found = text.match(pattern);
        if (found) matches.push(...found);
    }
    return [...new Set(matches)]; // Unique
}

export function suggestRoleMatch(skillsFound: Record<string, string[]>) {
    const roleScores: Record<string, number> = {};
    const allFoundSkills = Object.values(skillsFound).flat();
    const uniqueFoundSkills = new Set(allFoundSkills);

    for (const [role, requirements] of Object.entries(JOB_ROLES)) {
        const requiredMatchCount = requirements.required_skills.filter(s => uniqueFoundSkills.has(s)).length;
        const requiredTotal = requirements.required_skills.length;
        const requiredMatch = requiredTotal > 0 ? requiredMatchCount / requiredTotal : 0;

        const goodToHaveMatchCount = requirements.good_to_have.filter(s => uniqueFoundSkills.has(s)).length;
        const goodToHaveTotal = requirements.good_to_have.length;
        const goodToHaveMatch = goodToHaveTotal > 0 ? goodToHaveMatchCount / goodToHaveTotal : 0;

        roleScores[role] = Math.round((requiredMatch * 0.7 + goodToHaveMatch * 0.3) * 100);
    }
    return roleScores;
}

export function calculateYearsOfExperience(text: string): number {
    const years: number[] = [];
    
    // Pattern 1: "5+ years experience" or "5 years of experience"
    const explicitYears = text.match(/(\d+)\+?\s*years?/gi);
    if (explicitYears) {
        explicitYears.forEach(match => {
            const num = parseInt(match.match(/\d+/)?.[0] || "0");
            if (num < 40) years.push(num); // Sanity check
        });
    }

    // Pattern 2: Date ranges "2018 - 2022" or "2018 - Present"
    const dateRanges = text.match(/(\d{4})\s*-\s*(present|current|now|\d{4})/gi);
    if (dateRanges) {
        dateRanges.forEach(range => {
            const parts = range.split('-');
            const start = parseInt(parts[0].trim());
            let end = new Date().getFullYear();
            
            const endPart = parts[1].trim().toLowerCase();
            if (!['present', 'current', 'now'].includes(endPart)) {
                end = parseInt(endPart);
            }
            
            if (start <= end && (end - start) < 40) {
                years.push(end - start);
            }
        });
    }

    if (years.length === 0) return 0;
    
    // Return the maximum found, assuming it represents total experience or the longest tenure
    // Alternatively, we could sum them if they don't overlap, but that's complex. 
    // Max is a safe heuristic for "Seniority".
    return Math.max(...years);
}

export { JOB_ROLES };
