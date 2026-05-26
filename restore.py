import sys

file_path = r'c:\Users\Kshitiz\.gemini\antigravity\scratch\auto-tasker\frontend\src\components\CrmDashboard.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the start of the logo block
keep_lines = []
for line in lines:
    keep_lines.append(line)
    if 'src={logoBase64}' in line and 'alt={companyName}' in line:
        break

remainder = """  ) : (
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
  await fetch(`http://localhost:3001/api/invoices/${paymentInvoice.id}/payments`, {
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
"""

new_content = "".join(keep_lines) + remainder

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("File restored successfully")
