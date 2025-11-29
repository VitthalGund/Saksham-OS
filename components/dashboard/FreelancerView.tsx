import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Target, TrendingUp, TrendingDown, Activity, Bell, Wallet, User as UserIcon } from "lucide-react";
import { JobFeed } from "@/components/features/JobFeed";

interface FreelancerViewProps {
  userName: string;
  credibilityScore: number;
  financialMetrics: {
    liquidity: number;
    burnRate: number;
    runwayDays: number;
    healthScore: number;
  };
  activeBids: {
    count: number;
    potentialValue: number;
  };
  topSkills: [string, number][];
  projectedEarnings: number;
  jobsWithDrafts: any[];
  invoices: {
    unpaidAmount: number;
    paidAmount: number;
  };
  notifications: any[];
}

export function FreelancerView({
  userName,
  credibilityScore,
  financialMetrics,
  activeBids,
  topSkills,
  projectedEarnings,
  jobsWithDrafts,
  invoices,
  notifications
}: FreelancerViewProps) {
  const { liquidity, burnRate, runwayDays, healthScore } = financialMetrics;

  return (
    <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {userName}. Growth Autopilot is active.</p>
        </div>
        <div className="flex gap-4">
          <Card className="bg-card border-border p-3 flex items-center gap-3">
            <UserIcon className="w-5 h-5 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Credibility</div>
              <div className={`font-bold ${credibilityScore >= 70 ? 'text-green-500' : credibilityScore >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                {credibilityScore}/100
              </div>
            </div>
          </Card>
        </div>
      </header>

      {/* CFO Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Liquidity</p>
                <h3 className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(liquidity)}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                <TrendingDown size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Burn</p>
                <h3 className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(burnRate)}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Runway</p>
                <h3 className="text-2xl font-bold">{runwayDays} Days</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${healthScore >= 70 ? 'bg-green-500/10 text-green-500' : healthScore >= 40 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                <Target size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Health Score</p>
                <h3 className={`text-2xl font-bold ${healthScore >= 70 ? 'text-green-500' : healthScore >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {healthScore}/100
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Widget 1: Active Pursuit */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Active Pursuit</span>
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">{activeBids.count} Bids</div>
            <p className="text-xs text-muted-foreground mt-1">Potential Value: ₹{activeBids.potentialValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        {/* Widget 2: Market Demand */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Market Demand</span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {topSkills.map(([skill, count], i) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill} <span className="ml-1 opacity-50">({count})</span>
                </Badge>
              ))}
              {topSkills.length === 0 && <span className="text-xs text-muted-foreground">No data yet</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Top skills in open jobs.</p>
          </CardContent>
        </Card>

        {/* Widget 3: Income Forecast */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Projected Earnings</span>
              <Activity className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold">₹{projectedEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on pipeline & 20% win rate.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Job Feed</h2>
            <Badge variant="outline" className="animate-pulse border-green-500 text-green-500">Live Scanning</Badge>
          </div>
          <JobFeed initialJobs={jobsWithDrafts} />
        </div>

        <div className="space-y-6">
          {/* Hunter Agent Status */}
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="text-base">Hunter Agent Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Scanning Upwork (API)</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Scanning LinkedIn Jobs</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Analyzing Freelancer.com</span>
              </div>
            </CardContent>
          </Card>

          {/* Financial Snapshot */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Financial Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Unpaid Invoices</span>
                <span className="font-bold text-red-400">₹{invoices.unpaidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Collected</span>
                <span className="font-bold text-green-400">₹{invoices.paidAmount.toLocaleString()}</span>
              </div>
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
