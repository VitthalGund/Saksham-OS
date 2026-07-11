"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Search, Filter, MapPin, Star, Briefcase } from "lucide-react";
import Link from "next/link";

export default function FindFreelancerPage() {
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    keyword: "",
    category: "",
    minExp: 0,
    maxExp: 20,
  });

  const fetchFreelancers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.keyword) params.append("id", filters.keyword); // Using keyword as ID search for now, or could be name
      if (filters.category) params.append("category", filters.category);
      params.append("minExp", filters.minExp.toString());
      params.append("maxExp", filters.maxExp.toString());

      const res = await fetch(`/api/freelancers/search?${params.toString()}`);
      const data = await res.json();
      setFreelancers(data);
    } catch (error) {
      console.error("Failed to fetch freelancers", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchFreelancers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [filters.keyword, filters.category, filters.minExp, filters.maxExp]);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <header className="mb-8">
            <h1 className="text-3xl font-bold">Find Talent</h1>
            <p className="text-muted-foreground">Discover top-rated freelancers for your projects.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter size={20} /> Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Name or ID..." 
                                    className="pl-9"
                                    value={filters.keyword}
                                    onChange={(e) => setFilters({...filters, keyword: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <select 
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={filters.category}
                                onChange={(e) => setFilters({...filters, category: e.target.value})}
                            >
                                <option value="">All Categories</option>
                                <option value="Web Development">Web Development</option>
                                <option value="Mobile">Mobile App</option>
                                <option value="Design">Design</option>
                                <option value="Data">Data Science</option>
                                <option value="Writing">Writing</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Experience (Years)</label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    type="number" 
                                    placeholder="Min" 
                                    value={filters.minExp}
                                    onChange={(e) => setFilters({...filters, minExp: Number(e.target.value)})}
                                />
                                <span>-</span>
                                <Input 
                                    type="number" 
                                    placeholder="Max" 
                                    value={filters.maxExp}
                                    onChange={(e) => setFilters({...filters, maxExp: Number(e.target.value)})}
                                />
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>

            {/* Results Grid */}
            <div className="lg:col-span-3">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {freelancers.map((freelancer: any) => (
                            <Card key={freelancer.id} className="hover:border-primary/50 transition-colors group">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-white">
                                                {freelancer.avatar}
                                            </div>
                                            <div>
                                                <h3 className="font-bold truncate max-w-[120px]" title={freelancer.name}>{freelancer.name}</h3>
                                                <p className="text-xs text-muted-foreground">{freelancer.location}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-yellow-500 text-sm font-medium">
                                            <Star size={14} fill="currentColor" />
                                            {freelancer.rating ? Math.round(freelancer.rating) : "N/A"}
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <div className="flex flex-wrap gap-2">
                                            {freelancer.skills.slice(0, 3).map((skill: string, i: number) => (
                                                <span key={i} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">
                                                    {skill}
                                                </span>
                                            ))}
                                            {freelancer.skills.length > 3 && (
                                                <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">
                                                    +{freelancer.skills.length - 3}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-slate-400">
                                            <span>{freelancer.experience} Years Exp.</span>
                                            <span>{freelancer.completed_jobs} Jobs</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                                        <span className="font-bold text-lg">${freelancer.hourly_rate}<span className="text-sm text-muted-foreground font-normal">/hr</span></span>
                                        <Link href={`/profile/${freelancer.id}`}>
                                            <Button size="sm" variant="outline" className="group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors">
                                                View Profile
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
                {!loading && freelancers.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No freelancers found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}
