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
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const body = await req.json();
        const { freelancerId } = body;

        let job = null;
        try {
            job = await Job.findById(id);
        } catch (e) {
            // Ignore cast errors
        }
        if (!job) {
            job = await Job.findOne({ job_id: id });
        }

        if (!job) {
            return NextResponse.json({ message: "Job not found" }, { status: 404 });
        }

        const clientIdStr = job.clientId?.toString() || "";
        const isClient = session.user.id === clientIdStr || session.user.userId === clientIdStr;
        if (!isClient) {
            return NextResponse.json({ message: "Unauthorized to reject bids for this job" }, { status: 401 });
        }

        // Find and remove the bid from the job's bids array
        job.bids = job.bids.filter((bid: any) => bid.freelancerId !== freelancerId);
        await job.save();

        // Notify Freelancer
        await Notification.create({
            recipientId: freelancerId,
            type: "job_match",
            message: `Your bid was rejected for: ${job.title}`,
            relatedJobId: job._id,
            read: false,
        });
        
        // Emit Socket Event
        if ((global as any).io) {
            (global as any).io.to(freelancerId).emit("notification", {
                message: `Your bid was rejected for: ${job.title}`,
                jobId: job._id
            });
        }

        return NextResponse.json({ message: "Bid rejected successfully" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
