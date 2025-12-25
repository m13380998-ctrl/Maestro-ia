
import React from 'react';
import { Note } from '../types';

interface PianoKeyProps {
  note: Note;
  isPressed: boolean;
  isTutorialHighlighted: boolean;
  onMouseDown: () => void;
  onMouseUp: () => void;
}

const PianoKey: React.FC<PianoKeyProps> = ({ 
  note, 
  isPressed, 
  onMouseDown, 
  onMouseUp 
}) => {
  const baseClasses = `
    relative transition-all duration-75 cursor-pointer select-none
    ${note.isBlack 
      ? 'bg-zinc-950 w-10 h-36 -mx-5 z-20 border-x border-zinc-800 rounded-b-lg shadow-xl' 
      : 'bg-white w-16 h-full border-r border-zinc-200 z-10 rounded-b-xl'}
    ${isPressed ? 'key-active-hit !bg-amber-100' : ''}
    flex items-end justify-center pb-6
  `;

  return (
    <div 
      className={baseClasses}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={(e) => { e.preventDefault(); onMouseDown(); }}
      onTouchEnd={(e) => { e.preventDefault(); onMouseUp(); }}
    >
      {!note.isBlack && (
        <span className="text-zinc-300 text-[10px] font-black uppercase pointer-events-none tracking-tighter">
          {note.label}
        </span>
      )}
      {note.isBlack && isPressed && (
        <div className="absolute inset-0 bg-amber-500/20 rounded-b-lg"></div>
      )}
    </div>
  );
};

export default PianoKey;
