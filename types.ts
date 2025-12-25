
export type InstrumentType = 
  | 'piano' 
  | 'violin' 
  | 'organ' 
  | 'tuba' 
  | 'sax' 
  | 'straight-sax' 
  | 'keyboard' 
  | 'trumpet' 
  | 'flute' 
  | 'clarinet';

export interface Note {
  key: string;
  frequency: number;
  label: string;
  isBlack: boolean;
}

export interface TutorialNote {
  key: string;
  time: number;
  duration: number;
}

export interface InstrumentConfig {
  id: InstrumentType;
  name: string;
  icon: string;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  oscillatorType: OscillatorType;
}
