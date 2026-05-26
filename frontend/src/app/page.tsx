'use client';
import { useEffect, useState } from 'react';
import { MainDashboard } from '@/components/MainDashboard';
import { TaskManager } from '@/components/TaskManager';
import { ContentPipeline } from '@/components/ContentPipeline';
import { CrmDashboard } from '@/components/CrmDashboard';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { TeamDashboard } from '@/components/TeamDashboard';
import { LayoutDashboard, CheckSquare, Briefcase, DollarSign, BellRing, Video, Users } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'content' | 'crm' | 'finance' | 'team'>('dashboard');
  const [showPingModal, setShowPingModal] = useState(false);
  const [pingMessage, setPingMessage] = useState('');
  const [isPinging, setIsPinging] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleGlobalPing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pingMessage.trim()) return;
    setIsPinging(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ping-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: pingMessage })
      });
      setShowPingModal(false);
      setPingMessage('');
      alert('Global Ping sent!');
    } catch(e) {
      alert('Failed to send global ping');
    } finally {
      setIsPinging(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <MainDashboard setActiveTab={setActiveTab} />;
      case 'tasks': return <TaskManager />;
      case 'content': return <ContentPipeline />;
      case 'crm': return <CrmDashboard />;
      case 'finance': return <AnalyticsDashboard />;
      case 'team': return <TeamDashboard />;
      default: return <MainDashboard setActiveTab={setActiveTab} />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'tasks': return 'Task Management';
      case 'content': return 'Content Production Pipeline';
      case 'crm': return 'Client CRM';
      case 'finance': return 'Finance & Analytics';
      case 'team': return 'Team Performance & Rankings';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex" suppressHydrationWarning>
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f172a] text-slate-300 flex flex-col shrink-0 border-r border-[#1e293b] shadow-xl z-20">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <img src="/tsc_logo_transparent.png" alt="The Social Circle" className="w-10 h-10 object-contain rounded-lg" />
            <h1 className="text-lg font-bold tracking-wider text-indigo-400 leading-tight font-heading">
              The Social<br/><span className="text-slate-100">Circle</span>
            </h1>
          </div>
          <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest">Agency Management System</p>
        </div>
        <nav className="flex-1 mt-2 overflow-y-auto custom-scrollbar px-3 space-y-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 font-medium ${activeTab === 'dashboard' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-[#1e293b] hover:text-white border border-transparent'}`}
          >
            <LayoutDashboard size={18} className={activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-500'} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 font-medium ${activeTab === 'tasks' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-[#1e293b] hover:text-white border border-transparent'}`}
          >
            <CheckSquare size={18} className={activeTab === 'tasks' ? 'text-indigo-400' : 'text-slate-500'} />
            Tasks
          </button>
          <button 
            onClick={() => setActiveTab('content')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 font-medium ${activeTab === 'content' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-[#1e293b] hover:text-white border border-transparent'}`}
          >
            <Video size={18} className={activeTab === 'content' ? 'text-indigo-400' : 'text-slate-500'} />
            Content Production
          </button>
          <button 
            onClick={() => setActiveTab('crm')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 font-medium ${activeTab === 'crm' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-[#1e293b] hover:text-white border border-transparent'}`}
          >
            <Briefcase size={18} className={activeTab === 'crm' ? 'text-indigo-400' : 'text-slate-500'} />
            Client CRM
          </button>
          <button 
            onClick={() => setActiveTab('team')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 font-medium ${activeTab === 'team' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-[#1e293b] hover:text-white border border-transparent'}`}
          >
            <Users size={18} className={activeTab === 'team' ? 'text-indigo-400' : 'text-slate-500'} />
            Team & Performance
          </button>
          <button 
            onClick={() => setActiveTab('finance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 font-medium ${activeTab === 'finance' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-[#1e293b] hover:text-white border border-transparent'}`}
          >
            <DollarSign size={18} className={activeTab === 'finance' ? 'text-indigo-400' : 'text-slate-500'} />
            Finance & Invoices
          </button>
        </nav>
        
        <div className="p-4 mt-auto">
          <button onClick={() => setShowPingModal(true)} className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]">
            <BellRing size={18} /> Global Ping
          </button>
        </div>

        <div className="p-4 border-t border-[#1e293b] m-2 rounded-xl bg-[#1e293b]/50">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-lg text-indigo-400 shadow-inner">S</div>
            <div>
              <p className="font-semibold text-white">Shan</p>
              <p className="text-indigo-400/80 text-xs font-medium">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative" suppressHydrationWarning>
        <header className="bg-white/70 backdrop-blur-md border-b border-slate-200 px-8 py-5 shrink-0 z-10 sticky top-0 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight font-heading">
              {getPageTitle()}
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-0.5">Manage your agency operations seamlessly.</p>
          </div>
        </header>
        <div className="p-8 flex-1 overflow-y-auto bg-transparent custom-scrollbar">
          {renderContent()}
        </div>
      </main>

      {/* Global Ping Modal */}
      {showPingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-black mb-6 text-center flex items-center justify-center gap-2">
              <BellRing className="text-blue-600" /> Broadcast Global Ping
            </h3>
            <form onSubmit={handleGlobalPing} className="grid gap-4">
              <div>
                <label className="block text-sm font-bold text-black mb-1">Message to Broadcast</label>
                <textarea 
                  required 
                  className="w-full border border-gray-300 rounded-lg p-3 text-black font-medium h-32 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" 
                  value={pingMessage} 
                  onChange={e => setPingMessage(e.target.value)} 
                  placeholder="Type your message here... All employees will receive this on Telegram."
                  autoFocus
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowPingModal(false);
                    setPingMessage('');
                  }} 
                  className="flex-1 border border-gray-300 rounded-lg py-2.5 font-bold text-black hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isPinging || !pingMessage.trim()}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 font-bold hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPinging ? 'Sending...' : <><BellRing size={16} /> Broadcast Now</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
