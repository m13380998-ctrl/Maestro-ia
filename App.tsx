
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Music, Play, Video, Volume2, Mic, MicOff, Settings, 
  Trophy, Flame, Target, Star, ChevronRight, Pause 
} from 'lucide-react';
import { NOTES, INSTRUMENTS } from './constants';
import { InstrumentConfig, Note, TutorialNote } from './types';
import { audioService } from './services/audioService';
import { getTutorialNotes } from './services/geminiService';
import { PitchDetector, getNoteFromFreq } from './services/pitchDetection';
import PianoKey from './components/PianoKey';

const App: React.FC = () => {
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentConfig>(INSTRUMENTS[0]);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [tutorialNotes, setTutorialNotes] = useState<TutorialNote[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<PitchDetector | null>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Sistema de Partículas e Notas Cadentes (Game Loop)
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameActive) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const KEY_WIDTH = canvas.width / (NOTES.filter(n => !n.isBlack).length);
    const PIXELS_PER_SECOND = 150;

    // Desenha as notas cadentes
    tutorialNotes.forEach(note => {
      const noteTime = note.time;
      const noteDuration = note.duration;
      const y = (noteTime - elapsed) * PIXELS_PER_SECOND + (canvas.height - 50);
      const height = noteDuration * PIXELS_PER_SECOND;

      // Encontra a posição X da nota
      const noteObj = NOTES.find(n => n.key === note.key);
      if (!noteObj) return;

      const whiteNotesBefore = NOTES.filter(n => !n.isBlack && NOTES.indexOf(n) < NOTES.indexOf(noteObj)).length;
      let x = whiteNotesBefore * KEY_WIDTH;
      let width = KEY_WIDTH;

      if (noteObj.isBlack) {
        x += KEY_WIDTH * 0.7;
        width = KEY_WIDTH * 0.6;
      }

      // Estilo da nota cadente (Simply Piano Style)
      if (y < canvas.height && y + height > 0) {
        const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
        gradient.addColorStop(0, '#f59e0b');
        gradient.addColorStop(1, '#d97706');
        
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
        
        // Arredondar cantos da nota
        const radius = 8;
        ctx.beginPath();
        ctx.roundRect(x + 2, y, width - 4, height, radius);
        ctx.fill();
        
        // Verifica colisão (Hit Zone)
        if (Math.abs(y - (canvas.height - 50)) < 10) {
           // Lógica de "Hit" automático ou via entrada
        }
      }
    });

    animationRef.current = requestAnimationFrame(drawGame);
  }, [gameActive, tutorialNotes]);

  useEffect(() => {
    if (gameActive) {
      startTimeRef.current = Date.now();
      drawGame();
    } else {
      cancelAnimationFrame(animationRef.current);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [gameActive, drawGame]);

  // Escutar Microfone
  const toggleListening = async () => {
    if (isListening) {
      detectorRef.current?.stop();
      setIsListening(false);
    } else {
      detectorRef.current = new PitchDetector();
      await detectorRef.current.start((freq) => {
        const note = getNoteFromFreq(freq);
        // Feedback visual se a nota do mic bater com a nota do tutorial
        console.log("Detectado:", note);
      });
      setIsListening(true);
    }
  };

  const startLesson = async () => {
    if (!youtubeUrl) return;
    setIsLoading(true);
    const notes = await getTutorialNotes(youtubeUrl);
    setTutorialNotes(notes);
    setIsLoading(false);
    setGameActive(true);
    setScore(0);
    setCombo(0);
  };

  return (
    <div className="h-screen w-full bg-[#050505] flex flex-col overflow-hidden">
      {/* Top Bar - Premium Glassmorphism */}
      <nav className="h-20 shrink-0 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Music className="text-black w-6 h-6" strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-cinzel font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-500">
            MAESTRO PRO
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-8 px-6 py-2 bg-white/5 rounded-full border border-white/10">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="font-mono text-amber-100">{score.toString().padStart(6, '0')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-mono text-orange-100">{combo}x</span>
            </div>
          </div>
          
          <button 
            onClick={toggleListening}
            className={`p-3 rounded-full transition-all ${isListening ? 'bg-amber-500 text-black' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
          >
            {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          
          <button className="p-3 bg-white/5 rounded-full text-zinc-400 hover:text-white">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Main Game Area */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {/* URL Input Bar */}
        {!gameActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40 backdrop-blur-md">
            <div className="w-full max-w-lg p-8 bg-zinc-900/50 rounded-3xl border border-white/10 shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <Star className="w-12 h-12 text-amber-500 mx-auto" />
                <h2 className="text-3xl font-cinzel font-bold">Inicie sua Lição</h2>
                <p className="text-zinc-400">Cole uma música do YouTube para a IA criar seu arranjo.</p>
              </div>
              
              <div className="space-y-4">
                <div className="relative group">
                  <Video className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                  <input 
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="youtube.com/watch?v=..."
                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-white"
                  />
                </div>
                <button 
                  onClick={startLesson}
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl font-bold text-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {isLoading ? <span className="animate-spin text-2xl">⏳</span> : <Play fill="currentColor" />}
                  COMEÇAR ACADEMIA
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Visualizer Canvas */}
        <div className="flex-1 game-canvas-container relative">
          <canvas 
            ref={canvasRef} 
            width={1200} 
            height={600}
            className="w-full h-full object-cover pointer-events-none"
          />
          
          {/* Instrument Quick Switcher */}
          <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-3">
             {INSTRUMENTS.slice(0, 5).map(inst => (
               <button
                 key={inst.id}
                 onClick={() => setSelectedInstrument(inst)}
                 className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all border ${
                   selectedInstrument.id === inst.id 
                    ? 'bg-amber-500 border-amber-300 scale-110 shadow-xl shadow-amber-500/20' 
                    : 'bg-black/40 border-white/10 grayscale hover:grayscale-0'
                 }`}
               >
                 {inst.icon}
               </button>
             ))}
          </div>
        </div>

        {/* Piano Interaction Layer */}
        <div className="h-64 shrink-0 bg-zinc-900 p-2 relative">
          <div className="absolute -top-1 left-0 right-0 h-1 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,1)] z-30"></div>
          <div className="flex h-full bg-zinc-800 rounded-xl overflow-hidden shadow-inner border border-white/5">
             {NOTES.map((note) => (
              <PianoKey
                key={note.key}
                note={note}
                isPressed={pressedKeys.has(note.key)}
                isTutorialHighlighted={false} // Usado agora pelo canvas
                onMouseDown={() => {
                  setPressedKeys(prev => new Set(prev).add(note.key));
                  audioService.playNote(note.frequency, selectedInstrument, note.key);
                }}
                onMouseUp={() => {
                  setPressedKeys(prev => {
                    const next = new Set(prev);
                    next.delete(note.key);
                    return next;
                  });
                  audioService.stopNote(note.key, selectedInstrument);
                }}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Control Footer */}
      <footer className="h-14 shrink-0 bg-black border-t border-white/5 flex items-center justify-between px-8 text-xs font-semibold text-zinc-500 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <Target className="w-3 h-3 text-amber-500" /> Precisão: 98%
          </span>
          <span className="w-px h-4 bg-zinc-800"></span>
          <span className="flex items-center gap-2">
            <Volume2 className="w-3 h-3" /> Timbre: {selectedInstrument.name}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
           <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20">
             Gemini-3 Orchestration Engine
           </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
