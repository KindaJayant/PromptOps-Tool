import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import EditorTab from './components/EditorTab';
import HistoryTab from './components/HistoryTab';
import TestsTab from './components/TestsTab';
import DiffView from './components/DiffView';
import LandingPage from './components/LandingPage';
import { api } from './api';
import { Edit3, Trash2, History, CheckSquare, Settings, Share2, Home } from 'lucide-react';

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
    if (confirm(`Are you sure you want to delete "${selectedPrompt.name}"? This action cannot be undone.`)) {
      await api.deletePrompt(selectedPrompt.id);
      setSelectedPrompt(null);
      setSidebarRefresh(prev => prev + 1);
    }
  };

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
    <div className="flex h-screen bg-black text-[#ededed] overflow-hidden font-sans selection:bg-[#333]">
      <Sidebar 
        onSelectPrompt={(p) => {
            setSelectedPrompt(p);
            setActiveTab('editor');
            setDiffSelection([]);
        }} 
        selectedPromptId={selectedPrompt?.id} 
        refreshTrigger={sidebarRefresh}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0a0a]">
        {selectedPrompt ? (
          <>
            <header className="z-30 px-8 pt-8 pb-4 bg-[#0a0a0a] border-b border-[#222]">
              <div className="flex justify-between items-center mb-8">
                <div className="flex flex-col">
                    <div className="flex items-center gap-3 mb-1">
                        <button 
                            onClick={() => setSelectedPrompt(null)}
                            className="p-1.5 hover:bg-[#222] rounded-md text-[#a1a1aa] hover:text-[#ededed] transition-all"
                        >
                            <Home className="w-4 h-4" />
                        </button>
                        <h1 className="text-3xl font-semibold tracking-tight">
                            {selectedPrompt.name}
                        </h1>
                        <span className="text-[10px] font-mono bg-[#222] text-[#ededed] px-2 py-0.5 rounded border border-[#333] uppercase">
                            v{selectedPrompt.versions.length > 0 ? selectedPrompt.versions[selectedPrompt.versions.length-1].version_number : 1}
                        </span>
                    </div>
                    <p className="text-[#a1a1aa] text-sm ml-10">{selectedPrompt.description || 'No description provided.'}</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <button className="vercel-button-outline px-3 py-1.5 flex items-center gap-2 text-sm">
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                    </button>
                    <button onClick={handleEditOpen} className="vercel-button-outline p-2 text-[#a1a1aa] hover:text-[#ededed]">
                        <Settings className="w-4 h-4" />
                    </button>
                    <button onClick={handleDeletePrompt} className="p-2 border border-transparent rounded-md text-red-500 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </div>

              <nav className="flex gap-8">
                {[
                  { id: 'editor', label: 'Playground', icon: Edit3 },
                  { id: 'history', label: 'Changelog', icon: History },
                  { id: 'tests', label: 'Evals', icon: CheckSquare },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all relative ${
                      activeTab === tab.id ? 'text-[#ededed]' : 'text-[#a1a1aa] hover:text-[#ededed]'
                    }`}
                  >
                    <tab.icon className={`w-4 h-4`} />
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#ededed]" />
                    )}
                  </button>
                ))}
              </nav>
            </header>

            <div className="flex-1 overflow-y-auto bg-transparent relative z-10 custom-scrollbar">
              {activeTab === 'editor' && (
                <EditorTab 
                  prompt={selectedPrompt} 
                  onVersionSaved={refreshPrompt} 
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
          <LandingPage onGetStarted={() => setSidebarRefresh(r => r + 1)} />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="vercel-card w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-6">Modify Prompt</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Name</label>
                <input
                  type="text"
                  required
                  value={editPromptData.name}
                  onChange={(e) => setEditPromptData({ ...editPromptData, name: e.target.value })}
                  className="w-full bg-[#111] border border-[#333] rounded-md px-3 py-2 text-[#ededed] focus:border-[#666] focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Description</label>
                <textarea
                  value={editPromptData.description}
                  onChange={(e) => setEditPromptData({ ...editPromptData, description: e.target.value })}
                  className="w-full bg-[#111] border border-[#333] rounded-md px-3 py-2 text-[#ededed] h-24 focus:border-[#666] focus:outline-none transition-all resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="vercel-button-outline px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="vercel-button px-4 py-2"
                >
                  Save
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
