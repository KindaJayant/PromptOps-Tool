import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import EditorTab from './components/EditorTab';
import HistoryTab from './components/HistoryTab';
import TestsTab from './components/TestsTab';
import DiffView from './components/DiffView';
import { api } from './api';
import { Edit3, Trash2, History, CheckSquare } from 'lucide-react';

function App() {
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [diffSelection, setDiffSelection] = useState([]);
  const [showDiff, setShowDiff] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPromptData, setEditPromptData] = useState({ name: '', description: '' });
  const [sidebarRefresh, setSidebarRefresh] = useState(0);

  const handleEditOpen = () => {
    setEditPromptData({ name: selectedPrompt.name, description: selectedPrompt.description || '' });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editPromptData.name) return;
    const updated = await api.updatePrompt(selectedPrompt.id, editPromptData);
    setSelectedPrompt(updated);
    setIsEditModalOpen(false);
    setSidebarRefresh(prev => prev + 1);
  };

  const handleDeletePrompt = async () => {
    if (confirm(`Are you sure you want to delete "${selectedPrompt.name}"? This will delete all versions and test data.\n\nThis action cannot be undone.`)) {
      await api.deletePrompt(selectedPrompt.id);
      setSelectedPrompt(null);
      setSidebarRefresh(prev => prev + 1);
    }
  };

  // Auto-refresh when prompt is updated
  const refreshPrompt = async () => {
    if (selectedPrompt) {
      const updated = await api.getPrompt(selectedPrompt.id);
      setSelectedPrompt(updated);
    }
  };

  const handleSelectForDiff = (id) => {
    if (id === 'compare') {
      setShowDiff(true);
      return;
    }
    
    setDiffSelection(prev => {
      if (prev.includes(id)) return prev.filter(item => item !== id);
      if (prev.length < 2) return [...prev, id];
      return prev;
    });
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      <Sidebar 
        onSelectPrompt={(p) => {
            setSelectedPrompt(p);
            setActiveTab('editor');
            setDiffSelection([]);
        }} 
        selectedPromptId={selectedPrompt?.id} 
        refreshTrigger={sidebarRefresh}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedPrompt ? (
          <>
            {/* Header / Tabs */}
            <div className="bg-slate-800 border-b border-slate-700 px-6 pt-6 flex flex-col shrink-0">
              <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        {selectedPrompt.name}
                        <span className="text-xs font-mono bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">DB ID: {selectedPrompt.id}</span>
                    </h1>
                    <p className="text-slate-400 mt-1 max-w-xl truncate">{selectedPrompt.description}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleEditOpen} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors" title="Edit Prompt Details">
                        <Edit3 className="w-5 h-5" />
                    </button>
                    <button onClick={handleDeletePrompt} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors" title="Delete Prompt">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
              </div>

              <div className="flex gap-8">
                {[
                  { id: 'editor', label: 'Editor', icon: Edit3 },
                  { id: 'history', label: 'History', icon: History },
                  { id: 'tests', label: 'Tests', icon: CheckSquare },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 pb-4 text-sm font-bold transition-all relative ${
                      activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-500 rounded-t-full shadow-[0_-4px_12px_rgba(99,102,241,0.5)]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto bg-slate-900/50 backdrop-blur-3xl">
              {activeTab === 'editor' && (
                <EditorTab 
                  prompt={selectedPrompt} 
                  onVersionSaved={() => {
                      refreshPrompt();
                      // Small delay to let the animation play?
                  }} 
                />
              )}
              {activeTab === 'history' && (
                <HistoryTab 
                  prompt={selectedPrompt} 
                  onRollback={refreshPrompt}
                  onSelectForDiff={handleSelectForDiff}
                  selectedForDiff={diffSelection}
                />
              )}
              {activeTab === 'tests' && <TestsTab prompt={selectedPrompt} />}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 opacity-40">
            <div className="bg-slate-800 p-8 rounded-full border-4 border-slate-700 shadow-2xl">
                <Edit3 className="w-16 h-16 text-slate-600" />
            </div>
            <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Select a prompt</h3>
                <p className="text-slate-400">Choose a prompt from the sidebar or create a new one to begin.</p>
            </div>
          </div>
        )}
      </main>

      {showDiff && diffSelection.length === 2 && (
        <DiffView 
          v1Id={diffSelection[0]} 
          v2Id={diffSelection[1]} 
          onClose={() => {
              setShowDiff(false);
              setDiffSelection([]);
          }} 
        />
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Edit Prompt Details</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editPromptData.name}
                  onChange={(e) => setEditPromptData({ ...editPromptData, name: e.target.value })}
                  placeholder="e.g. summarizer-prompt"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={editPromptData.description}
                  onChange={(e) => setEditPromptData({ ...editPromptData, description: e.target.value })}
                  placeholder="Prompt for summarizing articles..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white h-24 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg shadow-indigo-500/20 transition-all font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
