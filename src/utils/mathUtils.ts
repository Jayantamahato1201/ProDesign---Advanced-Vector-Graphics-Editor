/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Point, Shape, BoundingBox } from '../types';

export function snapValue(val: number, gridSize: number, enabled: boolean): number {
  if (!enabled) return val;
  return Math.round(val / gridSize) * gridSize;
}

/**
 * Rotates a point around a center of rotation by an angle in degrees.
 */
export function rotatePoint(p: Point, center: Point, angleDegrees: number): Point {
  const angleRad = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/**
 * Returns the logical SVG path d-string representing a freehand path of points.
 * Uses simple quadratic curves to smooth the raw coordinates.
 */
export function getSvgPathFromPoints(points: Point[]): string {
  if (points.length < 2) return '';
  const first = points[0]!;
  let d = `M ${first.x} ${first.y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const current = points[i]!;
    const next = points[i + 1]!;
    const xc = (current.x + next.x) / 2;
    const yc = (current.y + next.y) / 2;
    d += ` Q ${current.x} ${current.y}, ${xc} ${yc}`;
  }

  // End at last point
  const last = points[points.length - 1]!;
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/**
 * Finds the actual physical bounding box of a collection of shapes including rotation.
 */
export function getSelectionBoundingBox(selectedShapes: Shape[]): BoundingBox | null {
  if (selectedShapes.length === 0) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  selectedShapes.forEach((shape) => {
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;

    // Four corners of the shape boundary
    const corners = [
      { x: shape.x, y: shape.y },
      { x: shape.x + shape.width, y: shape.y },
      { x: shape.x + shape.width, y: shape.y + shape.height },
      { x: shape.x, y: shape.y + shape.height },
    ];

    corners.forEach((corner) => {
      // If rotated, compute rotated coords
      const rotated = shape.rotation !== 0 ? rotatePoint(corner, { x: cx, y: cy }, shape.rotation) : corner;
      minX = Math.min(minX, rotated.x);
      maxX = Math.max(maxX, rotated.x);
      minY = Math.min(minY, rotated.y);
      maxY = Math.max(maxY, rotated.y);
    });
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Computes Smart Guides alignment coordinates.
 * Compares a dragging shape's potential bounds against all other inactive shapes on the canvas.
 * Returns snap opportunities (x and y guidelines).
 */
export function calculateSmartGuides(
  targetId: string,
  targetX: number,
  targetY: number,
  targetWidth: number,
  targetHeight: number,
  allShapes: Shape[],
  threshold = 8
): { snapX: number | null; snapY: number | null; guides: { type: 'x' | 'y'; value: number; originShapeId: string }[] } {
  const resultGuides: { type: 'x' | 'y'; value: number; originShapeId: string }[] = [];
  let snapX: number | null = null;
  let snapY: number | null = null;

  const targetLeft = targetX;
  const targetRight = targetX + targetWidth;
  const targetCenterX = targetX + targetWidth / 2;
  const targetTop = targetY;
  const targetBottom = targetY + targetHeight;
  const targetCenterY = targetY + targetHeight / 2;

  let bestDiffX = threshold;
  let bestDiffY = threshold;

  allShapes.forEach((shape) => {
    if (shape.id === targetId || !shape.visible) return;

    const sLeft = shape.x;
    const sRight = shape.x + shape.width;
    const sCenterX = shape.x + shape.width / 2;
    const sTop = shape.y;
    const sBottom = shape.y + shape.height;
    const sCenterY = shape.y + shape.height / 2;

    // Direct coords to match target: X coordinate
    const xSnaps = [
      { tVal: targetLeft, sVal: sLeft, offset: sLeft - targetLeft },
      { tVal: targetLeft, sVal: sRight, offset: sRight - targetLeft },
      { tVal: targetRight, sVal: sLeft, offset: sLeft - targetRight },
      { tVal: targetRight, sVal: sRight, offset: sRight - targetRight },
      { tVal: targetCenterX, sVal: sCenterX, offset: sCenterX - targetCenterX },
    ];

    xSnaps.forEach(({ tVal, sVal, offset }) => {
      const diff = Math.abs(offset);
      if (diff < bestDiffX) {
        bestDiffX = diff;
        snapX = targetX + offset;
        resultGuides.push({ type: 'x', value: sVal, originShapeId: shape.id });
      }
    });

    // Direct coords to match target: Y coordinate
    const ySnaps = [
      { tVal: targetTop, sVal: sTop, offset: sTop - targetTop },
      { tVal: targetTop, sVal: sBottom, offset: sBottom - targetTop },
      { tVal: targetBottom, sVal: sTop, offset: sTop - targetBottom },
      { tVal: targetBottom, sVal: sBottom, offset: sBottom - targetBottom },
      { tVal: targetCenterY, sVal: sCenterY, offset: sCenterY - targetCenterY },
    ];

    ySnaps.forEach(({ tVal, sVal, offset }) => {
      const diff = Math.abs(offset);
      if (diff < bestDiffY) {
        bestDiffY = diff;
        snapY = targetY + offset;
        resultGuides.push({ type: 'y', value: sVal, originShapeId: shape.id });
      }
    });
  });

  return {
    snapX,
    snapY,
    guides: resultGuides.filter(
      (g) => (g.type === 'x' && Math.abs(g.value - (snapX ?? -9999)) < 2) || (g.type === 'y' && Math.abs(g.value - (snapY ?? -9999)) < 2)
    ),
  };
}
