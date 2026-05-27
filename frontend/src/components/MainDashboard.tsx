'use client';
import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, TrendingUp, Calendar, FileText, CheckSquare, Plus } from 'lucide-react';

interface MainDashboardProps {
  setActiveTab: (tab: 'dashboard' | 'tasks' | 'content' | 'crm' | 'finance') => void;
}

export function MainDashboard({ setActiveTab }: MainDashboardProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [t, c, i] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`).then(res => res.json()),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/content`).then(res => res.json()),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices`).then(res => res.json())
        ]);
        setTasks(t);
        setContent(c);
        setInvoices(i);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading Dashboard Data...</div>;
  }

  // Today's Priority Data
  const overdueTasks = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'COMPLETED');
  const shootsToday = content.filter(c => c.status === 'SHOOT_SCHEDULED' && new Date(c.deadline).toDateString() === new Date().toDateString());
  const editsDue = content.filter(c => c.status === 'EDITING' && new Date(c.deadline).toDateString() === new Date().toDateString());
  const approvalsWaiting = content.filter(c => c.status === 'REVIEW' || c.status === 'CLIENT_APPROVAL');
  const unpaidInvoices = invoices.filter(i => i.status === 'UNPAID');

  // Team Performance Data
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const delayedTasks = tasks.filter(t => t.status === 'DELAYED').length;
  const activeProjects = content.filter(c => c.status !== 'POSTED').length;
  const pendingApprovals = approvalsWaiting.length;

  return (
    <div className="space-y-8">
      
      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2 font-heading">
          <TrendingUp className="text-indigo-600" size={24} /> Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <button onClick={() => { window.location.hash = 'new-task'; setActiveTab('tasks'); }} className="bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm">
              <Plus size={24} />
            </div>
            <span className="font-semibold text-slate-700">Assign Task</span>
          </button>
          <button onClick={() => { window.location.hash = 'new-client'; setActiveTab('crm'); }} className="bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm">
              <Plus size={24} />
            </div>
            <span className="font-semibold text-slate-700">Add Client</span>
          </button>
          <button onClick={() => { window.location.hash = 'new-content'; setActiveTab('content'); }} className="bg-white border border-slate-200 hover:border-purple-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 shadow-sm">
              <Calendar size={24} />
            </div>
            <span className="font-semibold text-slate-700">Create Shoot</span>
          </button>
          <button onClick={() => { window.location.hash = 'new-invoice'; setActiveTab('crm'); }} className="bg-white border border-slate-200 hover:border-orange-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300 shadow-sm">
              <FileText size={24} />
            </div>
            <span className="font-semibold text-slate-700">Create Invoice</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Today's Priorities */}
        <div className="bg-white rounded-[24px] shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-slate-100 p-7">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 font-heading">
            <AlertCircle className="text-rose-500" size={22} /> Today's Priorities
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-5 bg-rose-50/50 rounded-2xl border border-rose-100/50 hover:bg-rose-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                  <Clock size={20} />
                </div>
                <span className="font-semibold text-rose-950">Overdue Tasks</span>
              </div>
              <span className="text-2xl font-bold text-rose-600">{overdueTasks.length}</span>
            </div>
            <div className="flex justify-between items-center p-5 bg-purple-50/50 rounded-2xl border border-purple-100/50 hover:bg-purple-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
                  <Calendar size={20} />
                </div>
                <span className="font-semibold text-purple-950">Shoots Today</span>
              </div>
              <span className="text-2xl font-bold text-purple-600">{shootsToday.length}</span>
            </div>
            <div className="flex justify-between items-center p-5 bg-amber-50/50 rounded-2xl border border-amber-100/50 hover:bg-amber-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                  <CheckSquare size={20} />
                </div>
                <span className="font-semibold text-amber-950">Approvals Waiting</span>
              </div>
              <span className="text-2xl font-bold text-amber-600">{approvalsWaiting.length}</span>
            </div>
            <div className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-200/60 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-200 text-slate-600 rounded-xl">
                  <FileText size={20} />
                </div>
                <span className="font-semibold text-slate-900">Unpaid Invoices</span>
              </div>
              <span className="text-2xl font-bold text-slate-600">{unpaidInvoices.length}</span>
            </div>
          </div>
        </div>

        {/* Team Performance Graph (Simplified Dashboard View) */}
        <div className="bg-white rounded-[24px] shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-slate-100 p-7">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 font-heading">
            <CheckCircle2 className="text-emerald-500" size={22} /> Team Performance Overview
          </h3>
          <div className="grid grid-cols-2 gap-5">
            <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 flex flex-col items-center justify-center text-center hover:bg-emerald-50 transition-colors">
              <span className="text-4xl font-black text-emerald-600 mb-2">{completedTasks}</span>
              <span className="text-sm font-semibold text-emerald-950">Completed Tasks</span>
            </div>
            <div className="p-6 bg-red-50/50 rounded-2xl border border-red-100/50 flex flex-col items-center justify-center text-center hover:bg-red-50 transition-colors">
              <span className="text-4xl font-black text-red-600 mb-2">{delayedTasks}</span>
              <span className="text-sm font-semibold text-red-950">Delayed Tasks</span>
            </div>
            <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex flex-col items-center justify-center text-center hover:bg-indigo-50 transition-colors">
              <span className="text-4xl font-black text-indigo-600 mb-2">{activeProjects}</span>
              <span className="text-sm font-semibold text-indigo-950">Active Projects</span>
            </div>
            <div className="p-6 bg-orange-50/50 rounded-2xl border border-orange-100/50 flex flex-col items-center justify-center text-center hover:bg-orange-50 transition-colors">
              <span className="text-4xl font-black text-orange-600 mb-2">{pendingApprovals}</span>
              <span className="text-sm font-semibold text-orange-950">Pending Approval</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
