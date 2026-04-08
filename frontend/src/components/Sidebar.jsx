import React, { useState, useEffect } from 'react';
import { Plus, Search, Terminal, FileText, Settings, PanelLeft } from 'lucide-react';
import { api } from '../api';

const Sidebar = ({ onSelectPrompt, selectedPromptId, refreshTrigger }) => {
  const [prompts, setPrompts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ name: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const loadPrompts = async () => {
    const data = await api.listPrompts();
    setPrompts(data);
  };

  useEffect(() => {
    loadPrompts();
  }, [refreshTrigger]);

  const handleCreatePrompt = async (e) => {
    e.preventDefault();
    if (!newPrompt.name) return;
    const created = await api.createPrompt(newPrompt);
    setPrompts([...prompts, created]);
    setNewPrompt({ name: '', description: '' });
    setIsModalOpen(false);
    onSelectPrompt(created);
  };

  const filteredPrompts = prompts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-64 bg-[#050505] border-r border-[#222] h-screen flex flex-col z-20">
      
      {/* Brand */}
      <div className="flex items-center justify-between p-4 mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-[#ededed] p-1 rounded-sm text-black">
            <Terminal className="w-4 h-4" />
          </div>
          <h1 className="text-[15px] font-semibold text-[#ededed] tracking-tight">
            PromptOps
          </h1>
        </div>
        <button className="text-[#666] hover:text-[#ededed] transition-colors p-1">
          <PanelLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Action Area */}
      <div className="px-4 mb-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-[#ededed] hover:bg-[#fff] text-black rounded-md py-1.5 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Prompt
        </button>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
          <div className="relative group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#666] group-focus-within:text-[#ededed] transition-colors" />
            <input 
                type="text" 
                placeholder="Find..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#111] border border-[#333] focus:border-[#666] rounded-md py-1.5 pl-8 pr-3 text-[13px] text-[#ededed] placeholder-[#666] focus:outline-none transition-colors"
            />
          </div>
      </div>

      {/* Workspace List */}
      <div className="flex-1 overflow-y-auto px-2 pb-6 space-y-0.5 custom-scrollbar">
        <div className="text-[11px] font-medium text-[#666] uppercase tracking-wider px-3 mb-2 mt-2">Prompts</div>
        
        {filteredPrompts.length === 0 ? (
          <div className="text-[13px] text-[#666] px-3 py-2 italic">No prompts found.</div>
        ) : (
          filteredPrompts.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPrompt(p)}
              className={`w-full group flex items-center gap-3 px-3 py-1.5 rounded-md text-[13px] transition-colors ${
                selectedPromptId === p.id
                  ? 'bg-[#1a1a1a] text-[#ededed]'
                  : 'text-[#888] hover:bg-[#111] hover:text-[#ededed]'
              }`}
            >
              <FileText className={`w-4 h-4 ${selectedPromptId === p.id ? 'text-[#a1a1aa]' : 'text-[#444] group-hover:text-[#666]'}`} />
              <span className="truncate">{p.name}</span>
            </button>
          ))
        )}
      </div>

      {/* Footer Settings Area */}
      <div className="p-4 border-t border-[#222]">
        <button className="flex items-center gap-2 text-[13px] font-medium text-[#888] hover:text-[#ededed] transition-colors">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="vercel-card w-full max-w-sm p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-[#ededed] mb-1">Create Prompt</h2>
            <p className="text-[13px] text-[#888] mb-6">Set up a new system instruction template.</p>
            
            <form onSubmit={handleCreatePrompt} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#ededed] mb-1.5">Identifier</label>
                <input
                  type="text"
                  required
                  value={newPrompt.name}
                  onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                  placeholder="e.g. support-agent-v1"
                  className="w-full bg-[#111] border border-[#333] rounded-md px-3 py-2 text-[13px] text-[#ededed] placeholder-[#444] focus:border-[#666] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#ededed] mb-1.5">Description (optional)</label>
                <textarea
                  value={newPrompt.description}
                  onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                  placeholder="Handles Tier 1 support queries..."
                  className="w-full bg-[#111] border border-[#333] rounded-md px-3 py-2 text-[13px] text-[#ededed] placeholder-[#444] h-20 resize-none focus:border-[#666] focus:outline-none transition-colors"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="vercel-button-outline px-4 py-1.5 text-[13px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#ededed] hover:bg-white text-black font-medium rounded-md px-4 py-1.5 text-[13px] transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

