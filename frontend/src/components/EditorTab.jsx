import React, { useState, useEffect } from 'react';
import { Save, Terminal } from 'lucide-react';
import { api } from '../api';

const EditorTab = ({ prompt, onVersionSaved }) => {
  const [content, setContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [latestVersion, setLatestVersion] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (prompt && prompt.versions && prompt.versions.length > 0) {
      const sorted = [...prompt.versions].sort((a, b) => b.version_number - a.version_number);
      setLatestVersion(sorted[0]);
      setContent(sorted[0].content);
    } else {
      setLatestVersion(null);
      setContent('');
    }
    setCommitMessage('');
  }, [prompt]);

  const handleSave = async () => {
    if (!content) return;
    setIsSaving(true);
    try {
      const newVersion = await api.createVersion(prompt.id, {
        content,
        commit_message: commitMessage || `Update v${(latestVersion?.version_number || 0) + 1}`
      });
      setLatestVersion(newVersion);
      setCommitMessage('');
      onVersionSaved(newVersion);
    } finally {
      setIsSaving(false);
    }
  };

  if (!prompt) return (
    <div className="h-full flex items-center justify-center text-slate-500 italic">
      Select a prompt to start editing
    </div>
  );

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">{prompt.name}</h2>
          <p className="text-slate-400 text-sm mt-1">{prompt.description || 'No description'}</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">Current Version</span>
          <p className="text-xl font-bold text-white">v{latestVersion?.version_number || 0}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-4">
        <div className="flex-1 relative group">
          <div className="absolute inset-0 bg-indigo-500/5 rounded-xl blur-xl group-focus-within:bg-indigo-500/10 transition-all"></div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="relative w-full h-full bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-slate-100 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none shadow-inner"
            placeholder="Write your system prompt here..."
          />
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 text-slate-400">
              <Terminal className="w-3.5 h-3.5" />
              <span className="text-xs uppercase tracking-wider font-semibold">Commit Message</span>
            </div>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="What changed in this version?"
              className="w-full bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none text-sm"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || !content}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-indigo-500/20 font-bold"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Version'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorTab;
