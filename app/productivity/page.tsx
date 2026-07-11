"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { CheckCircle, Plus, Calendar as CalendarIcon, Clock, Briefcase, Trash2, Edit2, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const EVENT_TYPES = [
  { value: "ProjectDeadline", label: "Project Deadline", color: "bg-red-500/10 text-red-500" },
  { value: "NetworkEvent", label: "Networking Event", color: "bg-blue-500/10 text-blue-500" },
  { value: "Personal", label: "Personal", color: "bg-green-500/10 text-green-500" },
];

export default function ProductivityPage() {
  const { data: session } = useSession();
  
  // State
  const [tasks, setTasks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newTask, setNewTask] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", type: "Personal" });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Fetch Data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, eventsRes, jobsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/events"),
        fetch("/api/jobs")
      ]);
      
      const tasksData = await tasksRes.json();
      const eventsData = await eventsRes.json();
      const jobsData = await jobsRes.json();

      // Deduplicate jobs by job_id
      // Deduplicate jobs by job_id or _id
      const uniqueJobs = Array.from(new Map(jobsData.map((job: any) => [job.job_id || job._id, job])).values());

      setTasks(tasksData);
      setEvents(eventsData);
      setJobs(uniqueJobs);
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Failed to load productivity data");
    } finally {
      setLoading(false);
    }
  };

  // Task Handlers
  const [newTaskDate, setNewTaskDate] = useState("");

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newTask, jobId: selectedJobId, date: newTaskDate })
      });
      const data = await res.json();
      setTasks([data, ...tasks]);
      setNewTask("");
      setNewTaskDate("");
      setSelectedJobId("");
      toast.success("Task added");
    } catch (error) {
      toast.error("Failed to add task");
    }
  };

  const toggleTask = async (task: any) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, done: !task.done })
      });
      const updated = await res.json();
      setTasks(tasks.map(t => t.id === updated.id ? updated : t));
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      setTasks(tasks.filter(t => t.id !== id));
      toast.success("Task deleted");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  // Event Handlers
  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent)
      });
      const data = await res.json();
      setEvents([...events, data]);
      setShowEventModal(false);
      setNewEvent({ title: "", date: "", type: "Personal" });
      toast.success("Event scheduled");
    } catch (error) {
      toast.error("Failed to add event");
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await fetch(`/api/events?id=${id}`, { method: "DELETE" });
      setEvents(events.filter(e => e.event_id !== id));
      toast.success("Event deleted");
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  // Calendar Helpers
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
  const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();
  const currentMonthPrefix = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;

  const userId = (session?.user as any)?.id || (session?.user as any)?.userId;
  const jobMilestones: any[] = [];
  if (userId) {
    jobs.forEach(job => {
        const isMyJob = job.assignedFreelancerId && (job.assignedFreelancerId === userId || job.assignedFreelancerId?.toString() === userId?.toString());
        
        // 1. Bid Placed
        const myBid = job.bids?.find((b: any) => b.freelancerId === userId || b.freelancerId?.toString() === userId?.toString());
        if (myBid && myBid.createdAt) {
            jobMilestones.push({
                event_id: `bid-${job.job_id || job._id}`,
                title: `Bid Placed: ${job.title}`,
                start_time: new Date(myBid.createdAt).toISOString().split('T')[0],
                type: 'NetworkEvent',
                isMilestone: true
            });
        }
        
        // 2. Job Accepted
        if (isMyJob && job.acceptedAt) {
            jobMilestones.push({
                event_id: `accepted-${job.job_id || job._id}`,
                title: `Bid Accepted: ${job.title}`,
                start_time: new Date(job.acceptedAt).toISOString().split('T')[0],
                type: 'Personal',
                isMilestone: true
            });
        }
        
        // 3. Work Submitted
        if (isMyJob && job.submission?.submittedAt) {
            jobMilestones.push({
                event_id: `submit-${job.job_id || job._id}`,
                title: `Work Submitted: ${job.title}`,
                start_time: new Date(job.submission.submittedAt).toISOString().split('T')[0],
                type: 'ProjectDeadline',
                isMilestone: true
            });
        }
    });
  }

  const allEvents = [...events, ...jobMilestones];

  const getDaysInMonth = () => Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);
  const getEventsForDate = (day: number) => {
    const dateStr = `${currentMonthPrefix}-${day.toString().padStart(2, '0')}`;
    const dayEvents = allEvents.filter(e => e.start_time === dateStr);
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
    return [...dayEvents, ...dayTasks.map(t => ({ ...t, type: 'Task', event_id: t.id }))];
  };

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden relative">
      <Sidebar />

      {/* Video Background */}
      <div className="absolute inset-0 z-0 ml-64 opacity-60">
        <video 
          autoPlay 
          loop 
          muted 
          className="w-full h-full object-cover"
        >
          <source src="/assets/animated_calendar.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
      </div>

      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen relative z-10">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Productivity Hub
            </h1>
            <p className="text-gray-400 mt-1">Manage your tasks and schedule in the flow.</p>
          </div>
          <Button onClick={() => setShowEventModal(true)} className="gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10">
            <Plus className="w-4 h-4" /> Add Event
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Tasks Column */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="h-full bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addTask} className="space-y-4 mb-6">
                  <Input 
                    placeholder="Add a new task..." 
                    value={newTask} 
                    onChange={(e) => setNewTask(e.target.value)} 
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                  <div className="flex gap-2">
                    <Input 
                      type="date"
                      value={newTaskDate}
                      onChange={(e) => setNewTaskDate(e.target.value)}
                      className="bg-white/5 border-white/10 text-white w-1/2"
                    />
                    <select 
                      className="flex h-10 w-1/2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                    >
                      <option value="" className="bg-slate-900">Assign Job</option>
                      {jobs.map((job, index) => (
                        <option key={job.job_id || job._id || index} value={job.job_id || job._id} className="bg-slate-900">{job.title}</option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={!newTask.trim()}>Add Task</Button>
                </form>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence>
                    {/* Merge Tasks and Events for Display */}
                    {[...tasks, ...allEvents].sort((a, b) => {
                        const dateA = a.createdAt || a.start_time || "";
                        const dateB = b.createdAt || b.start_time || "";
                        return dateB.localeCompare(dateA); // Newest first
                    }).map(item => {
                      const isEvent = !!item.event_id;
                      return (
                      <motion.div 
                        key={isEvent ? item.event_id : item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${item.done ? 'bg-white/5 border-white/5 opacity-60' : 'bg-white/10 border-white/20 hover:bg-white/15'}`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          {!isEvent ? (
                            <button onClick={() => toggleTask(item)} className={`shrink-0 ${item.done ? 'text-green-500' : 'text-gray-400 hover:text-white'}`}>
                              <CheckCircle className={`w-5 h-5 ${item.done ? 'fill-current' : ''}`} />
                            </button>
                          ) : (
                             <div className={`w-2 h-2 rounded-full ${EVENT_TYPES.find(t => t.value === item.type)?.color?.split(' ')[0]?.replace('/10', '') || 'bg-purple-500'}`} />
                          )}
                          
                          <div className="min-w-0">
                            <p className={`text-sm font-medium truncate text-white ${item.done ? 'line-through text-gray-500' : ''}`}>
                              {item.title}
                            </p>
                            <div className="flex gap-2 text-xs text-gray-400 mt-1">
                                {(item.dueDate || item.start_time) && (
                                    <span className="flex items-center gap-1">
                                        <CalendarIcon className="w-3 h-3" />
                                        {item.dueDate || item.start_time}
                                    </span>
                                )}
                                {item.relatedJobId && (
                                  <span className="flex items-center gap-1">
                                    <Briefcase className="w-3 h-3" />
                                    {jobs.find(j => j.job_id === item.relatedJobId)?.title || "Job"}
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                        {!item.isMilestone && (
                            <button onClick={() => isEvent ? deleteEvent(item.event_id) : deleteTask(item.id)} className="text-gray-500 hover:text-red-400 shrink-0 ml-2">
                              <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                      </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {[...tasks, ...allEvents].length === 0 && !loading && (
                    <p className="text-center text-gray-500 text-sm py-4">No tasks or events yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interactive SVG Calendar Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="h-full flex flex-col bg-black/40 backdrop-blur-xl border-white/10 overflow-hidden">
              <CardHeader className="border-b border-white/10 pb-4">
                <CardTitle className="text-white flex justify-between items-center">
                  <span>{currentMonthName} {currentYear}</span>
                  <div className="flex gap-2 text-xs font-normal text-gray-400">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Deadline</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Network</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Personal</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-6 relative">
                
                {/* SVG Grid Overlay */}
                <div className="grid grid-cols-7 gap-4 h-full">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{day}</div>
                  ))}
                  
                  {/* Empty slots */}
                  {Array.from({ length: 6 }).map((_, i) => <div key={`empty-${i}`} />)}
                  
                  {getDaysInMonth().map(day => {
                    const dayItems = getEventsForDate(day);
                    const isSelected = selectedDate === `${currentMonthPrefix}-${day.toString().padStart(2, '0')}`;
                    
                    return (
                      <motion.button
                        key={day}
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedDate(`${currentMonthPrefix}-${day.toString().padStart(2, '0')}`)}
                        className={`
                          aspect-square rounded-xl border p-2 flex flex-col items-start justify-between transition-all relative group
                          ${isSelected ? 'bg-white/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/5 border-white/10 hover:border-white/30'}
                          ${dayItems.length > 0 ? 'bg-white/10' : ''}
                        `}
                      >
                        <span className={`text-lg font-bold ${dayItems.length > 0 ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>{day}</span>
                        
                        {/* Event Dots */}
                        <div className="flex gap-1 w-full overflow-hidden flex-wrap content-end">
                          {dayItems.map((item: any, i) => {
                            let colorClass = "bg-gray-500";
                            if (item.type === 'ProjectDeadline') colorClass = "bg-red-500";
                            else if (item.type === 'NetworkEvent') colorClass = "bg-blue-500";
                            else if (item.type === 'Personal') colorClass = "bg-green-500";
                            else if (item.type === 'Task') colorClass = "bg-purple-500"; // Distinct color for tasks

                            return (
                              <div key={item.event_id || item.id || i} className={`w-2 h-2 rounded-full shadow-sm ${colorClass}`} />
                            );
                          })}
                        </div>

                        {/* Hover Glow Effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </motion.button>
                    );
                  })}
                </div>

                {/* Selected Date Details Overlay */}
                <AnimatePresence>
                  {selectedDate && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="absolute top-6 right-6 bottom-6 w-80 bg-black/90 backdrop-blur-2xl border-l border-white/10 p-6 shadow-2xl z-20 rounded-l-2xl"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <CalendarIcon className="w-5 h-5 text-blue-400" />
                          {selectedDate}
                        </h3>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-white">
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {getEventsForDate(parseInt(selectedDate.split('-')[2])).map((item: any) => (
                          <motion.div 
                            key={item.event_id || item.id} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className={`mt-1 w-2 h-2 rounded-full ${
                                  item.type === 'ProjectDeadline' ? 'bg-red-500' :
                                  item.type === 'NetworkEvent' ? 'bg-blue-500' :
                                  item.type === 'Personal' ? 'bg-green-500' :
                                  'bg-purple-500'
                                }`} />
                                <div>
                                  <p className="font-medium text-white">{item.title}</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {item.type === 'Task' ? 'Task' : EVENT_TYPES.find(t => t.value === item.type)?.label || 'Event'}
                                  </p>
                                </div>
                              </div>
                              {!item.isMilestone && (
                                <button 
                                  onClick={() => item.type === 'Task' ? deleteTask(item.id) : deleteEvent(item.event_id)} 
                                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        ))}
                        {getEventsForDate(parseInt(selectedDate.split('-')[2])).length === 0 && (
                          <div className="text-center py-10 text-gray-500">
                            <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p>No events scheduled.</p>
                            <Button 
                              variant="ghost" 
                              className="text-blue-400 mt-2"
                              onClick={() => {
                                setNewEvent({ ...newEvent, date: selectedDate });
                                setShowEventModal(true);
                              }}
                            >
                              Add Event
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </CardContent>
            </Card>
          </div>

        </div>

        {/* Add Event Modal */}
        <AnimatePresence>
          {showEventModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-950 border border-white/10 rounded-xl shadow-2xl w-full max-w-md p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">Add New Event</h2>
                  <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={addEvent} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Event Title</Label>
                    <Input 
                      value={newEvent.title} 
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} 
                      placeholder="e.g. Client Meeting"
                      required
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Date</Label>
                    <Input 
                      type="date"
                      value={newEvent.date} 
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})} 
                      required
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Type</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={newEvent.type}
                      onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                    >
                      {EVENT_TYPES.map(type => (
                        <option key={type.value} value={type.value} className="bg-slate-900">{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-white hover:bg-white/5">Cancel</Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Create Event</Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
