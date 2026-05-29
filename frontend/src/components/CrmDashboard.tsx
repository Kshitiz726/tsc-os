'use client';
import { useState, useEffect, useMemo } from 'react';
import { Building2, FileText, Plus, CheckCircle2, Clock, Upload, BarChart as BarChartIcon, TrendingUp, Download, PoundSterling, Target, AlertCircle, ArrowUpRight, ArrowDownRight, Calendar, ChevronDown, ChevronRight, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { exportToExcel } from '../utils/excel';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { InvoiceGenerator } from './InvoiceGenerator';

export function CrmDashboard() {
 const [clients, setClients] = useState<any[]>([]);
 const [invoices, setInvoices] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 // New Client State
 const [showClientModal, setShowClientModal] = useState(false);
 const [companyName, setCompanyName] = useState('');
 const [contactEmail, setContactEmail] = useState('');
 const [logoBase64, setLogoBase64] = useState('');
 const [pkg, setPkg] = useState('');
 const [monthlyDeliverables, setMonthlyDeliverables] = useState('');
 const [driveLinks, setDriveLinks] = useState('');
 const [notes, setNotes] = useState('');
 const [status, setStatus] = useState('ACTIVE');
 const [credentials, setCredentials] = useState<{platform: string; username: string; password: string}[]>([]);
 
 const [editClientId, setEditClientId] = useState<number | null>(null);
 const [viewClientId, setViewClientId] = useState<number | null>(null);
 const [deleteWarningClient, setDeleteWarningClient] = useState<number | null>(null);

 const [viewMode, setViewMode] = useState<'CRM' | 'INVOICE_GENERATOR' | 'ANALYTICS'>('CRM');
 const [selectedAnalyticsClient, setSelectedAnalyticsClient] = useState<string>('ALL');
 const [expandedClient, setExpandedClient] = useState<number | null>(null);
 const [crmTimePeriod, setCrmTimePeriod] = useState<string>('1M');
 const [chartClientFilter, setChartClientFilter] = useState<string>('ALL');

 const [generatingId, setGeneratingId] = useState<number | null>(null);

 // Payment Modal
 const [showPaymentModal, setShowPaymentModal] = useState(false);
 const [paymentInvoice, setPaymentInvoice] = useState<any>(null);
 const [paymentAmount, setPaymentAmount] = useState('');
 const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
 const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');

 const [invoiceFilterClient, setInvoiceFilterClient] = useState<string>('ALL');
 const [invoiceFilterStatus, setInvoiceFilterStatus] = useState<string>('ALL');

 const fetchData = async () => {
 const [c, i] = await Promise.all([
 fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`).then(res => res.json()),
 fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices`).then(res => res.json())
 ]);
 setClients(c);
 setInvoices(i);
 setLoading(false);
 };

 useEffect(() => { 
 fetchData(); 
 const intervalId = setInterval(fetchData, 5000);
 return () => clearInterval(intervalId);
 }, []);

 useEffect(() => {
    if (window.location.hash === '#new-client') {
      setShowClientModal(true);
      window.location.hash = '';
    } else if (window.location.hash === '#new-invoice') {
      setViewMode('INVOICE_GENERATOR');
      window.location.hash = '';
    }
  }, []);

 const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 const reader = new FileReader();
 reader.onloadend = () => {
 setLogoBase64(reader.result as string);
 };
 reader.readAsDataURL(file);
 }
 };

 const handleCreateClient = async (e: React.FormEvent) => {
 e.preventDefault();
 const passwordsPayload = JSON.stringify(credentials);
 await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ 
 companyName, contactEmail, logoUrl: logoBase64,
 package: pkg, monthlyDeliverables, driveLinks, passwords: passwordsPayload, notes, status 
 })
 });
 closeClientModal();
 fetchData();
 };

 const handleEditClient = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!editClientId) return;
 const passwordsPayload = JSON.stringify(credentials);
 await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${editClientId}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ 
 companyName, contactEmail, logoUrl: logoBase64,
 package: pkg, monthlyDeliverables, driveLinks, passwords: passwordsPayload, notes, status 
 })
 });
 closeClientModal();
 fetchData();
 };

 const closeClientModal = () => {
 setShowClientModal(false); setEditClientId(null); setViewClientId(null);
 setLogoBase64(''); setCompanyName(''); setContactEmail('');
 setPkg(''); setMonthlyDeliverables(''); setDriveLinks(''); setNotes(''); setStatus('ACTIVE');
 setCredentials([]);
 };

 const openViewClient = (client: any) => {
 setEditClientId(null);
 setViewClientId(client.id);
 setCompanyName(client.companyName); setContactEmail(client.contactEmail);
 setLogoBase64(client.logoUrl || ''); setPkg(client.package || '');
 setMonthlyDeliverables(client.monthlyDeliverables || ''); setDriveLinks(client.driveLinks || '');
 setNotes(client.notes || ''); setStatus(client.status);
 try {
 const parsed = JSON.parse(client.passwords || '[]');
 setCredentials(Array.isArray(parsed) ? parsed : []);
 } catch(e) { setCredentials([]); }
 setShowClientModal(true);
 };

 const openEditClient = (client: any) => {
 setViewClientId(null);
 setEditClientId(client.id);
 setCompanyName(client.companyName); setContactEmail(client.contactEmail);
 setLogoBase64(client.logoUrl || ''); setPkg(client.package || '');
 setMonthlyDeliverables(client.monthlyDeliverables || ''); setDriveLinks(client.driveLinks || '');
 setNotes(client.notes || ''); setStatus(client.status);
 try {
 const parsed = JSON.parse(client.passwords || '[]');
 setCredentials(Array.isArray(parsed) ? parsed : []);
 } catch(e) { setCredentials([]); }
 setShowClientModal(true);
 };

 const handleDeleteClient = async (id: number) => {
 await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${id}`, { method: 'DELETE' });
 setDeleteWarningClient(null);
 closeClientModal();
 fetchData();
 };
 
 const addCredential = () => setCredentials([...credentials, { platform: '', username: '', password: '' }]);
 const updateCredential = (index: number, field: string, value: string) => {
 const newCreds = [...credentials];
 newCreds[index] = { ...newCreds[index], [field]: value };
 setCredentials(newCreds);
 };
 const removeCredential = (index: number) => setCredentials(credentials.filter((_, i) => i !== index));

 // Invoice creation is handled via the InvoiceGenerator component (setViewMode('INVOICE_GENERATOR'))

 const handleGeneratePdf = async (invoice: any) => {
 setGeneratingId(invoice.id);
 try {
 // 1. Fetch the exact template PDF
 const existingPdfBytes = await fetch('/invoice_template.pdf').then(res => res.arrayBuffer());
 const pdfDoc = await PDFDocument.load(existingPdfBytes);
 pdfDoc.registerFontkit(fontkit);
 const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
 const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
 const pages = pdfDoc.getPages();
 const firstPage = pages[0];
 const { width, height } = firstPage.getSize();
 
 const textColor = rgb(0.3, 0.3, 0.3); 
 // 2. Erase Dummy Template Data with White Rectangles
 // Top Right"Invoice No"box. Start at y=695 so it doesn't clip the"BILL TO"header below it!
 firstPage.drawRectangle({ x: 350, y: 695, width: 250, height: 135, color: rgb(1, 1, 1) }); 
 
 // FROM and BILL TO details
 // Expanded width to catch stray text like"ANY CITY,"on the far right
 // Kept safe from the center"Description"header
 firstPage.drawRectangle({ x: 40, y: 580, width: 220, height: 85, color: rgb(1, 1, 1) }); // Left eraser
 firstPage.drawRectangle({ x: 315, y: 580, width: 250, height: 85, color: rgb(1, 1, 1) }); // Right eraser

 // 3. Header & Invoice Info
 try {
 const tscLogoBytes = await fetch('/tsc_logo.png').then(res => res.arrayBuffer());
 const tscImage = await pdfDoc.embedPng(tscLogoBytes);
 // Move TSC Logo up to avoid crowding BILL TO
 firstPage.drawImage(tscImage, {
 x: 400,
 y: 765, 
 width: 80,
 height: 80 * (tscImage.height / tscImage.width),
 });
 } catch (e) { console.warn("Failed to load tsc_logo.png"); }

 // Invoice Number & Dates (Top Right, shifted up under the moved logo)
 const blackText = rgb(0, 0, 0);
 const year = new Date().getFullYear();
 firstPage.drawText(`Invoice No: TSC-${year}-${invoice.id.toString().padStart(3, '0')}`, { x: 400, y: 745, size: 10, font: boldFont, color: blackText });
 firstPage.drawText(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, { x: 400, y: 730, size: 10, font, color: blackText });
 firstPage.drawText(`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`, { x: 400, y: 715, size: 10, font, color: blackText });

 // 4. FROM (Left side)
 firstPage.drawText('The Social Circle', { x: 50, y: 650, size: 12, font: boldFont, color: blackText });
 firstPage.drawText('2nd Floor, 112 High Road', { x: 50, y: 635, size: 10, font, color: blackText });
 firstPage.drawText('Ilford, England, IG1 1BY', { x: 50, y: 620, size: 10, font, color: blackText });

 // 5. BILL TO (Right side, perfectly aligning the"B"in client name with the"B"in BILL TO)
 const billToX = 370;
 firstPage.drawText(invoice.client.companyName, { x: billToX, y: 650, size: 12, font: boldFont, color: blackText });
 firstPage.drawText(invoice.client.contactEmail, { x: billToX, y: 635, size: 10, font, color: blackText });

 // Embed Client Logo if exists
 if (invoice.client.logoUrl) {
 try {
 const clientImgBytes = await fetch(invoice.client.logoUrl).then(res => res.arrayBuffer());
 let clientImage;
 if (invoice.client.logoUrl.includes('image/jpeg')) {
 clientImage = await pdfDoc.embedJpg(clientImgBytes);
 } else {
 clientImage = await pdfDoc.embedPng(clientImgBytes);
 }
 firstPage.drawImage(clientImage, {
 x: billToX,
 y: 570, 
 width: 50,
 height: 50 * (clientImage.height / clientImage.width),
 });
 } catch(e) { console.warn("Failed to load client logo"); }
 }

 // 6. Table Items (Lower half)
 const tableY = 510;
 firstPage.drawText('01', { x: 80, y: tableY, size: 11, font, color: blackText }); 
 firstPage.drawText(invoice.description, { x: 180, y: tableY, size: 11, font, color: blackText }); 
 firstPage.drawText(`£${Number(invoice.amount).toFixed(2)}`, { x: 430, y: tableY, size: 11, font, color: blackText }); 

 // 7. Total (Bottom of table)
 firstPage.drawText(`£${Number(invoice.amount).toFixed(2)}`, { x: 430, y: 180, size: 14, font: boldFont, color: blackText });

 // 8. Administrator Signature Area (Bottom Right)
 try {
 const sigFontBytes = await fetch('/signature.ttf').then(res => res.arrayBuffer());
 const signatureFont = await pdfDoc.embedFont(sigFontBytes);
 
 // Create a crisp white cutout over the right side of the Note box for the signature
 // We start the cutout at x=350, preserving the left side of the note box.
 firstPage.drawRectangle({ x: 350, y: 30, width: 220, height: 120, color: rgb(1, 1, 1) });
 
 const sigX = 390;
 const sigY = 70;
 
 // Flowing Signature
 firstPage.drawText('Shaan', { x: sigX, y: sigY + 25, size: 48, font: signatureFont, color: blackText });
 
 // Printed Name
 firstPage.drawText('Shaan', { x: sigX, y: sigY, size: 14, font: boldFont, color: blackText });
 
 // Title
 firstPage.drawText('Administrator', { x: sigX, y: sigY - 15, size: 11, font, color: rgb(0.4, 0.4, 0.4) });
 } catch (e) { 
 console.warn("Failed to load signature font", e); 
 }

 // Serialize & Download
 const pdfBytes = await pdfDoc.save();
 const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
 const link = document.createElement('a');
 link.href = URL.createObjectURL(blob);
 link.download = `Invoice_${invoice.client.companyName.replace(/\s+/g, '_')}_${invoice.id}.pdf`;
 link.click();

 } catch (error) {
 console.error("PDF Generation Error:", error);
 alert("Failed to generate PDF invoice.");
 } finally {
 setGeneratingId(null);
 }
 };

 const filteredInvoices = invoices.filter(inv => {
 if (invoiceFilterClient !== 'ALL' && inv.clientId.toString() !== invoiceFilterClient) return false;
 if (invoiceFilterStatus !== 'ALL' && inv.status !== invoiceFilterStatus) return false;
 return true;
 });

 const exportClientsToExcel = () => {
    const dataToExport = clients.map(c => ({
      'Company Name': c.companyName,
      'Email': c.contactEmail,
      'Package': c.package,
      'Status': c.status,
      'Monthly Deliverables': c.monthlyDeliverables,
      'Drive Links': c.driveLinks ? { 
        text: c.driveLinks, 
        hyperlink: c.driveLinks.startsWith('http') ? c.driveLinks : `https://${c.driveLinks}`
      } : ''
    }));
    const columns = [
      { header: 'Company Name', key: 'Company Name', width: 25 },
      { header: 'Email', key: 'Email', width: 30 },
      { header: 'Package', key: 'Package', width: 15 },
      { header: 'Status', key: 'Status', width: 15 },
      { header: 'Monthly Deliverables', key: 'Monthly Deliverables', width: 30 },
      { header: 'Drive Links', key: 'Drive Links', width: 40 }
    ];
    exportToExcel(dataToExport, columns, 'Clients', 'crm_clients');
  };

  const exportInvoicesToExcel = () => {
    const dataToExport = filteredInvoices.map(i => ({
      'Client': i.client?.companyName || 'Unknown',
      'Amount (£)': i.amount,
      'Status': i.status,
      'Description': i.description,
      'Due Date': new Date(i.dueDate).toLocaleDateString(),
      'Created At': new Date(i.createdAt).toLocaleDateString()
    }));
    const columns = [
      { header: 'Client', key: 'Client', width: 25 },
      { header: 'Amount (£)', key: 'Amount (£)', width: 15 },
      { header: 'Status', key: 'Status', width: 15 },
      { header: 'Description', key: 'Description', width: 40 },
      { header: 'Due Date', key: 'Due Date', width: 15 },
      { header: 'Created At', key: 'Created At', width: 15 }
    ];
    exportToExcel(dataToExport, columns, 'Invoices', 'crm_invoices');
  };

 if (loading) return <div>Loading CRM...</div>;

 if (viewMode === 'INVOICE_GENERATOR') {
 return (
 <InvoiceGenerator 
 clients={clients} 
 onBack={() => setViewMode('CRM')}
 onSave={async (invoiceData) => {
 await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(invoiceData)
 });
 fetchData();
 }}
 />
 );
 }

 if (viewMode === 'ANALYTICS') {
 // Compute per-client detailed metrics
 const clientMetrics = clients.map(client => {
 const allInvoices = client.invoices || [];
 const paidInvoices = allInvoices.filter((i: any) => i.status === 'PAID');
 const unpaidInvoices = allInvoices.filter((i: any) => i.status === 'UNPAID');
 const ltv = paidInvoices.reduce((s: number, i: any) => s + i.amount, 0);
 const pending = unpaidInvoices.reduce((s: number, i: any) => s + i.amount, 0);

 // MRR = total paid divided by active months
 const firstInvoiceDate = paidInvoices.length > 0
 ? new Date(Math.min(...paidInvoices.map((i: any) => new Date(i.createdAt).getTime())))
 : null;
 const monthsActive = firstInvoiceDate
 ? Math.max(1, Math.ceil((Date.now() - firstInvoiceDate.getTime()) / (1000 * 60 * 60 * 24 * 30)))
 : 1;
 const mrr = ltv / monthsActive;
 const paymentRate = allInvoices.length > 0 ? (paidInvoices.length / allInvoices.length) * 100 : 0;

 // Monthly revenue buckets for sparkline
 const monthlyBuckets: Record<string, number> = {};
 paidInvoices.forEach((inv: any) => {
 const d = new Date(inv.createdAt);
 const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
 monthlyBuckets[key] = (monthlyBuckets[key] || 0) + inv.amount;
 });
 const sparkData = Object.keys(monthlyBuckets).sort().map(k => ({ month: k, revenue: monthlyBuckets[k] }));

 // Time-period filtered metrics
 const now = Date.now();
 const periods: Record<string, number> = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
 const periodMetrics = Object.fromEntries(Object.entries(periods).map(([label, days]) => {
 const cutoff = now - days * 24 * 60 * 60 * 1000;
 const filtered = paidInvoices.filter((i: any) => new Date(i.createdAt).getTime() >= cutoff);
 return [label, filtered.reduce((s: number, i: any) => s + i.amount, 0)];
 }));

 return { client, ltv, pending, mrr, paymentRate, monthsActive, sparkData, periodMetrics, paidCount: paidInvoices.length, unpaidCount: unpaidInvoices.length, allInvoices };
 }).sort((a, b) => b.ltv - a.ltv);

 const totalLTV = clientMetrics.reduce((s, c) => s + c.ltv, 0);
 const totalPending = clientMetrics.reduce((s, c) => s + c.pending, 0);
 const totalMRR = clientMetrics.reduce((s, c) => s + c.mrr, 0);

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex justify-between items-center">
 <div>
 <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-heading">
 <TrendingUp className="text-indigo-600"size={24} /> Client Economic Intelligence
 </h2>
 <p className="text-slate-500 text-sm mt-1">Detailed financial performance across all reporting periods</p>
 </div>
 <div className="flex items-center gap-3">
 <button onClick={() => setViewMode('CRM')} className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
 <X size={14} /> Close
 </button>
 </div>
 </div>

 {/* Agency-Wide KPIs */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/20">
 <p className="text-xs font-semibold text-indigo-200 uppercase tracking-widest mb-3">Total Lifetime Revenue</p>
 <h3 className="text-2xl font-black font-heading">£{totalLTV.toLocaleString()}</h3>
 <p className="text-indigo-300 text-xs mt-1">All time from all clients</p>
 </div>
 <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
 <p className="text-xs font-semibold text-emerald-200 uppercase tracking-widest mb-3">Total MRR</p>
 <h3 className="text-2xl font-black font-heading">£{totalMRR.toFixed(0)}</h3>
 <p className="text-emerald-300 text-xs mt-1">Avg monthly recurring revenue</p>
 </div>
 <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
 <p className="text-xs font-semibold text-amber-100 uppercase tracking-widest mb-3">Pending Revenue</p>
 <h3 className="text-2xl font-black font-heading">£{totalPending.toLocaleString()}</h3>
 <p className="text-amber-200 text-xs mt-1">Across unpaid invoices</p>
 </div>
 <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl p-5 text-white shadow-lg shadow-violet-500/20">
 <p className="text-xs font-semibold text-violet-200 uppercase tracking-widest mb-3">Active Clients</p>
 <h3 className="text-2xl font-black font-heading">{clients.filter(c => c.status === 'ACTIVE').length}</h3>
 <p className="text-violet-300 text-xs mt-1">of {clients.length} total clients</p>
 </div>
 </div>

 {/* Monthly Revenue Chart */}
 <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm">
 <div className="flex justify-between items-start mb-6">
 <div>
 <h3 className="text-lg font-bold text-slate-800 mb-1">12-Month Revenue Analysis</h3>
 <p className="text-sm text-slate-500">Monthly breakdown of paid vs pending revenue</p>
 </div>
 <select
 className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
 value={chartClientFilter}
 onChange={(e) => setChartClientFilter(e.target.value)}
 >
 <option value="ALL">All Clients (Aggregated)</option>
 {clients.map(c => <option key={c.id} value={c.id.toString()}>{c.companyName}</option>)}
 </select>
 </div>
 <div className="h-72">
 <ResponsiveContainer width="100%"height="100%">
 {(() => {
 // Generate last 12 months labels
 const months: { key: string, label: string, paid: number, pending: number }[] = [];
 const d = new Date();
 d.setDate(1); // Set to 1st to avoid end-of-month skips
 for (let i = 11; i >= 0; i--) {
 const past = new Date(d);
 past.setMonth(d.getMonth() - i);
 months.push({
 key: `${past.getFullYear()}-${String(past.getMonth()+1).padStart(2,'0')}`,
 label: past.toLocaleString('default', { month: 'short', year: '2-digit' }),
 paid: 0,
 pending: 0
 });
 }
 
 // Aggregate data based on filter
 const filteredClients = chartClientFilter === 'ALL' 
 ? clientMetrics 
 : clientMetrics.filter(cm => cm.client.id.toString() === chartClientFilter);
 
 filteredClients.forEach(cm => {
 cm.allInvoices.forEach((inv: any) => {
 const invDate = new Date(inv.createdAt);
 const key = `${invDate.getFullYear()}-${String(invDate.getMonth()+1).padStart(2,'0')}`;
 const monthObj = months.find(m => m.key === key);
 if (monthObj) {
 if (inv.status === 'PAID') monthObj.paid += inv.amount;
 if (inv.status === 'UNPAID') monthObj.pending += inv.amount;
 }
 });
 });

 return (
 <BarChart data={months} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
 <CartesianGrid strokeDasharray="3 3"vertical={false} stroke="#F1F5F9"/>
 <XAxis dataKey="label"axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
 <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={v => `£${v}`} />
 <Tooltip 
 contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
 formatter={(value: any, name: any) => [`£${Number(value).toLocaleString()}`, name === 'paid' ? 'Paid Revenue' : 'Pending Revenue']}
 />
 <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} formatter={(val) => val === 'paid' ? 'Paid Revenue' : 'Pending Revenue'} />
 <Bar dataKey="paid"stackId="a"fill="#10B981"radius={[0,0,4,4]} maxBarSize={40} />
 <Bar dataKey="pending"stackId="a"fill="#F43F5E"radius={[4,4,0,0]} maxBarSize={40} />
 </BarChart>
 );
 })()}
 </ResponsiveContainer>
 </div>
 </div>

 {/* Per-Client Detailed Cards */}
 <div className="space-y-4">
 <h3 className="text-lg font-bold text-slate-800">Client-by-Client Analysis</h3>
 {clientMetrics.map((cm) => {
 const isExpanded = expandedClient === cm.client.id;
 return (
 <div key={cm.client.id} className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
 {/* Card Header - Always Visible */}
 <div className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"onClick={() => setExpandedClient(isExpanded ? null : cm.client.id)}>
 <div className="flex items-center gap-4">
 {cm.client.logoUrl ? (
 <img src={cm.client.logoUrl} className="w-11 h-11 rounded-xl object-contain bg-slate-50 border border-slate-100"/>
 ) : (
 <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg">{cm.client.companyName.charAt(0)}</div>
 )}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5">
 <h4 className="font-bold text-slate-800">{cm.client.companyName}</h4>
 <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${cm.client.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200 '}`}>{cm.client.status}</span>
 </div>
 <p className="text-xs text-slate-500">{cm.client.package || 'No package set'} • {cm.paidCount}/{cm.paidCount + cm.unpaidCount} invoices paid</p>
 </div>
 {/* Quick Metrics */}
 <div className="hidden md:flex items-center gap-6 mr-4">
 <div className="text-center">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LTV</p>
 <p className="text-base font-black text-slate-800">£{cm.ltv.toLocaleString()}</p>
 </div>
 <div className="text-center">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MRR</p>
 <p className="text-base font-black text-emerald-600">£{cm.mrr.toFixed(0)}</p>
 </div>
 <div className="text-center">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pay Rate</p>
 <p className="text-base font-black text-indigo-600">{cm.paymentRate.toFixed(0)}%</p>
 </div>
 {cm.pending > 0 && (
 <div className="text-center">
 <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Due</p>
 <p className="text-base font-black text-amber-600">£{cm.pending.toLocaleString()}</p>
 </div>
 )}
 </div>
 <div className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}><ChevronRight size={18} /></div>
 </div>
 </div>

 {/* Expanded Detail */}
 {isExpanded && (
 <div className="border-t border-slate-100 bg-slate-50 p-6 space-y-6">
 {/* Multi-period revenue */}
 <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
 {['1W','1M','3M','6M','1Y'].map(p => (
 <div key={p} className="bg-white rounded-xl p-4 border border-slate-100 text-center">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{p === '1W' ? '1 Week' : p === '1M' ? '1 Month' : p === '3M' ? '3 Months' : p === '6M' ? '6 Months' : '12 Months'}</p>
 <p className="text-lg font-black text-slate-800">£{(cm.periodMetrics[p] || 0).toLocaleString()}</p>
 </div>
 ))}
 </div>

 {/* Revenue Trend + Invoice Details side by side */}
 <div className="grid md:grid-cols-2 gap-6">
 {/* Monthly Revenue Sparkline */}
 <div className="bg-white rounded-xl border border-slate-100 p-5">
 <h4 className="text-sm font-bold text-slate-700 mb-4">Monthly Revenue History</h4>
 {cm.sparkData.length > 0 ? (
 <div className="h-[160px]">
 <ResponsiveContainer width="100%"height="100%">
 <AreaChart data={cm.sparkData} margin={{ top: 5, right: 5, left: 20, bottom: 0 }}>
 <defs>
 <linearGradient id={`gClient${cm.client.id}`} x1="0"y1="0"x2="0"y2="1">
 <stop offset="5%"stopColor="#6366F1"stopOpacity={0.2}/>
 <stop offset="95%"stopColor="#6366F1"stopOpacity={0}/>
 </linearGradient>
 </defs>
 <XAxis dataKey="month"tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
 <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `£${v}`} />
 <Tooltip formatter={(v: any) => `£${Number(v).toLocaleString()}`} contentStyle={{ borderRadius: '10px', fontSize: '12px', border: '1px solid #E2E8F0' }} />
 <Area type="monotone"dataKey="revenue"stroke="#6366F1"strokeWidth={2} fill={`url(#gClient${cm.client.id})`} />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 ) : (
 <div className="h-[160px] flex items-center justify-center text-slate-400 text-sm">No paid invoices yet</div>
 )}
 </div>

 {/* Invoice Log */}
 <div className="bg-white rounded-xl border border-slate-100 p-5">
 <h4 className="text-sm font-bold text-slate-700 mb-4">Invoice Log</h4>
 <div className="overflow-y-auto max-h-[160px] space-y-2 custom-scrollbar pr-1">
 {cm.allInvoices.length === 0 ? (
 <p className="text-sm text-slate-400 text-center py-4">No invoices yet</p>
 ) : (
 cm.allInvoices.map((inv: any) => (
 <div key={inv.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
 <div>
 <p className="text-xs font-semibold text-slate-700 truncate max-w-[160px]">{inv.description}</p>
 <p className="text-[10px] text-slate-400">{new Date(inv.createdAt).toLocaleDateString()} · Due {new Date(inv.dueDate).toLocaleDateString()}</p>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <span className="text-sm font-black text-slate-800">£{inv.amount.toLocaleString()}</span>
 <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{inv.status}</span>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>

 {/* Key Financial Indicators */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 <div className="bg-white rounded-xl p-4 border border-slate-100">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lifetime Value</p>
 <p className="text-xl font-black text-slate-800">£{cm.ltv.toLocaleString()}</p>
 <p className="text-xs text-slate-400 mt-0.5">All time</p>
 </div>
 <div className="bg-white rounded-xl p-4 border border-slate-100">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Monthly</p>
 <p className="text-xl font-black text-emerald-600">£{cm.mrr.toFixed(0)}</p>
 <p className="text-xs text-slate-400 mt-0.5">Over {cm.monthsActive} months</p>
 </div>
 <div className="bg-white rounded-xl p-4 border border-slate-100">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Rate</p>
 <p className={`text-xl font-black ${cm.paymentRate === 100 ? 'text-emerald-600' : cm.paymentRate >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>{cm.paymentRate.toFixed(0)}%</p>
 <p className="text-xs text-slate-400 mt-0.5">{cm.paidCount}/{cm.paidCount + cm.unpaidCount} invoices</p>
 </div>
 <div className="bg-white rounded-xl p-4 border border-slate-100">
 <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Outstanding</p>
 <p className={`text-xl font-black ${cm.pending > 0 ? 'text-amber-600' : 'text-slate-400'}`}>£{cm.pending.toLocaleString()}</p>
 <p className="text-xs text-slate-400 mt-0.5">{cm.unpaidCount} unpaid</p>
 </div>
 </div>
 </div>
 )}
 </div>
 );
 })}
 </div>
 </div>
 );
 }

 return (
 <div className="grid lg:grid-cols-2 gap-8">
 {/* Clients Section */}
 <div>
 <div className="flex justify-between items-center mb-6">
 <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-heading whitespace-nowrap">
 <Building2 className="text-indigo-600"size={26} /> Client Directory
 </h3>
 <div className="flex items-center gap-2 shrink-0">
 <button onClick={exportClientsToExcel} className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all duration-200 shadow-sm active:scale-95">
 <Download size={16} /> Export
 </button>
 <button onClick={() => setViewMode('ANALYTICS')} className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all duration-200 shadow-sm active:scale-95">
 <TrendingUp size={16} /> Analytics
 </button>
 <button onClick={() => setShowClientModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all duration-200 shadow-sm active:scale-95 border border-indigo-700">
 <Plus size={16} /> Add Client
 </button>
 </div>
 </div>
 
 <div className="grid gap-5">
 {clients.map(client => (
 <div key={client.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
 {client.logoUrl ? (
 <img src={client.logoUrl} alt={client.companyName} className="w-12 h-12 rounded-lg object-contain bg-gray-50 border border-gray-100"/>
 ) : (
 <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
 {client.companyName.charAt(0)}
 </div>
 )}
 <div className="flex-1">
 <div className="flex items-center justify-between mb-1">
 <h4 className="font-bold text-gray-800">{client.companyName}</h4>
 <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-medium tracking-wide border ${client.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-slate-50 text-slate-700 border-slate-200 '}`}>{client.status.replace('_', ' ')}</span>
 </div>
 <p className="text-sm text-gray-500 mb-1">{client.contactEmail}</p>
 {client.package && <p className="text-xs text-blue-600 font-medium">Pkg: {client.package}</p>}
 {client.driveLinks && <a href={client.driveLinks} target="_blank"rel="noreferrer"className="text-xs text-indigo-500 hover:underline mt-1 inline-block">Drive Assets</a>}
 </div>
 <div className="flex flex-col gap-2 shrink-0 w-32">
 <button onClick={() => openViewClient(client)} className="w-full bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 shadow-sm active:scale-95">
 View Details
 </button>
 <button onClick={() => openEditClient(client)} className="w-full bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 shadow-sm active:scale-95">
 Edit Client
 </button>
 </div>
 </div>
 ))}
 {clients.length === 0 && <p className="text-gray-500 text-center py-8">No clients added yet.</p>}
 </div>
 </div>

 {/* Invoices Section */}
 <div>
 <div className="flex flex-col mb-6 gap-3">
 <div className="flex justify-between items-center">
 <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-heading whitespace-nowrap">
 <FileText className="text-emerald-600"size={26} /> Billing & Invoices
 </h3>
 <button onClick={() => setViewMode('INVOICE_GENERATOR')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all duration-200 shadow-md shadow-emerald-500/20 active:scale-95 border border-emerald-700">
 <Plus size={16} /> Create Invoice
 </button>
 </div>
 <div className="flex items-center gap-3 flex-wrap bg-slate-50 p-2 rounded-xl border border-slate-100">
 <select 
 className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 bg-white"
 value={invoiceFilterClient} onChange={e => setInvoiceFilterClient(e.target.value)}
 >
 <option value="ALL">All Clients</option>
 {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
 </select>
 <select 
 className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 bg-white"
 value={invoiceFilterStatus} onChange={e => setInvoiceFilterStatus(e.target.value)}
 >
 <option value="ALL">All Status</option>
 <option value="PAID">Paid</option>
 <option value="PARTIAL">Partial</option>
 <option value="UNPAID">Unpaid</option>
 </select>
 <div className="flex-1"></div>
 <button onClick={exportInvoicesToExcel} className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all duration-200 shadow-sm active:scale-95">
 <Download size={16} /> Export
 </button>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-gray-100 max-h-[600px] overflow-y-auto custom-scrollbar relative">
 <table className="w-full">
 <thead className="sticky top-0 bg-white shadow-sm z-10">
 <tr className="border-b border-gray-100">
 <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Client</th>
 <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Date</th>
 <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
 <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Paid Date</th>
 <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Status</th>
 <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase"></th>
 </tr>
 </thead>
 <tbody>
 {filteredInvoices.map(invoice => {
 const totalPaid = invoice.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
 const balance = invoice.amount - totalPaid;
 return (
 <tr key={invoice.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
 <td className="py-4 px-4 font-bold text-gray-800 flex items-center gap-2">
 {invoice.client?.companyName}
 {invoice.isInternal && <span className="bg-gray-200 text-gray-600 text-[9px] px-1.5 py-0.5 rounded font-bold tracking-widest uppercase">Internal</span>}
 </td>
 <td className="py-4 px-4 text-gray-500">{new Date(invoice.issueDate || invoice.createdAt).toLocaleDateString()}</td>
 <td className="py-4 px-4 text-gray-600">£{invoice.amount}</td>
 <td className="py-4 px-4 font-medium text-gray-500">
 {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : <span className="text-gray-300">-</span>}
 </td>
 <td className="py-4 px-4">
 <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-medium tracking-wide border ${invoice.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : invoice.status === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border-amber-200/60' : 'bg-red-50 text-red-700 border-red-200/60'}`}>
 {invoice.status}
 </span>
 </td>
 <td className="py-4 px-4 text-right">
 {invoice.status !== 'PAID' ? (
 <button 
 onClick={() => {
 setPaymentInvoice(invoice);
 setPaymentAmount(balance.toString());
 setShowPaymentModal(true);
 }}
 className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-bold text-xs"
 >
 Add Payment
 </button>
 ) : (
 <span className="text-emerald-500 flex justify-end">
 <CheckCircle2 size={20} />
 </span>
 )}
 </td>
 </tr>
 )})}
 </tbody>
 </table>
 {filteredInvoices.length === 0 && <p className="text-gray-500 text-center py-8">No invoices match filters.</p>}
 </div>
 </div>

 {/* Modals */}
 {showClientModal && (
 <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
 <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 px-8 py-6 shrink-0">
 <div className="flex justify-between items-start">
 <div>
 <h3 className="text-xl font-bold text-white font-heading">
 {viewClientId ? 'Client Profile' : editClientId ? 'Edit Client details' : 'Add New Client'}
 </h3>
 <p className="text-indigo-200 text-sm mt-1">Manage client records and settings</p>
 </div>
 <button onClick={closeClientModal} className="text-indigo-200 hover:text-white hover:bg-white p-1.5 rounded-lg transition-colors">
 <svg width="18"height="18"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
 </button>
 </div>
 </div>
 
 {viewClientId ? (
 <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-slate-50">
 <div className="flex items-center gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
 {logoBase64 ? (
 <img src={logoBase64} alt={companyName} className="w-20 h-20 rounded-xl object-contain bg-slate-50 border border-slate-100 p-2"/>
  ) : (
  <div className="w-20 h-20 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-3xl font-heading shadow-inner">
  {companyName.charAt(0)}
  </div>
  )}
  <div className="flex-1">
  <h4 className="text-2xl font-bold text-slate-800 mb-1">{companyName}</h4>
  <p className="text-slate-500 font-medium">{contactEmail}</p>
  <div className="flex gap-2 mt-3">
  {pkg && <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-md font-bold border border-indigo-100 uppercase tracking-wider">Pkg: {pkg}</span>}
  <span className={`text-xs px-2.5 py-1 rounded-md font-bold border uppercase tracking-wider ${status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-700 border-slate-200 '}`}>{status}</span>
  </div>
  </div>
  </div>

  <div className="grid md:grid-cols-2 gap-6">
  {monthlyDeliverables && (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><CheckCircle2 size={14} /> Deliverables</h4>
  <p className="text-slate-800 font-medium">{monthlyDeliverables}</p>
  </div>
  )}

  {notes && (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><FileText size={14} /> Notes</h4>
  <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{notes}</p>
  </div>
  )}
  </div>

  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">Platform Credentials</h4>
  {credentials.length > 0 ? (
  <div className="grid gap-3">
  {credentials.map((cred, idx) => (
  <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex justify-between items-center group hover:border-slate-200 transition-colors">
  <div>
  <p className="font-bold text-sm text-slate-800 mb-0.5">{cred.platform}</p>
  <p className="text-sm text-slate-500">{cred.username}</p>
  </div>
  <div className="text-right">
  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Password</p>
  <p className="font-mono text-sm font-semibold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">{cred.password}</p>
  </div>
  </div>
  ))}
  </div>
  ) : (
  <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
  <p className="text-slate-400 text-sm font-medium">No credentials saved.</p>
  </div>
  )}
  </div>

  <div className="flex gap-3 pt-4 border-t border-slate-100">
  <button onClick={closeClientModal} className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-sm font-bold transition-all">Close Profile</button>
  {clients.find((c:any) => c.id === viewClientId)?.driveFolderId && (
  <a href={`https://drive.google.com/drive/folders/${clients.find((c:any) => c.id === viewClientId)?.driveFolderId}`} target="_blank" rel="noreferrer" className="flex-1 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-700 py-3 rounded-xl text-sm font-bold transition-all text-center flex items-center justify-center gap-2"><ArrowUpRight size={16}/> Client Resources</a>
  )}
  <button onClick={() => openEditClient(clients.find((c:any) => c.id === viewClientId))} className="flex-1 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 py-3 rounded-xl text-sm font-bold transition-all">Edit Info</button>
  <button onClick={() => setDeleteWarningClient(viewClientId)} className="bg-rose-50 hover:bg-rose-100 text-rose-600 py-3 px-6 rounded-xl text-sm font-bold transition-all">Delete</button>
  </div>
  </div>
  ) : (
  <form onSubmit={editClientId ? handleEditClient : handleCreateClient} className="flex flex-col flex-1 overflow-hidden">
  <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar bg-slate-50">
  
  <div className="flex gap-6 items-start">
  <div className="flex-1 space-y-5">
  <div>
  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Company / Brand Name <span className="text-rose-400">*</span></label>
  <input required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white transition-all shadow-sm" value={companyName} onChange={e=>setCompanyName(e.target.value)} />
  </div>
  <div>
  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contact Email <span className="text-rose-400">*</span></label>
  <input required type="email" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white transition-all shadow-sm" value={contactEmail} onChange={e=>setContactEmail(e.target.value)} />
  </div>
  </div>
  
  <div className="w-32 shrink-0">
  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">Logo</label>
  <label className="cursor-pointer group">
  <div className={`w-32 h-32 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-all ${logoBase64 ? 'border-indigo-300 bg-indigo-50 ' : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50 '}`}>
  {logoBase64 ? (
  <img src={logoBase64} alt="Preview" className="w-full h-full object-contain rounded-2xl p-2"/>
  ) : (
  <>
  <Upload size={24} className="text-slate-400 group-hover:text-indigo-500 transition-colors"/>
  <span className="text-xs font-medium text-slate-500 group-hover:text-indigo-600 transition-colors">Upload</span>
  </>
  )}
  </div>
  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
  </label>
  </div>
  </div>

  <div className="grid grid-cols-2 gap-5">
  <div>
  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Package</label>
  <select className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white transition-all shadow-sm" value={pkg} onChange={e=>setPkg(e.target.value)}>
  <option value="">Select Package...</option>
  <option value="Bronze">Bronze</option>
  <option value="Silver">Silver</option>
  <option value="Gold">Gold</option>
  <option value="Platinium">Platinium</option>
  </select>
  </div>
  <div>
  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Status</label>
  <select className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white transition-all shadow-sm" value={status} onChange={e=>setStatus(e.target.value)}>
  <option value="ACTIVE">Active</option>
  <option value="PENDING_PAYMENT">Pending Payment</option>
  <option value="ONBOARDING">Onboarding</option>
  <option value="PAUSED">Paused</option>
  </select>
  </div>
  </div>

  <div>
  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Monthly Deliverables</label>
  <input placeholder="4 Reels, 2 Carousels" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white transition-all shadow-sm placeholder:text-slate-400" value={monthlyDeliverables} onChange={e=>setMonthlyDeliverables(e.target.value)} />
  </div>

  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
  <div className="flex justify-between items-center mb-4">
  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Platform Credentials</label>
  <button type="button" onClick={addCredential} className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"><Plus size={14}/> Add Account</button>
  </div>
  {credentials.length === 0 ? (
  <p className="text-sm text-slate-400 text-center py-4 border-2 border-dashed border-slate-100 rounded-xl">No accounts added yet.</p>
  ) : (
  <div className="grid gap-3">
  {credentials.map((cred, idx) => (
  <div key={idx} className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl border border-slate-100">
  <div className="grid gap-3 flex-1">
  <input placeholder="Platform (TikTok)" className="w-full border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white outline-none transition-all placeholder:text-slate-400" value={cred.platform} onChange={e=>updateCredential(idx, 'platform', e.target.value)} />
  <div className="flex gap-3">
  <input placeholder="Username" className="w-1/2 border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white outline-none transition-all placeholder:text-slate-400" value={cred.username} onChange={e=>updateCredential(idx, 'username', e.target.value)} />
  <input placeholder="Password" type="password" className="w-1/2 border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white outline-none transition-all placeholder:text-slate-400" value={cred.password} onChange={e=>updateCredential(idx, 'password', e.target.value)} />
  </div>
  </div>
  <button type="button" onClick={()=>removeCredential(idx)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors mt-0.5"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
  </div>
  ))}
  </div>
  )}
  </div>

  <div>
  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Extra Notes</label>
  <textarea placeholder="General notes..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white transition-all shadow-sm resize-none h-24 placeholder:text-slate-400" value={notes} onChange={e=>setNotes(e.target.value)} />
  </div>
  </div>

  <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
  <button type="button" onClick={closeClientModal} className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-sm font-bold transition-all shadow-sm">Cancel</button>
  <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/25">{editClientId ? 'Save Changes' : 'Create Client'}</button>
  </div>
  </form>
  )}
  </div>
  </div>
  )}

  {/* Add Payment Modal */}
  {showPaymentModal && paymentInvoice && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
  <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-5 shrink-0 flex justify-between items-center">
  <h3 className="text-lg font-bold text-white font-heading">Add Payment</h3>
  <button onClick={() => setShowPaymentModal(false)} className="text-emerald-200 hover:text-white transition-colors">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
  </button>
  </div>
  <div className="p-6 space-y-4 bg-slate-50">
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Invoice</p>
  <p className="text-xl font-black text-slate-800">£{paymentInvoice.amount.toFixed(2)}</p>
  </div>
  <div>
  <label className="block text-xs font-bold text-slate-500 mb-1">AMOUNT TO PAY (£)</label>
  <input type="number" className="w-full text-sm border border-slate-300 rounded-lg p-3 outline-none focus:border-emerald-500 font-black text-lg text-emerald-700 shadow-inner bg-white" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)} />
  </div>
  <div className="grid grid-cols-2 gap-4">
  <div>
  <label className="block text-xs font-bold text-slate-500 mb-1">DATE</label>
  <input type="date" className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 font-bold bg-white" value={paymentDate} onChange={e=>setPaymentDate(e.target.value)} />
  </div>
  <div>
  <label className="block text-xs font-bold text-slate-500 mb-1">METHOD</label>
  <select className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 font-bold bg-white" value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}>
  <option value="BANK_TRANSFER">Bank Transfer</option>
  <option value="CASH">Cash</option>
  <option value="CARD">Card</option>
  </select>
  </div>
  </div>
  </div>
  <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
  <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
  <button 
  onClick={async () => {
  if (!paymentAmount) return alert("Amount is required.");
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/${paymentInvoice.id}/payments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: paymentAmount, date: paymentDate, method: paymentMethod })
  });
  setShowPaymentModal(false);
  fetchData();
  }}
  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-95 flex items-center gap-2"
  >
  <CheckCircle2 size={16} /> Confirm Payment
  </button>
  </div>
  </div>
  </div>
  )}
  
  {/* Delete Warning Modal */}
  {deleteWarningClient && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
  <div className="bg-rose-600 p-6 flex flex-col items-center justify-center text-white text-center">
  <div className="bg-white/20 p-4 rounded-full mb-4">
  <AlertCircle size={48} className="text-white" />
  </div>
  <h3 className="text-2xl font-black font-heading mb-1">Delete Client?</h3>
  <p className="text-rose-100 font-medium">This action cannot be undone.</p>
  </div>
  <div className="p-8 text-center space-y-4 bg-slate-50">
  <p className="text-slate-700 text-base font-medium leading-relaxed">
  This will <span className="font-bold text-rose-600">permanently delete</span> the entire resources of the client, including all videos, tasks, invoices, and everything from the database. 
  </p>
  <p className="text-slate-700 text-base font-medium leading-relaxed">
  It will also <span className="font-bold text-rose-600">delete the Google Drive folder</span> of the client entirely.
  </p>
  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl my-4 text-left">
  <p className="text-amber-800 text-sm font-bold flex items-center gap-2 mb-1"><AlertCircle size={16} /> Recommendation</p>
  <p className="text-amber-700 text-sm font-medium">Please export the statement and financial history to an Excel sheet before proceeding.</p>
  </div>
  <p className="text-slate-900 font-black pt-2">Do you want to continue?</p>
  </div>
  <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
  <button onClick={() => setDeleteWarningClient(null)} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
  Cancel
  </button>
  <button onClick={() => handleDeleteClient(deleteWarningClient)} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/25 transition-all active:scale-95 flex items-center justify-center gap-2">
  <AlertCircle size={18} /> Yes, Delete Everything
  </button>
  </div>
  </div>
  </div>
  )}
  </div>
  );
}
