import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Job from "@/models/Job";
import User from "@/models/User"; // Assuming we might need to fetch freelancer details if not fully in Job

export async function GET() {
    try {
        const session:any = await getServerSession(authOptions as any) as Session | null;
        if (!session || !session.user || session.user.role !== "client") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const validIds = [session.user.id, session.user.userId].filter(Boolean);
        // Fetch jobs that are InProgress, Pending Review, or Completed for this client
        const jobs = await Job.find({
            clientId: { $in: validIds },
            status: { $in: ["InProgress", "Pending Review", "Completed"] }
        }).sort({ createdAt: -1 });

        const jobsWithFreelancers = await Promise.all(jobs.map(async (job: any) => {
            let freelancerName = "Unknown Freelancer";
            let freelancerEmail = "";

            if (job.assignedFreelancerId) {
                const freelancerQuery: any = { $or: [{ userId: job.assignedFreelancerId }] };
                if (job.assignedFreelancerId.match(/^[0-9a-fA-F]{24}$/)) {
                    freelancerQuery.$or.push({ _id: job.assignedFreelancerId });
                }
                
                const freelancer = await User.findOne(freelancerQuery);
                if (freelancer) {
                    freelancerName = freelancer.name;
                    freelancerEmail = freelancer.email;
                }
            }

            return {
                ...job.toObject(),
                freelancerName,
                freelancerEmail
            };
        }));

        return NextResponse.json(jobsWithFreelancers);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
