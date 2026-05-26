'use client';
import { useState, useEffect, useMemo } from 'react';
import {
 BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
 PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Line
} from 'recharts';
import {
 Wallet, TrendingDown, PoundSterling, Download, Plus, X, TrendingUp,
 Target, Users, AlertCircle, Calendar, ArrowUpRight, ArrowDownRight,
 Receipt, Banknote, BarChart2, Clock, Trash2
} from 'lucide-react';
import { exportToExcel as professionalExport } from '../utils/excel';

const EXPENSE_CATEGORIES = ['SALARY', 'AD_COST', 'SOFTWARE', 'EQUIPMENT', 'OFFICE', 'MARKETING', 'TRAVEL', 'GENERAL'];
const INCOME_SOURCES = ['CLIENT_PAYMENT', 'RETAINER', 'PROJECT', 'CONSULTING', 'BONUS', 'OTHER'];

const CATEGORY_COLORS: Record<string, string> = {
 SALARY: '#6366F1', AD_COST: '#EF4444', SOFTWARE: '#3B82F6', EQUIPMENT: '#F59E0B',
 OFFICE: '#10B981', MARKETING: '#EC4899', TRAVEL: '#8B5CF6', GENERAL: '#9CA3AF'
};

export function AnalyticsDashboard() {
 const [stats, setStats] = useState<any>(null);
 const [expenses, setExpenses] = useState<any[]>([]);
 const [incomes, setIncomes] = useState<any[]>([]);
 const [invoices, setInvoices] = useState<any[]>([]);
 const [users, setUsers] = useState<any[]>([]);
 const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
 const [selectedClient, setSelectedClient] = useState<string>('ALL');
 const [selectedUserId, setSelectedUserId] = useState<string>('ALL');
 const [activeTable, setActiveTable] = useState<'expenses' | 'incomes'>('expenses');

 // Add Expense Modal
 const [showExpenseModal, setShowExpenseModal] = useState(false);
 const [expAmount, setExpAmount] = useState('');
 const [expCategory, setExpCategory] = useState('GENERAL');
 const [expDescription, setExpDescription] = useState('');
 const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
 const [expSaving, setExpSaving] = useState(false);

 // Add Income Modal
 const [showIncomeModal, setShowIncomeModal] = useState(false);
 const [incAmount, setIncAmount] = useState('');
 const [incSource, setIncSource] = useState('OTHER');
 const [incDescription, setIncDescription] = useState('');
 const [incDate, setIncDate] = useState(new Date().toISOString().split('T')[0]);
 const [incSaving, setIncSaving] = useState(false);

 const fetchData = () => {
 fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics`).then(r => r.json()).then(d => setStats(d));
 fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/expenses`).then(r => r.json()).then(d => setExpenses(d));
 fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/incomes`).then(r => r.json()).then(d => setIncomes(d));
 fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices`).then(r => r.json()).then(d => setInvoices(d));
 fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`).then(r => r.json()).then(d => setUsers(d));
 };

 useEffect(() => { fetchData(); }, []);

 const handleAddExpense = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!expAmount || !expDescription) return;
 setExpSaving(true);
 try {
 await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/expenses`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ amount: Number(expAmount), category: expCategory, description: expDescription, date: expDate })
 });
 setShowExpenseModal(false);
 setExpAmount(''); setExpCategory('GENERAL'); setExpDescription(''); setExpDate(new Date().toISOString().split('T')[0]);
 fetchData();
 } finally { setExpSaving(false); }
 };

 const handleAddIncome = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!incAmount || !incDescription) return;
 setIncSaving(true);
 try {
 await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/incomes`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ amount: Number(incAmount), source: incSource, description: incDescription, date: incDate })
 });
 setShowIncomeModal(false);
 setIncAmount(''); setIncSource('OTHER'); setIncDescription(''); setIncDate(new Date().toISOString().split('T')[0]);
 fetchData();
 } finally { setIncSaving(false); }
 };

 const handleDeleteExpense = async (id: number) => {
 await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/expenses/${id}`, { method: 'DELETE' });
 fetchData();
 };

 const handleDeleteIncome = async (id: number) => {
 await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/incomes/${id}`, { method: 'DELETE' });
 fetchData();
 };

 const employeePerformanceData = useMemo(() => {
 if (selectedUserId === 'ALL') return stats?.completionStats || [];
 const user = users.find(u => u.id.toString() === selectedUserId);
 if (!user) return [];
 const contentCount = (user.contentWrites?.length || 0) + (user.contentShoots?.length || 0) + (user.contentEdits?.length || 0) + (user.contentSchedules?.length || 0);
 const completedTasks = user.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
 const delayedTasks = user.tasks?.filter((t: any) => t.status === 'DELAYED').length || 0;
 return [
 { name: 'Standard Tasks', completed: completedTasks, delayed: delayedTasks },
 { name: 'Content Tasks', completed: contentCount, delayed: 0 },
 ];
 }, [selectedUserId, stats, users]);

 const availableMonths = useMemo(() => {
 const months = new Set<string>();
 invoices.forEach(i => months.add(`${new Date(i.createdAt).getFullYear()}-${String(new Date(i.createdAt).getMonth() + 1).padStart(2, '0')}`));
 expenses.forEach(e => months.add(`${new Date(e.date).getFullYear()}-${String(new Date(e.date).getMonth() + 1).padStart(2, '0')}`));
 incomes.forEach(i => months.add(`${new Date(i.date).getFullYear()}-${String(new Date(i.date).getMonth() + 1).padStart(2, '0')}`));
 
 // Add current month as default fallback
 const now = new Date();
 months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
 
 return Array.from(months).sort().reverse().map(m => {
 const [year, month] = m.split('-');
 const d = new Date(Number(year), Number(month) - 1, 1);
 return { value: m, label: d.toLocaleString('default', { month: 'long', year: 'numeric' }) };
 });
 }, [invoices, expenses, incomes]);

 const dashboardData = useMemo(() => {
 const cInvoices = selectedClient === 'ALL' ? invoices : invoices.filter(i => i.clientId.toString() === selectedClient);
 const cExpenses = selectedClient === 'ALL' ? expenses : [];
 const cIncomes = selectedClient === 'ALL' ? incomes : [];

 const filteredInvoices = selectedMonth === 'ALL' ? cInvoices : cInvoices.filter(i => {
 const d = new Date(i.issueDate || i.createdAt);
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
 });
 const filteredExpenses = selectedMonth === 'ALL' ? cExpenses : cExpenses.filter(e => {
 const d = new Date(e.date);
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
 });
 const filteredIncomes = selectedMonth === 'ALL' ? cIncomes : cIncomes.filter(inc => {
 const d = new Date(inc.date);
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
 });
 
 const paidInvoices = filteredInvoices.filter(i => i.status === 'PAID');
 const unpaidInvoices = filteredInvoices.filter(i => i.status === 'UNPAID');
 
 const totalInvoiceRev = paidInvoices.reduce((sum, i) => sum + i.amount, 0);
 const totalGenericInc = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
 const totalRev = totalInvoiceRev + totalGenericInc;
 
 const totalExp = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
 const netRetained = totalRev - totalExp;
 const margin = totalRev > 0 ? ((netRetained / totalRev) * 100).toFixed(1) : '0.0';
 const pendingRev = unpaidInvoices.reduce((sum, i) => sum + i.amount, 0);

 const activeClientIds = new Set(paidInvoices.map(i => i.clientId));
 const arpc = activeClientIds.size > 0 ? totalRev / activeClientIds.size : 0;

 const clientTotals: Record<number, number> = {};
 paidInvoices.forEach(i => {
 clientTotals[i.clientId] = (clientTotals[i.clientId] || 0) + i.amount;
 });
 let topClientName = 'N/A';
 let topClientRev = 0;
 Object.entries(clientTotals).forEach(([clientId, rev]) => {
 if (rev > topClientRev) {
 topClientRev = rev;
 const client = stats?.clientRevenue?.find((c: any) => c.id.toString() === clientId);
 if (client) topClientName = client.name;
 }
 });

 let revenueRunRate = 0;
 if (selectedMonth !== 'ALL') {
 revenueRunRate = totalRev * 12;
 } else {
 const now = new Date();
 const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
 const currentMonthInvoices = cInvoices.filter(i => {
 const d = new Date(i.issueDate || i.createdAt);
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === currentMonthStr && i.status === 'PAID';
 });
 const currentMonthIncomes = cIncomes.filter(inc => {
 const d = new Date(inc.date);
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === currentMonthStr;
 });
 const currentMonthRev = currentMonthInvoices.reduce((sum, i) => sum + i.amount, 0) + currentMonthIncomes.reduce((sum, i) => sum + i.amount, 0);
 revenueRunRate = currentMonthRev * 12;
 }

 return {
 totalRev, totalGenericInc, totalExp, netRetained, margin, pendingRev, unpaidInvoices,
 arpc, topClientName, topClientRev, revenueRunRate,
 filteredInvoices, filteredExpenses, filteredIncomes
 };
 }, [invoices, expenses, incomes, selectedMonth, selectedClient, stats]);

 const financialChartData = useMemo(() => {
 if (!dashboardData.filteredInvoices.length && !dashboardData.filteredExpenses.length && !dashboardData.filteredIncomes.length) return [];
 const buckets: Record<string, { income: number, expense: number, dateObj: Date }> = {};
 const isDaily = selectedMonth !== 'ALL';

 const getBucketKey = (dateStr: string) => {
 const d = new Date(dateStr);
 if (isDaily) return d.toISOString().split('T')[0];
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
 };

 dashboardData.filteredInvoices.filter(i => i.status === 'PAID').forEach(inv => {
 const dateVal = inv.issueDate || inv.createdAt;
 const key = getBucketKey(dateVal);
 if (!buckets[key]) buckets[key] = { income: 0, expense: 0, dateObj: new Date(dateVal) };
 buckets[key].income += inv.amount;
 });
 dashboardData.filteredIncomes.forEach(inc => {
 const key = getBucketKey(inc.date);
 if (!buckets[key]) buckets[key] = { income: 0, expense: 0, dateObj: new Date(inc.date) };
 buckets[key].income += inc.amount;
 });
 dashboardData.filteredExpenses.forEach(exp => {
 const key = getBucketKey(exp.date);
 if (!buckets[key]) buckets[key] = { income: 0, expense: 0, dateObj: new Date(exp.date) };
 buckets[key].expense += exp.amount;
 });

 let sortedKeys = Object.keys(buckets).sort((a, b) => buckets[a].dateObj.getTime() - buckets[b].dateObj.getTime());
 
 let cumulativeCash = 0;
 return sortedKeys.map(k => {
 const b = buckets[k];
 cumulativeCash += (b.income - b.expense);
 const profitMargin = b.income > 0 ? ((b.income - b.expense) / b.income) * 100 : 0;
 let displayLabel = isDaily 
 ? b.dateObj.toLocaleString('default', { month: 'short', day: 'numeric' })
 : b.dateObj.toLocaleString('default', { month: 'short', year: '2-digit' });
 return { name: displayLabel, income: b.income, expense: b.expense, profit: b.income - b.expense, cumulativeCash, profitMargin: parseFloat(profitMargin.toFixed(2)) };
 });
 }, [dashboardData, selectedMonth]);

  const exportToExcel = (data: any[], filename: string) => {
    if (data.length === 0) return alert("No data to export");
    const columns = Object.keys(data[0]).map(key => ({
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      key: key,
      width: 20
    }));
    professionalExport(data, columns, 'Analytics', filename);
  };

 if (!stats) return (
 <div className="flex items-center justify-center h-64">
 <div className="flex items-center gap-3 text-slate-500">
 <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
 Loading Analytics...
 </div>
 </div>
 );

 const f = stats.finance;

 return (
 <div className="space-y-8 pb-10">

 {/* Global Filter Bar */}
 <div className="flex flex-col sm:flex-row justify-end mb-2 gap-3">
 <select
 className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
 value={selectedClient}
 onChange={(e) => setSelectedClient(e.target.value)}
 >
 <option value="ALL">Entire Agency</option>
 {stats?.clientRevenue?.map((c: any) => (
 <option key={c.id} value={c.id.toString()}>{c.name}</option>
 ))}
 </select>

 <div className="flex items-center gap-2">
 {selectedMonth !== 'ALL' && (
 <button 
 onClick={() => setSelectedMonth('ALL')} 
 className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm h-full"
 title="Clear Filter"
 >
 Clear
 </button>
 )}
 <input
 type="month"
 className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
 value={selectedMonth === 'ALL' ? '' : selectedMonth}
 onChange={(e) => setSelectedMonth(e.target.value || 'ALL')}
 />
 </div>
 </div>

 {/* === TOP KPI CARDS === */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {/* Total Revenue */}
 <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
 <div className="flex justify-between items-start mb-4">
 <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
 <PoundSterling size={22} />
 </div>
 <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1"><ArrowUpRight size={12} /> Revenue</span>
 </div>
 <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
 <h3 className="text-2xl font-black text-slate-800 font-heading">£{dashboardData.totalRev?.toLocaleString()}</h3>
 <p className="text-xs text-slate-400 mt-1">{dashboardData.totalGenericInc > 0 ? `Incl. £${dashboardData.totalGenericInc.toLocaleString()} extra income` : 'From paid invoices'}</p>
 </div>

 {/* Total Expenses */}
 <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
 <div className="flex justify-between items-start mb-4">
 <div className="w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
 <TrendingDown size={22} />
 </div>
 <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg flex items-center gap-1"><ArrowDownRight size={12} /> Expenses</span>
 </div>
 <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Total Expenses</p>
 <h3 className="text-2xl font-black text-slate-800 font-heading">£{dashboardData.totalExp?.toLocaleString()}</h3>
 <p className="text-xs text-slate-400 mt-1">Across all categories</p>
 </div>

 {/* Net Retained */}
 <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
 <div className="flex justify-between items-start mb-4">
 <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
 <Wallet size={22} />
 </div>
 <span className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${dashboardData.netRetained >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
 {dashboardData.netRetained >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} Net
 </span>
 </div>
 <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Net Retained</p>
 <h3 className={`text-2xl font-black font-heading ${dashboardData.netRetained >= 0 ? 'text-slate-800 ' : 'text-rose-600'}`}>£{dashboardData.netRetained?.toLocaleString()}</h3>
 <p className="text-xs text-slate-400 mt-1">Profit margin: <span className="font-bold text-slate-600">{dashboardData.margin}%</span></p>
 </div>

 {/* Pending Revenue */}
 <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
 <div className="flex justify-between items-start mb-4">
 <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
 <Clock size={22} />
 </div>
 <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg flex items-center gap-1"><AlertCircle size={12} /> Unpaid</span>
 </div>
 <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Pending Revenue</p>
 <h3 className="text-2xl font-black text-slate-800 font-heading">£{dashboardData.pendingRev?.toLocaleString()}</h3>
 <p className="text-xs text-slate-400 mt-1">{dashboardData.unpaidInvoices?.length || 0} unpaid invoices</p>
 </div>
 </div>

 {/* === SECONDARY KPI ROW === */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600"><TrendingUp size={20} /></div>
 <p className="text-sm font-semibold text-indigo-200 uppercase tracking-widest">Revenue Run Rate</p>
 </div>
 <h3 className="text-3xl font-black font-heading">£{dashboardData.revenueRunRate?.toLocaleString()}</h3>
 <p className="text-indigo-300 text-xs mt-1">Projected annualized from this period</p>
 </div>

 <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600"><Users size={20} /></div>
 <p className="text-sm font-semibold text-emerald-200 uppercase tracking-widest">Avg Revenue / Client</p>
 </div>
 <h3 className="text-3xl font-black font-heading">£{dashboardData.arpc?.toFixed(0).toLocaleString()}</h3>
 <p className="text-emerald-300 text-xs mt-1">ARPC across active clients in period</p>
 </div>

 <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg shadow-violet-500/20">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-violet-600"><Target size={20} /></div>
 <p className="text-sm font-semibold text-violet-200 uppercase tracking-widest">Top Client</p>
 </div>
 <h3 className="text-2xl font-black font-heading truncate">{dashboardData.topClientName}</h3>
 <p className="text-violet-300 text-xs mt-1">£{dashboardData.topClientRev?.toLocaleString()} revenue in period</p>
 </div>
 </div>

 {/* === MAIN FINANCIAL CHARTS === */}
 <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
 <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
 <div>
 <h3 className="text-xl font-bold text-slate-800 font-heading">Economic Analysis</h3>
 <p className="text-sm text-slate-500 mt-0.5">Income vs Expenses over time</p>
 </div>
 <div className="flex items-center gap-3 flex-wrap">
 <button onClick={() => exportToExcel(financialChartData, 'financial_data')} className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
 <Download size={15} /> Export
 </button>
 </div>
 </div>

 <div className="grid lg:grid-cols-2 gap-10">
 <div>
 <h4 className="text-xs font-bold text-slate-400 mb-5 text-center tracking-widest uppercase">Income vs Expenses</h4>
 <div className="h-[280px]">
 <ResponsiveContainer width="100%"height="100%">
 <AreaChart data={financialChartData} margin={{ top: 5, right: 10, left: 30, bottom: 0 }}>
 <defs>
 <linearGradient id="gIncome"x1="0"y1="0"x2="0"y2="1">
 <stop offset="5%"stopColor="#10B981"stopOpacity={0.25} />
 <stop offset="95%"stopColor="#10B981"stopOpacity={0} />
 </linearGradient>
 <linearGradient id="gExpense"x1="0"y1="0"x2="0"y2="1">
 <stop offset="5%"stopColor="#EF4444"stopOpacity={0.25} />
 <stop offset="95%"stopColor="#EF4444"stopOpacity={0} />
 </linearGradient>
 </defs>
 <XAxis dataKey="name"axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={v => `£${v}`} />
 <CartesianGrid strokeDasharray="3 3"vertical={false} stroke="#F1F5F9"/>
 <Tooltip formatter={(v: any) => `£${Number(v).toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '13px' }} />
 <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
 <Area type="monotone"dataKey="income"stroke="#10B981"strokeWidth={2.5} fillOpacity={1} fill="url(#gIncome)"name="Income"/>
 <Area type="monotone"dataKey="expense"stroke="#EF4444"strokeWidth={2.5} fillOpacity={1} fill="url(#gExpense)"name="Expense"/>
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div>
 <h4 className="text-xs font-bold text-slate-400 mb-5 text-center tracking-widest uppercase">Net Profit & Margin Trend</h4>
 <div className="h-[280px]">
 <ResponsiveContainer width="100%"height="100%">
 <ComposedChart data={financialChartData} margin={{ top: 5, right: 10, left: 30, bottom: 0 }}>
 <XAxis dataKey="name"axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
 <YAxis yAxisId="left"axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={v => `£${v}`} />
 <YAxis yAxisId="right"orientation="right"axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={v => `${v}%`} />
 <CartesianGrid strokeDasharray="3 3"vertical={false} stroke="#F1F5F9"/>
 <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '13px' }} />
 <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
 <Bar yAxisId="left"dataKey="profit"barSize={18} fill="#6366F1"name="Net Profit"radius={[4, 4, 0, 0]} />
 <Line yAxisId="left"type="monotone"dataKey="cumulativeCash"stroke="#8B5CF6"strokeWidth={2.5} name="Cumulative Cash"dot={{ r: 3, fill: '#8B5CF6' }} />
 <Line yAxisId="right"type="monotone"dataKey="profitMargin"stroke="#F59E0B"strokeWidth={2} name="Margin %"dot={false} strokeDasharray="5 5"/>
 </ComposedChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>
 </div>

 {/* === CLIENT REVENUE + EXPENSE BREAKDOWN === */}
 <div className="grid lg:grid-cols-3 gap-6">
 {/* Client Revenue Leaderboard */}
 <div className="lg:col-span-2 bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h3 className="text-xl font-bold text-slate-800 font-heading">Client Revenue Breakdown</h3>
 <p className="text-sm text-slate-500 mt-0.5">Revenue per client in period</p>
 </div>
 </div>
 <div className="space-y-3">
 {(() => {
 const crMap: Record<number, any> = {};
 dashboardData.filteredInvoices.forEach((inv: any) => {
 if (!crMap[inv.clientId]) {
 const clientMeta = stats?.clientRevenue?.find((c: any) => c.id === inv.clientId) || { name: 'Unknown' };
 crMap[inv.clientId] = { id: inv.clientId, name: clientMeta.name, revenue: 0, pending: 0, paidCount: 0, invoiceCount: 0 };
 }
 crMap[inv.clientId].invoiceCount++;
 if (inv.status === 'PAID') {
 crMap[inv.clientId].revenue += inv.amount;
 crMap[inv.clientId].paidCount++;
 } else if (inv.status === 'UNPAID') {
 crMap[inv.clientId].pending += inv.amount;
 }
 });
 const crArray = Object.values(crMap).sort((a, b) => b.revenue - a.revenue);
 if (crArray.length === 0 || crArray.every(c => c.revenue === 0 && c.pending === 0)) return <div className="py-10 text-center text-slate-400 text-sm">No invoices in this period.</div>;
 
 const maxRevenue = crArray[0]?.revenue || 1;
 return crArray.filter((c: any) => c.revenue > 0 || c.pending > 0).map((client: any, i: number) => {
 const pct = Math.round((client.revenue / maxRevenue) * 100);
 return (
 <div key={client.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
 <span className="text-xs font-black text-slate-400 w-5 text-center">{i + 1}</span>
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-center mb-1.5">
 <span className="font-bold text-sm text-slate-800 truncate">{client.name}</span>
 <div className="flex items-center gap-3 shrink-0 ml-3">
 {client.pending > 0 && <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">£{client.pending.toLocaleString()} due</span>}
 <span className="text-sm font-black text-slate-800">£{client.revenue.toLocaleString()}</span>
 </div>
 </div>
 <div className="w-full bg-slate-100 rounded-full h-2">
 <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-700"style={{ width: `${pct}%` }} />
 </div>
 <p className="text-xs text-slate-400 mt-1">{client.paidCount}/{client.invoiceCount} invoices paid</p>
 </div>
 </div>
 );
 });
 })()}
 </div>
 </div>

 {/* Expense Breakdown Donut */}
 <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
 <div className="mb-6">
 <h3 className="text-xl font-bold text-slate-800 font-heading">Expense Breakdown</h3>
 <p className="text-sm text-slate-500 mt-0.5">By category</p>
 </div>
 {(() => {
 const expMap: Record<string, number> = {};
 dashboardData.filteredExpenses.forEach(e => {
 expMap[e.category] = (expMap[e.category] || 0) + e.amount;
 });
 const expArray = Object.entries(expMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
 
 if (expArray.length === 0) return <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">No expenses in this period.</div>;
 
 return (
 <>
 <div className="h-[200px]">
 <ResponsiveContainer width="100%"height="100%">
 <PieChart>
 <Pie data={expArray} cx="50%"cy="50%"innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
 {expArray.map((entry: any, i: number) => (
 <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#9CA3AF'} />
 ))}
 </Pie>
 <Tooltip formatter={(v: any) => `£${Number(v).toLocaleString()}`} contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
 </PieChart>
 </ResponsiveContainer>
 </div>
 <div className="space-y-2 mt-4">
 {expArray.map((entry: any) => (
 <div key={entry.name} className="flex items-center justify-between text-sm">
 <div className="flex items-center gap-2">
 <div className="w-2.5 h-2.5 rounded-full"style={{ backgroundColor: CATEGORY_COLORS[entry.name] || '#9CA3AF' }} />
 <span className="font-medium text-slate-600">{entry.name.replace('_', ' ')}</span>
 </div>
 <span className="font-bold text-slate-800">£{entry.value.toLocaleString()}</span>
 </div>
 ))}
 </div>
 </>
 );
 })()}
 </div>
 </div>

 {/* === CASH FLOW FORECAST === */}
 {dashboardData.unpaidInvoices?.length > 0 && (
 <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h3 className="text-xl font-bold text-slate-800 font-heading flex items-center gap-2">
 <AlertCircle size={20} className="text-amber-500"/> Cash Flow Forecast
 </h3>
 <p className="text-sm text-slate-500 mt-0.5">Upcoming receivables from unpaid invoices in period</p>
 </div>
 <div className="text-right">
 <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Expected In</p>
 <p className="text-2xl font-black text-amber-600 font-heading">£{dashboardData.pendingRev?.toLocaleString()}</p>
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="border-b border-slate-100 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
 <th className="py-3 px-4">Client</th>
 <th className="py-3 px-4">Description</th>
 <th className="py-3 px-4">Due Date</th>
 <th className="py-3 px-4 text-right">Amount</th>
 </tr>
 </thead>
 <tbody>
 {dashboardData.unpaidInvoices.map((inv: any) => {
 const dueDate = new Date(inv.dueDate);
 const isOverdue = dueDate < new Date();
 return (
 <tr key={inv.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
 <td className="py-4 px-4 font-bold text-slate-800 text-sm">{inv.client?.companyName || 'Unknown'}</td>
 <td className="py-4 px-4 text-sm text-slate-500">{inv.description}</td>
 <td className="py-4 px-4">
 <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${isOverdue ? 'text-rose-700 bg-rose-50' : 'text-amber-700 bg-amber-50'}`}>
 {isOverdue ? 'Overdue' : ''} {dueDate.toLocaleDateString()}
 </span>
 </td>
 <td className="py-4 px-4 text-sm font-black text-slate-800 text-right">£{inv.amount.toLocaleString()}</td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* === EMPLOYEE PERFORMANCE + TASK STATUS === */}
 <div className="grid lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
 <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
 <div>
 <h3 className="text-xl font-bold text-slate-800 font-heading">Employee Performance</h3>
 <p className="text-sm text-slate-500 mt-0.5">Completed vs delayed tasks</p>
 </div>
 <select className="bg-white border border-slate-200 text-sm font-semibold text-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
 <option value="ALL">All Employees</option>
 {users.map(u => <option key={u.id} value={u.id.toString()}>{u.name}</option>)}
 </select>
 </div>
 <div className="h-[300px]">
 <ResponsiveContainer width="100%"height="100%">
 <BarChart data={employeePerformanceData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
 <CartesianGrid strokeDasharray="3 3"vertical={false} stroke="#F1F5F9"/>
 <XAxis dataKey="name"axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
 <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
 <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '13px' }} />
 <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
 <Bar dataKey="completed"name="Completed"fill="#10B981"radius={[4, 4, 0, 0]} maxBarSize={45} />
 <Bar dataKey="delayed"name="Delayed / Overdue"fill="#EF4444"radius={[4, 4, 0, 0]} maxBarSize={45} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
 <div className="mb-6">
 <h3 className="text-xl font-bold text-slate-800 font-heading">Task Status</h3>
 <p className="text-sm text-slate-500 mt-0.5">Current distribution</p>
 </div>
 <div className="h-[300px] flex items-center justify-center">
 {stats.statusDistribution?.length > 0 ? (
 <ResponsiveContainer width="100%"height="100%">
 <PieChart>
 <Pie data={stats.statusDistribution} cx="50%"cy="50%"innerRadius={65} outerRadius={100} paddingAngle={4} dataKey="value">
 {stats.statusDistribution.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
 </Pie>
 <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
 <Legend verticalAlign="bottom"height={36} wrapperStyle={{ fontSize: '11px' }} />
 </PieChart>
 </ResponsiveContainer>
 ) : (
 <div className="text-slate-400 text-sm">No tasks assigned yet.</div>
 )}
 </div>
 </div>
 </div>

 {/* === TRANSACTIONS TABLE (Expenses + Income) === */}
 <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
 <div className="px-8 pt-8 pb-0">
 <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
 <div>
 <h3 className="text-xl font-bold text-slate-800 font-heading">Transaction Ledger</h3>
 <p className="text-sm text-slate-500 mt-0.5">All recorded expenses and additional income</p>
 </div>
 <div className="flex items-center gap-3">
 <button onClick={() => exportToExcel(activeTable === 'expenses' ? expenses : incomes, activeTable)} className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
 <Download size={14} /> Export
 </button>
 <button onClick={() => setShowExpenseModal(true)} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm shadow-rose-500/30">
 <Plus size={16} /> Add Expense
 </button>
 <button onClick={() => setShowIncomeModal(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm shadow-emerald-500/30">
 <Plus size={16} /> Add Manual Revenue
 </button>
 </div>
 </div>

 {/* Tabs */}
 <div className="flex border-b border-slate-100 gap-0">
 {(['expenses', 'incomes'] as const).map(tab => (
 <button key={tab} onClick={() => setActiveTable(tab)}
 className={`px-6 py-3 text-sm font-bold capitalize transition-all border-b-2 ${activeTable === tab ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 '}`}>
 {tab === 'expenses' ? <span className="flex items-center gap-1.5"><Receipt size={14} /> Expenses ({expenses.length})</span> : <span className="flex items-center gap-1.5"><Banknote size={14} /> Manual Revenue Entry ({incomes.length})</span>}
 </button>
 ))}
 </div>
 </div>

 <div className="overflow-x-auto">
 {activeTable === 'expenses' && (
 <table className="w-full">
 <thead>
 <tr className="border-b border-slate-100 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
 <th className="py-4 px-8">Date</th>
 <th className="py-4 px-4">Description</th>
 <th className="py-4 px-4">Category</th>
 <th className="py-4 px-4 text-right">Amount</th>
 <th className="py-4 px-8"></th>
 </tr>
 </thead>
 <tbody>
 {expenses.map(exp => (
 <tr key={exp.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
 <td className="py-4 px-8 text-sm font-medium text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
 <td className="py-4 px-4 font-semibold text-slate-800 text-sm">{exp.description}</td>
 <td className="py-4 px-4">
 <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg"style={{ color: CATEGORY_COLORS[exp.category] || '#6B7280', backgroundColor: (CATEGORY_COLORS[exp.category] || '#6B7280') + '15' }}>
 {exp.category.replace('_', ' ')}
 </span>
 </td>
 <td className="py-4 px-4 text-sm font-black text-rose-600 text-right">-£{exp.amount.toLocaleString()}</td>
 <td className="py-4 px-8 text-right">
 <button onClick={() => handleDeleteExpense(exp.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all p-1.5 rounded-lg hover:bg-rose-50">
 <Trash2 size={14} />
 </button>
 </td>
 </tr>
 ))}
 {expenses.length === 0 && <tr><td colSpan={5} className="py-16 text-center text-slate-400 font-medium">No expenses recorded. Click Add Expense to get started.</td></tr>}
 </tbody>
 </table>
 )}
 {activeTable === 'incomes' && (
 <table className="w-full">
 <thead>
 <tr className="border-b border-slate-100 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
 <th className="py-4 px-8">Date</th>
 <th className="py-4 px-4">Description</th>
 <th className="py-4 px-4">Source</th>
 <th className="py-4 px-4 text-right">Amount</th>
 <th className="py-4 px-8"></th>
 </tr>
 </thead>
 <tbody>
 {incomes.map(inc => (
 <tr key={inc.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
 <td className="py-4 px-8 text-sm font-medium text-slate-500">{new Date(inc.date).toLocaleDateString()}</td>
 <td className="py-4 px-4 font-semibold text-slate-800 text-sm">{inc.description}</td>
 <td className="py-4 px-4">
 <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
 {inc.source.replace('_', ' ')}
 </span>
 </td>
 <td className="py-4 px-4 text-sm font-black text-emerald-600 text-right">+£{inc.amount.toLocaleString()}</td>
 <td className="py-4 px-8 text-right">
 <button onClick={() => handleDeleteIncome(inc.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all p-1.5 rounded-lg hover:bg-rose-50">
 <Trash2 size={14} />
 </button>
 </td>
 </tr>
 ))}
 {incomes.length === 0 && <tr><td colSpan={5} className="py-16 text-center text-slate-400 font-medium">No manual revenue recorded. Click "Add Manual Revenue" to log past/external payments.</td></tr>}
 </tbody>
 </table>
 )}
 </div>
 </div>

 {/* === ADD EXPENSE MODAL === */}
 {showExpenseModal && (
 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
 <div className="bg-gradient-to-br from-rose-600 to-rose-700 px-8 py-6 flex justify-between items-start">
 <div>
 <h3 className="text-xl font-bold text-white font-heading flex items-center gap-2"><TrendingDown size={20} /> Record Expense</h3>
 <p className="text-rose-200 text-sm mt-1">Log a business expense to your ledger</p>
 </div>
 <button onClick={() => setShowExpenseModal(false)} className="text-rose-200 hover:text-white hover:bg-white p-1.5 rounded-lg transition-colors">
 <X size={18} />
 </button>
 </div>
 <form onSubmit={handleAddExpense} className="px-8 py-7 space-y-5">
 <div>
 <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-3 flex items-center gap-2">
 <Calendar size={14} className="text-amber-600 shrink-0" />
 <p className="text-xs font-semibold text-amber-700">The date below determines which month this expense appears in Analytics. Change it to backdate entries.</p>
 </div>
 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Expense Date <span className="text-rose-500">*</span></label>
 <input required type="date" value={expDate} onChange={e => setExpDate(e.target.value)}
 className="w-full border-2 border-rose-300 rounded-xl px-4 py-3 text-slate-800 text-base font-bold bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"/>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Amount (£) <span className="text-rose-500">*</span></label>
 <input required type="number" step="0.01" min="0.01" value={expAmount} onChange={e => setExpAmount(e.target.value)}
 placeholder="0.00" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition-all"/>
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Category</label>
 <select value={expCategory} onChange={e => setExpCategory(e.target.value)}
 className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition-all">
 {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
 </select>
 </div>
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description <span className="text-rose-500">*</span></label>
 <textarea required rows={3} value={expDescription} onChange={e => setExpDescription(e.target.value)}
 placeholder="What was this expense for?" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition-all resize-none"/>
 </div>
 <div className="flex gap-3 pt-1">
 <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-sm font-semibold transition-all">Cancel</button>
 <button type="submit" disabled={expSaving} className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-500/25">
 {expSaving ? 'Saving...' : 'Record Expense'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* === ADD INCOME MODAL === */}
 {showIncomeModal && (
 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
 <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-8 py-6 flex justify-between items-start">
 <div>
 <h3 className="text-xl font-bold text-white font-heading flex items-center gap-2"><TrendingUp size={20} /> Record Income</h3>
 <p className="text-emerald-200 text-sm mt-1">Log external or miscellaneous income</p>
 </div>
 <button onClick={() => setShowIncomeModal(false)} className="text-emerald-200 hover:text-white hover:bg-white p-1.5 rounded-lg transition-colors">
 <X size={18} />
 </button>
 </div>
 <form onSubmit={handleAddIncome} className="px-8 py-7 space-y-5">
 <div>
 <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-3 flex items-center gap-2">
 <Calendar size={14} className="text-amber-600 shrink-0" />
 <p className="text-xs font-semibold text-amber-700">The date below determines which month this income appears in Analytics. Change it to backdate entries.</p>
 </div>
 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Income Date <span className="text-rose-500">*</span></label>
 <input required type="date" value={incDate} onChange={e => setIncDate(e.target.value)}
 className="w-full border-2 border-emerald-300 rounded-xl px-4 py-3 text-slate-800 text-base font-bold bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"/>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Amount (£) <span className="text-rose-500">*</span></label>
 <input required type="number" step="0.01" min="0.01" value={incAmount} onChange={e => setIncAmount(e.target.value)}
 placeholder="0.00" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"/>
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Source</label>
 <select value={incSource} onChange={e => setIncSource(e.target.value)}
 className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all">
 {INCOME_SOURCES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
 </select>
 </div>
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description <span className="text-rose-500">*</span></label>
 <textarea required rows={3} value={incDescription} onChange={e => setIncDescription(e.target.value)}
 placeholder="What is this income from?" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all resize-none"/>
 </div>
 <div className="flex gap-3 pt-1">
 <button type="button" onClick={() => setShowIncomeModal(false)} className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-sm font-semibold transition-all">Cancel</button>
 <button type="submit" disabled={incSaving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/25">
 {incSaving ? 'Saving...' : 'Record Income'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
