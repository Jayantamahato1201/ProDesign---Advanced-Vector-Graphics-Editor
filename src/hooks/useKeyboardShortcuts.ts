/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ToolType } from '../types';

export function useKeyboardShortcuts() {
  const setTool = useStore((s) => s.setTool);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const deleteSelected = useStore((s) => s.deleteSelected);
  const duplicateSelected = useStore((s) => s.duplicateSelected);
  const bringToFront = useStore((s) => s.bringToFront);
  const sendToBack = useStore((s) => s.sendToBack);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if user is typing in forms/inputs
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      const isMac = navigator.userAgent.toLowerCase().includes('mac');
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd shortcuts
      if (modifier) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          redo();
        } else if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          duplicateSelected();
        } else if (e.key === ']') {
          e.preventDefault();
          bringToFront();
        } else if (e.key === '[') {
          e.preventDefault();
          sendToBack();
        }
        return; // Skip drawing hotkeys when modifier is down
      }

      // Drawing Tool keys
      switch (e.key.toLowerCase()) {
        case 'v':
          setTool('select');
          break;
        case 'r':
          setTool('rectangle');
          break;
        case 'e':
        case 'o':
          setTool('ellipse');
          break;
        case 'l':
          setTool('line');
          break;
        case 'p':
          setTool('pen');
          break;
        case 'b':
          setTool('freehand');
          break;
        case 't':
          setTool('text');
          break;
        case 'h':
          setTool('hand');
          break;
        case 'z':
          setTool('zoom');
          break;
        case 'delete':
        case 'backspace':
          e.preventDefault();
          deleteSelected();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setTool, undo, redo, deleteSelected, duplicateSelected, bringToFront, sendToBack]);
}
