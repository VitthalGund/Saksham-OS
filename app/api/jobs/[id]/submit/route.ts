import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Job from "@/models/Job";
import Notification from "@/models/Notification";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        await dbConnect();
        const session: any = await getServerSession(authOptions as any);
        if (!session || !session.user || session.user.role !== "freelancer") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const body = await req.json();
        const { notes } = body;

        let job = null;
        try {
            job = await Job.findById(id);
        } catch (e) {}
        if (!job) {
            job = await Job.findOne({ job_id: id });
        }

        if (!job) {
            return NextResponse.json({ message: "Job not found" }, { status: 404 });
        }

        const validIds = [session.user.id, session.user.userId].filter(Boolean);
        const assignedFreelancerStr = job.assignedFreelancerId?.toString();
        if (!validIds.includes(assignedFreelancerStr)) {
            return NextResponse.json({ message: "You are not assigned to this job" }, { status: 401 });
        }

        // Update Job Status
        job.status = "Pending Review";
        job.job_status = "Pending Review";
        job.submission = {
            notes: notes || "",
            submittedAt: new Date()
        };
        await job.save();

        // Notify Client
        await Notification.create({
            recipientId: job.clientId,
            type: "job_match", 
            message: `Work has been submitted for: ${job.title}`,
            relatedJobId: job._id,
            read: false,
        });

        // Emit Socket Event
        if ((global as any).io) {
            (global as any).io.to(job.clientId.toString()).emit("notification", {
                message: `Work has been submitted for: ${job.title}`,
                jobId: job._id
            });
        }

        return NextResponse.json({ message: "Work submitted successfully" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
