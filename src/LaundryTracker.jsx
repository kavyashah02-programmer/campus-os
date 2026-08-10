import React, { useState } from 'react';

const LaundryTracker = () => {
  const [items, setItems] = useState([
    { id: 1, name: 'T-Shirts', price: 10, count: 0 },
    { id: 2, name: 'Jeans', price: 20, count: 0 },
    { id: 3, name: 'Trackpants', price: 15, count: 0 },
    { id: 4, name: 'Shorts', price: 10, count: 0 },
    { id: 5, name: 'Hoodies', price: 30, count: 0 },
    { id: 6, name: 'Underwear', price: 5, count: 0 },
    { id: 7, name: 'Handkerchief', price: 5, count: 0 },
    { id: 8, name: 'Bed Sheets', price: 40, count: 0 },
  ]);

  const [totalDue, setTotalDue] = useState(0);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const updateCount = (id, delta) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newCount = item.count + delta;
        return { ...item, count: newCount >= 0 ? newCount : 0 };
      }
      return item;
    }));
  };

  const updatePrice = (id, newBasePrice) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, price: newBasePrice >= 0 ? newBasePrice : 0 } : item
    ));
  };

  // NEW FUNCTION: Deletes an item from the list entirely
  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addNewItem = (e) => {
    e.preventDefault();
    if (!newName || !newPrice) return;
    const newItem = { id: Date.now(), name: newName, price: Number(newPrice), count: 0 };
    setItems([...items, newItem]);
    setNewName('');
    setNewPrice('');
  };

  const currentBatchTotal = items.reduce((sum, item) => sum + (item.price * item.count), 0);

  const sendToLaundry = () => {
    if (currentBatchTotal === 0) return;
    setTotalDue(totalDue + currentBatchTotal);
    setItems(items.map(item => ({ ...item, count: 0 })));
  };

  const payBill = () => setTotalDue(0);

  return (
    <div className="bg-[#121212] rounded-xl p-6 shadow-lg border border-gray-700 w-full flex flex-col h-[650px]">
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-white font-bold text-xl">Current Wash Batch</h3>
          <p className="text-sm text-gray-300 mt-1">Add items to calculate the cost</p>
        </div>
        <div className="bg-[#1a1a1a] border border-gray-600 rounded-lg p-3 text-right shadow-inner min-w-[120px]">
          <p className="text-xs text-gray-300 uppercase tracking-wider font-semibold">Total Pending</p>
          <p className="text-2xl font-bold text-red-500">₹{totalDue}</p>
          {totalDue > 0 && (
            <button onClick={payBill} className="text-xs text-green-400 hover:text-green-300 mt-2 font-bold underline decoration-2 underline-offset-2">
              Mark as Paid
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-4 custom-scrollbar">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-lg border border-gray-700 group">
            <div>
              <p className="text-white text-base font-semibold">{item.name}</p>
              <div className="flex items-center space-x-1 mt-1">
                <span className="text-sm text-gray-400">₹</span>
                <input 
                  type="number" 
                  value={item.price}
                  onChange={(e) => updatePrice(item.id, Number(e.target.value))}
                  className="bg-transparent border-b border-gray-600 text-sm text-gray-300 w-12 focus:outline-none focus:border-green-500 text-center"
                />
                <span className="text-sm text-gray-400">/ piece</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Quantity Controls */}
              <div className="flex items-center space-x-3 bg-black rounded-md border border-gray-600 p-1">
                <button onClick={() => updateCount(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-800 rounded font-bold text-lg transition-colors">-</button>
                <span className="text-white w-6 text-center text-base font-bold">{item.count}</span>
                <button onClick={() => updateCount(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-800 rounded font-bold text-lg transition-colors">+</button>
              </div>

              {/* NEW: Delete Button */}
              <button 
                onClick={() => deleteItem(item.id)} 
                title="Remove item"
                className="text-gray-500 hover:text-red-500 transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={addNewItem} className="flex space-x-3 mb-4 border-t border-gray-700 pt-5">
        <input type="text" placeholder="New item..." value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1 bg-black border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors" />
        <input type="number" placeholder="₹ Price" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-24 bg-black border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors" />
        <button type="submit" className="bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">Add</button>
      </form>

      <div className="flex items-center justify-between bg-black p-4 rounded-lg border border-gray-700 mt-auto">
        <div>
          <p className="text-sm text-gray-400 font-semibold">Current Batch Cost</p>
          <p className="text-xl font-bold text-green-400">₹{currentBatchTotal}</p>
        </div>
        <button onClick={sendToLaundry} disabled={currentBatchTotal === 0} className={`px-6 py-2 rounded-lg font-bold transition-all ${currentBatchTotal === 0 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-green-500 text-black hover:bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]'}`}>
          Send to Wash
        </button>
      </div>

    </div>
  );
};

export default LaundryTracker;