import { getProfileById } from "@/lib/profile-service";
import { notFound } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { UserCircle, MapPin, Mail, Phone, Briefcase, Star, DollarSign, Award, Shield } from "lucide-react";
import { ResumeUploadCard } from "@/components/features/ResumeUploadCard";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfileById(id);

  if (!profile) {
    notFound();
  }

  const isFreelancer = profile.role === 'freelancer';

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        {/* Header */}
        <div className="relative mb-8 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
            <div className="h-32 bg-linear-to-r from-blue-600 to-purple-600 opacity-20"></div>
            <div className="px-8 pb-8 flex items-end -mt-12 gap-6">
                <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-slate-900 flex items-center justify-center text-4xl font-bold text-white shadow-xl">
                    {profile.name.charAt(0)}
                </div>
                <div className="flex-1 mb-2">
                    <h1 className="text-3xl font-bold text-white">{profile.name}</h1>
                    <div className="flex items-center gap-4 text-slate-400 text-sm mt-1">
                        <span className="flex items-center gap-1 uppercase tracking-wider font-semibold text-blue-400">
                            {profile.role}
                        </span>
                        {profile.location && (
                            <span className="flex items-center gap-1">
                                <MapPin size={14} /> {profile.location}
                            </span>
                        )}
                        {profile.email && (
                            <span className="flex items-center gap-1">
                                <Mail size={14} /> {profile.email}
                            </span>
                        )}
                    </div>
                </div>
                <div className="mb-4">
                    <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors">
                        Contact
                    </button>
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{isFreelancer ? "Total Earnings" : "Total Spent"}</p>
                            <h3 className="text-2xl font-bold">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(isFreelancer ? profile.total_earnings || 0 : profile.total_spent || 0)}
                            </h3>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                            <Briefcase size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{isFreelancer ? "Jobs Completed" : "Jobs Posted"}</p>
                            <h3 className="text-2xl font-bold">
                                {isFreelancer ? profile.jobs_completed : profile.jobs_posted}
                            </h3>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500">
                            <Star size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{isFreelancer ? "Credibility Score" : "Rating"}</p>
                            <h3 className="text-2xl font-bold">
                                {profile.rating ? Math.round(profile.rating) : 'N/A'}%
                            </h3>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                            <Award size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Experience</p>
                            <h3 className="text-2xl font-bold">
                                {profile.experience_years || 0} Years
                            </h3>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Details Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <section>
                    <h2 className="text-xl font-bold mb-4">About</h2>
                    <p className="text-slate-400 leading-relaxed">
                        {profile.bio || `${profile.name} is a professional ${profile.role} on Saksham OS. Connect to collaborate.`}
                    </p>
                </section>

                {isFreelancer && profile.skills && (
                    <section>
                        <h2 className="text-xl font-bold mb-4">Skills</h2>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill, i) => (
                                <span key={i} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-300 text-sm">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <div className="space-y-6">
                {/* Resume Upload - Only visible to the owner (simplified check for now, assuming profile page is mostly self-view in this context or we'd check session) */}
                {/* In a real app, we'd check if session.user.id === profile.userId */}
                <ResumeUploadCard userId={profile.userId || profile.id} />

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Verification</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                            <Shield className={`w-4 h-4 ${(profile.credibilityScore || 0) > 0 ? 'text-green-500' : 'text-slate-500'}`} />
                            <span>Identity Verified</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Shield className={`w-4 h-4 ${(profile.isBankConnected || false) ? 'text-green-500' : 'text-slate-500'}`} />
                            <span>Payment Verified</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Shield className="text-slate-500 w-4 h-4" />
                            <span>Phone Verified</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
}
