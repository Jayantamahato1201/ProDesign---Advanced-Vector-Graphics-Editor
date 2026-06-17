/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Shape, ToolType, Point, BoundingBox, ActiveGuide } from '../types';
import { 
  snapValue, 
  getSelectionBoundingBox, 
  rotatePoint, 
  getSvgPathFromPoints, 
  calculateSmartGuides 
} from '../utils/mathUtils';

export function InfiniteCanvas() {
  const {
    shapes,
    activeTool,
    setTool,
    canvas,
    setCanvas,
    selectedIds,
    setSelectedIds,
    addShape,
    updateShape,
    updateSelectedShapes,
    pushHistory
  } = useStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Interaction States
  const [dragMode, setDragMode] = useState<'none' | 'drawing' | 'moving' | 'resizing' | 'rotating' | 'pan' | 'marquee'>('none');
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [shapeOffsets, setShapeOffsets] = useState<{ [id: string]: { x: number; y: number } }>({});
  
  // Tracking mouse positions for Status overlay
  const [canvasMouse, setCanvasMouse] = useState<Point>({ x: 0, y: 0 });

  // Marquee Selecting State
  const [marqueeEnd, setMarqueeEnd] = useState<Point>({ x: 0, y: 0 });

  // Temporary path elements for Pen Tool & Brush
  const [tempPoints, setTempPoints] = useState<Point[]>([]);
  const [tempPathShapeId, setTempPathShapeId] = useState<string | null>(null);

  // Active Smart Snapping guidelines
  const [activeGuides, setActiveGuides] = useState<ActiveGuide[]>([]);

  // Inline Text Editor State
  const [editingShapeId, setEditingShapeId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState('');

  const getHandleCursor = (h: string): string => {
    if (h === 'nw' || h === 'se') return 'cursor-nwse-resize';
    if (h === 'ne' || h === 'sw') return 'cursor-nesw-resize';
    if (h === 'n' || h === 's') return 'cursor-ns-resize';
    return 'cursor-ew-resize';
  };

  // Calculate coordinates relative to canvas zoom & pan offsets
  const getCanvasCoords = (e: React.MouseEvent | MouseEvent): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvas.panX) / canvas.zoom;
    const y = (e.clientY - rect.top - canvas.panY) / canvas.zoom;
    return { x, y };
  };

  // Export event listener setup
  useEffect(() => {
    const handleProjectExport = () => {
      exportProject();
    };
    window.addEventListener('trigger-project-export', handleProjectExport);
    return () => {
      window.removeEventListener('trigger-project-export', handleProjectExport);
    };
  }, [shapes, canvas]);

  // Compute overall selection box dimensions
  const selectionBox = useMemo(() => {
    const selected = shapes.filter((s) => selectedIds.includes(s.id));
    return getSelectionBoundingBox(selected);
  }, [shapes, selectedIds]);

  // Handle zooming via mouse scroll wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.08;
    const isZoomIn = e.deltaY < 0;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Zoom centered on actual cursor
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const beforeZoomX = (mouseX - canvas.panX) / canvas.zoom;
    const beforeZoomY = (mouseY - canvas.panY) / canvas.zoom;

    let nextZoom = canvas.zoom + (isZoomIn ? zoomIntensity : -zoomIntensity) * canvas.zoom;
    nextZoom = Math.max(0.1, Math.min(6.0, nextZoom)); // clamp between 10% and 600%

    const nextPanX = mouseX - beforeZoomX * nextZoom;
    const nextPanY = mouseY - beforeZoomY * nextZoom;

    setCanvas({ zoom: nextZoom, panX: nextPanX, panY: nextPanY });
  };

  // Canvas Mouse Down Dispatcher
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2 || activeTool === 'hand' || e.shiftKey && activeTool === 'select') {
      // Treat alternative dragging triggers as structural Pan
      setDragMode('pan');
      setDragStart({ x: e.clientX - canvas.panX, y: e.clientY - canvas.panY });
      return;
    }

    const mouseCanvas = getCanvasCoords(e);
    setDragStart(mouseCanvas);

    // Brush Tool: Freehand drawing path
    if (activeTool === 'freehand') {
      pushHistory();
      setDragMode('drawing');
      const drawingId = `path-${Date.now()}`;
      const brushShape: Shape = {
        id: drawingId,
        name: 'Brush Stroke',
        type: 'path',
        x: mouseCanvas.x,
        y: mouseCanvas.y,
        width: 1,
        height: 1,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        fill: 'none',
        stroke: '#f43f5e', // Hot pink stroke
        strokeWidth: 4,
        points: [{ x: 0, y: 0 }]
      };
      addShape(brushShape);
      setTempPathShapeId(drawingId);
      setTempPoints([{ x: mouseCanvas.x, y: mouseCanvas.y }]);
      return;
    }

    // Pen Tool: Precise lines drawing
    if (activeTool === 'pen') {
      setDragMode('drawing');
      if (tempPoints.length === 0) {
        pushHistory();
        const drawingId = `pen-${Date.now()}`;
        const newPenPath: Shape = {
          id: drawingId,
          name: 'Pen Path',
          type: 'path',
          x: mouseCanvas.x,
          y: mouseCanvas.y,
          width: 1,
          height: 1,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          fill: 'none',
          stroke: '#6366f1', // Indigo stroke
          strokeWidth: 3,
          points: [{ x: 0, y: 0 }]
        };
        addShape(newPenPath);
        setTempPathShapeId(drawingId);
        setTempPoints([{ x: mouseCanvas.x, y: mouseCanvas.y }]);
      } else {
        // Subsequent anchor nodes added
        const initialPoint = tempPoints[0]!;
        const relativeX = mouseCanvas.x - initialPoint.x;
        const relativeY = mouseCanvas.y - initialPoint.y;
        const updatedPoints = [...tempPoints, { x: mouseCanvas.x, y: mouseCanvas.y }];
        setTempPoints(updatedPoints);

        if (tempPathShapeId) {
          updateShape(tempPathShapeId, {
            points: updatedPoints.map((p) => ({
              x: p.x - initialPoint.x,
              y: p.y - initialPoint.y
            }))
          });
        }
      }
      return;
    }

    // Standard interactive shapes drawing (Rect, Circle, Lines, Writing)
    if (
      activeTool === 'rectangle' ||
      activeTool === 'ellipse' ||
      activeTool === 'line' ||
      activeTool === 'text'
    ) {
      pushHistory();
      setDragMode('drawing');
      const drawingId = `shape-${Date.now()}`;
      
      let baseShape: Shape;
      const initialSize = 1;

      if (activeTool === 'rectangle') {
        baseShape = {
          id: drawingId,
          name: 'Rectangle Rect',
          type: 'rectangle',
          x: mouseCanvas.x,
          y: mouseCanvas.y,
          width: initialSize,
          height: initialSize,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          fill: '#3b82f6',
          stroke: 'none',
          strokeWidth: 1,
          cornerRadius: 4,
        };
      } else if (activeTool === 'ellipse') {
        baseShape = {
          id: drawingId,
          name: 'Ellipse Circle',
          type: 'ellipse',
          x: mouseCanvas.x,
          y: mouseCanvas.y,
          width: initialSize,
          height: initialSize,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          fill: '#10b981',
          stroke: 'none',
          strokeWidth: 1,
        };
      } else if (activeTool === 'line') {
        baseShape = {
          id: drawingId,
          name: 'Line Segment',
          type: 'line',
          x: mouseCanvas.x,
          y: mouseCanvas.y,
          width: initialSize,
          height: initialSize,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          fill: 'none',
          stroke: '#f59e0b',
          strokeWidth: 3,
        };
      } else {
        // Text shape
        baseShape = {
          id: drawingId,
          name: 'Typography Label',
          type: 'text',
          x: mouseCanvas.x,
          y: mouseCanvas.y,
          width: 140,
          height: 28,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          fill: '#ffffff',
          stroke: 'none',
          strokeWidth: 0,
          text: 'Double click to edit',
          fontSize: 16,
          fontFamily: 'Inter',
          align: 'left',
        };
      }

      addShape(baseShape);
      setTempPathShapeId(drawingId);

      if (activeTool === 'text') {
        // Text tool is instant
        setDragMode('none');
        setTool('select');
        setEditingShapeId(drawingId);
        setEditingTextValue('');
      }
      return;
    }

    // Default V-selection marquee or moving shapes
    if (activeTool === 'select') {
      const clickedElement = (e.target as SVGElement).closest('.v-shape-layer');
      if (clickedElement) {
        const shapeId = clickedElement.getAttribute('data-shape-id');
        if (!shapeId) return;

        const targetShape = shapes.find((s) => s.id === shapeId);
        if (targetShape?.locked) return; // Prevent selection changes if locked

        pushHistory();
        setDragMode('moving');

        let nextSelected = [...selectedIds];
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
          if (nextSelected.includes(shapeId)) {
            nextSelected = nextSelected.filter((id) => id !== shapeId);
          } else {
            nextSelected.push(shapeId);
          }
        } else {
          if (!nextSelected.includes(shapeId)) {
            nextSelected = [shapeId];
          }
        }
        setSelectedIds(nextSelected);

        const offsets: typeof shapeOffsets = {};
        shapes.forEach((s) => {
          if (nextSelected.includes(s.id)) {
            offsets[s.id] = {
              x: mouseCanvas.x - s.x,
              y: mouseCanvas.y - s.y,
            };
          }
        });
        setShapeOffsets(offsets);
      } else {
        // Clicked empty background: initiate selection marquee
        if (!e.shiftKey) {
          setSelectedIds([]);
        }
        setDragMode('marquee');
        setMarqueeEnd(mouseCanvas);
      }
    }
  };

  // Canvas Mouse Move Handler
  const handleMouseMove = (e: React.MouseEvent) => {
    const mouseCanvas = getCanvasCoords(e);
    setCanvasMouse(mouseCanvas);

    // Dispatch coordinate updates onto StatusBar
    const customMoveEv = new CustomEvent('canvas-mouse-move', { 
      detail: { x: mouseCanvas.x, y: mouseCanvas.y } 
    });
    window.dispatchEvent(customMoveEv);

    if (dragMode === 'none') return;

    if (dragMode === 'pan') {
      setCanvas({
        panX: e.clientX - dragStart.x,
        panY: e.clientY - dragStart.y,
      });
      return;
    }

    // Freehand drawing stroke appending points
    if (dragMode === 'drawing' && activeTool === 'freehand' && tempPathShapeId) {
      const updated = [...tempPoints, mouseCanvas];
      setTempPoints(updated);

      const firstPoint = updated[0]!;
      updateShape(tempPathShapeId, {
        points: updated.map((p) => ({
          x: p.x - firstPoint.x,
          y: p.y - firstPoint.y
        }))
      });
      return;
    }

    // Drawing geometric bounding box structures (Rect, Circle, Line)
    if (dragMode === 'drawing' && tempPathShapeId) {
      let dx = mouseCanvas.x - dragStart.x;
      let dy = mouseCanvas.y - dragStart.y;

      if (e.shiftKey) {
        // Uniform aspect lock (Squares or uniform Spheres)
        const size = Math.max(Math.abs(dx), Math.abs(dy));
        dx = dx < 0 ? -size : size;
        dy = dy < 0 ? -size : size;
      }

      const rawX = dx < 0 ? dragStart.x + dx : dragStart.x;
      const rawY = dy < 0 ? dragStart.y + dy : dragStart.y;
      
      // Smart grid snapping for new elements
      const snappedX = snapValue(rawX, canvas.gridSize, canvas.snapToGrid);
      const snappedY = snapValue(rawY, canvas.gridSize, canvas.snapToGrid);
      const snappedW = snapValue(Math.abs(dx), canvas.gridSize, canvas.snapToGrid);
      const snappedH = snapValue(Math.abs(dy), canvas.gridSize, canvas.snapToGrid);

      updateShape(tempPathShapeId, {
        x: snappedX,
        y: snappedY,
        width: snappedW || 1,
        height: snappedH || 1,
      });
      return;
    }

    // Selection Box Marquee Dragging
    if (dragMode === 'marquee') {
      setMarqueeEnd(mouseCanvas);

      const minX = Math.min(dragStart.x, mouseCanvas.x);
      const maxX = Math.max(dragStart.x, mouseCanvas.x);
      const minY = Math.min(dragStart.y, mouseCanvas.y);
      const maxY = Math.max(dragStart.y, mouseCanvas.y);

      // Highlight shapes containing centroids intersections
      const overlappingIds = shapes
        .filter((s) => !s.locked && s.visible)
        .filter((s) => {
          const cx = s.x + s.width / 2;
          const cy = s.y + s.height / 2;
          return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
        })
        .map((s) => s.id);

      setSelectedIds(overlappingIds);
      return;
    }

    // Translation drag actions
    if (dragMode === 'moving' && selectedIds.length > 0) {
      let activeGuidesAccumulator: ActiveGuide[] = [];
      let snapOffsetX = 0;
      let snapOffsetY = 0;

      // Smart Snapping & Guides Alignment for single element movements
      if (selectedIds.length === 1 && canvas.smartGuides) {
        const targetId = selectedIds[0]!;
        const targetShape = shapes.find((s) => s.id === targetId);

        if (targetShape) {
          const rawTargetX = mouseCanvas.x - (shapeOffsets[targetId]?.x ?? 0);
          const rawTargetY = mouseCanvas.y - (shapeOffsets[targetId]?.y ?? 0);

          const snapResults = calculateSmartGuides(
            targetId,
            rawTargetX,
            rawTargetY,
            targetShape.width,
            targetShape.height,
            shapes,
            9 / canvas.zoom
          );

          if (snapResults.snapX !== null) {
            snapOffsetX = snapResults.snapX - rawTargetX;
          }
          if (snapResults.snapY !== null) {
            snapOffsetY = snapResults.snapY - rawTargetY;
          }

          // Convert matched points to structural guides
          activeGuidesAccumulator = snapResults.guides.map((g) => ({
            type: g.type,
            value: g.value,
            originShapeId: g.originShapeId
          }));
        }
      }

      shapes.forEach((shape) => {
        if (selectedIds.includes(shape.id) && !shape.locked) {
          const rawX = mouseCanvas.x - (shapeOffsets[shape.id]?.x ?? 0) + snapOffsetX;
          const rawY = mouseCanvas.y - (shapeOffsets[shape.id]?.y ?? 0) + snapOffsetY;

          // Apply coordinates snaps
          const snappedX = snapValue(rawX, canvas.gridSize, canvas.snapToGrid);
          const snappedY = snapValue(rawY, canvas.gridSize, canvas.snapToGrid);

          updateShape(shape.id, { x: snappedX, y: snappedY });
        }
      });

      setActiveGuides(activeGuidesAccumulator);
      return;
    }

    // Selection Resizing Delta Handling
    if (dragMode === 'resizing' && activeHandle && selectionBox) {
      const handleName = activeHandle;
      const mouseOffsetCoords = mouseCanvas;

      selectedIds.forEach((targetId) => {
        const s = shapes.find((x) => x.id === targetId);
        if (!s || s.locked) return;

        let nx = s.x;
        let ny = s.y;
        let nw = s.width;
        let nh = s.height;

        // Perform resize vector offset maps
        if (handleName.includes('e')) {
          nw = Math.max(8, mouseOffsetCoords.x - s.x);
        }
        if (handleName.includes('s')) {
          nh = Math.max(8, mouseOffsetCoords.y - s.y);
        }
        if (handleName.includes('w')) {
          const rx = Math.min(s.x + s.width - 8, mouseOffsetCoords.x);
          nw = s.x + s.width - rx;
          nx = rx;
        }
        if (handleName.includes('n')) {
          const ry = Math.min(s.y + s.height - 8, mouseOffsetCoords.y);
          nh = s.y + s.height - ry;
          ny = ry;
        }

        if (e.shiftKey) {
          // Lock proportional squares aspect ratios
          const ratio = s.width / s.height;
          nw = nh * ratio;
        }

        updateShape(targetId, {
          x: snapValue(nx, canvas.gridSize, canvas.snapToGrid),
          y: snapValue(ny, canvas.gridSize, canvas.snapToGrid),
          width: snapValue(nw, canvas.gridSize, canvas.snapToGrid),
          height: snapValue(nh, canvas.gridSize, canvas.snapToGrid)
        });
      });
      return;
    }

    // Selection Rotation Engine
    if (dragMode === 'rotating' && selectionBox) {
      const boxCenter = {
        x: selectionBox.x + selectionBox.width / 2,
        y: selectionBox.y + selectionBox.height / 2
      };

      const rad = Math.atan2(mouseCanvas.y - boxCenter.y, mouseCanvas.x - boxCenter.x);
      let angleDeg = (rad * 180) / Math.PI + 90; // Add 90 for offset rotation handle
      if (angleDeg < 0) angleDeg += 360;

      // Snapping rotation on common intervals (45, 90, 180 deg) if Shift held
      if (e.shiftKey) {
        angleDeg = Math.round(angleDeg / 45) * 45;
      }

      selectedIds.forEach((targetId) => {
        updateShape(targetId, { rotation: Math.round(angleDeg) % 360 });
      });
    }
  };

  // Canvas Mouse Up Trigger Handler
  const handleMouseUp = () => {
    setDragMode('none');
    setActiveHandle(null);
    setActiveGuides([]);

    // Finish freehand tracing operations
    if (activeTool === 'freehand' && tempPathShapeId) {
      setTempPoints([]);
      setTempPathShapeId(null);
      setTool('select');
    }

    // Capture precise and finalized changes on Undo/Redo stack on mouse release
    pushHistory();
  };

  // double click checks to close Paths or edit text on-screen
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (activeTool === 'pen') {
      setTempPoints([]);
      setTempPathShapeId(null);
      setTool('select');
      pushHistory();
      return;
    }

    const clickedElement = (e.target as SVGElement).closest('.v-shape-layer');
    if (clickedElement) {
      const shapeId = clickedElement.getAttribute('data-shape-id');
      if (shapeId) {
        const targetShape = shapes.find((s) => s.id === shapeId);
        if (targetShape && targetShape.type === 'text' && !targetShape.locked) {
          setEditingShapeId(shapeId);
          setEditingTextValue(targetShape.text ?? '');
        }
      }
    }
  };

  // Core Vector Export Routine
  const exportProject = () => {
    if (!svgRef.current) return;

    try {
      // Create clean SVG representation without selections handles overlay markup
      const clonedSvg = svgRef.current.cloneNode(true) as SVGSVGElement;
      
      // Purge selection bounding box and smart alignment guides from exporting clone
      const a11yBoxes = clonedSvg.querySelector('#export-exclude-a11y-overlay');
      if (a11yBoxes) {
        a11yBoxes.remove();
      }

      const gridOverlay = clonedSvg.querySelector('#export-exclude-grid');
      if (gridOverlay) {
        gridOverlay.remove();
      }

      // Read final bounds to pad exporting viewport
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      shapes.forEach((s) => {
        minX = Math.min(minX, s.x);
        minY = Math.min(minY, s.y);
        maxX = Math.max(maxX, s.x + s.width);
        maxY = Math.max(maxY, s.y + s.height);
      });

      // Pad viewports nicely
      const pad = 40;
      const width = (maxX === -Infinity) ? 800 : (maxX - minX) + pad * 2;
      const height = (maxY === -Infinity) ? 600 : (maxY - minY) + pad * 2;
      const viewX = (minX === Infinity) ? 0 : minX - pad;
      const viewY = (minY === Infinity) ? 0 : minY - pad;

      clonedSvg.setAttribute('viewBox', `${viewX} ${viewY} ${width} ${height}`);
      clonedSvg.setAttribute('width', width.toString());
      clonedSvg.setAttribute('height', height.toString());
      
      // Inline document fonts styles
      const styleNode = document.createElement('style');
      styleNode.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@400;700&family=Playfair+Display:wght@700&family=JetBrains+Mono:wght@500&display=swap');
        text { font-family: 'Inter', sans-serif; }
      `;
      clonedSvg.insertBefore(styleNode, clonedSvg.firstChild);

      const xmlSerializer = new XMLSerializer();
      const svgString = xmlSerializer.serializeToString(clonedSvg);
      
      // Trigger instant direct download
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const dlLink = document.createElement('a');
      dlLink.href = URL.createObjectURL(svgBlob);
      dlLink.download = `prodesign-drawing-${Date.now()}.svg`;
      document.body.appendChild(dlLink);
      dlLink.click();
      document.body.removeChild(dlLink);
    } catch (err) {
      console.error('Error constructing design export files', err);
    }
  };

  return (
    <main
      ref={canvasRef}
      id="prodesign-canvas-workspace"
      className={`flex-1 relative overflow-hidden outline-none cursor-default select-none ${
        canvas.theme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      tabIndex={0}
      role="application"
      aria-label="Infinite vector graphic canvas blackboard"
    >
      {/* SVG Vector Renderer Segment */}
      <svg
        ref={svgRef}
        id="core-svg-renderer"
        className="w-full h-full absolute inset-0 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* SVG Definition patterns */}
        <defs>
          <pattern
            id="workspace-dot-grid"
            width={canvas.gridSize}
            height={canvas.gridSize}
            patternUnits="userSpaceOnUse"
          >
            <circle 
              cx="1" 
              cy="1" 
              r="1" 
              fill={canvas.theme === 'dark' ? '#334155' : '#cbd5e1'} 
              className="opacity-70"
            />
          </pattern>
        </defs>

        {/* Structural Snapping Grid Overlay */}
        {canvas.showGrid && (
          <rect
            id="export-exclude-grid"
            width="100%"
            height="100%"
            fill="url(#workspace-dot-grid)"
          />
        )}

        {/* Viewport Panning & Scale Transform Bracket */}
        <g 
          id="workspace-transformed-viewport"
          transform={`translate(${canvas.panX}, ${canvas.panY}) scale(${canvas.zoom})`}
        >
          {/* Loop over Shape layers and render each appropriately */}
          {shapes.map((s) => {
            if (!s.visible) return null;

            const isSelected = selectedIds.includes(s.id);
            const fillVal = s.fill === 'none' ? 'transparent' : s.fill;
            const strokeVal = s.stroke === 'none' ? 'none' : s.stroke;

            // Common transform attribute matrices representation
            const cx = s.x + s.width / 2;
            const cy = s.y + s.height / 2;
            const transformAttr = s.rotation !== 0 ? `rotate(${s.rotation} ${cx} ${cy})` : undefined;

            return (
              <g 
                key={s.id} 
                transform={transformAttr}
                className="v-shape-layer pointer-events-auto cursor-pointer"
                data-shape-id={s.id}
                style={{ opacity: s.opacity }}
              >
                {/* 1. Rectangle shapes */}
                {s.type === 'rectangle' && (
                  <rect
                    id={`svg-shape-${s.id}`}
                    x={s.x}
                    y={s.y}
                    width={s.width}
                    height={s.height}
                    rx={s.cornerRadius ?? 0}
                    ry={s.cornerRadius ?? 0}
                    fill={fillVal}
                    stroke={strokeVal}
                    strokeWidth={s.strokeWidth}
                    className="transition-all duration-100"
                  />
                )}

                {/* 2. Ellipse / Circles shapes */}
                {s.type === 'ellipse' && (
                  <ellipse
                    id={`svg-shape-${s.id}`}
                    cx={s.x + s.width / 2}
                    cy={s.y + s.height / 2}
                    rx={s.width / 2}
                    ry={s.height / 2}
                    fill={fillVal}
                    stroke={strokeVal}
                    strokeWidth={s.strokeWidth}
                    className="transition-all duration-100"
                  />
                )}

                {/* 3. Straight Line segments */}
                {s.type === 'line' && (
                  <line
                    id={`svg-shape-${s.id}`}
                    x1={s.x}
                    y1={s.y}
                    x2={s.x + s.width}
                    y2={s.y + s.height}
                    stroke={strokeVal !== 'none' ? strokeVal : '#f59e0b'}
                    strokeWidth={s.strokeWidth}
                    strokeLinecap="round"
                    className="transition-all duration-100"
                  />
                )}

                {/* 4. Smooth Curves or Brush Strokes */}
                {s.type === 'path' && s.points && s.points.length > 0 && (
                  <path
                    id={`svg-shape-${s.id}`}
                    d={getSvgPathFromPoints(s.points.map((p) => ({ x: s.x + p.x, y: s.y + p.y })))}
                    fill="none"
                    stroke={strokeVal !== 'none' ? strokeVal : '#6366f1'}
                    strokeWidth={s.strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-100"
                  />
                )}

                {/* 5. Typography Text letters */}
                {s.type === 'text' && (
                  <text
                    id={`svg-shape-${s.id}`}
                    x={s.x}
                    y={s.y + s.height - s.height/4} // Align text beautifully aligned on the baseline
                    fill={fillVal !== 'transparent' ? fillVal : '#ffffff'}
                    fontSize={s.fontSize ?? 16}
                    fontFamily={s.fontFamily ?? 'Inter'}
                    textAnchor={s.align === 'center' ? 'middle' : s.align === 'right' ? 'end' : 'start'}
                    dx={s.align === 'center' ? s.width / 2 : s.align === 'right' ? s.width : 0}
                    className="font-semibold select-none transition-all duration-100"
                  >
                    {s.text || 'Label text'}
                  </text>
                )}
              </g>
            );
          })}

          {/* Marquee Drag Outline */}
          {dragMode === 'marquee' && (
            <rect
              x={Math.min(dragStart.x, marqueeEnd.x)}
              y={Math.min(dragStart.y, marqueeEnd.y)}
              width={Math.abs(dragStart.x - marqueeEnd.x)}
              height={Math.abs(dragStart.y - marqueeEnd.y)}
              fill="rgba(6, 182, 212, 0.05)"
              stroke="#06b6d4"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          )}

          {/* EXCLUDE FROM EXPORT OVERLAYS */}
          <g id="export-exclude-a11y-overlay">
            {/* active Selection Resizing Bounding Box overlay */}
            {selectionBox && selectedIds.length > 0 && (
              <g>
                {/* 1. Surrounding selection border box */}
                <rect
                  x={selectionBox.x - 2}
                  y={selectionBox.y - 2}
                  width={selectionBox.width + 4}
                  height={selectionBox.height + 4}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2 / canvas.zoom}
                  strokeDasharray="3 3"
                />

                {/* 2. Interactive Control corner points */}
                {['nw', 'ne', 'se', 'sw', 'n', 'e', 's', 'w'].map((handle) => {
                  let hx = selectionBox.x;
                  let hy = selectionBox.y;

                  if (handle.includes('e')) hx += selectionBox.width;
                  if (handle.includes('s')) hy += selectionBox.height;
                  if (handle === 'n') { hx += selectionBox.width / 2; }
                  if (handle === 's') { hx += selectionBox.width / 2; }
                  if (handle === 'e') { hy += selectionBox.height / 2; }
                  if (handle === 'w') { hy += selectionBox.height / 2; }

                  const visualSize = 7 / canvas.zoom;
                  const hitSize = 16 / canvas.zoom;

                  return (
                    <g key={handle} className="pointer-events-auto">
                      {/* Invisible larger interactive hit target */}
                      <rect
                        x={hx - hitSize / 2}
                        y={hy - hitSize / 2}
                        width={hitSize}
                        height={hitSize}
                        fill="transparent"
                        className={`pointer-events-auto ${getHandleCursor(handle)}`}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          pushHistory();
                          setDragMode('resizing');
                          setActiveHandle(handle);
                          setDragStart(getCanvasCoords(e));
                        }}
                      />
                      {/* Precise visual anchor indicator */}
                      <rect
                        x={hx - visualSize / 2}
                        y={hy - visualSize / 2}
                        width={visualSize}
                        height={visualSize}
                        fill={canvas.theme === 'dark' ? '#1e293b' : '#ffffff'}
                        stroke="#3b82f6"
                        strokeWidth={1.5 / canvas.zoom}
                        className="pointer-events-none transition-transform duration-100"
                      />
                    </g>
                  );
                })}

                {/* 3. Handle rotation neck & circle */}
                <line
                  x1={selectionBox.x + selectionBox.width / 2}
                  y1={selectionBox.y}
                  x2={selectionBox.x + selectionBox.width / 2}
                  y2={selectionBox.y - 18 / canvas.zoom}
                  stroke="#3b82f6"
                  strokeWidth={1.5 / canvas.zoom}
                />
                <g className="pointer-events-auto">
                  {/* Invisible larger rotation target */}
                  <circle
                    cx={selectionBox.x + selectionBox.width / 2}
                    cy={selectionBox.y - 18 / canvas.zoom}
                    r={14 / canvas.zoom}
                    fill="transparent"
                    className="cursor-grab"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      pushHistory();
                      setDragMode('rotating');
                      setDragStart(getCanvasCoords(e));
                    }}
                  />
                  {/* Visual rotation wheel */}
                  <circle
                    cx={selectionBox.x + selectionBox.width / 2}
                    cy={selectionBox.y - 18 / canvas.zoom}
                    r={5 / canvas.zoom}
                    fill={canvas.theme === 'dark' ? '#1e293b' : '#ffffff'}
                    stroke="#3b82f6"
                    strokeWidth={1.5 / canvas.zoom}
                    className="pointer-events-none transition-transform"
                    title="Drag rotation wheel"
                  />
                </g>
              </g>
            )}

            {/* Smart Snapping Guide alignments lines */}
            {activeGuides.map((guide, idx) => (
              <line
                key={idx}
                x1={guide.type === 'x' ? guide.value : -20000}
                y1={guide.type === 'y' ? guide.value : -20000}
                x2={guide.type === 'x' ? guide.value : 20000}
                y2={guide.type === 'y' ? guide.value : 20000}
                stroke="#ec4899" // hot pink
                strokeWidth={1.5 / canvas.zoom}
                strokeDasharray="4 3"
              />
            ))}
          </g>
        </g>
      </svg>

      {/* Inline Text Editor Overlay */}
      {editingShapeId && (() => {
        const shape = shapes.find((s) => s.id === editingShapeId);
        if (!shape) return null;

        const scaleVal = canvas.zoom;
        const left = shape.x * scaleVal + canvas.panX;
        const top = shape.y * scaleVal + canvas.panY;
        const width = Math.max(180, shape.width * scaleVal);
        const height = Math.max(48, shape.height * scaleVal);

        return (
          <textarea
            className="absolute z-50 border border-blue-500 bg-slate-900/90 text-white backdrop-blur-[2px] focus:outline-none p-1.5 rounded shadow-2xl resize-none overflow-hidden"
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: `${width}px`,
              height: `${height}px`,
              fontSize: `${Math.max(11, (shape.fontSize ?? 16) * scaleVal)}px`,
              fontFamily: shape.fontFamily ?? 'Inter',
              textAlign: shape.align === 'center' ? 'center' : shape.align === 'right' ? 'right' : 'left',
              lineHeight: '1.2',
            }}
            value={editingTextValue}
            onChange={(ev) => setEditingTextValue(ev.target.value)}
            onBlur={() => {
              if (editingShapeId) {
                updateShape(editingShapeId, { text: editingTextValue });
                pushHistory();
                setEditingShapeId(null);
              }
            }}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter' && !ev.shiftKey) {
                ev.preventDefault();
                ev.currentTarget.blur();
              }
              if (ev.key === 'Escape') {
                ev.preventDefault();
                setEditingShapeId(null);
              }
            }}
            autoFocus
          />
        );
      })()}

      {/* Floating Canvas Quick Guides */}
      <div className="absolute bottom-4 left-4 bg-slate-900/85 backdrop-blur border border-slate-800 text-slate-300 text-[10px] font-mono py-1.5 px-3 rounded-lg shadow-xl pointer-events-none select-none max-w-[280px]">
        <div className="font-bold text-cyan-400 border-b pb-0.5 mb-1 text-[11px] uppercase">Control Manual ⚡</div>
        <div className="flex justify-between gap-4"><span>[Space + Drag]</span> <span className="text-right">Pan View</span></div>
        <div className="flex justify-between gap-4"><span>[Scroll Wheel]</span> <span className="text-right">Zoom In/Out</span></div>
        <div className="flex justify-between gap-4"><span>[Backspace]</span> <span className="text-right">Delete Select</span></div>
      </div>
    </main>
  );
}
