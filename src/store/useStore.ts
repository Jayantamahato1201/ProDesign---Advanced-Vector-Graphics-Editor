/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { Shape, ToolType, CanvasState, HistoryEntry, Point } from '../types';

interface StoreState {
  // Tool & Canvas State
  activeTool: ToolType;
  canvas: CanvasState;
  
  // Shapes & Selections
  shapes: Shape[];
  selectedIds: string[];
  
  // Transform / Drag Info (Transient states for drawing & dragging)
  isDrawing: boolean;
  activeDrawingId: string | null;
  dragStartPoint: Point | null;
  panning: boolean;
  
  // History State
  history: {
    past: HistoryEntry[];
    future: HistoryEntry[];
  };

  // Actions - Core
  setTool: (tool: ToolType) => void;
  setCanvas: (canvas: Partial<CanvasState>) => void;
  resetCanvas: () => void;
  
  // Actions - Shapes
  addShape: (shape: Shape) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  updateSelectedShapes: (updates: Partial<Shape>) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  
  // Actions - Selection
  setSelectedIds: (ids: string[]) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  
  // Actions - History Execution
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;

  // Actions - Layer Z-Ordering
  bringToFront: () => void;
  sendToBack: () => void;
  bringForward: () => void;
  sendBackward: () => void;
}

// Initial mockup illustration shapes to make the editor feel alive and premium
const INITIAL_SHAPES: Shape[] = [
  {
    id: 'intro-card',
    name: 'Intro Canvas',
    type: 'rectangle',
    x: 80,
    y: 80,
    width: 320,
    height: 200,
    rotation: 0,
    opacity: 0.95,
    locked: false,
    visible: true,
    fill: '#1e1e24',
    stroke: '#3b82f6',
    strokeWidth: 2,
    cornerRadius: 12,
  },
  {
    id: 'intro-title',
    name: 'ProDesign Label',
    type: 'text',
    x: 100,
    y: 120,
    width: 280,
    height: 30,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    fill: '#ffffff',
    stroke: 'none',
    strokeWidth: 0,
    text: 'ProDesign Editor ⚡',
    fontSize: 24,
    fontFamily: 'Inter',
    align: 'left',
  },
  {
    id: 'intro-subtitle',
    name: 'Intro Guide',
    type: 'text',
    x: 100,
    y: 160,
    width: 280,
    height: 80,
    rotation: 0,
    opacity: 0.8,
    locked: false,
    visible: true,
    fill: '#94a3b8',
    stroke: 'none',
    strokeWidth: 0,
    text: 'Use hotkeys V, R, E, L, T, H. Press [Shift] for square / circle aspect lock. Space+drag to pan.',
    fontSize: 13,
    fontFamily: 'Inter',
    align: 'left',
  },
  {
    id: 'abstract-circle-1',
    name: 'Cyan Orbit',
    type: 'ellipse',
    x: 480,
    y: 100,
    width: 140,
    height: 140,
    rotation: 0,
    opacity: 0.7,
    locked: false,
    visible: true,
    fill: '#06b6d4',
    stroke: '#22d3ee',
    strokeWidth: 3,
  },
  {
    id: 'abstract-circle-2',
    name: 'Violet Orbit',
    type: 'ellipse',
    x: 550,
    y: 130,
    width: 140,
    height: 140,
    rotation: 0,
    opacity: 0.6,
    locked: false,
    visible: true,
    fill: '#8b5cf6',
    stroke: '#a78bfa',
    strokeWidth: 2,
  },
  {
    id: 'accent-line',
    name: 'Dynamic Path',
    type: 'line',
    x: 480,
    y: 320,
    width: 210,
    height: 1,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    fill: 'none',
    stroke: '#10b981',
    strokeWidth: 4,
  }
];

