'use client';
import { useState, useRef } from 'react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { ChevronLeft, Download, Plus, Trash2, FileText } from 'lucide-react';

export function InvoiceGenerator({ onBack, clients, onSave }: { onBack: () => void, clients: any[], onSave: (data: any) => Promise<void> }) {
 const previewRef = useRef<HTMLDivElement>(null);
 const [isGenerating, setIsGenerating] = useState(false);

 // Agency State
 const [agencyAddress, setAgencyAddress] = useState('2nd Floor, 112 High Road High Road, Ilford, England, IG1 1BY');
 const [agencyGstin, setAgencyGstin] = useState('');
 const [agencyPhone, setAgencyPhone] = useState('+44 7432 043918');
 const [agencyEmail, setAgencyEmail] = useState('admin@thesocialcircle.io');
 const [agencyWebsite, setAgencyWebsite] = useState('www.thesocialcircle.io');
 const [agencyInsta, setAgencyInsta] = useState('@thesocialcirclex');
 const [agencyTwitter, setAgencyTwitter] = useState('');
 const [agencyFacebook, setAgencyFacebook] = useState('');

 // Client State
 const [selectedClientId, setSelectedClientId] = useState('');
 const [clientName, setClientName] = useState('');
 const [contactPerson, setContactPerson] = useState('');
 const [clientAddress, setClientAddress] = useState('');
 const [clientPhone, setClientPhone] = useState('');

 const handleClientSelect = (clientIdStr: string) => {
 setSelectedClientId(clientIdStr);
 const client = clients.find(c => c.id.toString() === clientIdStr);
 if (client) {
 setClientName(client.companyName);
 setClientPhone('');
 setClientAddress('');
 } else {
 setClientName('');
 }
 };

 // Invoice Details
 const [invoiceNo, setInvoiceNo] = useState(`TSC-${new Date().getFullYear()}-001`);
 const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
 const [isInternal, setIsInternal] = useState(false);
 const [paymentTerms, setPaymentTerms] = useState('Net 15');
 const [dueDate, setDueDate] = useState('');
 const [supplyPlace, setSupplyPlace] = useState('London');
 const [packageDesc, setPackageDesc] = useState('Social Media Monthly Package • 1 Month');

 // Line Items
 const [items, setItems] = useState([{ id: 1, service: 'Content Creation', month: 'June 2026', sac: '998314', qty: 1, rate: 1000, gst: 0 }]);

 const addItem = () => {
 setItems([...items, { id: Date.now(), service: '', month: '', sac: '', qty: 1, rate: 0, gst: 0 }]);
 };

 const removeItem = (id: number) => {
 if (items.length > 1) {
 setItems(items.filter(item => item.id !== id));
 }
 };

 const updateItem = (id: number, field: string, value: string | number) => {
 setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
 };

 const subtotal = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.rate)), 0);
 const totalGst = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.rate) * (Number(item.gst) / 100)), 0);
 const total = subtotal + totalGst;

 const downloadPdf = async () => {
 if (!previewRef.current) return;
 if (!selectedClientId) {
 alert("Please select a client from the Client Details section first to link this invoice.");
 return;
 }
 setIsGenerating(true);
 try {
 // 1. Save to database
 await onSave({
 clientId: selectedClientId,
 amount: total,
 dueDate: dueDate || new Date().toISOString(),
 issueDate: issueDate,
 isInternal: isInternal,
 description: packageDesc || 'Custom Invoice'
 });

 // 2. Generate PDF
 const dataUrl = await htmlToImage.toPng(previewRef.current, { pixelRatio: 2 });
 const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
 const pdfWidth = pdf.internal.pageSize.getWidth();
 const pdfHeight = (previewRef.current.offsetHeight * pdfWidth) / previewRef.current.offsetWidth;
 pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
 pdf.save(`${invoiceNo}.pdf`);
 
 onBack(); // Go back to CRM
 } catch (error) {
 console.error('Failed to generate PDF', error);
 alert('Failed to generate PDF');
 } finally {
 setIsGenerating(false);
 }
 };

 return (
 <div className="flex w-full min-w-0 h-[calc(100vh-2rem)] bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-200">
 <style>{`
 @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');
 .signature-font { font-family: 'Caveat', cursive; }
 `}</style>

 {/* Left Panel: Form */}
 <div className="w-[450px] bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
 <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white sticky top-0 z-10">
 <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
 <ChevronLeft size={20} />
 </button>
 <div className="flex items-center gap-2 text-blue-600 font-bold text-lg">
 <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
 <FileText size={18} />
 </div>
 Invoice Generator
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
 {/* Agency Details */}
 <div>
 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Agency Details</h3>
 <div className="grid gap-4">
 <div>
 <label className="block text-xs font-bold text-gray-500 mb-1">ADDRESS</label>
 <textarea className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:border-blue-500 outline-none text-gray-900 font-medium"rows={2} value={agencyAddress} onChange={e=>setAgencyAddress(e.target.value)} />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-gray-500 mb-1">GSTIN</label>
 <input className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none text-gray-900 font-medium"placeholder="Leave empty if unregistered"value={agencyGstin} onChange={e=>setAgencyGstin(e.target.value)} />
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-500 mb-1">PHONE</label>
 <input className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none text-gray-900 font-medium"value={agencyPhone} onChange={e=>setAgencyPhone(e.target.value)} />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-gray-500 mb-1">EMAIL</label>
 <input className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none text-gray-900 font-medium"value={agencyEmail} onChange={e=>setAgencyEmail(e.target.value)} />
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-500 mb-1">WEBSITE</label>
 <input className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none text-gray-900 font-medium"value={agencyWebsite} onChange={e=>setAgencyWebsite(e.target.value)} />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-gray-500 mb-1">INSTAGRAM</label>
 <input className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none text-gray-900 font-medium"value={agencyInsta} onChange={e=>setAgencyInsta(e.target.value)} />
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-500 mb-1">X / TWITTER</label>
 <input className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none text-gray-900 font-medium"placeholder="@username"value={agencyTwitter} onChange={e=>setAgencyTwitter(e.target.value)} />
 </div>
 </div>
 </div>
 </div>

 {/* Client Details */}
 <div>
 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-t border-gray-200 pt-6">Client Details</h3>
 <div className="grid gap-4">
 <div>
 <label className="block text-xs font-bold text-emerald-600 mb-1">* LINK TO EXISTING CLIENT *</label>
 <select 
 className="w-full text-sm border border-emerald-400 bg-emerald-50 text-emerald-900 rounded-lg p-2.5 outline-none font-bold"
 value={selectedClientId}
 onChange={e => handleClientSelect(e.target.value)}
 >
 <option value="">Select a Client...</option>
 {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-500 mb-1">CLIENT / BRAND NAME</label>
 <input className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none bg-gray-100 text-gray-600 font-medium"readOnly value={clientName} />
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-500 mb-1">CONTACT PERSON</label>
 <input className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none text-gray-900 font-medium"value={contactPerson} onChange={e=>setContactPerson(e.target.value)} />
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-500 mb-1">ADDRESS</label>
 <textarea className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none text-gray-900 font-medium"rows={3} value={clientAddress} onChange={e=>setClientAddress(e.target.value)} />
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-500 mb-1">PHONE</label>
 <input className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none text-gray-900 font-medium"value={clientPhone} onChange={e=>setClientPhone(e.target.value)} />
 </div>
 </div>
 </div>

 {/* Invoice Specifics */}
 <div>
 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-t border-gray-200 pt-6">Invoice Settings</h3>
 <div className="grid grid-cols-2 gap-4 mb-4">
 <div>
 <label className="block text-xs font-bold text-gray-500 mb-1">INVOICE NO</label>
 <input className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none font-mono text-gray-900 font-bold"value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)} />
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-500 mb-1">ISSUE DATE</label>
 <input type="date"className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none text-gray-900 font-medium"value={issueDate} onChange={e=>setIssueDate(e.target.value)} />
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-500 mb-1">PAYMENT TERMS</label>
 <input className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none text-gray-900 font-medium"value={paymentTerms} onChange={e=>setPaymentTerms(e.target.value)} />
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-500 mb-1">DUE DATE</label>
 <input type="date"className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none text-gray-900 font-medium"value={dueDate} onChange={e=>setDueDate(e.target.value)} />
 </div>
 <div className="col-span-2">
 <label className="block text-xs font-bold text-gray-500 mb-1">PLACE OF SUPPLY</label>
 <input className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none text-gray-900 font-medium"value={supplyPlace} onChange={e=>setSupplyPlace(e.target.value)} />
 </div>
 <div className="col-span-2">
 <label className="block text-xs font-bold text-gray-500 mb-1">PACKAGE DESCRIPTION</label>
 <input className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none text-gray-900 font-medium"value={packageDesc} onChange={e=>setPackageDesc(e.target.value)} />
 </div>
 <div className="col-span-2 flex items-center gap-3 bg-indigo-50 p-4 rounded-xl border-2 border-indigo-200 mt-2 hover:bg-indigo-100 transition-colors">
 <input type="checkbox"id="isInternal"checked={isInternal} onChange={e=>setIsInternal(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded cursor-pointer accent-indigo-600"/>
 <label htmlFor="isInternal"className="text-sm font-bold text-indigo-900 cursor-pointer select-none flex-1">
 Internal / Non-Record Invoice <span className="font-medium text-indigo-700 ml-1">(Exclude from official financial analytics and revenue tracking)</span>
 </label>
 </div>
 </div>
 </div>

 {/* Line Items */}
 <div>
 <div className="flex justify-between items-center mb-4 border-t border-gray-200 pt-6">
 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Line Items</h3>
 </div>
 <div className="space-y-3">
 {items.map((item, index) => (
 <div key={item.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 relative">
 <button onClick={() => removeItem(item.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full hover:bg-red-200"><Trash2 size={12} /></button>
 <div className="grid gap-2">
 <div className="grid grid-cols-2 gap-2">
 <input placeholder="Service Description"className="w-full text-sm border border-gray-300 rounded p-2 outline-none text-gray-900 font-medium"value={item.service} onChange={e=>updateItem(item.id, 'service', e.target.value)} />
 <input placeholder="Month (June)"className="w-full text-sm border border-gray-300 rounded p-2 outline-none text-gray-900 font-medium"value={item.month} onChange={e=>updateItem(item.id, 'month', e.target.value)} />
 </div>
 <div className="grid grid-cols-4 gap-2">
 <input placeholder="SAC"className="w-full text-xs border border-gray-300 rounded p-2 outline-none text-gray-900 font-medium"value={item.sac} onChange={e=>updateItem(item.id, 'sac', e.target.value)} />
 <input type="number"placeholder="Qty"className="w-full text-xs border border-gray-300 rounded p-2 outline-none text-gray-900 font-medium"value={item.qty} onChange={e=>updateItem(item.id, 'qty', e.target.value)} />
 <input type="number"placeholder="Rate"className="w-full text-xs border border-gray-300 rounded p-2 outline-none text-gray-900 font-medium"value={item.rate} onChange={e=>updateItem(item.id, 'rate', e.target.value)} />
 <input type="number"placeholder="GST%"className="w-full text-xs border border-gray-300 rounded p-2 outline-none text-gray-900 font-medium"value={item.gst} onChange={e=>updateItem(item.id, 'gst', e.target.value)} />
 </div>
 </div>
 </div>
 ))}
 <button onClick={addItem} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors flex justify-center items-center gap-1">
 <Plus size={16} /> Add Item
 </button>
 </div>
 </div>

 </div>
 </div>

 {/* Right Panel: Live Preview */}
 <div className="flex-1 bg-slate-100 flex flex-col h-full relative min-w-0">
 <div className="p-4 bg-slate-800 text-white flex justify-between items-center shadow-md z-10 shrink-0">
 <div className="flex items-center gap-3">
 <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded font-bold border border-emerald-500/30">Live Preview</span>
 <span className="text-sm font-medium text-slate-300">A4 Document Format</span>
 </div>
 <button 
 onClick={downloadPdf} 
 disabled={isGenerating}
 className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
 >
 {isGenerating ? 'Generating...' : <><Download size={16} /> Download PDF</>}
 </button>
 </div>

 <div className="flex-1 overflow-auto custom-scrollbar bg-slate-100 flex justify-center pt-8">
 <div style={{ transform: 'scale(0.65)', transformOrigin: 'top center', height: '780px' }}>
 {/* A4 Page Container */}
 <div 
 ref={previewRef}
 className="shadow-2xl relative bg-white"
 style={{ width: '794px', minHeight: '1123px', padding: '0', color: '#000000' }}
 >
 {/* Top Purple Banner */}
 <div className="h-4 w-full"style={{ backgroundColor: '#8B5CF6' }}></div>

 <div className="px-12 py-10">
 {/* Header Section */}
 <div className="flex justify-between items-start mb-8">
 <div className="flex items-center gap-4">
 <img src="/tsc_logo.png"alt="Logo"className="w-16 h-16 rounded-xl object-contain shadow-sm border"style={{ borderColor: '#E5E7EB' }} />
 <div>
 <h1 className="text-2xl font-black tracking-tight flex items-center gap-1"style={{ color: '#000000' }}>
 the<span style={{ color: '#8B5CF6' }}>•</span>social circle
 </h1>
 <p className="text-[11px] tracking-wide mb-1"style={{ color: '#000000' }}>Turning visions into visuals</p>
 <div className="flex gap-3 text-[10px] font-medium"style={{ color: '#8B5CF6' }}>
 {agencyInsta && <span>Instagram: {agencyInsta}</span>}
 {agencyWebsite && <span style={{ color: '#000000' }}>|</span>}
 {agencyWebsite && <span>{agencyWebsite}</span>}
 </div>
 </div>
 </div>
 <div className="text-right">
 <h2 className="text-xl font-black tracking-widest uppercase mb-1"style={{ color: '#000000' }}>INVOICE</h2>
 <p className="text-lg font-bold mb-2"style={{ color: '#8B5CF6' }}>{invoiceNo}</p>
 <p className="text-xs font-medium"style={{ color: '#000000' }}>{agencyPhone}</p>
 <p className="text-xs font-medium"style={{ color: '#000000' }}>{agencyEmail}</p>
 </div>
 </div>

 {/* Purple Services Banner */}
 <div className="text-[11px] font-bold py-2.5 px-6 rounded-xl text-center shadow-md mb-8 tracking-widest uppercase"style={{ backgroundColor: '#8B5CF6', color: '#ffffff' }}>
 Media | Ads | Events | Photo/Videography | Content Creation | Brand Story | Page Handling
 </div>

 {/* Bill To & Dates Grid */}
 <div className="grid grid-cols-2 gap-6 mb-8">
 <div className="rounded-xl p-5 border"style={{ backgroundColor: '#F9FAFB', borderColor: '#F3F4F6' }}>
 <h3 className="text-[10px] font-black uppercase tracking-widest mb-3"style={{ color: '#000000' }}>BILL TO</h3>
 <p className="text-base font-bold mb-1"style={{ color: '#000000' }}>{clientName || 'Client Name'}</p>
 {contactPerson && <p className="text-xs font-medium mb-1"style={{ color: '#000000' }}>Attn: {contactPerson}</p>}
 <p className="text-xs whitespace-pre-wrap leading-relaxed"style={{ color: '#000000' }}>{clientAddress || 'Client Address'}</p>
 {clientPhone && <p className="text-xs mt-1"style={{ color: '#000000' }}>{clientPhone}</p>}
 </div>
 
 <div className="rounded-xl p-5 border flex flex-col justify-center"style={{ backgroundColor: '#F9FAFB', borderColor: '#F3F4F6' }}>
 <h3 className="text-[10px] font-black uppercase tracking-widest mb-3"style={{ color: '#000000' }}>DATES & TERMS</h3>
 <div className="grid grid-cols-2 gap-y-3 text-xs">
 <span className="font-medium"style={{ color: '#000000' }}>Issued:</span>
 <span className="font-bold text-right"style={{ color: '#000000' }}>{issueDate}</span>
 
 <span className="font-medium"style={{ color: '#000000' }}>Payment Terms:</span>
 <span className="font-bold text-right"style={{ color: '#000000' }}>{paymentTerms}</span>
 
 <span className="font-medium"style={{ color: '#000000' }}>Due Date:</span>
 <span className="font-bold text-right"style={{ color: '#000000' }}>{dueDate || 'On Receipt'}</span>
 
 <span className="font-medium"style={{ color: '#000000' }}>Supply:</span>
 <span className="font-bold text-right"style={{ color: '#000000' }}>{supplyPlace}</span>
 </div>
 </div>
 </div>

 {/* Package Tag */}
 {packageDesc && (
 <div className="inline-flex items-center gap-2 text-sm font-bold mb-5 px-3 py-1.5 rounded-lg border"style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', color: '#000000' }}>
 <span className="text-lg"style={{ color: '#8B5CF6' }}>#</span> {packageDesc}
 </div>
 )}

 {/* Table */}
 <div className="rounded-xl border overflow-hidden mb-8 shadow-sm"style={{ borderColor: '#E5E7EB' }}>
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="text-[10px] font-black uppercase tracking-widest border-b"style={{ backgroundColor: '#F9FAFB', color: '#000000', borderColor: '#E5E7EB' }}>
 <th className="px-4 py-3 text-center w-10">#</th>
 <th className="px-4 py-3">SERVICE</th>
 <th className="px-4 py-3">MONTH</th>
 <th className="px-4 py-3">SAC</th>
 <th className="px-4 py-3 text-right">QTY</th>
 <th className="px-4 py-3 text-right">RATE</th>
 <th className="px-4 py-3 text-right">GST%</th>
 <th className="px-4 py-3 text-right">AMOUNT</th>
 </tr>
 </thead>
 <tbody>
 {items.map((item, index) => (
 <tr key={item.id} className="border-b last:border-0 text-xs font-medium"style={{ borderColor: '#F3F4F6', color: '#000000' }}>
 <td className="px-4 py-4 text-center">{index + 1}</td>
 <td className="px-4 py-4 font-bold">{item.service || '-'}</td>
 <td className="px-4 py-4">{item.month || '-'}</td>
 <td className="px-4 py-4">{item.sac || '-'}</td>
 <td className="px-4 py-4 text-right">{item.qty}</td>
 <td className="px-4 py-4 text-right">£{Number(item.rate).toFixed(2)}</td>
 <td className="px-4 py-4 text-right">{item.gst}%</td>
 <td className="px-4 py-4 text-right font-bold">
 £{(item.qty * item.rate).toFixed(2)}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Totals & Signature */}
 <div className="flex justify-between items-start mt-12">
 {/* Notes & Bank Details (Optional) */}
 <div className="w-1/2 text-xs pr-8 leading-relaxed"style={{ color: '#000000' }}>
 <p className="font-bold mb-1">Payment Instructions:</p>
 <p>Please make all cheques payable to <strong>The Social Circle</strong>.</p>
 <p>Direct bank transfers can be made to the account provided below. If you have any questions concerning this invoice, contact {agencyEmail}.</p>
 <p className="mt-4 italic font-medium"style={{ color: '#000000' }}>Thank you for your business!</p>
 </div>

 {/* Calculations */}
 <div className="w-1/2 flex flex-col items-end">
 <div className="w-64 space-y-3 text-sm">
 <div className="flex justify-between font-medium"style={{ color: '#000000' }}>
 <span>Subtotal</span>
 <span>£{subtotal.toFixed(2)}</span>
 </div>
 {totalGst > 0 && (
 <div className="flex justify-between font-medium"style={{ color: '#000000' }}>
 <span>GST / VAT</span>
 <span>£{totalGst.toFixed(2)}</span>
 </div>
 )}
 <div className="flex justify-between font-black text-2xl pt-4 border-t mt-3"style={{ color: '#8B5CF6', borderColor: '#000000' }}>
 <span>TOTAL</span>
 <span style={{ color: '#8B5CF6' }}>£{total.toFixed(2)}</span>
 </div>
 </div>

 {/* Signature Box */}
 <div className="mt-16 text-center">
 <div className="signature-font text-5xl mb-1 inline-block -rotate-3 select-none"style={{ color: '#000000' }}>
 Shan
 </div>
 <div className="w-48 h-px mx-auto mb-2"style={{ backgroundColor: '#D1D5DB' }}></div>
 <p className="text-xs font-bold tracking-widest uppercase"style={{ color: '#000000' }}>Shan</p>
 <p className="text-[10px] font-medium tracking-wide"style={{ color: '#000000' }}>Administrator</p>
 </div>
 </div>
 </div>

 {/* Bottom Footer Info */}
 <div className="absolute bottom-0 left-0 right-0 p-8 border-t flex justify-between text-[10px] font-medium uppercase tracking-widest"style={{ borderColor: '#F3F4F6', color: '#000000' }}>
 <span>{agencyWebsite}</span>
 <span>{agencyEmail}</span>
 <span>{agencyPhone}</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
