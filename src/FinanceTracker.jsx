import React, { useState, useEffect } from 'react';

// 1. Accept the new cloud props from App.jsx
const FinanceTracker = ({ cloudFinance = {}, updateCloudData }) => {
  
  // Default accounts for new users
  const defaultAccounts = [
    { id: 'acc_1', name: 'Cash / Wallet', initialBalance: 0, isLocked: false },
    { id: 'acc_2', name: 'Bank Account', initialBalance: 0, isLocked: false }
  ];

  // 2. Initialize state with cloud data (fallback to defaults)
  const [accounts, setAccounts] = useState(cloudFinance.accounts || defaultAccounts);
  const [transactions, setTransactions] = useState(cloudFinance.transactions || []);

  // 3. Keep local state synced if cloud data changes
  useEffect(() => {
    if (cloudFinance.accounts) setAccounts(cloudFinance.accounts);
    if (cloudFinance.transactions) setTransactions(cloudFinance.transactions);
  }, [cloudFinance]);

  // --- UNIVERSAL CLOUD SAVE HELPER ---
  const saveToCloud = (updatedAccounts, updatedTransactions) => {
    setAccounts(updatedAccounts);
    setTransactions(updatedTransactions);
    updateCloudData('finance', { accounts: updatedAccounts, transactions: updatedTransactions });
  };

  const [editingTxId, setEditingTxId] = useState(null);
  const [type, setType] = useState('expense'); 
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // PDF Date Range Filters
  const [pdfStartDate, setPdfStartDate] = useState('');
  const [pdfEndDate, setPdfEndDate] = useState('');

  const lockedAccounts = accounts.filter(a => a.isLocked);
  
  useEffect(() => {
    if (!editingTxId) {
      if (lockedAccounts.length > 0) {
        if (!lockedAccounts.find(a => a.id === accountId)) setAccountId(lockedAccounts[0].id);
        if (type === 'transfer' && !lockedAccounts.find(a => a.id === toAccountId)) setToAccountId(lockedAccounts.length > 1 ? lockedAccounts[1].id : '');
      } else {
        setAccountId(''); setToAccountId('');
      }
    }
  }, [accounts, type, editingTxId, accountId, toAccountId, lockedAccounts]);

  // --- CORE LOGIC: Balance Calculations ---
  const getNetFlow = (accId, excludeTxId = null) => {
    const relevantTransactions = excludeTxId ? transactions.filter(t => t.id !== excludeTxId) : transactions;
    return relevantTransactions.reduce((total, t) => {
      if (t.type === 'income' && t.accountId === accId) return total + t.amount;
      if (t.type === 'expense' && t.accountId === accId) return total - t.amount;
      if (t.type === 'transfer') {
        if (t.accountId === accId) return total - t.amount; 
        if (t.toAccountId === accId) return total + t.amount; 
      }
      return total;
    }, 0);
  };

  const getCurrentBalance = (accId, excludeTxId = null) => {
    const acc = accounts.find(a => a.id === accId);
    if (!acc) return 0;
    return acc.initialBalance + getNetFlow(accId, excludeTxId);
  };

  // --- ACCOUNT MANAGEMENT ---
  const handleAccountChange = (id, field, value) => {
    const updatedAccounts = accounts.map(acc => acc.id === id ? { ...acc, [field]: field === 'initialBalance' ? Number(value) : value } : acc);
    saveToCloud(updatedAccounts, transactions);
  };

  const toggleLock = (id) => {
    let rejected = false;
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === id) {
        if (!acc.isLocked) {
          const netFlow = getNetFlow(acc.id);
          if (acc.initialBalance + netFlow < 0) {
            alert(`Lock Rejected!\n\nYour net transactions amount to ₹${netFlow}.\nSetting the initial balance to ₹${acc.initialBalance} would result in a negative balance (₹${acc.initialBalance + netFlow}).\n\nPlease enter an initial amount of at least ₹${Math.abs(netFlow)}.`);
            rejected = true;
            return acc; 
          }
          return { ...acc, isLocked: true };
        } else {
          return { ...acc, isLocked: false };
        }
      }
      return acc;
    });

    if (!rejected) saveToCloud(updatedAccounts, transactions);
  };

  const addAccount = () => {
    const updatedAccounts = [...accounts, { id: Date.now().toString(), name: 'New Account', initialBalance: 0, isLocked: false }];
    saveToCloud(updatedAccounts, transactions);
  };
  
  const deleteAccount = (id) => {
    const hasHistory = transactions.some(t => t.accountId === id || t.toAccountId === id);
    if (hasHistory) return alert("Cannot delete an account that has transaction history. Please delete its transactions first.");
    if (window.confirm("Delete this account?")) {
      const updatedAccounts = accounts.filter(a => a.id !== id);
      saveToCloud(updatedAccounts, transactions);
    }
  };

  // --- TRANSACTION MANAGEMENT ---
  const handleTransactionSubmit = (e) => {
    e.preventDefault();
    if (!accountId || !amount || !desc) return;
    const numAmount = Number(amount);

    if (type === 'transfer' && accountId === toAccountId) {
      return alert("Cannot transfer money to the same account.");
    }

    if (type === 'expense' || type === 'transfer') {
      const currentBal = getCurrentBalance(accountId, editingTxId);
      if (currentBal - numAmount < 0) {
        return alert(`Insufficient Funds! Proposed balance would be negative (Available: ₹${currentBal}).`);
      }
    }

    const newTx = {
      id: editingTxId || Date.now().toString(),
      type, accountId, toAccountId, amount: numAmount, desc, category, date
    };

    let updatedTransactions;
    if (editingTxId) {
      updatedTransactions = transactions.map(t => t.id === editingTxId ? newTx : t);
      setEditingTxId(null);
    } else {
      updatedTransactions = [newTx, ...transactions];
    }
    
    saveToCloud(accounts, updatedTransactions);
    
    setAmount(''); setDesc(''); setCategory('');
  };

  const editTransaction = (id) => {
    const t = transactions.find(x => x.id === id);
    if (!t) return;
    setEditingTxId(t.id); setType(t.type); setAccountId(t.accountId); setToAccountId(t.toAccountId || '');
    setAmount(t.amount.toString()); setDesc(t.desc); setCategory(t.category || ''); setDate(t.date);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingTxId(null); setAmount(''); setDesc(''); setCategory('');
  };

  const deleteTransaction = (id) => {
    if (window.confirm("Delete this transaction?")) {
      const updatedTransactions = transactions.filter(t => t.id !== id);
      saveToCloud(accounts, updatedTransactions);
    }
  };

  const exportPDF = () => window.print();

  const totalNetWorth = accounts.reduce((sum, acc) => sum + getCurrentBalance(acc.id), 0);

  // Filter transactions specifically for the PDF View
  const pdfFilteredTransactions = transactions.filter(t => {
    if (pdfStartDate && t.date < pdfStartDate) return false;
    if (pdfEndDate && t.date > pdfEndDate) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-10 relative">
      
      {/* --- HEADER --- */}
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Finance & Budget</h1>
          <p className="text-gray-400 text-sm mt-0.5">Lock accounts to enable tracking. Protected against negative balances.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          {/* PDF Date Filter Panel */}
          <div className="flex items-center bg-black rounded-xl border border-gray-800 p-1 flex-1 xl:flex-none overflow-hidden">
            <input 
              type="date" 
              title="Statement Start Date" 
              value={pdfStartDate} 
              onChange={e => setPdfStartDate(e.target.value)} 
              className="bg-transparent text-gray-300 text-xs px-2 py-2 outline-none [color-scheme:dark] border-r border-gray-800 w-full xl:w-auto" 
            />
            <input 
              type="date" 
              title="Statement End Date" 
              value={pdfEndDate} 
              onChange={e => setPdfEndDate(e.target.value)} 
              className="bg-transparent text-gray-300 text-xs px-2 py-2 outline-none [color-scheme:dark] mr-2 w-full xl:w-auto" 
            />
            <button onClick={exportPDF} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg> 
              Export PDF
            </button>
          </div>

          <div className="bg-emerald-900/20 border border-emerald-900/50 px-5 py-1.5 rounded-xl text-center shrink-0">
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-0.5">Net Worth</p>
            <p className="text-xl font-black text-white">₹{totalNetWorth}</p>
          </div>
        </div>
      </header>

      {/* --- ACCOUNTS SECTION --- */}
      <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg print:hidden">
        <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            Your Accounts
          </h2>
          <button onClick={addAccount} className="text-xs font-bold bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-colors">+ Add Account</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => (
            <div key={acc.id} className={`p-4 rounded-xl border transition-all ${acc.isLocked ? 'bg-black border-emerald-900/50 shadow-[0_0_10px_rgba(16,185,129,0.05)]' : 'bg-[#1a1a1a] border-gray-700 border-dashed'}`}>
              {!acc.isLocked ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg> Unlocked</span>
                    <button onClick={() => deleteAccount(acc.id)} className="text-gray-600 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                  <input type="text" value={acc.name} onChange={(e) => handleAccountChange(acc.id, 'name', e.target.value)} className="w-full bg-black border border-gray-700 text-white px-3 py-2 rounded focus:border-blue-500 outline-none text-sm font-bold" placeholder="Account Name" />
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Initial Balance (₹)</label>
                    <input type="number" value={acc.initialBalance} onChange={(e) => handleAccountChange(acc.id, 'initialBalance', e.target.value)} className="w-full bg-black border border-gray-700 text-white px-3 py-2 rounded focus:border-blue-500 outline-none text-sm" />
                  </div>
                  <button onClick={() => toggleLock(acc.id)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs transition-colors mt-2">Lock Account</button>
                </div>
              ) : (
                <div className="flex flex-col h-full justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-bold text-lg leading-tight">{acc.name}</h3>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Locked Initial: ₹{acc.initialBalance}</p>
                    </div>
                    <button onClick={() => toggleLock(acc.id)} title="Edit Initial Balance" className="text-gray-500 hover:text-white bg-gray-900 p-1.5 rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Current Balance</p>
                    <p className="text-3xl font-black text-white">₹{getCurrentBalance(acc.id)}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        
        {/* --- ADD / EDIT TRANSACTION FORM --- */}
        <div className="lg:col-span-1 bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg h-fit">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-800 pb-3">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg> 
            {editingTxId ? 'Edit Transaction' : 'Log Transaction'}
          </h2>

          {lockedAccounts.length === 0 ? (
            <div className="bg-red-900/10 border border-red-900/50 text-red-400 p-4 rounded-xl text-sm text-center">
              ⚠️ You must lock at least one account above before you can add transactions.
            </div>
          ) : (
            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              <div className="flex bg-black p-1 rounded-xl border border-gray-800">
                <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${type === 'expense' ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-gray-300'}`}>Expense</button>
                <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}>Income</button>
                <button type="button" onClick={() => setType('transfer')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${type === 'transfer' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>Transfer</button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">{type === 'transfer' ? 'From Account' : 'Account'} *</label>
                <select required value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none">
                  <option value="" disabled>Select Account</option>
                  {lockedAccounts.map(a => <option key={a.id} value={a.id}>{a.name} (₹{getCurrentBalance(a.id, editingTxId)})</option>)}
                </select>
              </div>

              {type === 'transfer' && (
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">To Account *</label>
                  <select required value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none">
                    <option value="" disabled>Select Destination</option>
                    {lockedAccounts.filter(a => a.id !== accountId).map(a => <option key={a.id} value={a.id}>{a.name} (₹{getCurrentBalance(a.id, editingTxId)})</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Amount (₹) *</label>
                  <input type="number" required min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Date *</label>
                  <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none [color-scheme:dark]" />
                </div>
              </div>

              {type === 'expense' && (
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Category</label>
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Food, Transport..." className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none" />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Description *</label>
                <input type="text" required value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g., Campus Canteen" className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className={`flex-1 font-bold py-3 rounded-xl shadow-lg transition-colors text-sm text-white ${type === 'expense' ? 'bg-red-600 hover:bg-red-500' : type === 'income' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
                  {editingTxId ? 'Update' : `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                </button>
                {editingTxId && (
                  <button type="button" onClick={cancelEdit} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* --- TRANSACTION HISTORY --- */}
        <div className="lg:col-span-2 bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg flex flex-col max-h-[600px]">
          <h2 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-3">Transaction Ledger</h2>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
            {transactions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No transactions logged yet.</p>
            ) : (
              transactions.map(t => {
                const accName = accounts.find(a => a.id === t.accountId)?.name || 'Deleted Account';
                const toAccName = t.type === 'transfer' ? (accounts.find(a => a.id === t.toAccountId)?.name || 'Deleted Account') : '';
                
                return (
                  <div key={t.id} className="flex justify-between items-center p-4 bg-black border border-gray-800 rounded-xl hover:border-gray-600 transition-colors">
                    <div className="flex gap-4 items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.type === 'expense' ? 'bg-red-900/20 text-red-500' : t.type === 'income' ? 'bg-emerald-900/20 text-emerald-500' : 'bg-blue-900/20 text-blue-500'}`}>
                        {t.type === 'expense' ? '↓' : t.type === 'income' ? '↑' : '⇄'}
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm leading-tight">{t.desc}</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {t.date} • {t.type === 'transfer' ? `${accName} ➡️ ${toAccName}` : accName} {t.type === 'expense' && t.category && `• ${t.category}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`font-black text-lg mr-2 ${t.type === 'expense' ? 'text-red-400' : t.type === 'income' ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}₹{t.amount}
                      </span>
                      <button onClick={() => editTransaction(t.id)} title="Edit Transaction" className="text-gray-500 hover:text-white bg-gray-900 p-2 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => deleteTransaction(t.id)} title="Delete Transaction" className="text-gray-500 hover:text-red-500 bg-gray-900 p-2 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* --- HIDDEN PRINT VIEW (PDF GENERATOR) --- */}
      <div className="hidden print:block absolute inset-0 bg-white z-50 p-10 text-black min-h-screen">
        <div className="border-b-4 border-black pb-6 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight">Financial Statement</h1>
            <p className="text-gray-600 font-medium mt-2">
              {pdfStartDate || pdfEndDate 
                ? `Statement Period: ${pdfStartDate || 'Beginning'} to ${pdfEndDate || 'Present'}` 
                : `Generated on: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Total Net Worth</p>
            <p className="text-3xl font-black">₹{totalNetWorth}</p>
          </div>
        </div>

        <h2 className="text-xl font-bold bg-gray-100 border-l-4 border-black pl-3 py-2 mb-4">Account Balances</h2>
        <table className="w-full text-left border-collapse mb-10">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-3 px-2 text-sm uppercase tracking-widest text-gray-600">Account Name</th>
              <th className="py-3 px-2 text-sm uppercase tracking-widest text-gray-600 text-right">Current Balance</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(acc => (
              <tr key={acc.id} className="border-b border-gray-200">
                <td className="py-3 px-2 font-bold text-gray-800">{acc.name}</td>
                <td className="py-3 px-2 font-black text-right text-lg">₹{getCurrentBalance(acc.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="text-xl font-bold bg-gray-100 border-l-4 border-black pl-3 py-2 mb-4">Transaction History</h2>
        {pdfFilteredTransactions.length === 0 ? (
          <p className="text-gray-500 italic text-lg">No transaction history available for this period.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-3 px-2 text-sm uppercase tracking-widest text-gray-600 w-24">Date</th>
                <th className="py-3 px-2 text-sm uppercase tracking-widest text-gray-600 w-24">Type</th>
                <th className="py-3 px-2 text-sm uppercase tracking-widest text-gray-600">Description / Category</th>
                <th className="py-3 px-2 text-sm uppercase tracking-widest text-gray-600">Account</th>
                <th className="py-3 px-2 text-sm uppercase tracking-widest text-gray-600 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {pdfFilteredTransactions.map(t => {
                const accName = accounts.find(a => a.id === t.accountId)?.name || 'Deleted Account';
                const toAccName = t.type === 'transfer' ? (accounts.find(a => a.id === t.toAccountId)?.name || 'Deleted Account') : '';
                return (
                  <tr key={t.id} className="border-b border-gray-200 break-inside-avoid">
                    <td className="py-3 px-2 text-gray-600 whitespace-nowrap">{t.date}</td>
                    <td className="py-3 px-2 font-bold uppercase text-xs text-gray-500">{t.type}</td>
                    <td className="py-3 px-2">
                      <span className="font-bold text-black block">{t.desc}</span>
                      {t.category && <span className="text-sm text-gray-500">{t.category}</span>}
                    </td>
                    <td className="py-3 px-2 text-gray-800 text-sm">{t.type === 'transfer' ? `${accName} -> ${toAccName}` : accName}</td>
                    <td className={`py-3 px-2 font-black text-right whitespace-nowrap ${t.type === 'expense' ? 'text-gray-800' : 'text-black'}`}>
                      {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}₹{t.amount}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default FinanceTracker;