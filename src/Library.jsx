import React, { useState, useEffect } from 'react';

// --- IndexedDB Setup for Large File Storage (Stored Locally on Device) ---
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DigitalLibraryDB', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveFileDB = async (fileObj) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').put(fileObj);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const getFilesDB = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly');
    const req = tx.objectStore('files').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const deleteFileDB = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// --- Library Component ---
const Library = ({ cloudLibrary = {}, updateCloudData }) => {
  const defaultCategories = ['Notes', 'PPTs', 'Mind Maps', 'Shortcuts', 'Short Notes'];
  
  // Folders sync to the Cloud
  const [folders, setFolders] = useState(cloudLibrary.folders || []);
  
  useEffect(() => {
    if (cloudLibrary.folders) setFolders(cloudLibrary.folders);
  }, [cloudLibrary.folders]);

  const saveFoldersToCloud = (newFolders) => {
    setFolders(newFolders);
    if (updateCloudData) {
      updateCloudData('library', { folders: newFolders });
    }
  };
  
  // Files start empty and load asynchronously from local IndexedDB
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState([{ id: 'root', name: 'My Library', level: 0 }]);
  const [newItemName, setNewItemName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Load local files on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const storedFiles = await getFilesDB();
        setFiles(storedFiles);
      } catch (err) {
        console.error("Failed to load files from IndexedDB", err);
      }
    };
    loadFiles();
  }, []);

  const currentFolder = currentPath[currentPath.length - 1];

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    
    const newFolder = { id: Date.now().toString(), parentId: currentFolder.id, name: newItemName.trim(), level: currentFolder.level + 1 };
    let newFolders = [...folders, newFolder];

    if (newFolder.level === 1) {
      const categoryFolders = defaultCategories.map((cat, idx) => ({
        id: `cat_${newFolder.id}_${idx}`, parentId: newFolder.id, name: cat, level: 2
      }));
      newFolders = [...newFolders, ...categoryFolders];
    }

    saveFoldersToCloud(newFolders);
    setNewItemName('');
  };

  const handleFileUpload = async (e) => {
    const fileList = Array.from(e.target.files);
    if (fileList.length === 0) return;
    
    setIsUploading(true);
    const newFiles = [];

    // FILE SIZE LIMIT: 512 MB 
    const MAX_FILE_SIZE_MB = 512;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

    for (const f of fileList) {
      if (f.size > MAX_FILE_SIZE_BYTES) {
        alert(`Warning: "${f.name}" is over ${MAX_FILE_SIZE_MB}MB and was skipped.`);
        continue;
      }
      
      const fileRecord = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        folderId: currentFolder.id,
        name: f.name,
        type: f.type,
        size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
        date: new Date().toLocaleDateString(),
        blob: f // Stores the native File/Blob object in local IndexedDB
      };
      
      await saveFileDB(fileRecord);
      newFiles.push(fileRecord);
    }

    setFiles(prev => [...prev, ...newFiles]);
    setIsUploading(false);
  };

  const deleteFolder = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this folder and ALL its contents?")) {
      let idsToDelete = [id];
      let foundNew = true;
      while (foundNew) {
        foundNew = false;
        folders.forEach(f => {
          if (idsToDelete.includes(f.parentId) && !idsToDelete.includes(f.id)) { idsToDelete.push(f.id); foundNew = true; }
        });
      }
      
      const updatedFolders = folders.filter(f => !idsToDelete.includes(f.id));
      saveFoldersToCloud(updatedFolders);
      
      const filesToDelete = files.filter(f => idsToDelete.includes(f.folderId));
      for (const f of filesToDelete) {
        await deleteFileDB(f.id);
      }
      setFiles(files.filter(f => !idsToDelete.includes(f.folderId)));
    }
  };

  const deleteFile = async (id) => { 
    if (window.confirm("Delete this file?")) {
      await deleteFileDB(id);
      setFiles(files.filter(f => f.id !== id));
    }
  };

  // --- View & Download Logic ---
  const viewFile = (fileRecord) => {
    const url = URL.createObjectURL(fileRecord.blob);
    window.open(url, '_blank');
  };

  const downloadFile = (fileRecord, e) => {
    e.stopPropagation(); 
    const url = URL.createObjectURL(fileRecord.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileRecord.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const navigateTo = (folder) => setCurrentPath([...currentPath, folder]);
  const navigateUp = (index) => setCurrentPath(currentPath.slice(0, index + 1));

  const currentSubFolders = folders.filter(f => f.parentId === currentFolder.id);
  const currentFiles = files.filter(f => f.folderId === currentFolder.id);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Digital Library</h1>
        <p className="text-gray-400 text-sm mt-0.5">Organize subjects, view PDFs natively, and upload files up to 512MB.</p>
        <p className="text-amber-400/80 text-xs mt-2 bg-amber-950/30 border border-amber-900/40 rounded-lg p-2">
          ℹ️ <strong>Note on File Syncing:</strong> Your folder structures sync across all devices via the cloud, but uploaded files are saved locally on your device up to 512MB and will not sync across different devices.
        </p>
      </header>

      <div className="flex-1 bg-[#121212] rounded-2xl border border-gray-800 shadow-lg flex flex-col overflow-hidden">
        
        {/* Breadcrumbs */}
        <div className="p-4 border-b border-gray-800 flex items-center gap-2 overflow-x-auto whitespace-nowrap bg-black">
          {currentPath.map((crumb, index) => (
            <React.Fragment key={crumb.id}>
              <button onClick={() => navigateUp(index)} className={`text-sm font-bold transition-colors ${index === currentPath.length - 1 ? 'text-white' : 'text-blue-500 hover:text-blue-400'}`}>{crumb.name}</button>
              {index < currentPath.length - 1 && <span className="text-gray-600">/</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Action Bar */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#1a1a1a]">
          {currentFolder.level < 2 ? (
            <form onSubmit={handleCreateFolder} className="flex gap-2">
              <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder={`New ${currentFolder.level === 0 ? 'Subject' : 'Topic'}...`} className="bg-black border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500" />
              <button type="submit" className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors">Create Folder</button>
            </form>
          ) : (
            <div className="flex gap-2 items-center">
              <div className="relative">
                <button disabled={isUploading} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-lg ${isUploading ? 'bg-blue-800 text-blue-300' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
                  {isUploading ? 'Uploading...' : 'Upload Files Here'}
                </button>
                <input type="file" multiple onChange={handleFileUpload} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
              <span className="text-xs text-gray-500 ml-2">Max 512MB per file</span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {currentSubFolders.length === 0 && currentFiles.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
               <svg className="w-12 h-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
               <p>This folder is empty.</p>
             </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Folders */}
            {currentSubFolders.map(folder => (
              <div key={folder.id} onClick={() => navigateTo(folder)} className="bg-black border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-blue-500 hover:bg-[#1a1a1a] transition-all group relative flex flex-col items-center justify-center text-center h-32">
                <svg className={`w-12 h-12 mb-2 ${folder.level === 2 ? 'text-yellow-500' : 'text-blue-500'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                <span className="text-sm font-bold text-gray-300 group-hover:text-white line-clamp-2">{folder.name}</span>
                {folder.level !== 2 && (
                  <button onClick={(e) => deleteFolder(folder.id, e)} className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                )}
              </div>
            ))}

            {/* Files */}
            {currentFiles.map(file => (
              <div 
                key={file.id} 
                onClick={() => viewFile(file)}
                title="Click to View"
                className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-4 relative flex flex-col items-center justify-center text-center h-32 group hover:border-emerald-500 transition-colors cursor-pointer"
              >
                <svg className="w-10 h-10 mb-2 text-gray-400 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                <span className="text-xs font-bold text-white line-clamp-2 w-full truncate px-1">{file.name}</span>
                <span className="text-[10px] mt-1 text-gray-500">{file.size}</span>
                
                {/* Action Buttons: Delete & Download */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => downloadFile(file, e)} title="Download File" className="text-gray-500 hover:text-emerald-400 bg-black/60 rounded p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }} title="Delete File" className="text-gray-500 hover:text-red-500 bg-black/60 rounded p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Library;