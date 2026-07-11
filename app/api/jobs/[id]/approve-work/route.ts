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

        const clientIdStr = job.clientId?.toString() || "";
        const isClient = session.user.id === clientIdStr || session.user.userId === clientIdStr;
        if (!isClient) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        if (job.status !== "Pending Review") {
            return NextResponse.json({ message: "Job is not pending review" }, { status: 400 });
        }

        // Process Escrow Release
        const freelancerId = job.assignedFreelancerId;
        const acceptedBid = job.bids?.find((b: any) => b.freelancerId === freelancerId);
        const bidAmount = acceptedBid?.amount || 0;

        if (bidAmount > 0) {
            const BankAccount = (await import("@/models/BankAccount")).default;
            const Transaction = (await import("@/models/Transaction")).default;

            // Debit Arbiter Escrow
            const arbiterId = "ARBITER_ESCROW";
            let arbiterAccount = await BankAccount.findOne({ userId: arbiterId });
            if (arbiterAccount) {
                arbiterAccount.balance -= bidAmount; // Platform keeps the 199 fee. We only release the bidAmount.
                await arbiterAccount.save();

                await Transaction.create({
                    transaction_id: "TXN-" + Date.now() + "-DBT",
                    user_id: arbiterId,
                    related_job_id: job._id.toString(),
                    transaction_type: "DEBIT",
                    amount: bidAmount,
                    currency: "USD",
                    description: `Escrow release for job: ${job.title}`,
                    merchant_name: "Freelancer Payout",
                    transaction_category: "Escrow Release",
                    date: new Date(),
                    balance_after_transaction: arbiterAccount.balance
                });
            }

            // Credit Freelancer
            let freelancerAccount = await BankAccount.findOne({ userId: freelancerId });
            if (!freelancerAccount) {
                freelancerAccount = await BankAccount.create({
                    userId: freelancerId,
                    accountNumber: "FL-AC-" + Math.floor(100000 + Math.random() * 900000),
                    ifsc: "FLBANK0001",
                    bankName: "Freelancer Virtual Bank",
                    balance: 0
                });
            }
            freelancerAccount.balance += bidAmount;
            await freelancerAccount.save();

            await Transaction.create({
                transaction_id: "TXN-" + Date.now() + "-CRD",
                user_id: freelancerId,
                related_job_id: job._id.toString(),
                transaction_type: "CREDIT",
                amount: bidAmount,
                currency: "USD",
                description: `Payment released for completed job: ${job.title}`,
                merchant_name: "Platform Escrow",
                transaction_category: "Income",
                date: new Date(),
                balance_after_transaction: freelancerAccount.balance
            });
        }

        // Update Job Status
        job.status = "Completed";
        job.job_status = "Completed";
        await job.save();

        // Notify Freelancer
        await Notification.create({
            recipientId: freelancerId,
            type: "job_match", 
            message: `Your work was approved! Payment released for: ${job.title}`,
            relatedJobId: job._id,
            read: false,
        });

        // Emit Socket Event
        if ((global as any).io) {
            (global as any).io.to(freelancerId.toString()).emit("notification", {
                message: `Your work was approved! Payment released for: ${job.title}`,
                jobId: job._id
            });
        }

        return NextResponse.json({ message: "Work approved successfully" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
