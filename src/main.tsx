import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress unhandled third-party extension injection errors in sandboxed preview contexts
try {
  const targetProperties = ['tronlinkParams', 'tronWeb', 'tronLink', 'tron', 'sunWeb'];

  targetProperties.forEach((prop) => {
    try {
      Object.defineProperty(window, prop, {
        value: {},
        writable: true,
        configurable: true,
        enumerable: true
      });
    } catch (e) {
      try {
        (window as any)[prop] = {};
      } catch (e2) {}
    }

    try {
      Object.defineProperty(Window.prototype, prop, {
        value: {},
        writable: true,
        configurable: true,
        enumerable: true
      });
    } catch (e) {}
  });
} catch (e) {
  // silent ignore
}

window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  const errorStr = event?.error?.toString() || '';
  if (
    msg.includes('tronlinkParams') || 
    msg.includes('set on proxy') || 
    msg.includes('trap returned falsish') ||
    msg.includes('tronLink') ||
    errorStr.includes('tronlinkParams') ||
    errorStr.includes('set on proxy')
  ) {
    event.stopImmediatePropagation();
    event.preventDefault();
    return true;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason?.message || '';
  if (
    reason.includes('tronlinkParams') || 
    reason.includes('set on proxy') ||
    reason.includes('trap returned falsish') ||
    reason.includes('tronLink')
  ) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
