"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

// Mock Jobs for Dropdown
const ACTIVE_JOBS = [
  { id: "job_001", title: "Fintech App Redesign", client: "TechCorp Inc." },
  { id: "job_003", title: "AI Chatbot Frontend", client: "StartupAI" },
];

export default function SubmitWorkPage() {
  const [selectedJob, setSelectedJob] = useState("");
  const [workFile, setWorkFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [activeJobs, setActiveJobs] = useState<any[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
        try {
            const res = await fetch("/api/freelancer/active-jobs");
            if (res.ok) {
                const data = await res.json();
                setActiveJobs(data);
            }
        } catch (e) {
            console.error(e);
        }
    };
    fetchJobs();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setWorkFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !workFile) return;

    setIsSubmitting(true);
    
    try {
        const res = await fetch(`/api/jobs/${selectedJob}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes: description }),
        });

        if (res.ok) {
            setSubmitSuccess(true);
            setWorkFile(null);
            setDescription("");
            setSelectedJob("");
        } else {
            const data = await res.json();
            console.error("Failed to submit", data.message);
            alert(data.message || "Failed to submit work");
        }
    } catch (e) {
        console.error(e);
        alert("An error occurred");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Submit Work</h1>
          <p className="text-muted-foreground">Deliver your project milestones securely to clients.</p>
        </header>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle>Project Submission</CardTitle>
              </div>
              <CardDescription>
                Upload your deliverables. The client will be notified immediately.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitSuccess ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold">Work Submitted Successfully!</h3>
                  <p className="text-muted-foreground">
                    Your files have been sent to the client. You will be notified once they review it.
                  </p>
                  <Button onClick={() => setSubmitSuccess(false)} variant="outline">Submit Another</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="space-y-2">
                    <Label>Select Project</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedJob}
                      onChange={(e) => setSelectedJob(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Active Job --</option>
                      {activeJobs.map(job => (
                        <option key={job._id} value={job._id}>{job.title} ({job.clientName || "Client"})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Upload Files (ZIP / PDF / Design)</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-accent/5 transition-colors">
                      <input 
                        type="file" 
                        id="work-upload" 
                        className="hidden" 
                        onChange={handleFileChange}
                        required
                      />
                      <label htmlFor="work-upload" className="cursor-pointer flex flex-col items-center gap-4">
                        <div className="p-4 bg-primary/10 rounded-full text-primary">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-lg font-medium">
                            {workFile ? workFile.name : "Click to Upload Work"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {workFile ? `${(workFile.size / 1024 / 1024).toFixed(2)} MB` : "Max file size: 50MB"}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Submission Notes</Label>
                    <textarea 
                      className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Add any comments, instructions, or links for the client..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="bg-yellow-500/10 text-yellow-500 p-4 rounded-lg text-sm flex gap-3 items-start">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>
                      <strong>Note:</strong> Once submitted, this milestone will be marked as "Pending Review". Ensure all requirements are met to avoid revisions.
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting || !selectedJob || !workFile}>
                    {isSubmitting ? "Uploading & Sending..." : "Submit Work to Client"}
                  </Button>

                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
