/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Shape } from '../types';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Sliders, 
  Type as FontIcon, 
  Paintbrush, 
  Pipette,
  Check
} from 'lucide-react';

const COLORS_PALETTE = [
  '#ffffff', '#000000', // Monochrome
  '#3b82f6', '#06b6d4', // Blues / Cyans
  '#10b981', '#f59e0b', // Emeralds / Ambers
  '#ef4444', '#ec4899', // Roses / Pinks
  '#8b5cf6', '#64748b'  // Violets / Slates
];

const FONTS_LIST = [
  'Inter', 
  'Space Grotesk', 
  'Playfair Display', 
  'JetBrains Mono', 
  'sans-serif', 
  'serif'
];

export function PropertiesPanel() {
  const { 
    shapes, 
    selectedIds, 
    updateShape, 
    pushHistory,
    canvas
  } = useStore();

  // Find currently selected shape (or first available if multi-selected)
  const activeShape = shapes.find((s) => selectedIds.includes(s.id));

  // local temporary inputs state to guarantee responsive typing without typing lags
  const [localX, setLocalX] = useState('');
  const [localY, setLocalY] = useState('');
  const [localW, setLocalW] = useState('');
  const [localH, setLocalH] = useState('');
  const [localRadius, setLocalRadius] = useState('');
  const [localText, setLocalText] = useState('');
  const [localFontSize, setLocalFontSize] = useState('');

  useEffect(() => {
    if (activeShape) {
      setLocalX(Math.round(activeShape.x).toString());
      setLocalY(Math.round(activeShape.y).toString());
      setLocalW(Math.round(activeShape.width).toString());
      setLocalH(Math.round(activeShape.height).toString());
      setLocalRadius((activeShape.cornerRadius ?? 0).toString());
      setLocalText(activeShape.text ?? '');
      setLocalFontSize((activeShape.fontSize ?? 16).toString());
    }
  }, [activeShape, selectedIds]);

  if (!activeShape) {
    return (
      <aside 
        id="prodesign-properties-sidebar"
        className={`w-64 border-l flex flex-col items-center justify-center p-6 text-center select-none transition-colors duration-200 relative overflow-hidden ${
          canvas.theme === 'dark' 
            ? 'bg-slate-950/95 border-slate-900 text-slate-400' 
            : 'bg-slate-50/50 border-slate-200 text-slate-500'
        }`}
        aria-label="No properties selected panel"
      >
        {/* Subtle decorative mesh background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="p-3 bg-gradient-to-tr from-cyan-400/20 to-indigo-500/25 dark:from-cyan-500/10 dark:to-indigo-500/10 rounded-2xl border border-indigo-400/20 text-indigo-400 mb-4 shadow-sm animate-pulse">
            <Sliders size={24} className="rotate-90 transform" />
          </div>
          <h3 className="text-xs font-sans font-extrabold uppercase tracking-widest bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent mb-1 rounded-md">
            Editor Inspector
          </h3>
          <p className="text-[11px] font-sans max-w-44 leading-relaxed text-slate-400 dark:text-slate-500">
            Select individual or multiple layers on the canvas to view or edit their properties.
          </p>
        </div>
      </aside>
    );
  }

  // Pre-save undo state when user focuses on an input card
  const handleInputFocus = () => {
    pushHistory();
  };

  const handleUpdateNumProperty = (
    key: 'x' | 'y' | 'width' | 'height' | 'cornerRadius' | 'fontSize' | 'rotation' | 'opacity' | 'strokeWidth',
    valStr: string
  ) => {
    let parsed = parseFloat(valStr);
    if (isNaN(parsed)) return;

    // Apply clamped bounds for specific fields
    if (key === 'opacity') {
      parsed = Math.max(0, Math.min(1, parsed));
    } else if (key === 'width' || key === 'height') {
      parsed = Math.max(1, parsed);
    } else if (key === 'cornerRadius') {
      parsed = Math.max(0, parsed);
    } else if (key === 'fontSize') {
      parsed = Math.max(4, parsed);
    }

    updateShape(activeShape.id, { [key]: parsed });
  };

  const handleUpdateStringProperty = (key: 'fill' | 'stroke' | 'text' | 'fontFamily' | 'align', val: string) => {
    updateShape(activeShape.id, { [key]: val });
  };

  // Modern EyeDropper API capability
  const triggerEyedropper = async (targetKey: 'fill' | 'stroke') => {
    if (!('EyeDropper' in window)) {
      alert("Eyedropper is not natively supported in your browser version. Please type full Hex keys directly.");
      return;
    }
    try {
      const eyeDropperClient = new (window as any).EyeDropper();
      const result = await eyeDropperClient.open();
      if (result && result.sRGBHex) {
        pushHistory();
        handleUpdateStringProperty(targetKey, result.sRGBHex);
      }
    } catch (e) {
      console.log('Eyedropper interface cancelled or blocked', e);
    }
  };

  return (
    <aside 
      id="prodesign-properties-sidebar"
      className={`w-64 border-l flex flex-col select-none transition-colors duration-200 overflow-y-auto overflow-x-hidden scrollbar-thin relative ${
        canvas.theme === 'dark' 
          ? 'bg-slate-950/95 border-slate-900 text-slate-100' 
          : 'bg-white border-slate-150 text-slate-800'
      }`}
      aria-label="Properties panel controls"
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-700/10 dark:border-slate-800/40 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <Sliders size={15} className="text-pink-400 rotate-90 transform" />
          <h2 className="text-xs font-sans font-black uppercase tracking-wider bg-gradient-to-r from-pink-400 to-indigo-500 dark:from-pink-300 dark:to-indigo-300 bg-clip-text text-transparent">
            Properties Panel
          </h2>
        </div>
        <span className="text-[9px] font-mono bg-cyan-400/15 text-cyan-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
          {activeShape.type}
        </span>
      </div>

      {/* SECTION 1: TRANSFORM (POSITION & BOUNDS) */}
      <section className="p-4 border-b border-slate-700/10 space-y-3" aria-labelledby="heading-transform">
        <h3 id="heading-transform" className="text-[10px] font-sans font-bold uppercase text-slate-400 tracking-wider">Transform Dimensions</h3>
        <div className="grid grid-cols-2 gap-2">
          {/* Coordinates */}
          <div className="flex items-center gap-1.5 bg-slate-800/5 dark:bg-slate-950/40 p-1.5 rounded border border-slate-700/5 dark:border-slate-800/40">
            <span className="text-[10px] font-mono text-slate-500 font-bold w-4">X</span>
            <input
              type="text"
              value={localX}
              onFocus={handleInputFocus}
              onChange={(e) => {
                setLocalX(e.target.value);
                handleUpdateNumProperty('x', e.target.value);
              }}
              className="text-xs font-mono w-full bg-transparent border-0 outline-none text-right font-semibold"
              aria-label="X coordinates position"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800/5 dark:bg-slate-950/40 p-1.5 rounded border border-slate-700/5 dark:border-slate-800/40">
            <span className="text-[10px] font-mono text-slate-500 font-bold w-4">Y</span>
            <input
              type="text"
              value={localY}
              onFocus={handleInputFocus}
              onChange={(e) => {
                setLocalY(e.target.value);
                handleUpdateNumProperty('y', e.target.value);
              }}
              className="text-xs font-mono w-full bg-transparent border-0 outline-none text-right font-semibold"
              aria-label="Y coordinates position"
            />
          </div>

          {/* Width & Height */}
          <div className="flex items-center gap-1.5 bg-slate-800/5 dark:bg-slate-950/40 p-1.5 rounded border border-slate-700/5 dark:border-slate-800/40">
            <span className="text-[10px] font-mono text-slate-500 font-bold w-4">W</span>
            <input
              type="text"
              value={localW}
              onFocus={handleInputFocus}
              onChange={(e) => {
                setLocalW(e.target.value);
                handleUpdateNumProperty('width', e.target.value);
              }}
              className="text-xs font-mono w-full bg-transparent border-0 outline-none text-right font-semibold"
              aria-label="Width bounds"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800/5 dark:bg-slate-950/40 p-1.5 rounded border border-slate-700/5 dark:border-slate-800/40">
            <span className="text-[10px] font-mono text-slate-500 font-bold w-4">H</span>
            <input
              type="text"
              value={localH}
              onFocus={handleInputFocus}
              onChange={(e) => {
                setLocalH(e.target.value);
                handleUpdateNumProperty('height', e.target.value);
              }}
              className="text-xs font-mono w-full bg-transparent border-0 outline-none text-right font-semibold"
              aria-label="Height bounds"
            />
          </div>
        </div>

        {/* Rotation Slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono text-slate-400" htmlFor="rotation-input">Angle Rotation</label>
            <span className="text-[10px] font-mono font-bold text-cyan-400">{activeShape.rotation}°</span>
          </div>
          <input
            id="rotation-input"
            type="range"
            min="0"
            max="359"
            value={activeShape.rotation}
            onFocus={handleInputFocus}
            onChange={(e) => handleUpdateNumProperty('rotation', e.target.value)}
            className="w-full accent-cyan-500 h-1 bg-slate-750 rounded-lg appearance-none cursor-pointer"
            aria-label="Angle rotation adjust slider"
          />
        </div>

        {/* Rectangle Corner radius */}
        {activeShape.type === 'rectangle' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono text-slate-400" htmlFor="radius-input">Corner Radius</label>
              <span className="text-[10px] font-mono font-bold text-cyan-400">{activeShape.cornerRadius ?? 0}px</span>
            </div>
            <input
              id="radius-input"
              type="range"
              min="0"
              max="60"
              value={activeShape.cornerRadius ?? 0}
              onFocus={handleInputFocus}
              onChange={(e) => handleUpdateNumProperty('cornerRadius', e.target.value)}
              className="w-full accent-cyan-500 h-1 bg-slate-750 rounded-lg appearance-none cursor-pointer"
              aria-label="Corner radius adjust slider"
            />
          </div>
        )}
      </section>

      {/* SECTION 2: RICH COLOR SELECTION & OPACITY */}
      <section className="p-4 border-b border-slate-700/10 space-y-4" aria-labelledby="heading-fill">
        <div className="flex items-center justify-between">
          <h3 id="heading-fill" className="text-[10px] font-sans font-bold uppercase text-slate-400 tracking-wider">Colors & Appearance</h3>
          <Paintbrush size={11} className="text-slate-500" />
        </div>

        {/* Transparency / Opacity */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono text-slate-450" htmlFor="opacity-input">Opacity</label>
            <span className="text-[10px] font-mono font-bold text-cyan-400">{Math.round(activeShape.opacity * 100)}%</span>
          </div>
          <input
            id="opacity-input"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={activeShape.opacity}
            onFocus={handleInputFocus}
            onChange={(e) => handleUpdateNumProperty('opacity', e.target.value)}
            className="w-full accent-cyan-500 h-1 bg-slate-755 rounded-lg appearance-none cursor-pointer"
            aria-label="Shape opacity adjust slider"
          />
        </div>

        {/* Color Fill Block */}
        {activeShape.fill !== 'none' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono text-slate-450" htmlFor="fill-color-input">Solid Fill</label>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => triggerEyedropper('fill')}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400"
                  title="Pick fill color with Eyedropper"
                  aria-label="Eyedropper color picker"
                >
                  <Pipette size={11} />
                </button>
                <input
                  id="fill-color-input"
                  type="color"
                  value={activeShape.fill.startsWith('#') ? activeShape.fill : '#ffffff'}
                  onFocus={handleInputFocus}
                  onChange={(e) => handleUpdateStringProperty('fill', e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border border-slate-700/20 bg-transparent"
                  aria-label="Hex fill color chooser card"
                />
              </div>
            </div>

            {/* Quick Palette Circles */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {COLORS_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => { pushHistory(); handleUpdateStringProperty('fill', c); }}
                  className="w-5.5 h-5.5 rounded-full relative cursor-pointer hover:scale-110 active:scale-95 transition-all outline-none border border-black/10 dark:border-white/10"
                  style={{ backgroundColor: c }}
                  title={`Color swatch ${c}`}
                  aria-label={`Fill with swatch ${c}`}
                >
                  {activeShape.fill.toLowerCase() === c.toLowerCase() && (
                    <span className="absolute inset-0 flex items-center justify-center text-white text-[9px] drop-shadow-md">
                      <Check size={10} className="stroke-[3]" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stroke / Border Styles */}
        <div className="space-y-2.5 pt-2 border-t border-slate-700/10">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono text-slate-450" htmlFor="stroke-color-input">Stroke Style</label>
            <div className="flex items-center gap-1.5">
              {activeShape.stroke !== 'none' && (
                <button
                  onClick={() => triggerEyedropper('stroke')}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 cursor-pointer"
                  title="Pick stroke color with Eyedropper"
                  aria-label="Eyedropper stroke color picker"
                >
                  <Pipette size={11} />
                </button>
              )}
              {activeShape.stroke === 'none' ? (
                <button
                  onClick={() => { pushHistory(); handleUpdateStringProperty('stroke', '#ffffff'); }}
                  className="text-[10px] text-cyan-400 font-sans font-bold hover:underline cursor-pointer"
                  aria-label="Add border line stroke"
                >
                  + Add Border
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    id="stroke-color-input"
                    type="color"
                    value={activeShape.stroke.startsWith('#') ? activeShape.stroke : '#ffffff'}
                    onFocus={handleInputFocus}
                    onChange={(e) => handleUpdateStringProperty('stroke', e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border border-slate-700/20 bg-transparent"
                    aria-label="Border hex stroke color"
                  />
                  <button
                    onClick={() => { pushHistory(); handleUpdateStringProperty('stroke', 'none'); }}
                    className="text-[10px] text-rose-450 font-semibold hover:underline bg-transparent border-0 cursor-pointer pl-1 text-rose-400"
                    aria-label="Remove border line stroke"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {activeShape.stroke !== 'none' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-slate-400" htmlFor="stroke-width-input">Stroke Weight</label>
                <span className="text-[10px] font-mono font-bold text-cyan-400">{activeShape.strokeWidth}px</span>
              </div>
              <input
                id="stroke-width-input"
                type="range"
                min="1"
                max="16"
                value={activeShape.strokeWidth}
                onFocus={handleInputFocus}
                onChange={(e) => handleUpdateNumProperty('strokeWidth', e.target.value)}
                className="w-full accent-cyan-500 h-1 bg-slate-755 rounded-lg appearance-none cursor-pointer"
                aria-label="Border stroke weight adjust CSS slider"
              />
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: TEXT PROPERTIES (TYPOGRAPHY) */}
      {activeShape.type === 'text' && (
        <section className="p-4 space-y-4" aria-labelledby="heading-typography">
          <div className="flex items-center justify-between">
            <h3 id="heading-typography" className="text-[10px] font-sans font-bold uppercase text-slate-400 tracking-wider">Typography Settings</h3>
            <FontIcon size={12} className="text-slate-500" />
          </div>

          {/* Text String Edit Area */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-400" htmlFor="text-content-input">Text Contents</label>
            <textarea
              id="text-content-input"
              value={localText}
              onFocus={handleInputFocus}
              onChange={(e) => {
                setLocalText(e.target.value);
                handleUpdateStringProperty('text', e.target.value);
              }}
              className={`w-full text-xs font-sans p-2 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 border h-18 resize-none ${
                canvas.theme === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
              placeholder="Edit SVG lettering text..."
              aria-label="Rich text editor textbox"
            />
          </div>

          {/* Font Family Menu */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-450" htmlFor="font-family-select">Family</label>
            <select
              id="font-family-select"
              value={activeShape.fontFamily ?? 'Inter'}
              onFocus={handleInputFocus}
              onChange={(e) => {
                pushHistory();
                handleUpdateStringProperty('fontFamily', e.target.value);
              }}
              className={`w-full text-xs font-sans p-1.5 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 border font-semibold ${
                canvas.theme === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
              aria-label="Font family family selection dropdown"
            >
              {FONTS_LIST.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Size Slide bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono text-slate-440" htmlFor="font-size-input">Font Size</label>
              <span className="text-[10px] font-mono font-bold text-cyan-400">{activeShape.fontSize ?? 16}px</span>
            </div>
            <input
              id="font-size-input"
              type="range"
              min="8"
              max="96"
              value={activeShape.fontSize ?? 16}
              onFocus={handleInputFocus}
              onChange={(e) => handleUpdateNumProperty('fontSize', e.target.value)}
              className="w-full accent-cyan-500 h-1 bg-slate-755 rounded-lg appearance-none cursor-pointer"
              aria-label="Font size adjust CSS slider"
            />
          </div>

          {/* Typography Align Buttons */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-slate-400">Horizontal Align</span>
            <div className="grid grid-cols-3 gap-1 bg-slate-950/20 dark:bg-slate-950/40 p-0.5 rounded border border-slate-700/5 dark:border-slate-800/40" role="group" aria-label="Horizontal Alignment">
              {(['left', 'center', 'right'] as const).map((alignChoice) => {
                const isSelected = (activeShape.align ?? 'left') === alignChoice;
                return (
                  <button
                    key={alignChoice}
                    onClick={() => { pushHistory(); handleUpdateStringProperty('align', alignChoice); }}
                    className={`flex items-center justify-center p-1 rounded transition cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={`Align ${alignChoice}`}
                    aria-label={`Horizontal text alignment: align ${alignChoice}`}
                    aria-pressed={isSelected}
                  >
                    {alignChoice === 'left' && <AlignLeft size={13} />}
                    {alignChoice === 'center' && <AlignCenter size={13} />}
                    {alignChoice === 'right' && <AlignRight size={13} />}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Layer quick toggle */}
      <section className="p-4 border-t border-slate-700/10 space-y-2.5">
        <h3 className="text-[10px] font-sans font-bold uppercase text-slate-400 tracking-wider">Layer Rules</h3>
        <div className="flex items-center justify-between">
          <span className="text-xs font-sans font-medium text-slate-300">Lock Layer state</span>
          <button
            onClick={() => {
              pushHistory();
              updateShape(activeShape.id, { locked: !activeShape.locked });
            }}
            className={`px-3 py-1 text-xs font-sans font-semibold rounded cursor-pointer ${
              activeShape.locked
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/35'
                : 'bg-slate-800 text-slate-350 border border-transparent'
            }`}
          >
            {activeShape.locked ? 'Locked' : 'Unlocked'}
          </button>
        </div>
      </section>
    </aside>
  );
}
