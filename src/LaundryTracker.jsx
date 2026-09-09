import React, { useState, useEffect } from 'react';
import { useLocalStorageSync } from './useLocalStorageSync'; 

const LaundryTracker = ({ cloudLaundry = {}, updateCloudData }) => {
  
  const defaultItems = [
    { id: 1, name: 'T-Shirts', price: 10, count: 0 },
    { id: 2, name: 'Jeans', price: 20, count: 0 },
    { id: 3, name: 'Trackpants', price: 15, count: 0 },
    { id: 4, name: 'Shorts', price: 10, count: 0 },
    { id: 5, name: 'Hoodies', price: 30, count: 0 },
    { id: 6, name: 'Underwear', price: 5, count: 0 },
    { id: 7, name: 'Handkerchief', price: 5, count: 0 },
    { id: 8, name: 'Bed Sheets', price: 40, count: 0 },
  ];

  const [items, setItems] = useLocalStorageSync('laundryItemsData', cloudLaundry.items || []);
  const [activeBills, setActiveBills] = useLocalStorageSync('laundryBillsData', cloudLaundry.activeBills || []);

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [laundryName, setLaundryName] = useState('Campus Hostel Laundry'); 

  useEffect(() => {
    if (cloudLaundry && cloudLaundry.items) setItems(cloudLaundry.items); 
    if (cloudLaundry && cloudLaundry.activeBills) setActiveBills(cloudLaundry.activeBills);
  }, [cloudLaundry, setItems, setActiveBills]);

  useEffect(() => {
    if (cloudLaundry.totalDue > 0 && (!cloudLaundry.activeBills || cloudLaundry.activeBills.length === 0)) {
      const legacyBill = {
        id: 'legacy-' + Date.now(),
        receiptNumber: 'LEGACY', // Auto-assign receipt number
        laundryName: 'Previous Pending Balance',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        items: [{ name: 'Legacy Wash Items', price: cloudLaundry.totalDue, count: 1 }],
        totalAmount: cloudLaundry.totalDue,
        totalClothes: '-',
        isPaid: false
      };
      setActiveBills([legacyBill]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeItems = Array.isArray(items) && items.length > 0 ? items : defaultItems;
  const safeActiveBills = Array.isArray(activeBills) ? activeBills : [];
  
  const totalOutstanding = safeActiveBills.filter(b => !b.isPaid).reduce((sum, b) => sum + b.totalAmount, 0);

  const saveToCloud = (newItems, newBills) => {
    setItems(newItems);
    setActiveBills(newBills);
    if (updateCloudData) updateCloudData('laundry', { items: newItems, activeBills: newBills, totalDue: totalOutstanding });
  };

  const updateCount = (id, delta) => {
    const newItems = safeItems.map(item => {
      if (item.id === id) {
        const newCount = item.count + delta;
        return { ...item, count: newCount >= 0 ? newCount : 0 };
      }
      return item;
    });
    saveToCloud(newItems, safeActiveBills);
  };

  const updatePrice = (id, newBasePrice) => {
    const newItems = safeItems.map(item => 
      item.id === id ? { ...item, price: newBasePrice >= 0 ? newBasePrice : 0 } : item
    );
    saveToCloud(newItems, safeActiveBills);
  };

  const deleteItem = (id) => {
    const newItems = safeItems.filter(item => item.id !== id);
    saveToCloud(newItems, safeActiveBills);
  };

  const addNewItem = (e) => {
    e.preventDefault();
    if (!newName || !newPrice) return;
    const newItem = { id: Date.now(), name: newName, price: Number(newPrice), count: 0 };
    const newItems = [...safeItems, newItem];
    saveToCloud(newItems, safeActiveBills);
    setNewName(''); setNewPrice('');
  };

  const currentBatchTotal = safeItems.reduce((sum, item) => sum + (item.price * item.count), 0);
  const currentBatchCount = safeItems.reduce((sum, item) => sum + item.count, 0); 

  const sendToLaundry = () => {
    if (currentBatchTotal === 0 || !laundryName) return;
    
    const washedItems = safeItems.filter(item => item.count > 0).map(item => ({ ...item }));
    const newId = Date.now();
    
    const newBill = {
      id: newId,
      receiptNumber: newId.toString().slice(-6), // Save the 6-digit ID explicitly
      laundryName: laundryName,
      date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      items: washedItems,
      totalAmount: currentBatchTotal,
      totalClothes: currentBatchCount,
      isPaid: false
    };

    const newBills = [newBill, ...safeActiveBills];
    const newItems = safeItems.map(item => ({ ...item, count: 0 })); 
    
    saveToCloud(newItems, newBills);
  };

  const markBillAsPaid = (billId) => {
    const newBills = safeActiveBills.map(b => b.id === billId ? { ...b, isPaid: true } : b);
    saveToCloud(safeItems, newBills);
  };

  const collectLaundry = (billId) => {
    const newBills = safeActiveBills.filter(b => b.id !== billId);
    saveToCloud(safeItems, newBills);
  };

  // --- NEW: EDIT RECEIPT NUMBER LOGIC ---
  const updateReceiptNumber = (billId, newReceiptNumber) => {
    const newBills = safeActiveBills.map(b => b.id === billId ? { ...b, receiptNumber: newReceiptNumber } : b);
    saveToCloud(safeItems, newBills);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500 min-h-[75vh]">
      
      {/* LEFT PANE: CURRENT BAG / ADD ITEMS */}
      <div className="bg-[#121212] rounded-xl p-6 shadow-lg border border-gray-800 flex flex-col h-[75vh]">
        <div className="flex justify-between items-start mb-6 shrink-0">
          <div>
            <h3 className="text-white font-bold text-xl flex items-center gap-2">
              <svg className="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              Washer Bag
            </h3>
            <p className="text-sm text-gray-400 mt-1">Add items to calculate batch cost</p>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 text-right shadow-inner min-w-[120px]">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total Dues</p>
            <p className="text-2xl font-black text-red-500">₹{totalOutstanding}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-4 custom-scrollbar">
          {safeItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between bg-black p-3 rounded-xl border border-gray-800 group transition-colors hover:border-gray-700">
              <div>
                <p className="text-white text-sm font-bold">{item.name}</p>
                <div className="flex items-center space-x-1 mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-gray-500">₹</span>
                  <input 
                    type="number" 
                    value={item.price}
                    onChange={(e) => updatePrice(item.id, Number(e.target.value))}
                    className="bg-transparent border-b border-gray-700 text-xs text-gray-400 w-10 focus:outline-none focus:border-sky-500 text-center transition-colors"
                  />
                  <span className="text-[10px] uppercase font-bold text-gray-600 tracking-wider">/ piece</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`flex items-center space-x-2 rounded-lg border p-1 transition-colors ${item.count > 0 ? 'bg-sky-900/10 border-sky-900/50' : 'bg-[#1a1a1a] border-gray-700'}`}>
                  <button onClick={() => updateCount(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded font-bold text-lg transition-colors">-</button>
                  <span className={`w-6 text-center text-sm font-bold ${item.count > 0 ? 'text-sky-400' : 'text-gray-500'}`}>{item.count}</span>
                  <button onClick={() => updateCount(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded font-bold text-lg transition-colors">+</button>
                </div>
                <button onClick={() => deleteItem(item.id)} className="text-gray-600 hover:text-red-500 transition-colors p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={addNewItem} className="flex space-x-3 mb-4 border-t border-gray-800 pt-5 shrink-0">
          <input type="text" placeholder="New cloth type..." value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1 bg-black border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors" />
          <input type="number" placeholder="₹ Price" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-24 bg-black border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors" />
          <button type="submit" className="bg-gray-800 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-gray-700 border border-gray-700 transition-colors">+</button>
        </form>

        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-700 mt-auto shrink-0 flex flex-col gap-3">
          <input type="text" value={laundryName} onChange={e => setLaundryName(e.target.value)} placeholder="Laundry Vendor Name" className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-sky-500 transition-colors" />
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Clothes</p>
                <p className="text-xl font-black text-white">{currentBatchCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Batch Cost</p>
                <p className="text-xl font-black text-sky-400">₹{currentBatchTotal}</p>
              </div>
            </div>
            <button onClick={sendToLaundry} disabled={currentBatchTotal === 0} className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg text-sm ${currentBatchTotal === 0 ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' : 'bg-sky-600 text-white hover:bg-sky-500 shadow-sky-900/50'}`}>
              Send to Wash ↗
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: ACTIVE BILLS & RECEIPTS */}
      <div className="bg-[#121212] rounded-xl p-6 shadow-lg border border-gray-800 flex flex-col h-[75vh]">
        <h3 className="text-white font-bold text-xl flex items-center gap-2 mb-6 shrink-0 border-b border-gray-800 pb-4">
          <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Active Bills
        </h3>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
          {safeActiveBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              <p className="font-medium">No active laundry batches.</p>
            </div>
          ) : (
            safeActiveBills.map(bill => (
              <div key={bill.id} className={`bg-black border-2 border-dashed p-5 rounded-2xl relative transition-colors ${bill.isPaid ? 'border-gray-800' : 'border-gray-600 shadow-md'}`}>
                
                <div className="absolute -left-3 top-1/2 w-6 h-6 bg-[#121212] rounded-full transform -translate-y-1/2 border-r-2 border-dashed border-gray-800 hidden sm:block"></div>
                <div className="absolute -right-3 top-1/2 w-6 h-6 bg-[#121212] rounded-full transform -translate-y-1/2 border-l-2 border-dashed border-gray-800 hidden sm:block"></div>

                <div className="flex justify-between border-b border-dashed border-gray-700 pb-3 mb-4">
                  <div>
                    <h4 className="text-white font-black tracking-wide">{bill.laundryName}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">{bill.date}</p>
                  </div>
                  
                  {/* --- UPDATED: EDITABLE RECEIPT NUMBER --- */}
                  <div className="flex items-center bg-gray-900 rounded border border-gray-800 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 overflow-hidden transition-colors h-fit">
                    <span className="text-[10px] font-mono text-gray-600 py-1 pl-2 select-none">#</span>
                    <input 
                      type="text" 
                      value={bill.receiptNumber || bill.id.toString().slice(-6)} 
                      onChange={(e) => updateReceiptNumber(bill.id, e.target.value)}
                      title="Edit Receipt Number"
                      className="text-[10px] font-mono text-gray-400 bg-transparent py-1 pr-2 border-none focus:outline-none w-16 transition-colors hover:text-white focus:text-sky-400"
                    />
                  </div>
                </div>

                <table className="w-full text-xs text-gray-400 mb-4">
                  <thead>
                    <tr className="border-b border-gray-800 text-left">
                      <th className="pb-2 font-bold uppercase tracking-wider">Type</th>
                      <th className="pb-2 text-center font-bold uppercase tracking-wider">Qty</th>
                      <th className="pb-2 text-center font-bold uppercase tracking-wider">Price</th>
                      <th className="pb-2 text-right font-bold uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-800/50">
                        <td className="py-2 text-gray-300 font-medium">{item.name}</td>
                        <td className="py-2 text-center">{item.count}</td>
                        <td className="py-2 text-center text-gray-500">₹{item.price}</td>
                        <td className="py-2 text-right text-gray-200">₹{item.price * item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-between items-center border-t border-dashed border-gray-700 pt-4 mb-5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Items</span>
                    <span className="text-sm font-bold text-gray-300">{bill.totalClothes}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Grand Total</span>
                    <span className={`text-xl font-black ${bill.isPaid ? 'text-gray-500' : 'text-sky-400'}`}>₹{bill.totalAmount}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  {bill.isPaid ? (
                    <span className="flex-1 bg-emerald-900/10 text-emerald-500 border border-emerald-900/30 py-2.5 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> Paid
                    </span>
                  ) : (
                    <button onClick={() => markBillAsPaid(bill.id)} className="flex-1 bg-gray-800 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 text-gray-300 border border-gray-700 py-2.5 rounded-xl text-xs font-bold transition-colors">
                      Mark as Paid
                    </button>
                  )}

                  <button
                    onClick={() => collectLaundry(bill.id)}
                    disabled={!bill.isPaid}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors border ${bill.isPaid ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'bg-gray-900 text-gray-700 border-gray-800 cursor-not-allowed'}`}
                  >
                    Collect Clothes
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default LaundryTracker;