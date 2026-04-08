import React, { useState, useEffect } from 'react';
import { Save, Terminal, Code2, Info, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

const EditorTab = ({ prompt, onVersionSaved }) => {
  const [content, setContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [latestVersion, setLatestVersion] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isDeployed, setIsDeployed] = useState(false);

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
      
      setIsDeployed(true);
      setTimeout(() => setIsDeployed(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!prompt) return null;

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto py-8 px-8 space-y-6 animate-in fade-in transition-all">
      {/* Workspace Header */}
      <div className="flex justify-between items-center bg-[#111] p-6 rounded-md border border-[#333]">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#222] rounded flex items-center justify-center border border-[#333]">
                <Code2 className="w-5 h-5 text-[#ededed]" />
            </div>
            <div>
                <h2 className="text-xl font-semibold text-[#ededed] mb-1">Editor</h2>
                <div className="flex items-center gap-2 text-[#a1a1aa] text-sm">
                    <Info className="w-3.5 h-3.5" />
                    Edit and version your template
                </div>
            </div>
        </div>
        
        <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-[#666] uppercase tracking-wider mb-1">Status</span>
            <div className="flex items-center gap-2 border border-[#333] bg-[#000] px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-medium text-[#ededed]">Deployed v{latestVersion?.version_number || 0}</span>
            </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-4">
        {/* Editor Wrapper */}
        <div className="flex-1 relative flex flex-col">
          <div className="relative h-full bg-[#000] border border-[#333] rounded-md overflow-hidden flex flex-col focus-within:border-[#666] transition-colors">
            <div className="px-4 py-2 bg-[#111] border-b border-[#333] flex items-center justify-between">
                <span className="text-xs font-mono text-[#888]">system_instruction.txt</span>
                <span className="text-xs font-mono text-[#666]">UTF-8</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 w-full bg-transparent p-6 text-[#ededed] font-mono text-[13px] leading-relaxed focus:outline-none resize-none placeholder-[#444] selection:bg-[#333]"
              placeholder="Inject model intelligence here..."
            />
          </div>
        </div>

        {/* Commitment Control */}
        <div className="bg-[#111] border border-[#333] rounded-md p-5 flex flex-col sm:flex-row items-center gap-4">
            
            <div className="flex-1 w-full flex items-center gap-3 bg-[#000] border border-[#333] rounded-md px-4 py-2 focus-within:border-[#666] transition-colors">
                <Terminal className="w-4 h-4 text-[#888]" />
                <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Changelog (e.g. Added safety constraints)"
                    className="w-full bg-transparent text-[#ededed] text-sm placeholder-[#666] focus:outline-none"
                />
            </div>

            <button
                onClick={handleSave}
                disabled={isSaving || !content || isDeployed}
                className={`w-full sm:w-auto px-6 py-2.5 flex items-center justify-center gap-2 text-sm disabled:opacity-50 transition-colors ${
                  isDeployed ? "bg-emerald-600 text-white border border-emerald-500" : "vercel-button"
                }`}
            >
                {isSaving ? (
                    <div className="w-4 h-4 border-2 border-[#000]/30 border-t-[#000] rounded-full animate-spin" />
                ) : isDeployed ? (
                    <CheckCircle2 className="w-4 h-4" />
                ) : (
                    <Save className="w-4 h-4" />
                )}
                {isSaving ? 'Deploying...' : isDeployed ? 'Deployed!' : 'Deploy'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default EditorTab;
