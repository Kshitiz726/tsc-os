'use client';
import { useState, useEffect } from 'react';
import { Plus, Video, Calendar, MoreVertical, Link as LinkIcon, User, Download, PenTool, Scissors } from 'lucide-react';
import { exportToExcel } from '../utils/excel';

const COLUMNS = [
 { id: 'IDEA', title: 'Idea', color: 'bg-slate-100 text-slate-700 border-slate-200 ' },
 { id: 'SCRIPT', title: 'Script', color: 'bg-yellow-50/80 text-yellow-700 border-yellow-200' },
 { id: 'SHOOT_SCHEDULED', title: 'Shoot Scheduled', color: 'bg-purple-50/80 text-purple-700 border-purple-200' },
 { id: 'FILMED', title: 'Filmed', color: 'bg-blue-50/80 text-blue-700 border-blue-200' },
 { id: 'EDITING', title: 'Editing', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
 { id: 'REVIEW', title: 'Review', color: 'bg-orange-50/80 text-orange-700 border-orange-200' },
 { id: 'CLIENT_APPROVAL', title: 'Client Approval', color: 'bg-rose-50/80 text-rose-700 border-rose-200' },
 { id: 'APPROVED', title: 'Approved', color: 'bg-emerald-50/80 text-emerald-700 border-emerald-200' },
 { id: 'SCHEDULED', title: 'Scheduled', color: 'bg-teal-50/80 text-teal-700 border-teal-200' },
 { id: 'DELAYED', title: 'Delayed', color: 'bg-red-50 text-red-700 border-red-200' },
 { id: 'CANCELLED', title: 'Cancelled', color: 'bg-gray-100 text-gray-700 border-gray-200 ' },
];

export function ContentPipeline() {
 const [tasks, setTasks] = useState<any[]>([]);
 const [users, setUsers] = useState<any[]>([]);
 const [clients, setClients] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 // Modal State
 const [showModal, setShowModal] = useState(false);
 const [title, setTitle] = useState('');
 const [description, setDescription] = useState('');
 const [deadline, setDeadline] = useState('');
 const [platform, setPlatform] = useState('');
 const [driveLink, setDriveLink] = useState('');
 const [scriptWriterIds, setScriptWriterIds] = useState<string[]>([]);
 const [shooterIds, setShooterIds] = useState<string[]>([]);
 const [editorIds, setEditorIds] = useState<string[]>([]);
 const [schedulerIds, setSchedulerIds] = useState<string[]>([]);
 const [clientId, setClientId] = useState('');
 const [idea, setIdea] = useState('');
 const [contentFiles, setContentFiles] = useState<FileList | null>(null);
 
 // Feedback Modal State
 const [feedbackTaskId, setFeedbackTaskId] = useState<number | null>(null);
 const [feedbackMessage, setFeedbackMessage] = useState('');
 const [feedbackFile, setFeedbackFile] = useState<File | null>(null);

 const [filterClient, setFilterClient] = useState('ALL');
 const [showHistory, setShowHistory] = useState(false);
 const [historySort, setHistorySort] = useState<'LATEST' | 'OLDEST'>('LATEST');
 const [historyClientFilter, setHistoryClientFilter] = useState('ALL');
 
 const [rescheduleModal, setRescheduleModal] = useState<{taskId: number, date: string, note: string} | null>(null);

 const fetchData = async () => {
 try {
 const [contentData, usersData, clientsData] = await Promise.all([
 fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/content`).then(res => res.json()),
 fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`).then(res => res.json()),
 fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`).then(res => res.json())
 ]);
 setTasks(contentData);
 setUsers(usersData);
 setClients(clientsData);
 setLoading(false);
 } catch (err) {
 console.error(err);
 setLoading(false);
 }
 };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (window.location.hash === '#new-content') {
      setShowModal(true);
      window.location.hash = '';
    }
  }, []);

 const handleCreate = async (e: React.FormEvent) => {
 e.preventDefault();
 const formData = new FormData();
 formData.append('title', title);
 formData.append('description', description);
 formData.append('idea', idea);
 formData.append('deadline', deadline);
 formData.append('platform', platform);
 if (clientId) formData.append('clientId', clientId);
 
 scriptWriterIds.forEach(id => formData.append('scriptWriterIds', id));
 shooterIds.forEach(id => formData.append('shooterIds', id));
 editorIds.forEach(id => formData.append('editorIds', id));
 schedulerIds.forEach(id => formData.append('schedulerIds', id));

 if (contentFiles) {
 for (let i = 0; i < contentFiles.length; i++) {
 formData.append('files', contentFiles[i]);
 }
 }

 await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/content`, {
 method: 'POST',
 body: formData
 });

 setShowModal(false);
 setTitle(''); setDescription(''); setIdea(''); setDeadline(''); setPlatform('');
 setScriptWriterIds([]); setShooterIds([]); setEditorIds([]); setSchedulerIds([]); 
 setClientId(''); setContentFiles(null);
 fetchData();
 };

 const handlePingApproval = async (taskId: number) => {
 await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/content/${taskId}/ping-shoot-approval`, { method: 'POST' });
 alert('Confirmation ping sent to shooter via Telegram!');
 };

 const handleReschedule = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!rescheduleModal) return;
 await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/content/${rescheduleModal.taskId}/admin-reschedule`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ newDate: rescheduleModal.date, note: rescheduleModal.note })
 });
 setRescheduleModal(null);
 alert('Reschedule request sent to shooter via Telegram!');
 fetchData();
 };

 const handleStatusChange = async (taskId: number, newStatus: string) => {
 // If admin moves to REVIEW, we might want to just move it.
 // If admin moves from REVIEW back to something else, maybe show feedback modal?
 // For now, let's just implement the status change and add a separate feedback button.
 setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
 await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/content/${taskId}/status`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ status: newStatus })
 });
 };

 const handleFeedbackSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!feedbackTaskId) return;

 const formData = new FormData();
 formData.append('message', feedbackMessage);
 if (feedbackFile) formData.append('file', feedbackFile);

 await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/content/${feedbackTaskId}/feedback`, {
 method: 'POST',
 body: formData
 });

 setFeedbackTaskId(null);
 setFeedbackMessage('');
 setFeedbackFile(null);
 fetchData();
 };

 if (loading) return <div>Loading Pipeline...</div>;

  const exportPipelineToExcel = () => {
    const dataToExport = tasks.map(task => ({
      'Content ID': task.contentId,
      'Title': task.title,
      'Platform': task.platform,
      'Status': task.status,
      'Client': task.client?.companyName || 'Internal',
      'Script Writers': task.scriptWriters?.map((u: any) => u.name).join(', ') || 'Unassigned',
      'Shooters': task.shooters?.map((u: any) => u.name).join(', ') || 'Unassigned',
      'Editors': task.editors?.map((u: any) => u.name).join(', ') || 'Unassigned',
      'Schedulers': task.schedulers?.map((u: any) => u.name).join(', ') || 'Unassigned',
      'Shoot Date': task.shootDate ? new Date(task.shootDate).toLocaleDateString() : 'N/A',
      'Post Date': task.postDate ? new Date(task.postDate).toLocaleDateString() : 'N/A',
      'Deadline': new Date(task.deadline).toLocaleDateString()
    }));

    const columns = [
      { header: 'Content ID', key: 'Content ID', width: 20 },
      { header: 'Title', key: 'Title', width: 40 },
      { header: 'Platform', key: 'Platform', width: 15 },
      { header: 'Status', key: 'Status', width: 20 },
      { header: 'Client', key: 'Client', width: 25 },
      { header: 'Script Writers', key: 'Script Writers', width: 25 },
      { header: 'Shooters', key: 'Shooters', width: 25 },
      { header: 'Editors', key: 'Editors', width: 25 },
      { header: 'Schedulers', key: 'Schedulers', width: 25 },
      { header: 'Shoot Date', key: 'Shoot Date', width: 15 },
      { header: 'Post Date', key: 'Post Date', width: 15 },
      { header: 'Deadline', key: 'Deadline', width: 15 }
    ];

    exportToExcel(dataToExport, columns, 'Content Pipeline', 'content_pipeline_export');
  };

 return (
 <div className="flex flex-col h-[calc(100vh-8rem)]">
 <div className="flex justify-between items-center mb-6 shrink-0">
 <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-heading">
 <Video className="text-indigo-600"size={28} /> Content Pipeline
 </h3>
 <div className="flex gap-4 items-center">
 <button onClick={exportPipelineToExcel} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-200">
 <Download size={18} /> Export Excel
 </button>
 <button onClick={() => setShowHistory(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-200">
 Content History
 </button>
 <select className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 font-semibold shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"value={filterClient} onChange={e => setFilterClient(e.target.value)}>
 <option value="ALL">All Clients</option>
 {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
 </select>
 <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-200 shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5">
 <Plus size={18} /> New Content
 </button>
 </div>
 </div>

 <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
 <div className="flex gap-4 h-full min-w-max">
 {COLUMNS.map(column => {
 const columnTasks = tasks.filter(t => t.status === column.id && (filterClient === 'ALL' || t.clientId === Number(filterClient)));
 return (
 <div key={column.id} className="w-80 flex flex-col h-full bg-slate-100 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
 <div className={`p-4 font-bold rounded-t-2xl border-b flex justify-between items-center ${column.color}`}>
 <span>{column.title}</span>
 <span className="bg-white text-slate-800 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm">{columnTasks.length}</span>
 </div>
 
 <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
 {columnTasks.map(task => {
 let borderCol = 'border-l-indigo-400';
 if (task.status === 'POSTED') borderCol = 'border-l-emerald-500';
 if (task.status === 'CLIENT_APPROVAL') borderCol = 'border-l-rose-400';
 
 return (
 <div key={task.id} className={`bg-white p-4 rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-200 group border-l-4 ${borderCol}`}>
 <div className="flex justify-between items-start mb-3">
 <div>
 <h4 className="font-bold text-slate-800 text-sm leading-tight">{task.title}</h4>
 {task.contentId && <div className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-50 px-1 py-0.5 rounded mt-1 inline-block border border-slate-200">{task.contentId}</div>}
 </div>
 <div className="relative">
 <select 
 className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
 value={task.status}
 onChange={(e) => handleStatusChange(task.id, e.target.value)}
 >
 {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
 </select>
 <MoreVertical size={16} className="text-gray-400 group-hover:text-gray-600"/>
 </div>
 </div>
 
 {task.client && (
 <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded mb-2 font-medium">
 {task.client.companyName}
 </span>
 )}
 
 {task.platform && (
 <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded mb-2 ml-1 font-medium">
 {task.platform}
 </span>
 )}

 <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
 <Calendar size={12} /> Deadline: {new Date(task.deadline).toLocaleDateString()}
 </div>

 {task.scriptDeadline && (
 <div className="bg-blue-50 border border-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded mb-1 font-medium shadow-sm flex items-center gap-1">
 📝 Script Due: {new Date(task.scriptDeadline).toLocaleDateString()}
 </div>
 )}

 {task.shootDate && (
 <div className="bg-purple-50 border border-purple-100 text-purple-700 text-[10px] px-2 py-1 rounded mb-1 font-medium shadow-sm flex items-center gap-1">
 🎥 Shoot: {new Date(task.shootDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
 </div>
 )}

 {task.editDeadline && (
 <div className="bg-pink-50 border border-pink-100 text-pink-700 text-[10px] px-2 py-1 rounded mb-1 font-medium shadow-sm flex items-center gap-1">
 ✂️ Edit Due: {new Date(task.editDeadline).toLocaleDateString()}
 </div>
 )}

 {task.postDate && (
 <div className="bg-teal-50 border border-teal-100 text-teal-700 text-[10px] px-2 py-1 rounded mb-2 font-medium shadow-sm flex items-center gap-1">
 📅 Post: {new Date(task.postDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
 </div>
 )}

 {task.status === 'SHOOT_SCHEDULED' && (
 <div className="mb-3 flex gap-2">
 <button onClick={() => handlePingApproval(task.id)} className="flex-1 bg-purple-100 text-purple-700 hover:bg-purple-200 text-[10px] font-bold py-1.5 rounded transition-colors">
 Approve Date
 </button>
 {!task.shootDateConfirmed && (
 <button onClick={() => setRescheduleModal({taskId: task.id, date: '', note: ''})} className="flex-1 bg-rose-100 text-rose-700 hover:bg-rose-200 text-[10px] font-bold py-1.5 rounded transition-colors">
 Change Date
 </button>
 )}
 {task.shootDateConfirmed && (
 <span className="flex-1 text-center text-[10px] font-bold py-1.5 rounded bg-green-100 text-green-700">🔒 Date Locked</span>
 )}
 </div>
 )}

 {task.status === 'REVIEW' && (
 <div className="mb-3 flex gap-2">
 <button onClick={() => setFeedbackTaskId(task.id)} className="flex-1 bg-rose-50 text-rose-700 hover:bg-rose-100 text-[10px] font-bold py-1.5 rounded transition-colors border border-rose-100">
 Revision Required
 </button>
 <button onClick={() => handleStatusChange(task.id, 'APPROVED')} className="flex-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold py-1.5 rounded transition-colors border border-emerald-100">
 Approve
 </button>
 </div>
 )}

 <div className="flex justify-between items-start pt-3 border-t border-gray-50">
 <div className="grid grid-cols-2 gap-y-2 gap-x-4">
 <div>
 <span className="text-[9px] uppercase tracking-wider text-gray-400 mb-1 block">Writers</span>
 <div className="flex -space-x-1.5">
 {task.scriptWriters && task.scriptWriters.length > 0 ? task.scriptWriters.map((u: any) => (
 <div key={u.id} className="w-5 h-5 rounded-full bg-yellow-100 border border-white flex items-center justify-center text-[9px] font-bold text-yellow-800"title={u.name}>{u.name ? u.name.charAt(0) : '?'}</div>
 )) : <span className="text-[10px] text-gray-400">None</span>}
 </div>
 </div>
 <div>
 <span className="text-[9px] uppercase tracking-wider text-gray-400 mb-1 block">Shooters</span>
 <div className="flex -space-x-1.5">
 {task.shooters && task.shooters.length > 0 ? task.shooters.map((u: any) => (
 <div key={u.id} className="w-5 h-5 rounded-full bg-indigo-100 border border-white flex items-center justify-center text-[9px] font-bold text-indigo-800"title={u.name}>{u.name ? u.name.charAt(0) : '?'}</div>
 )) : <span className="text-[10px] text-gray-400">None</span>}
 </div>
 </div>
 <div>
 <span className="text-[9px] uppercase tracking-wider text-gray-400 mb-1 block">Editors</span>
 <div className="flex -space-x-1.5">
 {task.editors && task.editors.length > 0 ? task.editors.map((u: any) => (
 <div key={u.id} className="w-5 h-5 rounded-full bg-blue-100 border border-white flex items-center justify-center text-[9px] font-bold text-blue-800"title={u.name}>{u.name ? u.name.charAt(0) : '?'}</div>
 )) : <span className="text-[10px] text-gray-400">None</span>}
 </div>
 </div>
 <div>
 <span className="text-[9px] uppercase tracking-wider text-gray-400 mb-1 block">Schedulers</span>
 <div className="flex -space-x-1.5">
 {task.schedulers && task.schedulers.length > 0 ? task.schedulers.map((u: any) => (
 <div key={u.id} className="w-5 h-5 rounded-full bg-teal-100 border border-white flex items-center justify-center text-[9px] font-bold text-teal-800"title={u.name}>{u.name ? u.name.charAt(0) : '?'}</div>
 )) : <span className="text-[10px] text-gray-400">None</span>}
 </div>
 </div>
 </div>
 
 {task.driveLink && (
 <a href={task.driveLink} target="_blank"rel="noreferrer"className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded-full mt-1"title="Drive Link">
 <LinkIcon size={14} />
 </a>
 )}
 </div>
 </div>
 )})}
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {showModal && (
 <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
 <div className="bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-6 shrink-0">
 <div className="flex justify-between items-start">
 <div>
 <h3 className="text-xl font-bold text-white font-heading">New Content Task</h3>
 <p className="text-indigo-200 text-sm mt-1">Set up the full production team</p>
 </div>
 <button onClick={() => setShowModal(false)} className="text-indigo-200 hover:text-white hover:bg-white p-1.5 rounded-lg transition-colors">
 <svg width="18"height="18"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
 </button>
 </div>
 </div>
 <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
 <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 custom-scrollbar">
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Title <span className="text-rose-400">*</span></label>
 <input required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-slate-50 transition-all placeholder:text-slate-400"value={title} onChange={e=>setTitle(e.target.value)} placeholder="Brand Video June Campaign"/>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Client</label>
 <select className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"value={clientId} onChange={e=>setClientId(e.target.value)}>
 <option value="">None</option>
 {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Platform</label>
 <input className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder:text-slate-400"placeholder="Instagram Reels"value={platform} onChange={e=>setPlatform(e.target.value)} />
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Deadline <span className="text-rose-400">*</span></label>
 <input required type="date"className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"value={deadline} onChange={e=>setDeadline(e.target.value)} />
 </div>

 <div className="border-t border-slate-100 pt-4">
 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Production Team</p>
 <div className="grid grid-cols-2 gap-3">
 {[
 { icon: <PenTool size={14} className="text-yellow-500"/>, label: 'Script Writers', ids: scriptWriterIds, setter: setScriptWriterIds, color: 'accent-yellow-500' },
 { icon: <Video size={14} className="text-indigo-500"/>, label: 'Shooters', ids: shooterIds, setter: setShooterIds, color: 'accent-indigo-600' },
 { icon: <Scissors size={14} className="text-blue-500"/>, label: 'Editors', ids: editorIds, setter: setEditorIds, color: 'accent-blue-600' },
 { icon: <Calendar size={14} className="text-teal-500"/>, label: 'Schedulers', ids: schedulerIds, setter: setSchedulerIds, color: 'accent-teal-600' },
 ].map(({ icon, label, ids, setter, color }) => (
 <div key={label}>
 <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{icon} {label}</label>
 <div className="border border-slate-200 rounded-xl max-h-24 overflow-y-auto bg-slate-50">
 {users.map(u => (
 <label key={u.id} className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-700 cursor-pointer hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-0">
 <input type="checkbox"className={`w-3.5 h-3.5 ${color}`} checked={ids.includes(u.id.toString())} onChange={(e) => {
 if (e.target.checked) setter(prev => [...prev, u.id.toString()]);
 else setter(prev => prev.filter(id => id !== u.id.toString()));
 }} />
 <span className="font-medium">{u.name || u.telegramId}</span>
 </label>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Content Idea / Brief <span className="text-rose-400">*</span></label>
 <textarea required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none h-24 placeholder:text-slate-400"placeholder="Describe the concept, tone, what to shoot..."value={idea} onChange={e=>setIdea(e.target.value)} />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Extra Notes</label>
 <textarea className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none h-16 placeholder:text-slate-400"value={description} onChange={e=>setDescription(e.target.value)} placeholder="Additional context..."/>
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Attachments</label>
 <label className="flex items-center gap-2 w-full border border-dashed border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-500 bg-slate-50 cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all">
 <svg width="15"height="15"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.47"/></svg>
 <span>{contentFiles ? `${contentFiles.length} file(s) selected` : 'Choose files'}</span>
 <input type="file"multiple className="hidden"onChange={e => setContentFiles(e.target.files)} />
 </label>
 </div>
 </div>
 <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
 <button type="button"onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-sm font-semibold transition-all">Cancel</button>
 <button type="submit"className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/25">Create Task</button>
 </div>
 </form>
 </div>
 </div>
 )}


 {rescheduleModal && (
 <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
 <div className="bg-gradient-to-br from-purple-600 to-purple-700 px-8 py-6">
 <div className="flex justify-between items-start">
 <div>
 <h3 className="text-xl font-bold text-white font-heading">Reschedule Shoot</h3>
 <p className="text-purple-200 text-sm mt-1">Propose a new date to the shooter</p>
 </div>
 <button type="button"onClick={() => setRescheduleModal(null)} className="text-purple-200 hover:text-white hover:bg-white p-1.5 rounded-lg transition-colors">
 <svg width="18"height="18"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
 </button>
 </div>
 </div>
 <form onSubmit={handleReschedule} className="px-8 py-6 space-y-5">
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">New Date & Time <span className="text-rose-400">*</span></label>
 <input required type="datetime-local"className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"value={rescheduleModal.date} onChange={e=>setRescheduleModal({...rescheduleModal, date: e.target.value})} />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Admin Note</label>
 <textarea className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all resize-none h-24 placeholder:text-slate-400"placeholder="Reason for the change..."value={rescheduleModal.note} onChange={e=>setRescheduleModal({...rescheduleModal, note: e.target.value})} />
 </div>
 <div className="flex gap-3">
 <button type="button"onClick={() => setRescheduleModal(null)} className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-sm font-semibold transition-all">Cancel</button>
 <button type="submit"className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/25">Send Request</button>
 </div>
 </form>
 </div>
 </div>
 )}

 {showHistory && (
 <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
 <div className="bg-gradient-to-br from-slate-700 to-slate-800 px-8 py-6 shrink-0">
 <div className="flex justify-between items-center">
 <div>
 <h3 className="text-xl font-bold text-white font-heading">Content History</h3>
 <p className="text-slate-300 text-sm mt-1">All posted content pieces</p>
 </div>
 <div className="flex items-center gap-3">
 <select className="border-0 bg-white text-slate-800 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none shadow-sm" value={historySort} onChange={e => setHistorySort(e.target.value as 'LATEST' | 'OLDEST')}>
 <option value="LATEST">Latest First</option>
 <option value="OLDEST">Oldest First</option>
 </select>
 <select className="border-0 bg-white text-slate-800 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none shadow-sm" value={historyClientFilter} onChange={e => setHistoryClientFilter(e.target.value)}>
 <option value="ALL">All Clients</option>
 {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
 </select>
 <button onClick={() => setShowHistory(false)} className="text-slate-300 hover:text-white hover:bg-white p-1.5 rounded-lg transition-colors ml-1">
 <svg width="18"height="18"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
 </button>
 </div>
 </div>
 </div>
 <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-4 bg-slate-50">
 {tasks
 .filter(t => t.status === 'POSTED')
 .filter(t => historyClientFilter === 'ALL' || t.clientId?.toString() === historyClientFilter)
 .sort((a,b) => historySort === 'LATEST'
 ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
 : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
 .map(task => (
 <div key={task.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
 <div className="px-5 py-4 flex justify-between items-start">
 <div>
 <h4 className="font-bold text-slate-800">{task.title}</h4>
 {task.contentId && <div className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded mt-1 inline-block border border-slate-200">{task.contentId}</div>}
 {task.description && <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{task.description}</p>}
 {task.driveLink && (
 <a href={task.driveLink} target="_blank"rel="noopener noreferrer"className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mt-2 font-medium">
 <svg width="14"height="14"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
 Open Folder
 </a>
 )}
 </div>
 <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shrink-0 ml-4">Posted</span>
 </div>
 <div className="border-t border-slate-100 px-5 py-3 bg-slate-50">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Production Team</p>
 <div className="grid grid-cols-4 gap-3">
 {[{label:'Writers', data: task.scriptWriters, color:'bg-yellow-50 text-yellow-700'},{label:'Shooters', data: task.shooters, color:'bg-indigo-50 text-indigo-700'},{label:'Editors', data: task.editors, color:'bg-blue-50 text-blue-700'},{label:'Schedulers', data: task.schedulers, color:'bg-teal-50 text-teal-700'}].map(({label, data, color}) => (
 <div key={label}>
 <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{label}</span>
 <div className="flex flex-col gap-1 mt-1">
 {data?.map((u:any) => <span key={u.id} className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${color}`}>{u.name}</span>) || <span className="text-xs text-slate-400">—</span>}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 ))}
 {tasks.filter(t => t.status === 'POSTED').length === 0 && (
 <div className="text-center py-16">
 <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
 <svg width="28"height="28"viewBox="0 0 24 24"fill="none"stroke="#94a3b8"strokeWidth="1.5"><rect x="2"y="3"width="20"height="14"rx="2"/><path d="m8 21 4-4 4 4M12 17v4"/></svg>
 </div>
 <p className="text-slate-500 font-medium">No posted content yet</p>
 <p className="text-slate-400 text-sm mt-1">Content marked as Posted will appear here</p>
 </div>
 )}
 </div>
 </div>
 </div>
 )}

 {/* Feedback Modal */}
 {feedbackTaskId && (
 <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
 <div className="bg-gradient-to-br from-rose-500 to-rose-600 px-8 py-6">
 <div className="flex justify-between items-start">
 <div>
 <h3 className="text-xl font-bold text-white font-heading">Request Revisions</h3>
 <p className="text-rose-200 text-sm mt-1">Send feedback to the production team</p>
 </div>
 <button onClick={() => setFeedbackTaskId(null)} className="text-rose-200 hover:text-white hover:bg-white p-1.5 rounded-lg transition-colors">
 <svg width="18"height="18"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
 </button>
 </div>
 </div>
 <form onSubmit={handleFeedbackSubmit} className="px-8 py-6 space-y-5">
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Feedback Message <span className="text-rose-400">*</span></label>
 <textarea required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition-all resize-none h-28 placeholder:text-slate-400"value={feedbackMessage} onChange={e => setFeedbackMessage(e.target.value)} placeholder="What needs to be changed? Be specific."/>
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Attach Reference (Optional)</label>
 <label className="flex items-center gap-2 w-full border border-dashed border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-500 bg-slate-50 cursor-pointer hover:bg-rose-50 hover:border-rose-300 transition-all">
 <svg width="15"height="15"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.47"/></svg>
 <span>{feedbackFile ? feedbackFile.name : 'Choose file'}</span>
 <input type="file"className="hidden"onChange={e => e.target.files && setFeedbackFile(e.target.files[0])} />
 </label>
 </div>
 <div className="flex gap-3">
 <button type="button"onClick={() => setFeedbackTaskId(null)} className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-sm font-semibold transition-all">Cancel</button>
 <button type="submit"className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-500/25">Send Feedback</button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
