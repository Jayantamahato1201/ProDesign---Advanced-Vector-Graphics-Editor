/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ShieldCheck, Info } from 'lucide-react';

export function StatusBar() {
  const { shapes, selectedIds, canvas, activeTool } = useStore();
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  // Update mouse position from workspace dynamic tracking
  useEffect(() => {
    const handleMouseCoords = (e: CustomEvent) => {
      if (e.detail) {
        setCoords({
          x: Math.round(e.detail.x),
          y: Math.round(e.detail.y)
        });
      }
    };

    window.addEventListener('canvas-mouse-move' as any, handleMouseCoords);
    return () => {
      window.removeEventListener('canvas-mouse-move' as any, handleMouseCoords);
    };
  }, []);

  const getA11yStatus = () => {
    if (selectedIds.length === 0) return 'WCAG 2.1 AA Compliant • Normal View';
    if (selectedIds.length === 1) return '1 Active Vector Selected';
    return `${selectedIds.length} Layers Multi-selected`;
  };

  return (
    <footer 
      id="prodesign-status-bar"
      className={`h-7 px-4 border-t flex items-center justify-between text-[11px] font-sans font-medium select-none cursor-default shrink-0 transition-colors duration-200 ${
        canvas.theme === 'dark'
          ? 'bg-slate-950 border-slate-900 text-slate-400'
          : 'bg-slate-100 border-slate-205 text-slate-600'
      }`}
      role="contentinfo"
    >
      {/* Target invisible ARIA active speech announcer anchor */}
      <div 
        id="a11y-speak-region" 
        className="sr-only" 
        aria-live="assertive" 
        aria-atomic="true"
      >
        Welcome to ProDesign Editor. Select drawing tools in the upper toolbar or type hotkeys to start creating.
      </div>

      {/* Left items: Mouse coords, total objects */}
      <div className="flex items-center gap-4">
        {/* Dynamic position */}
        <div className="flex items-center gap-1 font-mono">
          <span className="opacity-50">X:</span>
          <span className="w-10 text-slate-200 dark:text-slate-300 transition-all">{coords.x}</span>
          <span className="opacity-50 pl-1">Y:</span>
          <span className="w-10 text-slate-200 dark:text-slate-300 transition-all">{coords.y}</span>
        </div>

        <div className="border-l h-3 border-slate-700/20 pr-1"></div>

        {/* Selected Layer Indicator */}
        <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
          Tool: {activeTool}
        </span>
      </div>

      {/* Center item: Quick accessibility guidelines */}
      <div className="hidden sm:flex items-center gap-1.5 opacity-85 hover:opacity-100 text-xs">
        <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
        <span className="text-[10px] tracking-wide font-mono text-emerald-400">
          {getA11yStatus()}
        </span>
      </div>

      {/* Right items: system specs & fitting screen ratios */}
      <div className="flex items-center gap-3 font-mono text-[10px]">
        <div className="flex items-center gap-1 opacity-70">
          <Info size={11} />
          <span>Grid Size: {canvas.gridSize}px</span>
        </div>
        <span className="bg-slate-800/10 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-[0.9]">
          Vector-SVG Core
        </span>
      </div>
    </footer>
  );
}