export const useStore = create<StoreState>((set, get) => ({
  activeTool: 'select',
  canvas: {
    zoom: 1.0,
    panX: 100,
    panY: 100,
    showGrid: true,
    snapToGrid: false,
    smartGuides: true,
    gridSize: 20,
    theme: 'dark',
  },
  shapes: INITIAL_SHAPES,
  selectedIds: [],
  isDrawing: false,
  activeDrawingId: null,
  dragStartPoint: null,
  panning: false,
  history: {
    past: [],
    future: [],
  },

  setTool: (tool) => {
    set({ activeTool: tool });
    // Clear selection for tools other than select
    if (tool !== 'select') {
      set({ selectedIds: [] });
    }
  },

  setCanvas: (canvasUpdate) => {
    set((state) => ({
      canvas: { ...state.canvas, ...canvasUpdate },
    }));
  },

  resetCanvas: () => {
    set((state) => ({
      canvas: {
        ...state.canvas,
        zoom: 1.0,
        panX: 100,
        panY: 100,
      }
    }));
  },

  addShape: (shape) => {
    const { pushHistory } = get();
    pushHistory();
    set((state) => ({
      shapes: [...state.shapes, shape],
      selectedIds: [shape.id], // Focus selection to the newly created shape
    }));
  },

  updateShape: (id, updates) => {
    set((state) => ({
      shapes: state.shapes.map((s) => (s.id === id ? { ...s, ...updates } as Shape : s)),
    }));
  },

  updateSelectedShapes: (updates) => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;
    set((state) => ({
      shapes: state.shapes.map((s) =>
        state.selectedIds.includes(s.id) && !s.locked ? ({ ...s, ...updates } as Shape) : s
      ),
    }));
  },

  deleteSelected: () => {
    const { selectedIds, pushHistory } = get();
    if (selectedIds.length === 0) return;
    pushHistory();
    set((state) => ({
      shapes: state.shapes.filter((s) => !selectedIds.includes(s.id)),
      selectedIds: [],
    }));
  },

  duplicateSelected: () => {
    const { selectedIds, shapes, pushHistory } = get();
    if (selectedIds.length === 0) return;
    pushHistory();
    const newShapes: Shape[] = [];
    const newIds: string[] = [];

    shapes.forEach((shape) => {
      if (selectedIds.includes(shape.id)) {
        const copyId = `shape-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const copy: Shape = {
          ...shape,
          id: copyId,
          name: `${shape.name} (Copy)`,
          x: shape.x + 20, // Offset dupe
          y: shape.y + 20,
        } as Shape;
        newShapes.push(copy);
        newIds.push(copyId);
      }
    });

    set((state) => ({
      shapes: [...state.shapes, ...newShapes],
      selectedIds: newIds,
    }));
  },

  setSelectedIds: (ids) => {
    set({ selectedIds: ids });
  },

  toggleSelect: (id) => {
    set((state) => {
      const selected = state.selectedIds.includes(id);
      if (selected) {
        return { selectedIds: state.selectedIds.filter((x) => x !== id) };
      } else {
        return { selectedIds: [...state.selectedIds, id] };
      }
    });
  },

  clearSelection: () => {
    set({ selectedIds: [] });
  },

  // History Execution
  pushHistory: () => {
    const { shapes, selectedIds, history } = get();
    // Serialize current state for reliable snapshots
    const snapshot: HistoryEntry = JSON.parse(
      JSON.stringify({ shapes, selectedIds })
    );
    
    // Cap at 50 past entries
    const past = [...history.past, snapshot].slice(-50);
    set({
      history: {
        past,
        future: [], // clear future on action
      },
    });
  },

  undo: () => {
    const { history, shapes, selectedIds } = get();
    if (history.past.length === 0) return;

    const previous = history.past[history.past.length - 1]!;
    const currentSnapshot: HistoryEntry = JSON.parse(
      JSON.stringify({ shapes, selectedIds })
    );

    set({
      shapes: previous.shapes,
      selectedIds: previous.selectedIds,
      history: {
        past: history.past.slice(0, -1),
        future: [currentSnapshot, ...history.future],
      },
    });
  },

  redo: () => {
    const { history, shapes, selectedIds } = get();
    if (history.future.length === 0) return;

    const next = history.future[0]!;
    const currentSnapshot: HistoryEntry = JSON.parse(
      JSON.stringify({ shapes, selectedIds })
    );

    set({
      shapes: next.shapes,
      selectedIds: next.selectedIds,
      history: {
        past: [...history.past, currentSnapshot],
        future: history.future.slice(1),
      },
    });
  },

  clearHistory: () => {
    set({
      history: {
        past: [],
        future: [],
      },
    });
  },

  // Z-Ordering
  bringToFront: () => {
    const { selectedIds, shapes, pushHistory } = get();
    if (selectedIds.length === 0) return;
    pushHistory();
    const itemsToMove = shapes.filter((s) => selectedIds.includes(s.id));
    const itemsToStay = shapes.filter((s) => !selectedIds.includes(s.id));
    set({ shapes: [...itemsToStay, ...itemsToMove] });
  },

  sendToBack: () => {
    const { selectedIds, shapes, pushHistory } = get();
    if (selectedIds.length === 0) return;
    pushHistory();
    const itemsToMove = shapes.filter((s) => selectedIds.includes(s.id));
    const itemsToStay = shapes.filter((s) => !selectedIds.includes(s.id));
    set({ shapes: [...itemsToMove, ...itemsToStay] });
  },

  bringForward: () => {
    const { selectedIds, shapes, pushHistory } = get();
    if (selectedIds.length === 0) return;
    pushHistory();
    
    const indexList = shapes.reduce<number[]>((acc, s, index) => {
      if (selectedIds.includes(s.id)) acc.push(index);
      return acc;
    }, []);

    const newShapes = [...shapes];
    // Move from right to left (top-most layer of selection first)
    for (let i = indexList.length - 1; i >= 0; i--) {
      const idx = indexList[i]!;
      if (idx < newShapes.length - 1) {
        // Swap with next shape
        const current = newShapes[idx]!;
        const next = newShapes[idx + 1]!;
        newShapes[idx] = next;
        newShapes[idx + 1] = current;
      }
    }
    set({ shapes: newShapes });
  },

  sendBackward: () => {
    const { selectedIds, shapes, pushHistory } = get();
    if (selectedIds.length === 0) return;
    pushHistory();

    const indexList = shapes.reduce<number[]>((acc, s, index) => {
      if (selectedIds.includes(s.id)) acc.push(index);
      return acc;
    }, []);

    const newShapes = [...shapes];
    for (let i = 0; i < indexList.length; i++) {
      const idx = indexList[i]!;
      if (idx > 0) {
        // Swap with previous shape
        const current = newShapes[idx]!;
        const prev = newShapes[idx - 1]!;
        newShapes[idx] = prev;
        newShapes[idx - 1] = current;
      }
    }
    set({ shapes: newShapes });
  },
}));
