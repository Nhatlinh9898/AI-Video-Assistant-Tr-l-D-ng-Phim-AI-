
export interface VideoClip {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  duration: number;
  resolution: string;
  contentAnalysis?: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: 'young' | 'middle' | 'old';
  emotion: string;
  voiceName: string;
}

export interface MusicOption {
  id: string;
  title: string;
  genre: string;
  mood: string;
  url: string;
}

export type AppStep = 'upload' | 'arrange' | 'voiceover' | 'music' | 'captions' | 'export';
