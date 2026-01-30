
import React from 'react';
import { 
  Upload, 
  Layers, 
  Mic2, 
  Music, 
  Type, 
  Download, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Trash2,
  MoveLeft,
  MoveRight,
  Sparkles,
  Settings2,
  Volume2
} from 'lucide-react';
import { VoiceOption, MusicOption } from './types';

export const STEPS = [
  { id: 'upload', label: 'Tải video', icon: <Upload size={20} />, desc: 'Bắt đầu bằng việc tải các clip ngắn của bạn.' },
  { id: 'arrange', label: 'Sắp xếp', icon: <Layers size={20} />, desc: 'Kéo thả để tạo mạch truyện logic.' },
  { id: 'voiceover', label: 'Giọng đọc', icon: <Mic2 size={20} />, desc: 'AI sẽ đọc kịch bản cho video của bạn.' },
  { id: 'music', label: 'Nhạc nền', icon: <Music size={20} />, desc: 'Chọn giai điệu phù hợp với cảm xúc.' },
  { id: 'captions', label: 'Phụ đề', icon: <Type size={20} />, desc: 'Tự động tạo chữ chạy khớp lời nói.' },
  { id: 'export', label: 'Xuất bản', icon: <Download size={20} />, desc: 'Nâng cấp 8K và lưu tác phẩm.' },
];

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'v1', name: 'Thanh Hà', gender: 'female', age: 'young', emotion: 'Trầm ấm', voiceName: 'Kore' },
  { id: 'v2', name: 'Minh Đức', gender: 'male', age: 'young', emotion: 'Mạnh mẽ', voiceName: 'Puck' },
  { id: 'v3', name: 'Hồng Vân', gender: 'female', age: 'middle', emotion: 'Truyền cảm', voiceName: 'Charon' },
  { id: 'v4', name: 'Gia Bảo', gender: 'male', age: 'middle', emotion: 'Nghiêm túc', voiceName: 'Fenrir' },
  { id: 'v5', name: 'Linh Chi', gender: 'female', age: 'young', emotion: 'Vui vẻ', voiceName: 'Zephyr' },
];

export const MUSIC_OPTIONS: MusicOption[] = [
  { id: 'm1', title: 'Sunshine Walk', genre: 'Acoustic', mood: 'Vui tươi', url: '' },
  { id: 'm2', title: 'Deep Ocean', genre: 'Ambient', mood: 'Nhẹ nhàng', url: '' },
  { id: 'm3', title: 'City Lights', genre: 'Lo-fi', mood: 'Thư giãn', url: '' },
  { id: 'm4', title: 'Epic Journey', genre: 'Cinematic', mood: 'Hào hùng', url: '' },
  { id: 'm5', title: 'Midnight Chill', genre: 'Jazz', mood: 'Sang trọng', url: '' },
];
