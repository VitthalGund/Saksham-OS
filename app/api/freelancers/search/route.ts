import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const category = searchParams.get("category");
        const minExp = searchParams.get("minExp");
        const maxExp = searchParams.get("maxExp");
        const skills = searchParams.get("skills");

        await dbConnect();
        const dbFreelancers = await User.find({ role: "freelancer" }).lean();
        const dbMapped = dbFreelancers.map((u: any) => ({
            id: u.userId || u._id.toString(),
            name: u.name || "Unknown",
            skills: (u.skills || []).join(", "),
            primary_domain: (u.skills || [])[0] || "",
            experience_years: u.experienceYears?.toString() || "0",
            credibility_score: u.credibilityScore?.toString() || "0",
            past_projects_count: "0",
            avg_earning_per_project: "1000",
            location: u.location || "Remote"
        }));

        const csvPath = path.join(process.cwd(), "bubble-chart", "data", "freelancers_profile.csv");
        let csvMapped: any[] = [];
        if (fs.existsSync(csvPath)) {
            const csvFile = fs.readFileSync(csvPath, "utf8");
            const { data } = Papa.parse(csvFile, { header: true, skipEmptyLines: true });
            csvMapped = (data as any[]).map((f: any) => ({
                id: f.freelancer_id,
                name: f.name,
                skills: f.skills,
                primary_domain: f.primary_domain,
                experience_years: f.experience_years,
                credibility_score: f.credibility_score,
                past_projects_count: f.past_projects_count,
                avg_earning_per_project: f.avg_earning_per_project,
                location: "Remote"
            }));
        }

        let freelancers = [...dbMapped, ...csvMapped];

        // Filter by ID or Name
        if (id) {
            freelancers = freelancers.filter((f) =>
                (f.id && f.id.toLowerCase().includes(id.toLowerCase())) ||
                (f.name && f.name.toLowerCase().includes(id.toLowerCase()))
            );
        }

        // Filter by Category
        if (category) {
            freelancers = freelancers.filter((f) =>
                (f.skills && f.skills.toLowerCase().includes(category.toLowerCase())) ||
                (f.primary_domain && f.primary_domain.toLowerCase().includes(category.toLowerCase()))
            );
        }

        // Filter by Experience Range
        if (minExp) {
            freelancers = freelancers.filter((f) => {
                const exp = parseFloat(f.experience_years);
                return !isNaN(exp) && exp >= parseFloat(minExp);
            });
        }

        if (maxExp) {
            freelancers = freelancers.filter((f) => {
                const exp = parseFloat(f.experience_years);
                return !isNaN(exp) && exp <= parseFloat(maxExp);
            });
        }

        // Filter by Skills
        if (skills) {
            const skillList = skills.split(",").map((s: string) => s.trim().toLowerCase());
            freelancers = freelancers.filter((f) => {
                if (!f.skills) return false;
                const fSkills = f.skills.toLowerCase();
                return skillList.some((s: string) => fSkills.includes(s));
            });
        }

        // Limit results for performance
        const results = freelancers.slice(0, 50).map(f => ({
            id: f.id,
            name: f.name,
            skills: f.skills ? f.skills.split(',').map((s: string) => s.trim()) : [],
            experience: f.experience_years,
            rating: f.credibility_score,
            completed_jobs: f.past_projects_count,
            hourly_rate: f.avg_earning_per_project ? (parseFloat(f.avg_earning_per_project) / 20).toFixed(0) : "50",
            location: f.location || "Remote",
            avatar: f.name ? f.name.charAt(0).toUpperCase() : "U"
        }));

        return NextResponse.json(results);

    } catch (error) {
        console.error("Error searching freelancers:", error);
        return NextResponse.json({ error: "Failed to fetch freelancers" }, { status: 500 });
    }
}
