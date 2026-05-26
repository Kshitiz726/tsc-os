'use client';
import { useEffect, useState } from 'react';
import { Trophy, TrendingUp, AlertCircle, Clock, CheckCircle2, ChevronRight, Download } from 'lucide-react';
import { exportToExcel } from '../utils/excel';

interface User {
 id: number;
 name: string;
 points: number;
 tasks: any[];
 payments?: any[];
 privateJobs?: any[];
 photoUrl?: string;
 baseSalary?: number;
}

export function TeamDashboard() {
 const [users, setUsers] = useState<User[]>([]);
 const [selectedUser, setSelectedUser] = useState<User | null>(null);
 const [loading, setLoading] = useState(true);
 const [editingMonth, setEditingMonth] = useState<string | null>(null);
 const [tempAmount, setTempAmount] = useState<string>('');

 const [deleteWarningEmployee, setDeleteWarningEmployee] = useState<User | null>(null);
 
 const [clients, setClients] = useState<any[]>([]);
 const [taskSort, setTaskSort] = useState<'LATEST' | 'OLDEST'>('LATEST');
 const [taskClientFilter, setTaskClientFilter] = useState<string>('ALL');

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPaymentMonth, setNewPaymentMonth] = useState('January');
  const [newPaymentYear, setNewPaymentYear] = useState(new Date().getFullYear().toString());
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('PAID');

 // Private Jobs State
 const [showPrivateJobModal, setShowPrivateJobModal] = useState(false);
 const [newJobClient, setNewJobClient] = useState('');
 const [newJobDesc, setNewJobDesc] = useState('');
 const [newJobAmount, setNewJobAmount] = useState('');
 const [newJobDate, setNewJobDate] = useState(new Date().toISOString().split('T')[0]);

 const fetchData = () => {
 fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`)
 .then(res => res.json())
 .then(data => {
 const sortedData = data.sort((a: User, b: User) => b.points - a.points);
 setUsers(sortedData);
 if (sortedData.length > 0 && !selectedUser) {
 setSelectedUser(sortedData[0]);
 }
 setLoading(false);
 });
 
 fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`)
 .then(res => res.json())
 .then(data => setClients(data));
 };

 useEffect(() => {
 fetchData();
 const intervalId = setInterval(fetchData, 5000);
 return () => clearInterval(intervalId);
 }, []);

 const getRatingTier = (points: number) => {
 if (points >= 50) return { label: 'Elite', color: 'text-emerald-500 bg-emerald-50 border-emerald-200', icon: <Trophy size={16} /> };
 if (points >= 0) return { label: 'Good', color: 'text-blue-500 bg-blue-50 border-blue-200', icon: <TrendingUp size={16} /> };
 return { label: 'Warning', color: 'text-red-500 bg-red-50 border-red-200', icon: <AlertCircle size={16} /> };
 };

 if (loading) return <div className="text-gray-500 p-8">Loading team data...</div>;

 const exportLeaderboardToExcel = () => {
  const dataToExport = users.map((u, index) => ({
    'Rank': index + 1,
    'Name': u.name,
    'Points': u.points,
    'Tier': getRatingTier(u.points).label,
    'Completed Tasks': u.tasks.filter(t => t.status === 'COMPLETED').length,
    'Active Tasks': u.tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length
  }));
  
  const columns = [
    { header: 'Rank', key: 'Rank', width: 10 },
    { header: 'Name', key: 'Name', width: 25 },
    { header: 'Points', key: 'Points', width: 15 },
    { header: 'Tier', key: 'Tier', width: 15 },
    { header: 'Completed Tasks', key: 'Completed Tasks', width: 20 },
    { header: 'Active Tasks', key: 'Active Tasks', width: 20 }
  ];

  exportToExcel(dataToExport, columns, 'Leaderboard', 'team_leaderboard');
};

