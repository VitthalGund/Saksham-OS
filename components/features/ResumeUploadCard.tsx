"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Upload, FileText, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ResumeUploadCard({ userId }: { userId: string }) {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/user/resume", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Upload failed");
            }

            toast.success(`Resume processed! Score: ${data.score}`, {
                description: `Extracted ${data.skills.length} skills and ${data.experienceYears} years of experience.`
            });
            
            // Optional: Refresh page to show new stats
            window.location.reload();

        } catch (error: any) {
            toast.error("Upload failed", {
                description: error.message
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Professional Profile
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Upload your resume to verify skills, experience, and boost your Credibility Score.
                </p>
                
                <div className="relative">
                    <input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={isUploading}
                    />
                    <div className="border-2 border-dashed border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-slate-800/50 transition-colors">
                        {isUploading ? (
                            <>
                                <Loader2 className="w-6 h-6 text-blue-500 animate-spin mb-2" />
                                <span className="text-sm font-medium">Analyzing Resume...</span>
                            </>
                        ) : (
                            <>
                                <Upload className="w-6 h-6 text-slate-400 mb-2" />
                                <span className="text-sm font-medium">Upload Resume</span>
                                <span className="text-xs text-muted-foreground mt-1">PDF or DOCX (Max 5MB)</span>
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
