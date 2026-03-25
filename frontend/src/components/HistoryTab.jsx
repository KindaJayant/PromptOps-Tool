import React, { useState } from 'react';
import { Tag, RotateCcw, GitCompare, Calendar, CheckCircle2 } from 'lucide-react';
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
    return <div className="p-8 text-center text-slate-500">No history available yet.</div>;
  }

  const sortedVersions = [...prompt.versions].sort((a, b) => b.version_number - a.version_number);

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-700">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Version</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Commit Message</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Tag</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {sortedVersions.map((v) => (
              <tr key={v.id} className="hover:bg-slate-700/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedForDiff.includes(v.id)}
                      onChange={() => onSelectForDiff(v.id)}
                      disabled={selectedForDiff.length >= 2 && !selectedForDiff.includes(v.id)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                    />
                    <span className="font-mono font-bold text-white uppercase text-xs px-2 py-1 bg-slate-700 rounded">v{v.version_number}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-300 text-sm max-w-xs truncate">{v.commit_message || '-'}</td>
                <td className="px-6 py-4">
                  {v.tag ? (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      v.tag === 'production' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      v.tag === 'staging' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {v.tag}
                    </span>
                  ) : (
                    <span className="text-slate-600 text-xs">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-400 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(v.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="relative">
                      <button
                        onClick={() => setIsTagging(isTagging === v.id ? null : v.id)}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-600 rounded-lg transition-all"
                        title="Set Tag"
                      >
                        <Tag className="w-4 h-4" />
                      </button>
                      {isTagging === v.id && (
                        <div className="absolute right-0 mt-2 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-20 py-1 overflow-hidden">
                          {['production', 'staging', 'experiment'].map(tag => (
                            <button
                              key={tag}
                              onClick={() => handleTag(v.id, tag)}
                              className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors capitalize"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRollback(v.id)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-600 rounded-lg transition-all"
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
        <div className="mt-6 flex justify-center">
          <button 
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl transition-all shadow-xl shadow-indigo-500/20 font-bold"
            onClick={() => onSelectForDiff('compare')}
          >
            <GitCompare className="w-5 h-5" />
            Compare Versions
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
