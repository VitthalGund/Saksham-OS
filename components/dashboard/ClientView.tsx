import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DollarSign, Briefcase, Users, TrendingUp, Bell, User as UserIcon } from "lucide-react";
import Link from "next/link";

interface ClientViewProps {
  userName: string;
  stats: {
    totalSpend: number;
    activeHires: number;
    pendingBids: number;
  };
  postedJobs: any[];
  notifications: any[];
}

export function ClientView({
  userName,
  stats,
  postedJobs,
  notifications
}: ClientViewProps) {
  return (
    <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Client Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {userName}. Manage your projects and hires.</p>
      </header>

      {/* Client Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spend</p>
                <h3 className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.totalSpend)}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
                <Briefcase size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Hires</p>
                <h3 className="text-2xl font-bold">{stats.activeHires}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Bids</p>
                <h3 className="text-2xl font-bold">{stats.pendingBids}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">My Posted Jobs</h2>
            <Link href="/client/create-job">
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">+ Post New Job</Badge>
            </Link>
          </div>
          
          <Card className="glass-card p-6">
            {postedJobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No jobs posted yet</p>
                <Link href="/client/create-job">
                  <Badge variant="default" className="cursor-pointer">Post Your First Job</Badge>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {postedJobs.map((job: any) => (
                  <div 
                    key={job._id || job.job_id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm">{job.title}</h4>
                      <Badge variant={job.status === 'Open' ? 'default' : job.status === 'InProgress' ? 'secondary' : 'outline'}>
                        {job.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{job.job_description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-400 font-bold">
                        {job.currency} {job.budget_min?.toLocaleString()} - {job.budget_max?.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">
                          {job.bids?.length || 0} bids
                        </span>
                        {job.days_to_complete && (
                          <span className="text-blue-400">
                            📅 {job.days_to_complete} days
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/client/create-job">
                <button className="w-full text-left px-4 py-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-sm font-medium">
                  Post New Job
                </button>
              </Link>
              <Link href="/client/my-hires">
                <button className="w-full text-left px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium">
                  View All Hires
                </button>
              </Link>
              <Link href="/finance">
                <button className="w-full text-left px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium">
                  Financial Hub
                </button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              ) : (
                notifications.map((n: any) => (
                  <div key={n._id || Date.now().toString(36) + Math.random().toString(36).slice(2)} className="flex gap-3 items-start">
                    <div className={`w-2 h-2 mt-1.5 rounded-full ${n.read ? 'bg-gray-500' : 'bg-blue-500'}`} />
                    <div>
                      <p className="text-sm font-medium line-clamp-2">{n.message}</p>
                      <p className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
