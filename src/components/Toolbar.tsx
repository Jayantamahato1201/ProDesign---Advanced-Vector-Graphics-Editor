/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ToolType } from '../types';
import { 
  MousePointer, 
  Square, 
  Circle, 
  Slash, 
  PenTool, 
  Brush, 
  Type, 
  Hand, 
  Search, 
  Undo2, 
  Redo2, 
  Grid, 
  Sparkles, 
  Download, 
  Sun, 
  Moon,
  Maximize2,
  Minimize2,
  Trash2,
  Copy
} from 'lucide-react';
import { motion } from 'motion/react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  key?: string;
}

function Tooltip({ text, children }: TooltipProps) {
  const [show, setShow] = useState(false);
  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-slate-100 text-xs py-1 px-2.5 rounded shadow-xl whitespace-nowrap border border-slate-700 pointer-events-none font-sans font-medium">
          {text}
        </div>
      )}
    </div>
  );
}

export function Toolbar() {
  const { 
    activeTool, 
    setTool, 
    canvas, 
    setCanvas, 
    resetCanvas,
    undo, 
    redo, 
    history,
    shapes,
    selectedIds,
    deleteSelected,
    duplicateSelected
  } = useStore();

  // Logo preference local persistence
  const [logoIcon, setLogoIcon] = useState(() => localStorage.getItem('prodesign-logo-icon') || 'sparkles');
  const [logoGradient, setLogoGradient] = useState(() => localStorage.getItem('prodesign-logo-gradient') || 'rainbow');
  const [showLogoSelector, setShowLogoSelector] = useState(false);

  const getLogoIconComponent = () => {
    switch (logoIcon) {
      case 'brush': return <Brush className="text-white" size={17} />;
      case 'pentool': return <PenTool className="text-white" size={17} />;
      case 'circle': return <Circle className="text-white animate-pulse" size={17} />;
      case 'type': return <Type className="text-white" size={17} />;
      default: return <Sparkles className="text-white animate-spin-slow" size={17} />;
    }
  };

  const getLogoGradientClass = () => {
    switch (logoGradient) {
      case 'teal': return 'from-teal-400 to-emerald-500 shadow-teal-500/25';
      case 'crimson': return 'from-pink-500 to-rose-600 shadow-rose-500/25';
      case 'sunset': return 'from-amber-400 to-orange-600 shadow-orange-500/25';
      case 'purple': return 'from-purple-600 to-indigo-700 shadow-indigo-500/25';
      default: return 'from-cyan-400 via-indigo-500 to-pink-500 shadow-indigo-500/25';
    }
  };

  const handleExport = () => {
    // Dispatch custom event for Canvas exporter
    const event = new CustomEvent('trigger-project-export');
    window.dispatchEvent(event);
  };

  const toolsList: { type: ToolType; label: string; shortcut: string; icon: React.ReactNode }[] = [
    { type: 'select', label: 'Selection Tool', shortcut: 'V', icon: <MousePointer size={18} /> },
    { type: 'rectangle', label: 'Rectangle Shape', shortcut: 'R', icon: <Square size={18} /> },
    { type: 'ellipse', label: 'Ellipse / Circle', shortcut: 'E', icon: <Circle size={18} /> },
    { type: 'line', label: 'Line Segment', shortcut: 'L', icon: <Slash size={18} /> },
    { type: 'pen', label: 'Pen Path', shortcut: 'P', icon: <PenTool size={18} /> },
    { type: 'freehand', label: 'Brush Draw', shortcut: 'B', icon: <Brush size={18} /> },
    { type: 'text', label: 'Rich Text', shortcut: 'T', icon: <Type size={18} /> },
    { type: 'hand', label: 'Hand Pan', shortcut: 'H', icon: <Hand size={18} /> },
    { type: 'zoom', label: 'Zoom Canvas', shortcut: 'Z', icon: <Search size={18} /> },
  ];

  const handleZoomIn = () => {
    setCanvas({ zoom: Math.min(canvas.zoom + 0.1, 4.0) });
  };

  const handleZoomOut = () => {
    setCanvas({ zoom: Math.max(canvas.zoom - 0.1, 0.15) });
  };

  const toggleTheme = () => {
    setCanvas({ theme: canvas.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <header 
      id="prodesign-top-bar"
      className={`h-14 px-5 flex items-center justify-between border-b select-none transition-colors duration-200 relative overflow-hidden backdrop-blur-md ${
        canvas.theme === 'dark' 
          ? 'bg-slate-950/80 border-slate-900 text-slate-100 shadow-lg shadow-black/30' 
          : 'bg-white/90 border-slate-200/80 text-slate-800 shadow-sm shadow-slate-100/40'
      }`}
      role="banner"
    >
      {/* Decorative ultra-thin color beam indicator */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 opacity-90" />

      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3 relative z-10">
        <button
          onClick={() => setShowLogoSelector(!showLogoSelector)}
          className={`h-9 w-9 bg-gradient-to-tr ${getLogoGradientClass()} rounded-xl flex items-center justify-center shadow-lg relative group overflow-hidden cursor-pointer border-0 outline-none`}
          title="Customize Brand Logo Icon"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          {getLogoIconComponent()}
        </button>
        <div className="flex flex-col">
          <button
            onClick={() => setShowLogoSelector(!showLogoSelector)}
            className="flex flex-col items-start bg-transparent border-0 cursor-pointer p-0 text-left outline-none"
            title="Customize Brand Logo Icon"
          >
            <h1 className="text-sm font-sans font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent leading-none">
              ProDesign
            </h1>
            <span className="text-[9px] font-mono text-cyan-400 font-extrabold tracking-widest uppercase mt-0.5">
              STUDIO X
            </span>
          </button>
        </div>

        {/* Custom Brand Icon Selector Dropdown */}
        {showLogoSelector && (
          <div className="absolute top-12 left-0 bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl p-3.5 z-50 w-64 text-slate-100 font-sans space-y-3 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Brand Icon Settings</span>
              <button 
                onClick={() => setShowLogoSelector(false)} 
                className="text-[9px] font-mono text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
            
            {/* Symbol picker list */}
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Symbol Icon</span>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { id: 'sparkles', icon: Sparkles, label: 'Magic' },
                  { id: 'brush', icon: Brush, label: 'Brush' },
                  { id: 'pentool', icon: PenTool, label: 'Pen' },
                  { id: 'circle', icon: Circle, label: 'Circle' },
                  { id: 'type', icon: Type, label: 'Type' }
                ].map((opt) => {
                  const IconComp = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setLogoIcon(opt.id);
                        localStorage.setItem('prodesign-logo-icon', opt.id);
                      }}
                      className={`p-2 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                        logoIcon === opt.id 
                          ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 border-indigo-500 text-white shadow-md' 
                          : 'bg-slate-900 border-slate-800/85 hover:bg-slate-850 text-slate-400 hover:text-white'
                      }`}
                      title={opt.label}
                    >
                      <IconComp size={14} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gradient picker list */}
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Base Theme Gradient</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'rainbow', label: 'Rainbow', gradient: 'from-cyan-400 via-indigo-500 to-pink-500' },
                  { id: 'teal', label: 'Teal Emerald', gradient: 'from-teal-400 to-emerald-500' },
                  { id: 'crimson', label: 'Berry Crimson', gradient: 'from-pink-500 to-rose-600' },
                  { id: 'sunset', label: 'Sunset Fire', gradient: 'from-amber-400 to-orange-600' },
                  { id: 'purple', label: 'Cosmic Indigo', gradient: 'from-purple-600 to-indigo-700' }
                ].map((gradientOpt) => (
                  <button
                    key={gradientOpt.id}
                    onClick={() => {
                      setLogoGradient(gradientOpt.id);
                      localStorage.setItem('prodesign-logo-gradient', gradientOpt.id);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-left transition-all cursor-pointer ${
                      logoGradient === gradientOpt.id 
                        ? 'bg-slate-950 border-indigo-505 text-white shadow-md' 
                        : 'bg-slate-900/50 border-slate-800/60 hover:bg-slate-900 text-slate-400'
                    }`}
                  >
                    <div className={`h-2.5 w-2.5 rounded bg-gradient-to-tr ${gradientOpt.gradient} shrink-0`} />
                    <span className="text-[9px] font-medium truncate">{gradientOpt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vector Tools Segment */}
      <div 
        className="flex items-center p-1 rounded-xl border gap-0.5 relative z-10 backdrop-blur bg-slate-800/10 dark:bg-slate-900/40 border-slate-200/40 dark:border-slate-800/60 shadow-sm" 
        role="toolbar" 
        aria-label="Drawing Tools"
      >
        {toolsList.map((tool) => (
          <Tooltip key={tool.type} text={`${tool.label} (${tool.shortcut})`}>
            <button
              id={`tool-btn-${tool.type}`}
              onClick={() => setTool(tool.type)}
              className={`p-2 rounded-lg transition-all duration-150 relative cursor-pointer ${
                activeTool === tool.type
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-indigo-500/30 font-bold scale-[1.04]'
                  : canvas.theme === 'dark'
                    ? 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/40'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100/80'
              }`}
              aria-label={`${tool.label}. Press ${tool.shortcut} on keyboard`}
              aria-pressed={activeTool === tool.type}
            >
              {tool.icon}
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Selection operations (Visible only when shapes selected) */}
      <div className="hidden md:flex items-center gap-1.5">
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
            <span className="text-xs font-sans text-amber-400 font-medium mr-1 select-none">
              {selectedIds.length} select
            </span>
            <Tooltip text="Duplicate shapes (Ctrl+D)">
              <button
                onClick={duplicateSelected}
                className="p-1.5 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800/40 cursor-pointer"
                aria-label="Duplicate selected shapes"
              >
                <Copy size={14} />
              </button>
            </Tooltip>
            <Tooltip text="Delete shapes (Del)">
              <button
                onClick={deleteSelected}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-800/40 cursor-pointer"
                aria-label="Delete selected shapes"
              >
                <Trash2 size={14} />
              </button>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Grid Settings & Utility Controls */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex bg-slate-800/10 p-0.5 rounded-lg border border-slate-700/10">
          <Tooltip text="Undo action (Ctrl+Z)">
            <button
              onClick={undo}
              disabled={history.past.length === 0}
              className={`p-1.5 rounded cursor-pointer ${
                history.past.length > 0
                  ? canvas.theme === 'dark' ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-800 hover:bg-slate-100'
                  : 'text-slate-500 opacity-40 cursor-not-allowed'
              }`}
              aria-label="Undo last action"
            >
              <Undo2 size={15} />
            </button>
          </Tooltip>
          <Tooltip text="Redo action (Ctrl+Shift+Z)">
            <button
              onClick={redo}
              disabled={history.future.length === 0}
              className={`p-1.5 rounded cursor-pointer ${
                history.future.length > 0
                  ? canvas.theme === 'dark' ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-800 hover:bg-slate-100'
                  : 'text-slate-500 opacity-40 cursor-not-allowed'
              }`}
              aria-label="Redo previous action"
            >
              <Redo2 size={15} />
            </button>
          </Tooltip>
        </div>

        {/* Zoom Engine panel */}
        <div className="flex items-center bg-slate-800/10 px-2 py-1 rounded-lg border border-slate-700/10 gap-1 select-none">
          <button 
            onClick={handleZoomOut}
            className="text-xs hover:text-cyan-400 p-0.5 cursor-pointer"
            aria-label="Zoom Out"
          >
            <Minimize2 size={13} />
          </button>
          <span 
            onClick={resetCanvas}
            className="text-xs font-mono font-bold hover:text-cyan-400 cursor-pointer w-12 text-center"
            title="Double click to fit screen"
          >
            {Math.round(canvas.zoom * 100)}%
          </span>
          <button 
            onClick={handleZoomIn}
            className="text-xs hover:text-cyan-400 p-0.5 cursor-pointer"
            aria-label="Zoom In"
          >
            <Maximize2 size={13} />
          </button>
        </div>

        {/* Snapping Status */}
        <Tooltip text={canvas.showGrid ? 'Hide Grid' : 'Show Grid'}>
          <button
            onClick={() => setCanvas({ showGrid: !canvas.showGrid })}
            className={`p-2 rounded-lg cursor-pointer ${
              canvas.showGrid 
                ? 'text-cyan-400 bg-cyan-400/10' 
                : 'text-slate-400 hover:bg-slate-800/30'
            }`}
            aria-label="Toggle structural grid overlay"
          >
            <Grid size={16} />
          </button>
        </Tooltip>

        <Tooltip text={canvas.snapToGrid ? 'Disable Grid Snap' : 'Enable Grid Snap'}>
          <button
            onClick={() => setCanvas({ snapToGrid: !canvas.snapToGrid })}
            className={`px-2.5 py-1 rounded-lg text-xs font-sans font-semibold cursor-pointer border ${
              canvas.snapToGrid
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'border-slate-700/15 text-slate-400 hover:bg-slate-800/30'
            }`}
            aria-label="Toggle snap-to-grid alignment"
          >
            SNAP
          </button>
        </Tooltip>

        {/* theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/30 cursor-pointer"
          aria-label="Toggle editor appearance theme"
        >
          {canvas.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Export Button */}
        <button
          id="export-trigger-btn"
          onClick={handleExport}
          className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-sans text-xs font-semibold px-3.5 py-1.5 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-indigo-600/15 cursor-pointer"
          aria-label="Export drawing design as vector SVG or high-res PNG image"
        >
          <Download size={14} />
          Export
        </button>
      </div>
    </header>
  );
}
