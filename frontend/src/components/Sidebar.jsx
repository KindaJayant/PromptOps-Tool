import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, ChevronRight } from 'lucide-react';
import { api } from '../api';

const Sidebar = ({ onSelectPrompt, selectedPromptId }) => {
  const [prompts, setPrompts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ name: '', description: '' });

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    const data = await api.listPrompts();
    setPrompts(data);
  };

  const handleCreatePrompt = async (e) => {
    e.preventDefault();
    if (!newPrompt.name) return;
    const created = await api.createPrompt(newPrompt);
    setPrompts([...prompts, created]);
    setNewPrompt({ name: '', description: '' });
    setIsModalOpen(false);
    onSelectPrompt(created);
  };

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 h-screen flex flex-col">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          PromptOps
        </h1>
      </div>

      <div className="p-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          New Prompt
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {prompts.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectPrompt(p)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all ${
              selectedPromptId === p.id
                ? 'bg-indigo-500/20 text-indigo-300 border-l-2 border-indigo-500'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-100'
            }`}
          >
            <span className="truncate">{p.name}</span>
            <ChevronRight className={`w-4 h-4 transition-transform ${selectedPromptId === p.id ? 'rotate-90' : ''}`} />
          </button>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Create New Prompt</h2>
            <form onSubmit={handleCreatePrompt} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newPrompt.name}
                  onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                  placeholder="e.g. summarizer-prompt"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={newPrompt.description}
                  onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                  placeholder="Prompt for summarizing articles..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white h-24 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg shadow-indigo-500/20 transition-all font-medium"
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
