import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Job from "@/models/Job";
import Notification from "@/models/Notification";
import fs from "fs";
import path from "path";

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
            return NextResponse.json({ message: "Unauthorized to accept bids for this job" }, { status: 401 });
        }

        // Update Job
        job.status = "InProgress";
        job.job_status = "InProgress";
        job.assignedFreelancerId = freelancerId;
        job.acceptedAt = new Date();
        await job.save();

        // Process Financial Transaction (Escrow System)
        const acceptedBid = job.bids?.find((b: any) => b.freelancerId === freelancerId);
        const bidAmount = acceptedBid?.amount || 0;
        const platformFee = 199;
        const totalCharge = bidAmount + platformFee;

        if (bidAmount > 0) {
            const BankAccount = (await import("@/models/BankAccount")).default;
            const Transaction = (await import("@/models/Transaction")).default;

            // 1. Debit Client
            const clientId = session.user.id || session.user.userId;
            let clientAccount = await BankAccount.findOne({ userId: clientId });
            if (!clientAccount) {
                clientAccount = await BankAccount.create({
                    userId: clientId,
                    accountNumber: "CL-AC-" + Math.floor(100000 + Math.random() * 900000),
                    ifsc: "CLBANK0001",
                    bankName: "Client Virtual Bank",
                    balance: 100000 // Give some starting balance for testing
                });
            }
            clientAccount.balance -= totalCharge;
            await clientAccount.save();

            await Transaction.create({
                transaction_id: "TXN-" + Date.now() + "-DBT",
                user_id: clientId,
                related_job_id: job._id.toString(),
                transaction_type: "DEBIT",
                amount: totalCharge,
                currency: "USD",
                description: `Payment for job escrow + fee: ${job.title}`,
                merchant_name: "Platform Arbiter Escrow",
                transaction_category: "Expense",
                date: new Date(),
                balance_after_transaction: clientAccount.balance
            });

            // 2. Credit Arbiter Escrow
            const arbiterId = "ARBITER_ESCROW";
            let arbiterAccount = await BankAccount.findOne({ userId: arbiterId });
            if (!arbiterAccount) {
                arbiterAccount = await BankAccount.create({
                    userId: arbiterId,
                    accountNumber: "ESCROW-001",
                    ifsc: "ARBITER0001",
                    bankName: "Trusted Arbiter Bank",
                    balance: 0
                });
            }
            arbiterAccount.balance += totalCharge;
            await arbiterAccount.save();

            await Transaction.create({
                transaction_id: "TXN-" + Date.now() + "-CRD",
                user_id: arbiterId,
                related_job_id: job._id.toString(),
                transaction_type: "CREDIT",
                amount: totalCharge,
                currency: "USD",
                description: `Escrow hold for job: ${job.title}`,
                merchant_name: "Client Payment",
                transaction_category: "Escrow",
                date: new Date(),
                balance_after_transaction: arbiterAccount.balance
            });
        }

        // Send Notification to Freelancer
        await Notification.create({
            recipientId: freelancerId,
            type: "job_match", // Reuse icon for now
            message: `Your bid was accepted for: ${job.title}`,
            relatedJobId: job._id,
            read: false,
        });

        // Update dummy_job_feed_v3.json for Bubble Chart
        const jobsFilePath = path.join(process.cwd(), 'public', 'data', 'dummy_job_feed_v3.json');
        if (fs.existsSync(jobsFilePath)) {
            try {
                const jobsData = JSON.parse(fs.readFileSync(jobsFilePath, 'utf-8'));
                const jobIndex = jobsData.findIndex((j: any) => j.job_id === job._id.toString());
                if (jobIndex !== -1) {
                    jobsData[jobIndex].assigned_freelancer_id = freelancerId;
                    jobsData[jobIndex].job_status = "InProgress";
                    fs.writeFileSync(jobsFilePath, JSON.stringify(jobsData, null, 2));
                }
            } catch (err) {
                console.error("Failed to update dummy_job_feed_v3.json", err);
            }
        }

        // Emit Socket Event (Implementation coming soon)
        if ((global as any).io) {
            (global as any).io.to(freelancerId).emit("notification", {
                message: `Your bid was accepted for: ${job.title}`,
                jobId: job._id
            });
        }

        return NextResponse.json({ message: "Bid accepted successfully" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
