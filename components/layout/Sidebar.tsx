"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Wallet, 
  Users, 
  Bell, 
  Settings,
  LogOut,
  Network,
  Briefcase,
  Calculator,
  UserCircle,
  Search,
  PlusCircle
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  // Define all possible nav items
  const allNavItems = [
    // Common
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["freelancer"] },
    { name: "Command Center", href: "/command-center", icon: LayoutDashboard, roles: ["freelancer"] },
    { name: "Network", href: "/network", icon: Network, roles: ["freelancer", "client"] },
    { name: "Notifications", href: "/notifications", icon: Bell, roles: ["freelancer", "client"] },
    
    // Freelancer Specific
    { name: "Financial Hub", href: "/finance", icon: Wallet, roles: ["freelancer"] },
    { name: "Productivity", href: "/productivity", icon: LayoutDashboard, roles: ["freelancer"] },
    { name: "Calculator", href: "/calculator", icon: Calculator, roles: ["freelancer"] },
    { name: "Profile", href: "/profile", icon: UserCircle, roles: ["freelancer"] },
    { name: "Submit Work", href: "/freelancer/submit-work", icon: Bell, roles: ["freelancer"] },

    // Client Specific
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["client"] },
    { name: "Post Job", href: "/client/create-job", icon: PlusCircle, roles: ["client"] },
    { name: "Find Talent", href: "/client/find-freelancer", icon: Search, roles: ["client"] },
    { name: "My Hires", href: "/client/hires", icon: Users, roles: ["client"] },
    { name: "Payments", href: "/finance", icon: Wallet, roles: ["client"] },
  ];

  // Filter items based on role
  const navItems = allNavItems.filter(item => !role || item.roles.includes(role));

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass border-r border-white/10 flex flex-col z-50 bg-slate-950/50 backdrop-blur-xl">
      <div className="p-6">
        <Link href="/home" className="text-2xl font-bold tracking-tighter">
          Saksham<span className="text-primary">OS</span>
        </Link>
        {role && (
            <div className="mt-2 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                {role} Workspace
            </div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        <Link href="/settings">
          <div className="flex items-center space-x-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </div>
        </Link>
        <button 
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
