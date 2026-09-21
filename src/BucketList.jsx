import React, { useState, useEffect } from 'react';
import { useLocalStorageSync } from './useLocalStorageSync'; 

const BucketList = ({ cloudBucketList = [], updateCloudData }) => {
  const [items, setItems] = useLocalStorageSync('bucketListData', cloudBucketList);

  useEffect(() => {
    if (cloudBucketList) {
      setItems(cloudBucketList); 
    }
  }, [cloudBucketList, setItems]);

  const safeItems = Array.isArray(items) ? items : [];

  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [place, setPlace] = useState('');
  const [thingsToBring, setThingsToBring] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('#ec4899'); // Pink default
  const [image, setImage] = useState(null);

  const generateId = () => Date.now().toString() + Math.random().toString(36).slice(2, 9);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 700 * 1024) {
        alert("For cloud syncing, please select an image under 700KB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => setImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!title) return;

    let updatedItems = [...safeItems];

    if (editingId) {
      const index = updatedItems.findIndex(x => x.id === editingId);
      if (index > -1) {
        updatedItems[index] = {
          ...updatedItems[index],
          title, place, thingsToBring, desc, category, color, image
        };
      }
      setEditingId(null);
    } else {
      const newItem = {
        id: generateId(),
        createdAt: Date.now(),
        title, place, thingsToBring, desc, category, color, image,
        completed: false
      };
      updatedItems.push(newItem);
    }
    
    setItems(updatedItems);
    if (updateCloudData) updateCloudData('bucketList', updatedItems);
    
    cancelEdit();
  };

  const handleEdit = (id) => {
    const t = safeItems.find(x => x.id === id);
    if (!t) return;
    
    setEditingId(t.id);
    setTitle(t.title || ''); 
    setPlace(t.place || ''); 
    setThingsToBring(t.thingsToBring || ''); 
    setDesc(t.desc || ''); 
    setCategory(t.category || '');
    setColor(t.color || '#ec4899'); 
    setImage(t.image || null);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleComplete = (id) => {
    const updatedItems = safeItems.map(item => {
      if (item.id === id) return { ...item, completed: !item.completed, completedAt: !item.completed ? Date.now() : null };
      return item;
    });
    setItems(updatedItems);
    if (updateCloudData) updateCloudData('bucketList', updatedItems);
  };

  const deleteItem = (id) => {
    if (window.confirm(`Are you sure you want to delete this from your bucket list?`)) {
      const updatedItems = safeItems.filter(x => x.id !== id);
      setItems(updatedItems);
      if (updateCloudData) updateCloudData('bucketList', updatedItems);
    }
  };

  const cancelEdit = () => {
    setEditingId(null); setTitle(''); setDesc(''); setImage(null); setThingsToBring(''); setPlace(''); setCategory(''); setColor('#ec4899');
  };

  const activeItems = safeItems.filter(item => !item.completed).sort((a, b) => b.createdAt - a.createdAt);
  const completedItems = safeItems.filter(item => item.completed).sort((a, b) => b.completedAt - a.completedAt);

  const renderCard = (item) => (
    <div 
      key={item.id} 
      className={`p-5 rounded-xl border transition-all flex flex-col gap-3 ${item.completed ? 'bg-[#1a1a1a] border-gray-800 opacity-60' : 'bg-black border-gray-700 shadow-md'}`} 
      style={{ borderLeftWidth: '4px', borderLeftColor: item.completed ? '#374151' : item.color }}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4 w-full">
          <input 
            type="checkbox" 
            checked={item.completed} 
            onChange={() => toggleComplete(item.id)} 
            className="mt-1.5 w-5 h-5 accent-pink-500 cursor-pointer shrink-0" 
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h4 className={`text-lg font-bold ${item.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                {item.title}
              </h4>
              {item.category && (
                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider" style={{ backgroundColor: `${item.color}20`, color: item.color, border: `1px solid ${item.color}40` }}>
                  {item.category}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {item.place && <span className="text-[10px] text-gray-300 bg-gray-800 px-2 py-1 rounded border border-gray-700">📍 {item.place}</span>}
              {item.thingsToBring && <span className="text-[10px] text-gray-300 bg-gray-800 px-2 py-1 rounded border border-gray-700">🎒 {item.thingsToBring}</span>}
            </div>
            
            {item.desc && (
              <p className="text-sm text-gray-400 mt-3 bg-gray-900/50 p-3 rounded-lg border border-gray-800 leading-relaxed">
                {item.desc}
              </p>
            )}
            
            {item.image && (
              <div className="mt-3 relative overflow-hidden rounded-lg border border-gray-700 inline-block">
                <img src={item.image} alt="Bucket List Attachment" className={`max-h-48 object-cover transition-transform duration-300 ${item.completed ? 'grayscale opacity-70' : 'hover:scale-105'}`} />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex shrink-0 gap-3 ml-4">
          <button onClick={() => handleEdit(item.id)} className="text-gray-500 hover:text-white transition-colors bg-gray-900 p-2 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
          <button onClick={() => deleteItem(item.id)} className="text-gray-500 hover:text-red-400 transition-colors bg-gray-900 p-2 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-10">
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Bucket List</h1>
          <p className="text-gray-400 text-sm mt-0.5">Track your goals, adventures, and things to do with no pressure.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* LEFT COLUMN: Form */}
        <div className="lg:col-span-1 bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg h-fit">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-800 pb-3">
            <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg> 
            {editingId ? 'Edit Experience' : 'Add New Experience'}
          </h2>
          
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Title *</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-pink-500 outline-none transition-colors" placeholder="e.g., Skydiving, Watch Inception..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Location / Place</label>
                <input type="text" value={place} onChange={(e) => setPlace(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-pink-500 outline-none transition-colors" placeholder="e.g., Interlaken" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Things to Bring</label>
                <input type="text" value={thingsToBring} onChange={(e) => setThingsToBring(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-pink-500 outline-none transition-colors" placeholder="e.g., Camera, Friends" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Description</label>
              <textarea rows="3" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-pink-500 outline-none resize-none transition-colors custom-scrollbar" placeholder="Details, links, or notes..."></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Category</label>
                <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-pink-500 outline-none transition-colors" placeholder="e.g., Travel, Movies, Career..." />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Color Code</label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-[46px] bg-black border border-gray-700 rounded-xl px-1 py-1 cursor-pointer transition-colors" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Attach Image</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-gray-800 file:text-white cursor-pointer hover:file:bg-gray-700 transition-colors" />
              {image && (
                <div className="mt-3 relative inline-block">
                  <img src={image} alt="Preview" className="h-24 rounded-lg border border-gray-700 object-cover" />
                  <button type="button" onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-500">×</button>
                </div>
              )}
            </div>

            <div className="pt-4 flex gap-3">
              <button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-500 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(219,39,119,0.4)] transition-colors text-sm">
                {editingId ? 'Update Item' : 'Save to Bucket List'}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="flex-1 bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors text-sm hover:bg-gray-600">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Display Lists */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          
          <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg">
            <h2 className="text-lg font-bold text-white mb-6 border-b border-gray-800 pb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Upcoming Adventures
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
              {activeItems.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8 bg-black rounded-xl border border-gray-800 border-dashed">
                  Your bucket list is empty. Dream big and add something!
                </p>
              ) : (
                activeItems.map(renderCard)
              )}
            </div>
          </div>

          {completedItems.length > 0 && (
            <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg opacity-80 hover:opacity-100 transition-opacity">
              <h2 className="text-lg font-bold text-gray-400 mb-6 border-b border-gray-800 pb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                Completed Experiences
              </h2>
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {completedItems.map(renderCard)}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BucketList;