"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { Briefcase, DollarSign, Clock, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function JobDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [proposal, setProposal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isClient = session?.user?.id === job?.clientId || session?.user?.userId === job?.clientId;
  const isFreelancer = session?.user?.role === "freelancer";

  const fetchJob = async () => {
    try {
      const res = await fetch(`/api/jobs/${id}`);
      if (!res.ok) throw new Error("Job not found");
      const data = await res.json();
      setJob(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("JobDetailsPage: id from useParams:", id);
    if (id) fetchJob();
  }, [id]);

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${id}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(bidAmount), proposal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success("Bid placed successfully!");
      fetchJob(); // Refresh
      setBidAmount("");
      setProposal("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptBid = async (freelancerId: string) => {
    if (!confirm("Are you sure you want to accept this bid? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/jobs/${id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freelancerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success("Bid accepted! Job is now in progress.");
      fetchJob();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRejectBid = async (freelancerId: string) => {
    if (!confirm("Are you sure you want to reject this bid?")) return;
    
    try {
      const res = await fetch(`/api/jobs/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freelancerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success("Bid rejected.");
      fetchJob();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleApproveWork = async () => {
    if (!confirm("Are you sure you want to approve this work? Payment will be released to the freelancer.")) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${id}/approve-work`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success("Work approved! Escrow payment released.");
      fetchJob();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-950 text-white">Loading...</div>;
  if (!job) return <div className="flex items-center justify-center h-screen bg-slate-950 text-white">Job not found</div>;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Job Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                    <div className="flex items-center gap-4 text-muted-foreground">
                        <span className="flex items-center gap-1"><Briefcase size={16} /> {job.job_category}</span>
                        <span className="flex items-center gap-1"><Clock size={16} /> {job.urgency_level}</span>
                        <span className="flex items-center gap-1"><Calendar size={16} /> Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <Badge variant={job.status === "Open" ? "default" : "secondary"} className="text-lg px-4 py-1">
                    {job.status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap text-muted-foreground">{job.job_description}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Required Skills</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {job.skills?.map((skill: string, i: number) => (
                                    <Badge key={i} variant="outline">{skill}</Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Client View: Review Work */}
                    {isClient && job.status === "Pending Review" && job.submission && (
                        <Card className="border-primary bg-primary/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="text-primary" />
                                    Work Submitted for Review
                                </CardTitle>
                                <CardDescription>The freelancer has submitted their work. Please review and approve to release payment.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-background p-4 rounded-md border">
                                    <p className="text-sm font-medium mb-1">Freelancer Notes:</p>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{job.submission.notes || "No notes provided."}</p>
                                    <p className="text-xs text-muted-foreground mt-4">Submitted on: {new Date(job.submission.submittedAt).toLocaleString()}</p>
                                </div>
                                <Button className="w-full" onClick={handleApproveWork} disabled={submitting}>
                                    {submitting ? "Approving..." : "Approve Work & Release Payment"}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Client View: Bids List */}
                    {isClient && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Received Bids ({job.bids?.length || 0})</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {!job.bids || job.bids.length === 0 ? (
                                    <p className="text-muted-foreground">No bids yet.</p>
                                ) : (
                                    job.bids.map((bid: any) => (
                                        <div key={bid._id} className="border rounded-lg p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-lg">{bid.freelancerName}</p>
                                                <p className="text-primary font-medium">${bid.amount}</p>
                                                <p className="text-sm text-muted-foreground mt-1">{bid.proposal}</p>
                                                <p className="text-xs text-slate-500 mt-2">Bid placed on {new Date(bid.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            {job.status === "Open" && (
                                                <div className="flex gap-2 flex-col sm:flex-row">
                                                    <Button onClick={() => handleAcceptBid(bid.freelancerId)}>Accept Bid</Button>
                                                    <Button variant="danger" onClick={() => handleRejectBid(bid.freelancerId)}>Reject Bid</Button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar Stats & Actions */}
                <div className="space-y-6">
                    {/* Escrow Arbiter Status */}
                    {job.status !== "Open" && (
                        <Card className="border-blue-500 bg-blue-500/10">
                            <CardHeader>
                                <CardTitle className="text-blue-500 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5" />
                                    Arbiter Escrow
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm font-medium mb-1">Status: {job.status === "Completed" ? "Released" : "Holding Funds"}</p>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {job.status === "Completed" 
                                        ? "Funds have been released to the freelancer." 
                                        : "Funds are securely held in escrow until work is approved."}
                                </p>
                                {job.bids && job.assignedFreelancerId && (
                                    <div className="flex justify-between items-center text-lg font-bold">
                                        <span>Amount:</span>
                                        <span className="text-blue-400">
                                            ${job.bids.find((b: any) => b.freelancerId === job.assignedFreelancerId || b.freelancerId === job.assignedFreelancerId.toString())?.amount || 0}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Budget & Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Client Budget</span>
                                <span className="font-bold text-lg">${job.budget_min} - ${job.budget_max}</span>
                            </div>
                            
                            {job.bidStats && (
                                <>
                                    <div className="border-t pt-4">
                                        <p className="text-sm font-medium mb-2">Bid Activity</p>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Total Bids</span>
                                            <span>{job.bidStats.count}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Lowest Bid</span>
                                            <span className="text-green-500">${job.bidStats.min || 0}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Highest Bid</span>
                                            <span className="text-red-500">${job.bidStats.max || 0}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Freelancer View: Place Bid */}
                    {isFreelancer && job.status === "Open" && !job.bidStats?.myBid && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Place a Bid</CardTitle>
                                <CardDescription>Submit your proposal for this job.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePlaceBid} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Bid Amount ($)</Label>
                                        <Input 
                                            type="number" 
                                            value={bidAmount} 
                                            onChange={(e) => setBidAmount(e.target.value)} 
                                            required 
                                            min={1}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Proposal / Cover Letter</Label>
                                        <Input 
                                            value={proposal} 
                                            onChange={(e) => setProposal(e.target.value)} 
                                            required 
                                            placeholder="Why are you a good fit?"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={submitting}>
                                        {submitting ? "Submitting..." : "Submit Bid"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {isFreelancer && job.bidStats?.myBid && (
                        <Card className="bg-green-500/10 border-green-500/20">
                            <CardContent className="p-6 text-center">
                                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                <p className="font-medium text-green-400">You have bid ${job.bidStats.myBid.amount}</p>
                                <p className="text-sm text-green-500/70">Waiting for client response</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
