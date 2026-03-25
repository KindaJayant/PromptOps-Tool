import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight } from 'lucide-react';
import { api } from '../api';

const DiffView = ({ v1Id, v2Id, onClose }) => {
  const [diff, setDiff] = useState([]);
  const [v1, setV1] = useState(null);
  const [v2, setV2] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const [diffData, ver1, ver2] = await Promise.all([
        api.getDiff(v1Id, v2Id),
        api.getVersion(v1Id),
        api.getVersion(v2Id)
      ]);
      setDiff(diffData);
      setV1(ver1);
      setV2(ver2);
    };
    loadData();
  }, [v1Id, v2Id]);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto py-12 px-6">
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-500/20 p-3 rounded-xl">
              <ArrowLeftRight className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Version Comparison</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-500 text-sm">Comparing</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-indigo-300 text-xs">v{v1?.version_number}</span>
                <span className="text-slate-500 text-sm">to</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-emerald-300 text-xs">v{v2?.version_number}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl font-mono text-sm leading-relaxed">
          <div className="flex bg-slate-950 px-4 py-2 border-b border-slate-800 text-xs text-slate-500 uppercase tracking-widest font-bold">
            <div className="w-12 text-center border-r border-slate-800">Type</div>
            <div className="flex-1 px-4">Content</div>
          </div>
          <div className="divide-y divide-slate-800/50">
            {diff.map((line, i) => (
              <div
                key={i}
                className={`flex ${
                  line.type === 'added' ? 'bg-emerald-500/10 text-emerald-300' :
                  line.type === 'removed' ? 'bg-rose-500/10 text-rose-300' :
                  'text-slate-400'
                }`}
              >
                <div className={`w-12 flex justify-center items-center font-bold text-[10px] select-none ${
                    line.type === 'added' ? 'text-emerald-500/50' :
                    line.type === 'removed' ? 'text-rose-500/50' :
                    'text-slate-700'
                }`}>
                  {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                </div>
                <div className="flex-1 px-4 py-1.5 whitespace-pre-wrap break-all">
                  {line.content || ' '}
                </div>
              </div>
            ))}
            {diff.length === 0 && (
              <div className="p-12 text-center text-slate-500 italic">No changes detected between these versions.</div>
            )}
          </div>
        </div>
        
        <div className="mt-8 flex justify-center gap-12 text-xs uppercase tracking-widest font-bold">
          <div className="flex items-center gap-2 text-rose-400">
            <div className="w-3 h-3 bg-rose-500/20 border border-rose-500/30 rounded"></div>
            Removed
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <div className="w-3 h-3 bg-emerald-500/20 border border-emerald-500/30 rounded"></div>
            Added
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-3 h-3 bg-slate-800 border border-slate-700 rounded"></div>
            Unchanged
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiffView;