const exportPaymentsToExcel = () => {
  if (!selectedUser) return;
  
  const dataToExport = (selectedUser.payments || []).map((p: any) => ({
      'Employee': selectedUser.name,
      'Month': p.month,
      'Amount (£)': p.amount,
      'Status': p.status
  }));

  const columns = [
    { header: 'Employee', key: 'Employee', width: 25 },
    { header: 'Month', key: 'Month', width: 20 },
    { header: 'Amount (£)', key: 'Amount (£)', width: 15 },
    { header: 'Status', key: 'Status', width: 15 }
  ];

  exportToExcel(dataToExport, columns, 'Payments', `payments_${selectedUser.name.replace(/\s+/g, '_')}`);
};

 return (
 <>
 <div className="flex gap-6 h-[calc(100vh-8rem)]">
 {/* Left Panel: Employee Leaderboard */}
 <div className="w-1/3 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden shrink-0">
 <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
 <div>
 <h3 className="text-xl font-bold text-slate-800 font-heading">Team Leaderboard</h3>
 <p className="text-sm text-slate-500 mt-1 font-medium">Best Employee of the Month</p>
 </div>
 <button onClick={exportLeaderboardToExcel} className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all duration-200 shadow-sm active:scale-95">
 <Download size={16} /> Export
 </button>
 </div>
 <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
 {users.map((user, index) => {
 const tier = getRatingTier(user.points);
 const isSelected = selectedUser?.id === user.id;
 return (
 <div 
 key={user.id} 
 onClick={() => setSelectedUser(user)}
 className={`p-5 flex items-center justify-between cursor-pointer transition-all duration-200 ${isSelected ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
 >
 <div className="flex items-center gap-4">
 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm 
 ${index === 0 ? 'bg-yellow-400 text-yellow-900' : index === 1 ? 'bg-slate-300 text-slate-800 ' : index === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 '}`}>
 {index + 1}
 </div>
 {user.photoUrl ? (
 <img src={`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user.id}/photo`} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"/>
 ) : (
 <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-sm">
 {user.name.charAt(0)}
 </div>
 )}
 <div>
 <h4 className={`font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-800 '}`}>{user.name}</h4>
 <p className="text-xs font-semibold text-slate-500 mt-0.5">{user.points} pts</p>
 </div>
 </div>
 <ChevronRight size={18} className={isSelected ? 'text-indigo-500' : 'text-slate-300'} />
 </div>
 );
 })}
 {users.length === 0 && (
 <div className="p-8 text-center text-slate-500">No employees found.</div>
 )}
 </div>
 </div>

 {/* Right Panel: Selected Employee Tasks Overview */}
 {selectedUser && (
 <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden">
 <div className="p-8 border-b border-slate-100 flex items-start justify-between bg-gradient-to-br from-slate-50 to-white">
 <div className="flex items-center gap-6">
 {selectedUser.photoUrl ? (
 <img src={`${process.env.NEXT_PUBLIC_API_URL}/api/users/${selectedUser.id}/photo`} alt={selectedUser.name} className="w-24 h-24 rounded-2xl object-cover shadow-sm border border-slate-200"/>
 ) : (
 <div className="w-24 h-24 rounded-2xl bg-indigo-100/50 text-indigo-600 flex items-center justify-center font-bold text-4xl shadow-sm border border-indigo-100">
 {selectedUser.name.charAt(0)}
 </div>
 )}
 <div>
 <h2 className="text-3xl font-bold text-slate-800 font-heading tracking-tight">{selectedUser.name}</h2>
 <div className="flex items-center gap-3 mt-3">
 <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-semibold border border-slate-200">
 {selectedUser.points} Total Points
 </span>
 <span className={`px-3 py-1 rounded-full text-sm font-semibold border flex items-center gap-1.5 ${getRatingTier(selectedUser.points).color}`}>
 {getRatingTier(selectedUser.points).icon}
 {getRatingTier(selectedUser.points).label} Tier
 </span>
 </div>
 </div>
 </div>
 
 <div className="text-right flex flex-col items-end gap-3">
 <div className="flex gap-8">
 <div>
 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Completed</p>
 <p className="text-3xl font-black text-emerald-600 font-heading">{selectedUser.tasks.filter(t => t.status === 'COMPLETED').length}</p>
 </div>
 <div>
 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Tasks</p>
 <p className="text-3xl font-black text-indigo-600 font-heading">{selectedUser.tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length}</p>
 </div>
 </div>
 <button 
 onClick={() => setDeleteWarningEmployee(selectedUser)}
 className="mt-3 bg-white border border-rose-200 hover:border-rose-300 hover:bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 shadow-sm active:scale-95"
 >
 Remove Employee
 </button>
 </div>
 </div>

 <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-slate-50 space-y-10">
  {/* Payments Section */}
  <div>
  <div className="flex justify-between items-center mb-5">
  <h3 className="text-xl font-bold text-slate-800 font-heading">Salary & Payments</h3>
  <div className="flex gap-2">
  <button onClick={() => {
    setNewPaymentAmount(selectedUser.baseSalary ? selectedUser.baseSalary.toString() : '0');
    setShowPaymentModal(true);
  }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all duration-200 shadow-sm active:scale-95">
  <CheckCircle2 size={16} /> Record Payment
  </button>
  <button onClick={exportPaymentsToExcel} className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all duration-200 shadow-sm active:scale-95">
  <Download size={16} /> Export
  </button>
  </div>
  </div>
  <div className="grid gap-4">
  {selectedUser.payments && selectedUser.payments.length > 0 ? (
  selectedUser.payments.map((payment: any) => (
  <div key={payment.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors">
  <div>
  <h4 className="font-bold text-slate-800 capitalize">{payment.month}</h4>
  <p className="text-sm text-slate-500">£{payment.amount.toLocaleString()}</p>
  </div>
  <div className="flex items-center gap-3">
  <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-medium tracking-wide border ${payment.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-red-50 text-red-700 border-red-200/60'}`}>
  {payment.status}
  </span>
  <button 
  onClick={() => {
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employee-payments/${payment.id}/status`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: payment.status === 'PAID' ? 'UNPAID' : 'PAID' })
  }).then(() => fetchData());
  }}
  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 shadow-sm active:scale-95 border ${payment.status === 'PAID' ? 'bg-white border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50' : 'bg-slate-800 hover:bg-slate-900 text-white border-slate-900'}`}
  >
  Mark {payment.status === 'PAID' ? 'Unpaid' : 'Paid'}
  </button>
  </div>
  </div>
  ))
  ) : (
  <div className="text-center py-6 bg-white border border-dashed border-slate-200 rounded-xl">
  <p className="text-slate-500 font-medium text-sm">No payment records found.</p>
  <p className="text-slate-400 text-xs mt-1">Click "Record Payment" to add one.</p>
  </div>
  )}
  </div>
  </div>

 {/* Private Jobs Section */}
 <div>
 <div className="flex justify-between items-center mb-5">
 <h3 className="text-xl font-bold text-slate-800 font-heading">Private Jobs</h3>
 <button onClick={() => setShowPrivateJobModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all duration-200 shadow-sm active:scale-95">
 <CheckCircle2 size={16} /> Log Private Job
 </button>
 </div>
 <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
 <table className="w-full text-left text-sm">
 <thead className="bg-slate-50 border-b border-slate-200">
 <tr>
 <th className="px-4 py-3 font-bold text-slate-600">Date</th>
 <th className="px-4 py-3 font-bold text-slate-600">Client</th>
 <th className="px-4 py-3 font-bold text-slate-600">Description</th>
 <th className="px-4 py-3 font-bold text-slate-600">Amount</th>
 <th className="px-4 py-3 font-bold text-slate-600">Status</th>
 <th className="px-4 py-3 font-bold text-slate-600 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {selectedUser.privateJobs && selectedUser.privateJobs.length > 0 ? (
 selectedUser.privateJobs.map((job: any) => (
 <tr key={job.id} className="hover:bg-slate-50 transition-colors">
 <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{new Date(job.date).toLocaleDateString()}</td>
 <td className="px-4 py-3 font-bold text-slate-800">{job.clientName}</td>
 <td className="px-4 py-3 text-slate-600">{job.description}</td>
 <td className="px-4 py-3 font-bold text-emerald-600">£{job.amount}</td>
 <td className="px-4 py-3">
 <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider border ${job.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
 {job.status}
 </span>
 </td>
 <td className="px-4 py-3 text-right">
 {job.status === 'UNPAID' && (
 <button 
 onClick={async () => {
 await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/private-jobs/${job.id}/paid`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method: 'CASH' }) });
 fetchData();
 }}
 className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-2 py-1 rounded font-bold transition-colors"
 >
 Mark Paid
 </button>
 )}
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-medium">No private jobs logged yet.</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 <div>
 <div className="flex justify-between items-center mb-5">
 <h3 className="text-xl font-bold text-slate-800 font-heading">Task History</h3>
 <div className="flex gap-3">
 <select 
 className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-bold"
 value={taskSort}
 onChange={(e) => setTaskSort(e.target.value as any)}
 >
 <option value="LATEST">Latest First</option>
 <option value="OLDEST">Oldest First</option>
 </select>
 <select 
 className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-bold"
 value={taskClientFilter}
 onChange={(e) => setTaskClientFilter(e.target.value)}
 >
 <option value="ALL">All Clients</option>
 {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
 </select>
 </div>
 </div>
 <div className="grid gap-4">
 {selectedUser.tasks.length > 0 ? (
 selectedUser.tasks
 .filter(t => taskClientFilter === 'ALL' || t.clientId?.toString() === taskClientFilter)
 .sort((a,b) => taskSort === 'LATEST' 
 ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() 
 : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
 .map(task => (
 <div key={task.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
 <div>
 <div className="flex items-center gap-3 mb-1">
 <h4 className="font-bold text-slate-800">{task.title}</h4>
 <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-medium tracking-wide border ${task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : (task.status === 'DELAYED' || task.status === 'CANCELLED') ? 'bg-red-50 text-red-700 border-red-200/60' : 'bg-blue-50 text-blue-700 border-blue-200/60'}`}>
 {task.status.replace('_', ' ')}
 </span>
 </div>
 <p className="text-sm text-slate-500 line-clamp-2">{task.description}</p>
 </div>
 <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
 <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
 <Clock size={14} /> Deadline: {new Date(task.deadline).toLocaleDateString()}
 </span>
 {task.status === 'COMPLETED' && (
 <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
 <CheckCircle2 size={14} /> +10 Points
 </span>
 )}
 </div>
 </div>
 ))
 ) : (
 <div className="text-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
 <p className="text-slate-500 font-medium">No tasks assigned to {selectedUser.name} yet.</p>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Private Job Modal */}
 {showPrivateJobModal && selectedUser && (
 <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
 <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 px-6 py-5 shrink-0 flex justify-between items-center">
 <h3 className="text-lg font-bold text-white font-heading">Log Private Job</h3>
 <button onClick={() => setShowPrivateJobModal(false)} className="text-indigo-200 hover:text-white transition-colors">
 <svg width="20"height="20"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
 </button>
 </div>
 <div className="p-6 space-y-4">
 <div>
 <label className="block text-xs font-bold text-gray-500 mb-1">STAFF MEMBER</label>
 <input className="w-full text-sm border border-gray-300 bg-gray-100 rounded-lg p-2.5 font-bold"value={selectedUser.name} readOnly />
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-500 mb-1">CLIENT NAME</label>
 <input className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 font-medium"placeholder="e.g. Acme Corp"value={newJobClient} onChange={e=>setNewJobClient(e.target.value)} />
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-500 mb-1">DESCRIPTION</label>
 <input className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 font-medium"placeholder="e.g. Logo Design"value={newJobDesc} onChange={e=>setNewJobDesc(e.target.value)} />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-gray-500 mb-1">AMOUNT (£)</label>
 <input type="number"className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 font-bold text-indigo-700"value={newJobAmount} onChange={e=>setNewJobAmount(e.target.value)} />
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-500 mb-1">DATE</label>
 <input type="date"className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 font-medium"value={newJobDate} onChange={e=>setNewJobDate(e.target.value)} />
 </div>
 </div>
 </div>
 <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
 <button onClick={() => setShowPrivateJobModal(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
 <button 
 onClick={async () => {
 if (!newJobClient || !newJobAmount) return alert("Client name and amount are required.");
 await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/private-jobs`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ userId: selectedUser.id, clientName: newJobClient, description: newJobDesc, amount: newJobAmount, date: newJobDate })
 });
 setShowPrivateJobModal(false);
 setNewJobClient(''); setNewJobDesc(''); setNewJobAmount('');
 fetchData();
 }}
 className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-all duration-200 active:scale-95"
 >
 Save Job
 </button>
 </div>
 </div>
 </div>
 )}

  {/* Delete Employee Warning Modal */}
  {deleteWarningEmployee && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
  <div className="bg-rose-600 p-6 flex flex-col items-center justify-center text-white text-center">
  <div className="bg-white/20 p-4 rounded-full mb-4">
  <AlertCircle size={48} className="text-white" />
  </div>
  <h3 className="text-2xl font-black font-heading mb-1">Remove Employee?</h3>
  <p className="text-rose-100 font-medium">This action cannot be undone.</p>
  </div>
  <div className="p-8 text-center space-y-4 bg-slate-50">
  <p className="text-slate-700 text-base font-medium leading-relaxed">
  This will <span className="font-bold text-rose-600">permanently delete</span> all information for <span className="font-bold">{deleteWarningEmployee.name}</span>, including their tasks and statement records.
  </p>
  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl my-4 text-left">
  <p className="text-amber-800 text-sm font-bold flex items-center gap-2 mb-1"><AlertCircle size={16} /> Recommendation</p>
  <p className="text-amber-700 text-sm font-medium">Please export the previous statement and financial history in an Excel sheet before proceeding.</p>
  </div>
  <p className="text-slate-900 font-black pt-2">Do you want to continue?</p>
  </div>
  <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
  <button onClick={() => setDeleteWarningEmployee(null)} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
  Cancel
  </button>
  <button onClick={() => {
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${deleteWarningEmployee.id}`, { method: 'DELETE' })
  .then(() => {
  setSelectedUser(null);
  setDeleteWarningEmployee(null);
  fetchData();
  });
  }} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/25 transition-all active:scale-95 flex items-center justify-center gap-2">
  <AlertCircle size={18} /> Yes, Remove Employee
  </button>
  </div>
  </div>
  </div>
  )}

  {/* Add Payment Modal */}
  {showPaymentModal && selectedUser && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
  <h3 className="text-lg font-bold text-slate-800 font-heading">Record Payment</h3>
  <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
  </button>
  </div>
  <div className="p-6 space-y-4">
  <div className="grid grid-cols-2 gap-4">
  <div>
  <label className="block text-xs font-bold text-slate-500 mb-1">MONTH</label>
  <select className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 font-medium bg-white" value={newPaymentMonth} onChange={e=>setNewPaymentMonth(e.target.value)}>
  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
  <option key={m} value={m}>{m}</option>
  ))}
  </select>
  </div>
  <div>
  <label className="block text-xs font-bold text-slate-500 mb-1">YEAR</label>
  <input type="number" className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 font-medium bg-white" value={newPaymentYear} onChange={e=>setNewPaymentYear(e.target.value)} />
  </div>
  </div>
  <div>
  <label className="block text-xs font-bold text-slate-500 mb-1">AMOUNT (£)</label>
  <input type="number" className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 font-bold text-indigo-700 bg-white" value={newPaymentAmount} onChange={e=>setNewPaymentAmount(e.target.value)} />
  </div>
  <div>
  <label className="block text-xs font-bold text-slate-500 mb-1">STATUS</label>
  <select className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 font-medium bg-white" value={newPaymentStatus} onChange={e=>setNewPaymentStatus(e.target.value)}>
  <option value="PAID">Paid</option>
  <option value="UNPAID">Unpaid</option>
  </select>
  </div>
  </div>
  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
  <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
  <button 
  onClick={async () => {
  if (!newPaymentMonth || !newPaymentYear || !newPaymentAmount) return alert("All fields are required.");
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employee-payments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
  userId: selectedUser.id, 
  month: `${newPaymentMonth} ${newPaymentYear}`, 
  amount: parseFloat(newPaymentAmount), 
  status: newPaymentStatus 
  })
  });
  setShowPaymentModal(false);
  fetchData();
  }}
  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-all duration-200 active:scale-95"
  >
  Save Payment
  </button>
  </div>
  </div>
  </div>
  )}
 </>
 );
}
