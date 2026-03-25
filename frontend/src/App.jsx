import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import EditorTab from './components/EditorTab';
import HistoryTab from './components/HistoryTab';
import TestsTab from './components/TestsTab';
import DiffView from './components/DiffView';
import { api } from './api';
import { Edit3, History, CheckSquare } from 'lucide-react';

function App() {
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [diffSelection, setDiffSelection] = useState([]);
  const [showDiff, setShowDiff] = useState(false);

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
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedPrompt ? (
          <>
            {/* Header / Tabs */}
            <div className="bg-slate-800 border-b border-slate-700 px-6 pt-6 flex flex-col shrink-0">
              <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        {selectedPrompt.name}
                        <span className="text-xs font-mono bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">DB ID: {selectedPrompt.id}</span>
                    </h1>
                    <p className="text-slate-400 mt-1 max-w-xl truncate">{selectedPrompt.description}</p>
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
    </div>
  );
}

export default App;
