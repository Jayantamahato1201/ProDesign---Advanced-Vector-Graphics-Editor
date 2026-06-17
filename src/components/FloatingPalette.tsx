/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Shape } from '../types';
import { 
  Sparkles, 
  Layers, 
  Palette, 
  FileDown, 
  X, 
  Zap, 
  Layout, 
  Check, 
  Sliders, 
  Download, 
  HelpCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PALETTES_PRESET = [
  {
    name: 'Sunset Crimson',
    colors: ['#ef4444', '#f59e0b', '#ec4899', '#f43f5e'],
    accent: '#f59e0b',
  },
  {
    name: 'Cyberpunk Violet',
    colors: ['#a855f7', '#06b6d4', '#ec4899', '#3b82f6'],
    accent: '#06b6d4',
  },
  {
    name: 'Emerald Aurora',
    colors: ['#10b981', '#06b6d4', '#6ee7b7', '#115e59'],
    accent: '#10b981',
  },
  {
    name: 'Cotton Candy',
    colors: ['#f472b6', '#38bdf8', '#c084fc', '#fdf2f8'],
    accent: '#f472b6',
  },
  {
    name: 'Minimal Slate',
    colors: ['#0f172a', '#334155', '#e2e8f0', '#ffffff'],
    accent: '#64748b',
  }
];

export function FloatingPalette() {
  const { 
    shapes, 
    selectedIds, 
    addShape, 
    updateShape, 
    pushHistory, 
    canvas, 
    setSelectedIds 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'presets' | 'palettes' | 'export'>('presets');
  const [exportFormat, setExportFormat] = useState<'svg' | 'png'>('svg');
  const [exportScale, setExportScale] = useState<number>(1);
  const [isOpen, setIsOpen] = useState(true);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Apply a curated color palette preset to selected vector elements
  const applyPalette = (colorScheme: string[]) => {
    if (selectedIds.length === 0) return;
    pushHistory();
    selectedIds.forEach((id, index) => {
      const shape = shapes.find(s => s.id === id);
      if (shape) {
        const assignedColor = colorScheme[index % colorScheme.length];
        if (shape.fill !== 'none') {
          updateShape(id, { fill: assignedColor });
        } else {
          updateShape(id, { stroke: assignedColor });
        }
      }
    });

    // Flash small quick indicator
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 1500);
  };

  // Quick preset vector template injector
  const injectPreset = (type: 'card' | 'badge' | 'neon-btn') => {
    pushHistory();
    const timestamp = Date.now();
    const centerX = -canvas.panX + (window.innerWidth / 2) / canvas.zoom - 100;
    const centerY = -canvas.panY + (window.innerHeight / 2) / canvas.zoom - 80;

    if (type === 'card') {
      // 1. Beautiful SaaS Glassmorphic Container
      const containerId = `preset-card-${timestamp}`;
      const containerShape: Shape = {
        id: containerId,
        name: 'Tech Card (Container)',
        type: 'rectangle',
        x: centerX,
        y: centerY,
        width: 250,
        height: 150,
        rotation: 0,
        opacity: 0.95,
        locked: false,
        visible: true,
        fill: '#0f172a',
        stroke: '#06b6d4',
        strokeWidth: 2,
        cornerRadius: 16,
      };

      // 2. Title label
      const titleId = `preset-card-title-${timestamp}`;
      const titleShape: Shape = {
        id: titleId,
        name: 'Card Title text',
        type: 'text',
        x: centerX + 20,
        y: centerY + 30,
        width: 210,
        height: 25,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        fill: '#ffffff',
        stroke: 'none',
        strokeWidth: 0,
        text: 'AESTHETIC MODULE',
        fontSize: 16,
        fontFamily: 'Space Grotesk',
        align: 'left',
      };

      // 3. Body text
      const bodyId = `preset-card-body-${timestamp}`;
      const bodyShape: Shape = {
        id: bodyId,
        name: 'Card Description text',
        type: 'text',
        x: centerX + 20,
        y: centerY + 65,
        width: 210,
        height: 60,
        rotation: 0,
        opacity: 0.75,
        locked: false,
        visible: true,
        fill: '#38bdf8',
        stroke: 'none',
        strokeWidth: 0,
        text: 'This is an auto-generated responsive vector shape preset component created with ProDesign Studio.',
        fontSize: 10,
        fontFamily: 'Inter',
        align: 'left',
      };

      addShape(containerShape);
      addShape(titleShape);
      addShape(bodyShape);
      setSelectedIds([containerId, titleId, bodyId]);

    } else if (type === 'badge') {
      // 1. Sleek tag pill shape
      const pillId = `preset-badge-${timestamp}`;
      const pillShape: Shape = {
        id: pillId,
        name: 'Badge Pill Shape',
        type: 'ellipse',
        x: centerX + 30,
        y: centerY + 30,
        width: 130,
        height: 32,
        rotation: 0,
        opacity: 0.9,
        locked: false,
        visible: true,
        fill: '#10b981',
        stroke: '#f59e0b',
        strokeWidth: 1.5,
      };

      // 2. Pill Tag Text label
      const badgeTextId = `preset-badge-txt-${timestamp}`;
      const badgeTextShape: Shape = {
        id: badgeTextId,
        name: 'Badge Label string',
        type: 'text',
        x: centerX + 45,
        y: centerY + 36,
        width: 100,
        height: 18,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        fill: '#ffffff',
        stroke: 'none',
        strokeWidth: 0,
        text: '★ PREMIUM ASSET',
        fontSize: 10,
        fontFamily: 'JetBrains Mono',
        align: 'center',
      };

      addShape(pillShape);
      addShape(badgeTextShape);
      setSelectedIds([pillId, badgeTextId]);

    } else if (type === 'neon-btn') {
      // 1. Neon glow rounded rectangle border
      const btnId = `preset-neon-${timestamp}`;
      const btnShape: Shape = {
        id: btnId,
        name: 'Neon Button Container',
        type: 'rectangle',
        x: centerX + 10,
        y: centerY + 20,
        width: 180,
        height: 48,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        fill: '#1e1b4b',
        stroke: '#ec4899',
        strokeWidth: 3,
        cornerRadius: 24,
      };

      // 2. Glowing inner pink label
      const labelId = `preset-neon-lbl-${timestamp}`;
      const labelShape: Shape = {
        id: labelId,
        name: 'Neon Button label',
        type: 'text',
        x: centerX + 20,
        y: centerY + 34,
        width: 160,
        height: 20,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        fill: '#f43f5e',
        stroke: 'none',
        strokeWidth: 0,
        text: 'LAUNCH STUDIO 🚀',
        fontSize: 11,
        fontFamily: 'Space Grotesk',
        align: 'center',
      };

      addShape(btnShape);
      addShape(labelShape);
      setSelectedIds([btnId, labelId]);
    }
  };

  const handleExportClick = () => {
    // Instantly triggers export routine
    const event = new CustomEvent('trigger-project-export');
    window.dispatchEvent(event);
  };

  return (
    <div className="absolute top-20 left-4 z-40 select-none">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            id="creative-floating-palette"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`w-72 rounded-2xl border backdrop-blur-xl shadow-2xl p-4 flex flex-col gap-3.5 transition-colors duration-200 ${
              canvas.theme === 'dark'
                ? 'bg-slate-900/90 border-slate-700/60 shadow-black/80'
                : 'bg-white/95 border-slate-200 shadow-slate-300/60'
            }`}
          >
            {/* Header section */}
            <div className="flex items-center justify-between border-b pb-2 border-slate-700/15 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-gradient-to-tr from-cyan-400 to-indigo-500 text-white shadow-sm">
                  <Sparkles size={14} className="animate-spin-slow" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-[11px] font-sans font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-200">
                    Creative Tools Kit
                  </h3>
                  <span className="text-[9px] font-mono text-cyan-400 font-bold">SMART VISUAL PLAYGROUND</span>
                </div>
              </div>
              
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800/10 dark:hover:bg-slate-800/30 transition cursor-pointer"
                title="Hide Creative Kit"
                aria-label="Hide panel"
              >
                <X size={14} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950/40 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800/40">
              {(['presets', 'palettes', 'export'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[9.5px] font-mono uppercase font-bold py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Switchable content boxes */}
            <div className="min-h-32 flex flex-col justify-center">
              {activeTab === 'presets' && (
                <div className="space-y-3">
                  <div className="text-[10px] font-sans text-slate-500 dark:text-slate-400 leading-relaxed">
                    Instantly inject beautifully styled, high-end vector components centered on your currently visible viewport:
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => injectPreset('card')}
                      className="group flex items-center justify-between p-2 rounded-xl text-left border border-slate-200/60 dark:border-slate-800/50 hover:border-cyan-500/50 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-cyan-500/5 transition duration-150 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Layout className="text-cyan-400" size={14} />
                        <span className="text-xs font-sans font-bold text-slate-700 dark:text-slate-200">Glassmorphic SaaS Card</span>
                      </div>
                      <span className="text-[9px] font-mono text-cyan-400 uppercase font-semibold border border-cyan-400/20 px-1 rounded hover:bg-cyan-500/20">Add Preset</span>
                    </button>

                    <button
                      onClick={() => injectPreset('neon-btn')}
                      className="group flex items-center justify-between p-2 rounded-xl text-left border border-slate-200/60 dark:border-slate-800/50 hover:border-rose-500/50 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-rose-500/5 transition duration-155 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="text-rose-400" size={14} />
                        <span className="text-xs font-sans font-bold text-slate-700 dark:text-slate-200">Glow Cyber Neon Button</span>
                      </div>
                      <span className="text-[9px] font-mono text-rose-400 uppercase font-semibold border border-rose-400/20 px-1 rounded hover:bg-rose-500/20">Add Preset</span>
                    </button>

                    <button
                      onClick={() => injectPreset('badge')}
                      className="group flex items-center justify-between p-2 rounded-xl text-left border border-slate-200/60 dark:border-slate-800/50 hover:border-emerald-500/50 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-emerald-500/5 transition duration-150 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Palette className="text-emerald-400" size={14} />
                        <span className="text-xs font-sans font-bold text-slate-700 dark:text-slate-200">Modern Tech Badge Pill</span>
                      </div>
                      <span className="text-[9px] font-mono text-emerald-400 uppercase font-semibold border border-emerald-400/20 px-1 rounded hover:bg-emerald-500/20">Add Preset</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'palettes' && (
                <div className="space-y-3">
                  <div className="text-[10px] font-sans text-slate-500 dark:text-slate-400 leading-relaxed">
                    Select one or more shape elements on the canvas first, then tap any palette to assign gorgeous color gradients instantly:
                  </div>

                  {selectedIds.length === 0 && (
                    <div className="py-2.5 px-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[10px] text-orange-400 font-sans tracking-wide">
                      ⚠️ No shapes currently selected in the outline. Select a shape to recolor details.
                    </div>
                  )}

                  <div className="space-y-2">
                    {PALETTES_PRESET.map((palette) => (
                      <button
                        key={palette.name}
                        disabled={selectedIds.length === 0}
                        onClick={() => applyPalette(palette.colors)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all text-left group ${
                          selectedIds.length === 0
                            ? 'opacity-50 cursor-not-allowed border-slate-850 bg-slate-900/10'
                            : 'border-slate-200/60 dark:border-slate-800/50 hover:border-indigo-500/30 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-800/10 hover:shadow-sm cursor-pointer'
                        }`}
                      >
                        <span className="text-xs font-sans text-slate-700 dark:text-slate-200 font-bold">
                          {palette.name}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {palette.colors.map((color, i) => (
                              <div
                                key={i}
                                className="w-4 h-4 rounded-full border border-slate-900"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {copiedNotification && (
                    <div className="text-[10px] font-mono text-emerald-400 font-bold text-center">
                      ✓ Aesthetic Color Palette applied successfully!
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'export' && (
                <div className="space-y-3">
                  <div className="text-[10px] font-sans text-slate-500 dark:text-slate-400 leading-relaxed">
                    Configure high-fidelity image formats, rendering engines, and target device multipliers:
                  </div>

                  {/* Format Selector */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">Format</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['svg', 'png'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setExportFormat(fmt)}
                          className={`text-xs py-1 rounded font-bold cursor-pointer ${
                            exportFormat === fmt
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                              : 'bg-slate-800/30 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {fmt.toUpperCase()} (vector)
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scale Selector */}
                  {exportFormat === 'png' && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">Retina Scale Density</span>
                      <div className="grid grid-cols-3 gap-1">
                        {([1, 2, 4] as const).map((multiplier) => (
                          <button
                            key={multiplier}
                            onClick={() => setExportScale(multiplier)}
                            className={`text-[10px] font-mono py-1 rounded cursor-pointer ${
                              exportScale === multiplier
                                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold'
                                : 'bg-slate-800/20 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {multiplier}x {multiplier === 4 ? '(Retina)' : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dynamic triggers popup button content */}
                  <button
                    onClick={handleExportClick}
                    className="w-full flex items-center justify-center gap-2 py-2 pr-3 pl-3 text-xs font-sans font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-xl shadow-md cursor-pointer hover:opacity-95 transition"
                  >
                    <Download size={13} />
                    Download {shapes.length} active assets
                  </button>
                </div>
              )}
            </div>

            {/* Quick hotkeys popup checklist overlay */}
            <div className="border-t pt-2 border-slate-700/15 dark:border-slate-800/50 flex justify-between items-center text-[9.5px] font-sans font-medium text-slate-500 dark:text-slate-400">
              <span>Selected layers: <b>{selectedIds.length}</b></span>
              <span className="text-[9px] font-mono bg-slate-950/20 dark:bg-indigo-950/30 text-indigo-400 px-1 rounded-md">PRO EDITOR</span>
            </div>
          </motion.div>
        ) : (
          <motion.button
            id="creative-kit-launcher-button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 pl-3.5 pr-4 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-500 text-white font-sans text-xs font-bold shadow-lg shadow-indigo-500/20 cursor-pointer overflow-hidden relative group"
            title="Open Creative Toolkit Panel"
          >
            <div className="absolute inset-0 bg-white/10 group-hover:left-full transition-all duration-300" />
            <Sparkles size={13} className="animate-pulse" />
            <span>Open Designs Palette</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
