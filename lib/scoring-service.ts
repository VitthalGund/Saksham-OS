import User from "@/models/User";

interface IScoreComponents {
    baseScore: number;
    financialTrust: number;
    skillDepth: number;
    experience: number;
    total: number;
}

export async function calculateCredibilityScore(userId: string, skillsCount: number, experienceYears: number): Promise<{ score: number, components: IScoreComponents }> {
    const user = await User.findOne({ userId });
    
    if (!user) {
        throw new Error("User not found");
    }

    let score = 0;
    const components: IScoreComponents = {
        baseScore: 0,
        financialTrust: 0,
        skillDepth: 0,
        experience: 0,
        total: 0
    };

    // 1. Base Score: 20 points (Active Account)
    components.baseScore = 20;
    score += 20;

    // 2. Financial Trust: +30 points if isBankConnected is true
    if (user.isBankConnected) {
        components.financialTrust = 30;
        score += 30;
    }

    // 3. Skill Depth: +20 points if > 5 valid skills are found
    if (skillsCount >= 5) {
        components.skillDepth = 20;
        score += 20;
    }

    // 4. Experience: +10 points per year of experience (Max 30 points)
    const experiencePoints = Math.min(experienceYears * 10, 30);
    components.experience = experiencePoints;
    score += experiencePoints;

    // Cap at 100
    score = Math.min(score, 100);
    components.total = score;

    return { score, components };
}
