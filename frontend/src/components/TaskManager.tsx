'use client';
import { useEffect, useState } from 'react';
import { Clock, Plus, AlertTriangle, Paperclip, CheckCircle2, MoreVertical, Download, ChevronDown, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { exportToExcel } from '../utils/excel';

const COLUMNS = [
 { id: 'TO_DO', title: 'To Do', color: 'bg-slate-100 text-slate-700 border-slate-200 ' },
 { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
 { id: 'WAITING_APPROVAL', title: 'Review', color: 'bg-amber-50/80 text-amber-700 border-amber-200' },
 { id: 'DELAYED', title: 'Delayed', color: 'bg-rose-50/80 text-rose-700 border-rose-200' },
 { id: 'CANCELLED', title: 'Cancelled', color: 'bg-gray-100 text-gray-700 border-gray-200 ' },
];

export function TaskManager() {
 const [tasks, setTasks] = useState<any[]>([]);
 const [users, setUsers] = useState<any[]>([]);
 const [clients, setClients] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 
 // Modal State
 const [showModal, setShowModal] = useState(false);
 const [title, setTitle] = useState('');
 const [description, setDescription] = useState('');
 const [deadline, setDeadline] = useState('');
 const [priority, setPriority] = useState('MEDIUM');
 const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
 const [recurring, setRecurring] = useState('');
 const [taskFiles, setTaskFiles] = useState<FileList | null>(null);
 const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
 const [clientId, setClientId] = useState('');

 // Feedback Modal State
 const [feedbackTaskId, setFeedbackTaskId] = useState<number | null>(null);
 const [feedbackMessage, setFeedbackMessage] = useState('');
 const [feedbackFile, setFeedbackFile] = useState<File | null>(null);

 // Filter & Sort State
 const [sortOrder, setSortOrder] = useState<'newest' | 'deadline'>('newest');
 const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
 const [filterPriority, setFilterPriority] = useState<string>('ALL');
 const [filterClient, setFilterClient] = useState<string>('ALL');

 // History State
 const [showHistory, setShowHistory] = useState(false);
 const [historySort, setHistorySort] = useState<'LATEST' | 'OLDEST'>('LATEST');
 const [historyClientFilter, setHistoryClientFilter] = useState('ALL');

 const fetchData = async () => {
 try {
 const [tasksData, usersData, clientsData] = await Promise.all([
 fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`).then(res => res.json()),
 fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`).then(res => res.json()),
 fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`).then(res => res.json())
 ]);
 setTasks(tasksData);
 setUsers(usersData);
 setClients(clientsData);
 setLoading(false);
 } catch (e) {
 console.error(e);
 setLoading(false);
 }
 };

 useEffect(() => { 
 fetchData(); 
 const intervalId = setInterval(fetchData, 5000);
 return () => clearInterval(intervalId);
 }, []);

 const handleCreateTask = async (e: React.FormEvent) => {
 e.preventDefault();
 const formData = new FormData();
 formData.append('title', title);
 formData.append('description', description);
 formData.append('deadline', deadline);
 formData.append('priority', priority);
 if (recurring) formData.append('recurring', recurring);
 if (clientId) formData.append('clientId', clientId);
 assignedUserIds.forEach(id => formData.append('assignedUserIds', id));
 
 if (taskFiles) {
 for (let i = 0; i < taskFiles.length; i++) {
 formData.append('files', taskFiles[i]);
 }
 }

 await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`, {
 method: 'POST',
 body: formData
 });

 setShowModal(false);
 setTitle(''); setDescription(''); setDeadline(''); setPriority('MEDIUM'); 
 setRecurring(''); setTaskFiles(null); setAssignedUserIds([]); setClientId('');
 fetchData();
 };

 const handleStatusChange = async (taskId: number, newStatus: string) => {
 setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
 await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}/status`, {
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
 if (feedbackFile) formData.append('attachment', feedbackFile);

 await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${feedbackTaskId}/feedback`, {
 method: 'POST',
 body: formData
 });

 setFeedbackTaskId(null);
 setFeedbackMessage('');
 setFeedbackFile(null);
 fetchData();
 };

 if (loading) return <div>Loading tasks...</div>;

 // Apply Filtering and Sorting
 let filteredTasks = [...tasks];
 
 if (filterAssignee !== 'ALL') {
 filteredTasks = filteredTasks.filter(t => t.assignedUsers?.some((u: any) => u.id.toString() === filterAssignee));
 }
 if (filterPriority !== 'ALL') {
 filteredTasks = filteredTasks.filter(t => t.priority === filterPriority);
 }
 if (filterClient !== 'ALL') {
 filteredTasks = filteredTasks.filter(t => t.clientId?.toString() === filterClient);
 }

 filteredTasks.sort((a, b) => {
 if (sortOrder === 'newest') {
 return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
 } else {
 return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
 }
 });

 const exportTasksToExcel = () => {
    const dataToExport = filteredTasks.map(task => ({
      'Task ID': task.taskId,
      'Title': task.title,
      'Description': task.description,
      'Status': task.status,
      'Priority': task.priority,
      'Client': task.client?.companyName || 'Internal',
      'Assigned To': task.assignedUsers?.map((u: any) => u.name).join(', ') || 'Unassigned',
      'Deadline': new Date(task.deadline).toLocaleDateString(),
      'Created At': new Date(task.createdAt).toLocaleDateString()
    }));

    const columns = [
      { header: 'Task ID', key: 'Task ID', width: 20 },
      { header: 'Title', key: 'Title', width: 40 },
      { header: 'Description', key: 'Description', width: 50 },
      { header: 'Status', key: 'Status', width: 15 },
      { header: 'Priority', key: 'Priority', width: 15 },
      { header: 'Client', key: 'Client', width: 25 },
      { header: 'Assigned To', key: 'Assigned To', width: 25 },
      { header: 'Deadline', key: 'Deadline', width: 15 },
      { header: 'Created At', key: 'Created At', width: 15 }
    ];

    exportToExcel(dataToExport, columns, 'Tasks', 'task_manager_export');
  };

 return (
 <div className="flex flex-col h-[calc(100vh-8rem)]">
 <div className="flex justify-between items-center mb-6 shrink-0">
 <h3 className="text-2xl font-bold text-slate-800 font-heading">Task Management</h3>
 <div className="flex items-center gap-4">
 <button onClick={exportTasksToExcel} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200">
 <Download size={20} /> Export Excel
 </button>
 <button onClick={() => setShowHistory(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200">
 Task History
 </button>
 <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5">
 <Plus size={20} /> Assign New Task
 </button>
 
 <div className="flex items-center gap-3 ml-2 border-l border-slate-200 pl-4">
 <select className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 max-w-[150px] truncate shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"value={filterClient} onChange={e => setFilterClient(e.target.value)}>
 <option value="ALL">All Clients</option>
 {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
 </select>
 <select className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 max-w-[150px] truncate shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
 <option value="ALL">All Employees</option>
 {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
 </select>
 <select className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
 <option value="ALL">All Priorities</option>
 <option value="HIGH">High Priority</option>
 <option value="MEDIUM">Medium Priority</option>
 <option value="LOW">Low Priority</option>
 </select>
 <select className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 font-semibold shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"value={sortOrder} onChange={e => setSortOrder(e.target.value as any)}>
 <option value="newest">Sort: Newest First</option>
 <option value="deadline">Sort: Deadline</option>
 </select>
 </div>
 </div>
 </div>

 <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
 <div className="flex gap-4 h-full min-w-max">
 {COLUMNS.map(column => {
 const columnTasks = filteredTasks.filter(t => t.status === column.id);
 return (
 <div key={column.id} className="w-80 flex flex-col h-full bg-slate-100 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
 <div className={`p-4 font-bold rounded-t-2xl border-b flex justify-between items-center ${column.color}`}>
 <span>{column.title}</span>
 <span className="bg-white text-slate-800 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm">{columnTasks.length}</span>
 </div>
 
 <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
 {columnTasks.map(task => {
 let priorityColor = 'border-l-slate-300';
 if (task.priority === 'HIGH') priorityColor = 'border-l-rose-500';
 else if (task.priority === 'MEDIUM') priorityColor = 'border-l-amber-500';
 else if (task.priority === 'LOW') priorityColor = 'border-l-emerald-500';
 
 return (
 <div key={task.id} className={`bg-white p-4 rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-200 group border-l-4 ${priorityColor}`}>
 <div className="flex justify-between items-start mb-3">
 <div>
 {task.taskId && <div className="text-[10px] text-slate-400 font-mono mb-1 bg-slate-50 inline-block px-1 rounded">{task.taskId}</div>}
 <h4 className="font-bold text-slate-800 text-sm leading-tight">{task.title}</h4>
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

 <div className="flex flex-wrap gap-1.5 mb-3">
 {task.priority === 'HIGH' && <span className="bg-rose-50 text-rose-700 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">High</span>}
 {task.recurring && <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">{task.recurring}</span>}
 {task.client && <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">{task.client.companyName}</span>}
 </div>

 <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{task.description}</p>
 
 {task.delayReason && (
 <div className="bg-rose-50/80 border border-rose-100 text-rose-700 p-2.5 rounded-lg text-xs mb-4 shadow-sm font-medium">
 <strong className="block mb-0.5 text-rose-800">Delay Reason:</strong> {task.delayReason}
 </div>
 )}

 <div className="flex justify-between items-center pt-3 border-t border-slate-100">
 <div className="flex flex-col">
 <span className="text-[10px] text-slate-400 mb-1 font-semibold">Assigned</span>
 <div className="flex -space-x-2">
 {task.assignedUsers && task.assignedUsers.length > 0 ? task.assignedUsers.map((u: any) => (
 <div key={u.id} className="w-7 h-7 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-800 shadow-sm z-10 hover:z-20 transition-transform hover:scale-110 cursor-help"title={u.name}>
 {u.name ? u.name.charAt(0) : '?'}
 </div>
 )) : <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Unassigned</span>}
 </div>
 </div>
 <div className="flex flex-col items-end gap-1">
 {task.driveFolderLink || task.attachments ? (
 <a href={task.driveFolderLink || task.attachments} target="_blank"rel="noreferrer"className="text-slate-400 hover:text-indigo-500 transition-colors bg-slate-50 p-1 rounded-md"title="Attachments">
 <Paperclip size={14} />
 </a>
 ) : null}
 <span className={`text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-md ${new Date(task.deadline) < new Date() && task.status !== 'COMPLETED' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600 '}`}>
 <Clock size={12} /> {new Date(task.deadline).toLocaleDateString()}
 </span>
 </div>
 </div>
 
 {task.status === 'WAITING_APPROVAL' && (
 <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
 <button onClick={() => setFeedbackTaskId(task.id)} className="flex-1 px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">Send Feedback</button>
 <button onClick={() => handleStatusChange(task.id, 'COMPLETED')} className="flex-1 px-2 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg">Approve</button>
 </div>
 )}
 
 {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
 <div className="mt-2 pt-2 flex justify-end">
 <button onClick={() => handleStatusChange(task.id, 'CANCELLED')} className="text-[10px] font-semibold text-slate-400 hover:text-red-600 transition-colors">
 🚫 Cancel Task
 </button>
 </div>
 )}
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
 <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 px-8 py-6 shrink-0">
 <div className="flex justify-between items-start">
 <div>
 <h3 className="text-xl font-bold text-white font-heading">Assign New Task</h3>
 <p className="text-indigo-200 text-sm mt-1">Fill in the details below to assign work</p>
 </div>
 <button onClick={() => setShowModal(false)} className="text-indigo-200 hover:text-white hover:bg-white p-1.5 rounded-lg transition-colors">
 <svg width="18"height="18"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
 </button>
 </div>
 </div>
 <form onSubmit={handleCreateTask} className="flex flex-col flex-1 overflow-hidden">
 <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 custom-scrollbar">
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Task Title <span className="text-rose-400">*</span></label>
 <input required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-slate-50 transition-all placeholder:text-slate-400"value={title} onChange={e=>setTitle(e.target.value)} placeholder="Daily Comment Replies"/>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Assign To</label>
 <div className="border border-slate-200 rounded-xl max-h-32 overflow-y-auto bg-slate-50">
 {users.map(u => (
 <label key={u.id} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 cursor-pointer hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-0">
 <input type="checkbox"className="w-4 h-4 accent-indigo-600"
 checked={assignedUserIds.includes(u.id.toString())}
 onChange={(e) => {
 if (e.target.checked) setAssignedUserIds(prev => [...prev, u.id.toString()]);
 else setAssignedUserIds(prev => prev.filter(id => id !== u.id.toString()));
 }}
 />
 <span className="font-medium">{u.name || u.telegramId}</span>
 </label>
 ))}
 </div>
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Client</label>
 <select className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"value={clientId} onChange={e=>setClientId(e.target.value)}>
 <option value="">None</option>
 {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
 </select>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Deadline <span className="text-rose-400">*</span></label>
 <input required type="datetime-local"className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"value={deadline} onChange={e=>setDeadline(e.target.value)} />
 </div>
 <div className="relative">
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Priority</label>
 <div 
 onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
 className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50 cursor-pointer flex justify-between items-center transition-all hover:border-indigo-300"
 >
 <div className="flex items-center gap-2 font-medium">
 {priority === 'HIGH' ? <ArrowUp className="text-rose-500"size={16}/> : priority === 'MEDIUM' ? <Minus className="text-amber-500"size={16}/> : <ArrowDown className="text-emerald-500"size={16}/>}
 {priority === 'HIGH' ? 'High' : priority === 'MEDIUM' ? 'Medium' : 'Low'}
 </div>
 <ChevronDown size={16} className={`text-slate-400 transition-transform ${priorityDropdownOpen ? 'rotate-180' : ''}`} />
 </div>
 
 {priorityDropdownOpen && (
 <>
 <div className="fixed inset-0 z-40"onClick={() => setPriorityDropdownOpen(false)}></div>
 <div className="absolute top-[72px] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
 {['LOW', 'MEDIUM', 'HIGH'].map(p => (
 <div 
 key={p}
 onClick={() => { setPriority(p); setPriorityDropdownOpen(false); }} 
 className={`px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center gap-2.5 text-sm transition-colors ${priority === p ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 font-medium'}`}
 >
 {p === 'HIGH' ? <ArrowUp className={`${priority === p ? 'text-indigo-600' : 'text-rose-500'}`} size={16}/> : p === 'MEDIUM' ? <Minus className={`${priority === p ? 'text-indigo-600' : 'text-amber-500'}`} size={16}/> : <ArrowDown className={`${priority === p ? 'text-indigo-600' : 'text-emerald-500'}`} size={16}/>}
 {p === 'HIGH' ? 'High' : p === 'MEDIUM' ? 'Medium' : 'Low'}
 </div>
 ))}
 </div>
 </>
 )}
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Recurring</label>
 <select className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"value={recurring} onChange={e=>setRecurring(e.target.value)}>
 <option value="">No</option>
 <option value="DAILY">Daily</option>
 <option value="WEEKLY">Weekly</option>
 <option value="MONTHLY">Monthly</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Attachments</label>
 <label className="flex items-center gap-2 w-full border border-dashed border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-500 bg-slate-50 cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all">
 <svg width="15"height="15"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.47"/></svg>
 <span>{taskFiles ? `${taskFiles.length} file(s)` : 'Choose files'}</span>
 <input type="file"multiple className="hidden"onChange={e => setTaskFiles(e.target.files)} />
 </label>
 </div>
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Notes / Description</label>
 <textarea className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none h-24 placeholder:text-slate-400"value={description} onChange={e=>setDescription(e.target.value)} placeholder="Add any relevant context or instructions..."/>
 </div>
 </div>
 <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
 <button type="button"onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-sm font-semibold transition-all">Cancel</button>
 <button type="submit"className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/25">Assign Task</button>
 </div>
 </form>
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
 <h3 className="text-xl font-bold text-white font-heading">Send Feedback</h3>
 <p className="text-rose-200 text-sm mt-1">Request revisions from the employee</p>
 </div>
 <button onClick={() => setFeedbackTaskId(null)} className="text-rose-200 hover:text-white hover:bg-white p-1.5 rounded-lg transition-colors">
 <svg width="18"height="18"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
 </button>
 </div>
 </div>
 <form onSubmit={handleFeedbackSubmit} className="px-8 py-6 space-y-5">
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Message for Employee <span className="text-rose-400">*</span></label>
 <textarea required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition-all resize-none h-28 placeholder:text-slate-400"value={feedbackMessage} onChange={e => setFeedbackMessage(e.target.value)} placeholder="Explain what needs to be fixed..."/>
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Attach File (Optional)</label>
 <label className="flex items-center gap-2 w-full border border-dashed border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-500 bg-slate-50 cursor-pointer hover:bg-rose-50 hover:border-rose-300 transition-all">
 <svg width="15"height="15"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.47"/></svg>
 <span>{feedbackFile ? feedbackFile.name : 'Choose file'}</span>
 <input type="file"className="hidden"onChange={e => e.target.files && setFeedbackFile(e.target.files[0])} />
 </label>
 </div>
 <div className="flex gap-3 pt-1">
 <button type="button"onClick={() => setFeedbackTaskId(null)} className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-sm font-semibold transition-all">Cancel</button>
 <button type="submit"className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-500/25">Send Feedback</button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* History Modal */}
 {showHistory && (
 <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
 <div className="bg-gradient-to-br from-slate-700 to-slate-800 px-8 py-6 shrink-0">
 <div className="flex justify-between items-center">
 <div>
 <h3 className="text-xl font-bold text-white font-heading">Task History</h3>
 <p className="text-slate-300 text-sm mt-1">All completed tasks</p>
 </div>
 <div className="flex items-center gap-3">
 <select className="border-0 bg-white text-slate-800 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-white/30 shadow-sm" value={historySort} onChange={e => setHistorySort(e.target.value as 'LATEST' | 'OLDEST')}>
 <option value="LATEST">Latest First</option>
 <option value="OLDEST">Oldest First</option>
 </select>
 <select className="border-0 bg-white text-slate-800 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-white/30 shadow-sm" value={historyClientFilter} onChange={e => setHistoryClientFilter(e.target.value)}>
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
 .filter(t => t.status === 'COMPLETED')
 .filter(t => historyClientFilter === 'ALL' || t.clientId?.toString() === historyClientFilter)
 .sort((a,b) => historySort === 'LATEST'
 ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
 : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
 .map(task => (
 <div key={task.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
 <div className="px-5 py-4 flex justify-between items-start">
 <div>
 {task.taskId && <div className="text-[10px] text-slate-400 font-mono mb-1 bg-slate-50 inline-block px-2 py-0.5 rounded border border-slate-200">{task.taskId}</div>}
 <h4 className="font-bold text-slate-800 mt-1">{task.title}</h4>
 {task.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>}
 {task.driveFolderLink && (
 <a href={task.driveFolderLink} target="_blank"rel="noopener noreferrer"className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mt-2 font-medium">
 <svg width="14"height="14"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
 Open Folder
 </a>
 )}
 </div>
 <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shrink-0 ml-4">Completed</span>
 </div>
 <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 grid grid-cols-2 gap-4">
 <div>
 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Performed By</span>
 <div className="flex flex-wrap gap-1.5 mt-1.5">
 {task.assignedUsers && task.assignedUsers.length > 0 ? task.assignedUsers.map((u: any) => (
 <span key={u.id} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">{u.name}</span>
 )) : <span className="text-xs text-slate-400">—</span>}
 </div>
 </div>
 <div>
 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client</span>
 <div className="mt-1.5 text-sm font-semibold text-slate-700">{task.client ? task.client.companyName : 'Internal'}</div>
 </div>
 </div>
 </div>
 ))}
 {tasks.filter(t => t.status === 'COMPLETED').length === 0 && (
 <div className="text-center py-16">
 <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
 <svg width="28"height="28"viewBox="0 0 24 24"fill="none"stroke="#94a3b8"strokeWidth="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
 </div>
 <p className="text-slate-500 font-medium">No completed tasks yet</p>
 <p className="text-slate-400 text-sm mt-1">Completed tasks will appear here</p>
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
