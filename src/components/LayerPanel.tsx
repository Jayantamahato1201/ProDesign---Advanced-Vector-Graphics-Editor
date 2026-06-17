/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Shape } from '../types';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Search, 
  ChevronUp, 
  ChevronDown, 
  Layers,
  Edit2
} from 'lucide-react';

export function LayerPanel() {
  const { 
    shapes, 
    selectedIds, 
    setSelectedIds, 
    toggleSelect, 
    updateShape, 
    pushHistory,
    bringForward,
    sendBackward,
    canvas
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Top-most shape inside the index tree should visually render at the top of our list
  const layers = useMemo(() => {
    return [...shapes].reverse();
  }, [shapes]);

  const filteredLayers = useMemo(() => {
    if (!searchQuery.trim()) return layers;
    const q = searchQuery.toLowerCase();
    return layers.filter((layer) => 
      layer.name.toLowerCase().includes(q) || 
      layer.type.toLowerCase().includes(q)
    );
  }, [layers, searchQuery]);

  const handleSelectLayer = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      toggleSelect(id);
    } else {
      setSelectedIds([id]);
    }

    // Scroll to shape or visually signal focus
    const speechMsg = `Selected layer ${shapes.find(s => s.id === id)?.name || id}`;
    announceToScreenReader(speechMsg);
  };

  const announceToScreenReader = (msg: string) => {
    const el = document.getElementById('a11y-speak-region');
    if (el) {
      el.textContent = msg;
    }
  };

  const handleToggleVisible = (e: React.MouseEvent, shape: Shape) => {
    e.stopPropagation();
    pushHistory();
    updateShape(shape.id, { visible: !shape.visible });
    announceToScreenReader(`${shape.name} is now ${!shape.visible ? 'visible' : 'hidden'}`);
  };

  const handleToggleLock = (e: React.MouseEvent, shape: Shape) => {
    e.stopPropagation();
    pushHistory();
    updateShape(shape.id, { locked: !shape.locked });
    announceToScreenReader(`${shape.name} is now ${!shape.locked ? 'locked' : 'unlocked'}`);
  };

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const commitRename = (id: string) => {
    if (editName.trim()) {
      pushHistory();
      updateShape(id, { name: editName.trim() });
    }
    setEditingId(null);
  };

  return (
    <aside 
      id="prodesign-layers-sidebar"
      className={`w-64 border-r flex flex-col select-none transition-colors duration-200 relative overflow-hidden ${
        canvas.theme === 'dark' 
          ? 'bg-slate-950/95 border-slate-900 text-slate-100' 
          : 'bg-white border-slate-150 text-slate-800'
      }`}
      aria-label="Layers outline list"
    >
      {/* Title & Stats */}
      <div className="p-4 border-b border-slate-700/10 dark:border-slate-800/40 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-indigo-400 rotate-1 transform" />
          <h2 className="text-xs font-sans font-black uppercase tracking-wider bg-gradient-to-r from-cyan-400 to-indigo-500 dark:from-cyan-300 dark:to-indigo-300 bg-clip-text text-transparent">
            Layers Outline
          </h2>
        </div>
        <span className="text-[9px] font-mono bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
          {shapes.length} total
        </span>
      </div>

      {/* Layer Search Box */}
      <div className="p-3 border-b border-slate-700/10 dark:border-slate-800/40 relative z-10 bg-slate-50/20 dark:bg-slate-950/30">
        <input
          type="text"
          placeholder="Filter layers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs font-sans focus:outline-none focus:ring-1 focus:ring-cyan-500 border transition-all ${
            canvas.theme === 'dark'
              ? 'bg-slate-900/60 border-slate-800 text-slate-200 placeholder-slate-500'
              : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
          }`}
          aria-label="Search layers input"
        />
        <Search className="absolute left-5.5 top-[21px] text-slate-450" size={11} />
      </div>

      {/* Layers Item List View */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin" role="listbox" aria-label="Vector Layers">
        {filteredLayers.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 font-sans">
            {shapes.length === 0 ? 'No shapes on canvas yet' : 'No matching layers'}
          </div>
        ) : (
          filteredLayers.map((layer) => {
            const isSelected = selectedIds.includes(layer.id);
            return (
              <div
                key={layer.id}
                onClick={(e) => handleSelectLayer(e, layer.id)}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer border transition-all ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                    : 'border-transparent hover:bg-slate-800/5 dark:hover:bg-slate-800/40'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                {/* Left block: Icon, Name (with editing capability) */}
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase shrink-0">
                    {layer.type === 'rectangle' && '■'}
                    {layer.type === 'ellipse' && '●'}
                    {layer.type === 'line' && '╱'}
                    {layer.type === 'path' && '✏'}
                    {layer.type === 'text' && 'T'}
                  </span>

                  {editingId === layer.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => commitRename(layer.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename(layer.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="text-xs px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-slate-900 border border-slate-700 text-white w-full"
                      autoFocus
                    />
                  ) : (
                    <span 
                      onDoubleClick={() => startRename(layer.id, layer.name)}
                      className="text-xs font-sans truncate font-medium flex-1 cursor-text"
                      title="Double click to rename"
                    >
                      {layer.name}
                    </span>
                  )}
                </div>

                {/* Right controls: Hide, Lock, Reorder */}
                <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100">
                  {/* Reorder actions inside select mode */}
                  {isSelected && (
                    <div className="flex select-none">
                      <button
                        onClick={(e) => { e.stopPropagation(); bringForward(); }}
                        className="p-1 hover:bg-cyan-500/20 rounded text-slate-400 hover:text-cyan-400"
                        title="Bring Forward layer"
                        aria-label="Bring layer forward"
                      >
                        <ChevronUp size={11} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); sendBackward(); }}
                        className="p-1 hover:bg-cyan-500/20 rounded text-slate-400 hover:text-cyan-400"
                        title="Send Backward layer"
                        aria-label="Send layer backward"
                      >
                        <ChevronDown size={11} />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={(e) => handleToggleVisible(e, layer)}
                    className={`p-1 rounded hover:bg-slate-800/10 dark:hover:bg-slate-800 text-slate-400 ${
                      !layer.visible ? 'text-amber-500' : ''
                    }`}
                    title={layer.visible ? 'Hide vector layer' : 'Show vector layer'}
                    aria-label={`Toggle visibility for layer ${layer.name}`}
                  >
                    {layer.visible ? <Eye size={12} /> : <EyeOff size={11} />}
                  </button>

                  <button
                    onClick={(e) => handleToggleLock(e, layer)}
                    className={`p-1 rounded hover:bg-slate-800/10 dark:hover:bg-slate-800 text-slate-400 ${
                      layer.locked ? 'text-amber-400' : ''
                    }`}
                    title={layer.locked ? 'Unlock vector layer' : 'Lock vector layer'}
                    aria-label={`Toggle lock status for layer ${layer.name}`}
                  >
                    {layer.locked ? <Lock size={12} /> : <Unlock size={11} />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Shortcuts Guide Footer */}
      <div className="p-3 border-t border-slate-700/10 text-[10px] font-mono text-slate-500 space-y-1">
        <div>💡 Double-click names to rename.</div>
        <div>💡 Drag with Hand tool (H) to move views.</div>
      </div>
    </aside>
  );
}
