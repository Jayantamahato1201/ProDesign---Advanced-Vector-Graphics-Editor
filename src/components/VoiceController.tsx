/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Shape } from '../types';
import { Mic, MicOff, Volume2, VolumeX, HelpCircle } from 'lucide-react';

export function VoiceController() {
  const { 
    shapes,
    canvas, 
    setCanvas, 
    addShape, 
    deleteSelected, 
    undo, 
    redo,
    pushHistory
  } = useStore();

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState('');
  const [showCommandsHelp, setShowCommandsHelp] = useState(false);
  const [micError, setMicError] = useState('');
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(() => localStorage.getItem('prodesign-speech-feedback') !== 'false');

  const recognitionRef = useRef<any>(null);
  const isListeningDesiredRef = useRef(false);

  useEffect(() => {
    const SpeechRecognitionClass = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      setIsSupported(true);
      const rec = new SpeechRecognitionClass();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setMicError('');
      };

      rec.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const speechText: string = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
        setTranscript(speechText);
        executeVoiceCommand(speechText);
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error', e);
        if (e.error === 'not-allowed') {
          isListeningDesiredRef.current = false;
          setIsListening(false);
          setMicError('Microphone blocked. Please grant microphone access in browser settings.');
        } else if (e.error === 'no-speech') {
          setMicError('No speech detected. Speak clearly into the microphone.');
        } else {
          setMicError(`Speech error: ${e.error}`);
        }
      };

      rec.onend = () => {
        if (isListeningDesiredRef.current) {
          try {
            // Restart standard speech session to recover from browser's auto-timeout behavior
            rec.start();
          } catch (err) {
            console.warn('Speech engine automatic restart failed:', err);
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  const announceSpeechAction = (msg: string) => {
    setLastCommand(msg);
    const liveRegion = document.getElementById('a11y-speak-region');
    if (liveRegion) {
      liveRegion.textContent = `Voice command: ${msg}`;
    }

    if (isSpeechEnabled && window.speechSynthesis) {
      // Clear speak queue to avoid voice overlay lag
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const executeVoiceCommand = (commandText: string) => {
    console.log('Voice Command received:', commandText);

    // Coordinate computation inside current pan center
    const viewportCenterX = -canvas.panX + (window.innerWidth / 2) / canvas.zoom - 100;
    const viewportCenterY = -canvas.panY + (window.innerHeight / 2) / canvas.zoom - 100;

    const text = commandText.trim().toLowerCase();

    if (
      text.includes('create rectangle') || 
      text.includes('add rectangle') || 
      text.includes('rectangle') || 
      text.includes('rect') ||
      text.includes('box') ||
      text.includes('add box')
    ) {
      const rectId = `rect-${Date.now()}`;
      const newRect: Shape = {
        id: rectId,
        name: 'Voice Rectangle',
        type: 'rectangle',
        x: Math.round(viewportCenterX),
        y: Math.round(viewportCenterY),
        width: 150,
        height: 100,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        fill: '#3b82f6',
        stroke: '#60a5fa',
        strokeWidth: 2,
        cornerRadius: 8,
      };
      addShape(newRect);
      announceSpeechAction('Created Rectangle shape');
    } 
    else if (
      text.includes('create circle') || 
      text.includes('add circle') || 
      text.includes('create ellipse') || 
      text.includes('circle') || 
      text.includes('ellipse') ||
      text.includes('oval')
    ) {
      const ellipseId = `ellipse-${Date.now()}`;
      const newEllipse: Shape = {
        id: ellipseId,
        name: 'Voice Circle',
        type: 'ellipse',
        x: Math.round(viewportCenterX),
        y: Math.round(viewportCenterY),
        width: 120,
        height: 120,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        fill: '#ec4899',
        stroke: '#f472b6',
        strokeWidth: 2,
      };
      addShape(newEllipse);
      announceSpeechAction('Created Circle shape');
    }
    else if (text.includes('zoom in') || text === 'zoom' || text === 'in') {
      setCanvas({ zoom: Math.min(canvas.zoom + 0.15, 3.0) });
      announceSpeechAction('Zoomed input perspective inward');
    }
    else if (text.includes('zoom out') || text === 'out') {
      setCanvas({ zoom: Math.max(canvas.zoom - 0.15, 0.2) });
      announceSpeechAction('Zoomed input perspective outward');
    }
    else if (text.includes('delete') || text.includes('remove') || text.includes('clear selection')) {
      deleteSelected();
      announceSpeechAction('Deleted active design selection');
    }
    else if (text.includes('undo') || text.includes('go back') || text.includes('back')) {
      undo();
      announceSpeechAction('Reverted last editing frame');
    }
    else if (text.includes('redo') || text.includes('forward')) {
      redo();
      announceSpeechAction('Restored forward history state');
    } else {
      // Suggest fallback
      setLastCommand(`Unrecognized command: "${commandText}"`);
    }
  };

  const toggleListen = () => {
    if (!recognitionRef.current) return;
    setMicError('');
    if (isListening) {
      isListeningDesiredRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('Speech stop error:', err);
      }
      setIsListening(false);
    } else {
      isListeningDesiredRef.current = true;
      try {
        setTranscript('');
        setLastCommand('');
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Speech engine conflict:', err);
        // Retry safety
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            if (isListeningDesiredRef.current) {
              try {
                recognitionRef.current.start();
              } catch (retryErr) {
                console.error(retryErr);
              }
            }
          }, 100);
        } catch (stopErr) {
          console.error(stopErr);
        }
      }
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/20 dark:bg-slate-900 border-t border-slate-700/10 text-xs text-slate-500 font-sans select-none shrink-0 h-10">
        <MicOff size={13} className="opacity-60" />
        <span className="font-medium text-[10px] tracking-wide uppercase">Voice recognition offline</span>
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center justify-between px-4 py-1.5 border-t select-none transition-colors duration-200 shrink-0 h-11 relative overflow-hidden backdrop-blur-md ${
        canvas.theme === 'dark' 
          ? 'bg-slate-950/90 border-slate-900 text-slate-300' 
          : 'bg-slate-100/90 border-slate-200 text-slate-700'
      }`}
      role="complementary"
      aria-label="Speech controller toolkit"
    >
      {/* Visual background gradient pulse layer */}
      {isListening && (
        <div className="absolute inset-0 bg-rose-500/5 pointer-events-none animate-pulse" />
      )}

      {/* Listening State Pill */}
      <div className="flex items-center gap-3 relative z-10">
        <div className="relative">
          {isListening && (
            <span className="absolute -inset-1 rounded-full bg-rose-500/50 blur animate-ping opacity-60" />
          )}
          <button
            onClick={toggleListen}
            className={`px-3.5 py-1.5 rounded-full flex items-center gap-2 text-[11px] font-sans font-black tracking-wider cursor-pointer transition-all shadow-md uppercase ${
              isListening
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-rose-500/20'
                : 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-cyan-500/15 hover:brightness-110 active:scale-[0.97]'
            }`}
            aria-label={isListening ? 'Stop listening to speech commands' : 'Start listening to speech commands'}
            aria-pressed={isListening}
          >
            {isListening ? (
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
              </span>
            ) : (
              <Mic size={11} className="animate-bounce" />
            )}
            {isListening ? 'LISTENING LIVE' : 'TAP TO SPEAK'}
          </button>
        </div>

        {/* Real-time speech result text boxes */}
        <div className="flex items-center gap-2 overflow-hidden max-w-sm md:max-w-md lg:max-w-lg">
          {micError ? (
            <span className="text-[10px] font-sans text-rose-400 font-semibold animate-pulse bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              ⚠️ {micError}
            </span>
          ) : transcript ? (
            <span className="text-[11px] font-mono bg-indigo-500/15 border border-indigo-400/20 px-2.5 py-0.5 rounded text-indigo-400 font-bold truncate tracking-wide">
              "{transcript}"
            </span>
          ) : (
            <span className="text-[10px] font-sans text-slate-400/90 font-medium">
              💡 Say "Create Rectangle", "Create Circle", "Zoom In", "Zoom Out", "Undo", "Redo"
            </span>
          )}

          {lastCommand && (
            <span className="text-[10px] font-sans text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-0.5 animate-bounce">
              ✓ {lastCommand}
            </span>
          )}
        </div>
      </div>

      {/* Commands Guidelines & TTS Config */}
      <div className="flex items-center gap-2 relative">
        {/* Toggle Speech Synthesis Voice feedback */}
        <button
          onClick={() => {
            const nextVal = !isSpeechEnabled;
            setIsSpeechEnabled(nextVal);
            localStorage.setItem('prodesign-speech-feedback', String(nextVal));
            if (nextVal && window.speechSynthesis) {
              window.speechSynthesis.cancel();
              const ut = new SpeechSynthesisUtterance("Audio speech synthesis active");
              window.speechSynthesis.speak(ut);
            }
          }}
          className={`p-1.5 rounded transition-all cursor-pointer ${
            isSpeechEnabled 
              ? 'text-cyan-400 hover:text-cyan-300 bg-cyan-500/10' 
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-850'
          }`}
          title={isSpeechEnabled ? "Mute Spoken Voice Actions" : "Unmute Spoken Voice Actions"}
          aria-label={isSpeechEnabled ? "Mute speech audio output" : "Unmute speech audio output"}
        >
          {isSpeechEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>

        <button
          onMouseEnter={() => setShowCommandsHelp(true)}
          onMouseLeave={() => setShowCommandsHelp(false)}
          onClick={() => setShowCommandsHelp(!showCommandsHelp)}
          className="text-slate-400 hover:text-cyan-400 p-1 flex items-center justify-center cursor-pointer"
          aria-label="Speech commands helpful overview menu"
        >
          <HelpCircle size={14} />
        </button>

        {showCommandsHelp && (
          <div className="absolute bottom-9 right-0 bg-slate-950 border border-slate-800 text-slate-100 text-[10px] p-3 rounded-lg shadow-2xl w-52 z-50 font-mono space-y-1.5 leading-relaxed">
            <div className="font-bold border-b pb-1 border-slate-800 text-cyan-400 uppercase text-xs">A11y Dictation Manual</div>
            <div>• "create rectangle"</div>
            <div>• "create circle"</div>
            <div>• "zoom in" | "zoom out"</div>
            <div>• "delete" (erase selected)</div>
            <div>• "undo" | "redo" (timeline steps)</div>
            <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-900 leading-normal">
              Continuous live speech recognition is active. Speaks actions via TTS when enabled.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
