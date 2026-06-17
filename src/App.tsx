/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from './store/useStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Toolbar } from './components/Toolbar';
import { LayerPanel } from './components/LayerPanel';
import { InfiniteCanvas } from './components/InfiniteCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { VoiceController } from './components/VoiceController';
import { StatusBar } from './components/StatusBar';
import { FloatingPalette } from './components/FloatingPalette';

export default function App() {
  // Bind core vector shortcuts in window global listener
  useKeyboardShortcuts();

  const canvas = useStore((s) => s.canvas);

  return (
    <div 
      className={`h-screen w-screen flex flex-col font-sans overflow-hidden transition-colors duration-200 ${
        canvas.theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* 1. Header Navigation Bar */}
      <Toolbar />

      {/* 2. Main Studio Sandbox Area */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Side Tree Layer Outline */}
        <LayerPanel />

        {/* Central Space Canvas */}
        <div className="flex-1 flex flex-col relative h-full min-w-0">
          <InfiniteCanvas />
          <FloatingPalette />
        </div>

        {/* Right Side Inspect Panel */}
        <PropertiesPanel />
      </div>

      {/* 3. Speech Accessibility Commands Pilot */}
      <VoiceController />

      {/* 4. Downmost Coordinates & Grid spec line */}
      <StatusBar />
    </div>
  );
}

