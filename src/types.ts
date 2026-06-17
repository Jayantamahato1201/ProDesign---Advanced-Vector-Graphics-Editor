/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ToolType =
  | 'select'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'pen'
  | 'freehand'
  | 'text'
  | 'hand'
  | 'zoom';

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BaseShape {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees, 0-359
  opacity: number; // 0 to 1
  locked: boolean;
  visible: boolean;
  fill: string; // solid hex or 'transparent'/'none'
  stroke: string; // solid hex or 'transparent'/'none'
  strokeWidth: number;
  cornerRadius?: number; // rect only
  text?: string; // text only
  fontSize?: number; // text only
  fontFamily?: string; // text only
  align?: 'left' | 'center' | 'right'; // text only
  points?: Point[]; // pen, freehand
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  cornerRadius: number;
}

export interface EllipseShape extends BaseShape {
  type: 'ellipse';
}

export interface LineShape extends BaseShape {
  type: 'line';
}

export interface PathShape extends BaseShape {
  type: 'path';
  points: Point[]; // relative to upper-left boundary x,y
}

export interface TextShape extends BaseShape {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  align: 'left' | 'center' | 'right';
}

export type Shape =
  | RectangleShape
  | EllipseShape
  | LineShape
  | PathShape
  | TextShape;

export interface CanvasState {
  zoom: number; // e.g. 1.0 is 100%
  panX: number;
  panY: number;
  showGrid: boolean;
  snapToGrid: boolean;
  smartGuides: boolean;
  gridSize: number;
  theme: 'light' | 'dark';
}

export interface HistoryEntry {
  shapes: Shape[];
  selectedIds: string[];
}

export interface ActiveGuide {
  type: 'x' | 'y';
  value: number; // Canvas coordinate
  originShapeId?: string;
}
