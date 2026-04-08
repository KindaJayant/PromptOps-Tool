import React, { useState } from 'react';
import { Tag, RotateCcw, GitCompare, Calendar, CheckCircle2, History } from 'lucide-react';
import { api } from '../api';

const HistoryTab = ({ prompt, onRollback, onSelectForDiff, selectedForDiff = [] }) => {
  const [isTagging, setIsTagging] = useState(null); // versionId

  const handleTag = async (versionId, tagName) => {
    await api.updateTag(versionId, tagName);
    setIsTagging(null);
    onRollback(); // Refresh parent data
  };

  const handleRollback = async (versionId) => {
    if (confirm("Are you sure you want to rollback to this version? A new version will be created.")) {
      await api.rollbackVersion(versionId);
      onRollback();
    }
  };

  if (!prompt || !prompt.versions || prompt.versions.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <History className="w-12 h-12 mb-4 text-[#888]" />
            <p className="text-sm font-medium text-[#888]">No history available yet.</p>
        </div>
    );
  }

  const sortedVersions = [...prompt.versions].sort((a, b) => b.version_number - a.version_number);

  return (
    <div className="max-w-5xl mx-auto py-8 px-8 animate-in fade-in duration-300">
      <div className="bg-[#111] border border-[#333] rounded-md overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0a0a0a] border-b border-[#333]">
              <th className="px-6 py-4 text-xs font-semibold text-[#888] uppercase tracking-wider">Version</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#888] uppercase tracking-wider">Commit Message</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#888] uppercase tracking-wider">Tag</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#888] uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#888] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#333]">
            {sortedVersions.map((v) => (
              <tr key={v.id} className="hover:bg-[#1a1a1a] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedForDiff.includes(v.id)}
                      onChange={() => onSelectForDiff(v.id)}
                      disabled={selectedForDiff.length >= 2 && !selectedForDiff.includes(v.id)}
                      className="w-4 h-4 rounded border-[#444] bg-[#000] text-[#ededed] focus:ring-[#666] focus:ring-offset-[#111] cursor-pointer"
                    />
                    <span className="font-mono text-[#ededed] text-xs px-2 py-1 bg-[#222] border border-[#333] rounded-md">v{v.version_number}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                    <p className="text-[#a1a1aa] font-medium text-sm max-w-sm truncate whitespace-pre group-hover:text-[#ededed] transition-colors">
                        {v.commit_message || '-'}
                    </p>
                </td>
                <td className="px-6 py-4">
                  {v.tag ? (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                      v.tag === 'production' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900' :
                      v.tag === 'staging' ? 'bg-amber-950/50 text-amber-400 border border-amber-900' :
                      'bg-blue-950/50 text-blue-400 border border-blue-900'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {v.tag}
                    </span>
                  ) : (
                    <span className="text-[#444]">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-[#a1a1aa] text-sm">
                    <Calendar className="w-4 h-4" />
                    {new Date(v.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="relative">
                      <button
                        onClick={() => setIsTagging(isTagging === v.id ? null : v.id)}
                        className="p-2 text-[#888] hover:text-[#ededed] hover:bg-[#222] rounded-md transition-colors"
                        title="Set Tag"
                      >
                        <Tag className="w-4 h-4" />
                      </button>
                      {isTagging === v.id && (
                        <div className="absolute right-0 mt-2 w-36 bg-[#000] border border-[#333] rounded-md shadow-xl z-50 py-1">
                          <div className="px-3 py-1.5 text-[10px] font-semibold text-[#666] uppercase tracking-wider border-b border-[#222]">Assign Tag</div>
                          {['production', 'staging', 'experiment'].map(tag => (
                            <button
                              key={tag}
                              onClick={() => handleTag(v.id, tag)}
                              className="w-full text-left px-3 py-2 text-xs font-medium text-[#a1a1aa] hover:bg-[#111] hover:text-[#ededed] transition-colors capitalize"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRollback(v.id)}
                      className="p-2 text-[#888] hover:text-[#ededed] hover:bg-[#222] rounded-md transition-colors"
                      title="Rollback to this version"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {selectedForDiff.length === 2 && (
        <div className="mt-8 flex justify-center animate-in fade-in duration-300">
          <button 
            className="vercel-button-outline flex items-center gap-2 px-6 py-2.5"
            onClick={() => onSelectForDiff('compare')}
          >
            <GitCompare className="w-4 h-4" />
            Compare Versions
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
