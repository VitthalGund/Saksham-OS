import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Sidebar } from "@/components/layout/Sidebar";
import { FreelancerView } from "@/components/dashboard/FreelancerView";
import { ClientView } from "@/components/dashboard/ClientView";
import { findMatches } from "@/lib/agents/hunter";
import Notification from "@/models/Notification";
import Job from "@/models/Job";
import Invoice from "@/models/Invoice";
import User from "@/models/User";
import dbConnect from "@/lib/db";
import { redirect } from "next/navigation";
import { calculateFinancialMetrics } from "@/lib/agents/cfo";

export default async function DashboardPage() {
  const session: any = await getServerSession(authOptions as any);
  if (!session) {
    redirect("/auth/login");
  }
  
  const userId = (session.user as any).userId || (session.user as any).id;
  const userRole = session.user.role;

  await dbConnect();

  // Common data: Notifications
  const notifications = await Notification.find({ 
    recipientId: userId 
  }).sort({ createdAt: -1 }).limit(5).lean();

  // Route based on role
  if (userRole === 'client') {
    // CLIENT DASHBOARD
    // Fetch client-specific data
    const invoices = await Invoice.find({ related_client_id: userId, status: 'PAID' }).lean();
    const totalSpend = invoices.reduce((sum: number, inv: any) => sum + (inv.amount_due || 0), 0);

    const activeHires = await Job.countDocuments({ clientId: userId, status: 'InProgress' });

    const openJobs = await Job.find({ clientId: userId, status: 'Open' }).lean();
    const pendingBids = openJobs.reduce((count: number, job: any) => count + (job.bids?.length || 0), 0);

    // Fetch posted jobs
    const postedJobs = await Job.find({ clientId: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return (
      <div className="min-h-screen bg-background text-foreground flex">
        <Sidebar />
        <ClientView
          userName={session.user?.name}
          stats={{ totalSpend, activeHires, pendingBids }}
          postedJobs={JSON.parse(JSON.stringify(postedJobs))}
          notifications={JSON.parse(JSON.stringify(notifications))}
        />
      </div>
    );
  }

  // FREELANCER DASHBOARD (default)
  // 1. Fetch Matches & Notifications (Hunter Agent)
  let matches: any[] = [];
  try {
    matches = await findMatches(userId);
  } catch (e) {
    console.error("Error finding matches:", e);
  }
  
  const matchNotifications = notifications.filter((n: any) => n.type === 'job_match');
  const draftJobIds = new Set(matchNotifications.map((n: any) => n.relatedJobId));

  const rawJobs = matches.map((job: any) => ({
    ...job,
    _id: job._id.toString(),
    hasDraft: draftJobIds.has(job.job_id || job._id),
    match_score: job.match_score || 0 // No hardcoding, use actual score or 0
  }));
  const jobsWithDrafts = JSON.parse(JSON.stringify(rawJobs));

  // 2. Active Pursuit (Bids)
  const activeJobs = await Job.find({
    "bids.freelancerId": userId,
    status: "Open"
  }).lean();

  const activeBidsCount = activeJobs.length;
  const potentialValue = activeJobs.reduce((sum: number, job: any) => {
    const bid = job.bids.find((b: any) => b.freelancerId === userId);
    return sum + (bid ? bid.amount : 0);
  }, 0);

  // 3. Market Demand (Skills from Open Jobs)
  const allOpenJobs = await Job.find({ status: "Open" }).select('skills').lean();
  const skillCounts: Record<string, number> = {};
  allOpenJobs.forEach((job: any) => {
    const skills = typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills;
    if (Array.isArray(skills)) {
      skills.forEach((skill: string) => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    }
  });
  const topSkills = Object.entries(skillCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  // 4. Income Forecast
  const winRate = 0.2;
  const projectedEarnings = Math.round(potentialValue * winRate);

  // 5. Financial Snapshot (Invoices)
  const invoices = await Invoice.find({ related_freelancer_id: userId }).lean();
  const unpaidAmount = invoices
    .filter((inv: any) => inv.status !== 'PAID')
    .reduce((sum: number, inv: any) => sum + inv.amount_due, 0);
  const paidAmount = invoices
    .filter((inv: any) => inv.status === 'PAID')
    .reduce((sum: number, inv: any) => sum + inv.amount_due, 0);

  // 6. Financial Metrics (CFO Agent)
  const metrics = await calculateFinancialMetrics(userId);
  const { liquidity, burnRate, runwayDays, healthScore } = metrics;

  // 7. User Profile (Credibility)
  const user = await User.findOne({ userId }).lean();
  let credibilityScore = (user as any)?.credibilityScore || 0;

  if (!credibilityScore || credibilityScore === 0) {
    try {
      const { calculateCredibilityScore } = await import("@/lib/scoring-service");
      const skillsCount = (user as any)?.skills?.length || 0;
      const experienceYears = (user as any)?.experienceYears || 0;
      
      const { score } = await calculateCredibilityScore(userId, skillsCount, experienceYears);
      credibilityScore = score;
      
      await User.findOneAndUpdate(
        { userId },
        { $set: { credibilityScore: score } }
      );
      
      console.log(`✓ Credibility score calculated and saved for ${userId}: ${score}`);
    } catch (error) {
      console.error("Failed to calculate credibility score:", error);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <FreelancerView
        userName={session.user?.name}
        credibilityScore={credibilityScore}
        financialMetrics={{ liquidity, burnRate, runwayDays, healthScore }}
        activeBids={{ count: activeBidsCount, potentialValue }}
        topSkills={topSkills}
        projectedEarnings={projectedEarnings}
        jobsWithDrafts={jobsWithDrafts}
        invoices={{ unpaidAmount, paidAmount }}
        notifications={JSON.parse(JSON.stringify(notifications))}
      />
    </div>
  );
}
