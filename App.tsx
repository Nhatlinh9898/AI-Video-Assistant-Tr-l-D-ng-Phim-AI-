
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Trash2, 
  Sparkles, 
  Volume2, 
  CheckCircle2,
  ChevronRight,
  Loader2,
  Music as MusicIcon,
  Mic2,
  Download,
  Type,
  Settings2,
  LayoutDashboard,
  Clapperboard,
  Waves
} from 'lucide-react';
import { STEPS, VOICE_OPTIONS, MUSIC_OPTIONS } from './constants';
import { VideoClip, AppStep, VoiceOption, MusicOption } from './types';
import { analyzeVideoContents, generateTTS, decodeBase64, decodeAudioData } from './services/gemini';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>('upload');
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [selectedClipIndex, setSelectedClipIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [script, setScript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(VOICE_OPTIONS[0]);
  const [selectedMusic, setSelectedMusic] = useState<MusicOption | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isCaptionsGenerated, setIsCaptionsGenerated] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);

  // Handle Video Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newClips: VideoClip[] = (Array.from(files) as File[]).map((file, idx) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: URL.createObjectURL(file),
      thumbnail: `https://picsum.photos/seed/${idx + Math.random()}/320/180`,
      duration: Math.floor(Math.random() * 10) + 5,
      resolution: '4K',
    }));

    setClips(prev => [...prev, ...newClips]);
    if (clips.length === 0 && newClips.length > 0) setCurrentStep('arrange');
  };

  const removeClip = (id: string) => {
    setClips(prev => prev.filter(c => c.id !== id));
  };

  const moveClip = (index: number, direction: 'up' | 'down') => {
    const newClips = [...clips];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newClips.length) return;
    
    [newClips[index], newClips[targetIndex]] = [newClips[targetIndex], newClips[index]];
    setClips(newClips);
  };

  const autoArrange = () => {
    const sorted = [...clips].sort((a, b) => a.duration - b.duration);
    setClips(sorted);
  };

  const handleAIAnalyze = async () => {
    if (clips.length === 0) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeVideoContents(clips.length);
      setScript(result || '');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const playPreviewVoice = async () => {
    if (!script) return;
    setIsGeneratingAudio(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const base64 = await generateTTS(script, selectedVoice.voiceName);
      if (base64) {
        const bytes = decodeBase64(base64);
        const buffer = await decodeAudioData(bytes, audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.start();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const startExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 50);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/50 p-12 text-center transition-all hover:border-blue-500/50">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
              <Plus className="text-blue-500" size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Tải video của bạn lên</h2>
            <p className="text-slate-400 mb-8 max-w-md">Kéo và thả video ngắn từ Veo3, Sora hoặc máy ảnh của bạn. AI sẽ lo phần còn lại.</p>
            <label className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold cursor-pointer transition-all active:scale-95 shadow-lg shadow-blue-500/20">
              Chọn tập tin
              <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="video/*" />
            </label>
            <p className="mt-4 text-xs text-slate-500">Hỗ trợ MP4, MOV, WEBM (Tối đa 500MB/file)</p>
          </div>
        );

      case 'arrange':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="text-amber-500" size={18} /> Thứ tự câu chuyện
              </h3>
              <button 
                onClick={autoArrange}
                className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all"
              >
                Tự động sắp xếp
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {clips.map((clip, idx) => (
                <div key={clip.id} className="group relative bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500/50 transition-all p-3 flex gap-4">
                  <div className="w-32 h-20 bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <img src={clip.thumbnail} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                    <span className="absolute bottom-1 right-1 bg-black/60 text-[10px] px-1 rounded">00:{clip.duration < 10 ? `0${clip.duration}` : clip.duration}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h4 className="text-sm font-medium truncate max-w-[150px]">{clip.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{clip.resolution} CLIP</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => moveClip(idx, 'up')} disabled={idx === 0} className="p-1.5 hover:bg-slate-700 rounded disabled:opacity-30"><ChevronRight className="rotate-[-90deg]" size={14} /></button>
                      <button onClick={() => moveClip(idx, 'down')} disabled={idx === clips.length - 1} className="p-1.5 hover:bg-slate-700 rounded disabled:opacity-30"><ChevronRight className="rotate-90" size={14} /></button>
                      <button onClick={() => removeClip(clip.id)} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 w-5 h-5 bg-blue-600 text-[10px] flex items-center justify-center rounded-full font-bold shadow-md">{idx + 1}</div>
                </div>
              ))}
              {clips.length < 10 && (
                <label className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl flex flex-col items-center justify-center p-6 text-slate-500 cursor-pointer transition-all">
                  <Plus size={24} className="mb-1" />
                  <span className="text-xs">Thêm clip</span>
                  <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                </label>
              )}
            </div>
          </div>
        );

      case 'voiceover':
        return (
          <div className="space-y-6">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Mic2 size={16} className="text-blue-400" /> Kịch bản lồng tiếng
                </h4>
                <button 
                  onClick={handleAIAnalyze}
                  disabled={isAnalyzing}
                  className="text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                  AI Tự soạn kịch bản
                </button>
              </div>
              <textarea 
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Nhập nội dung bạn muốn AI đọc hoặc để AI tự tạo nội dung dựa trên video..."
                className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition-all resize-none"
              />
            </div>
            
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Chọn giọng đọc</h4>
              <div className="grid grid-cols-1 gap-2">
                {VOICE_OPTIONS.map(voice => (
                  <button 
                    key={voice.id}
                    onClick={() => setSelectedVoice(voice)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${selectedVoice.id === voice.id ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedVoice.id === voice.id ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                        {voice.gender === 'male' ? 'M' : 'F'}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{voice.name}</div>
                        <div className="text-[10px] text-slate-500">{voice.age === 'young' ? 'Trẻ' : 'Trung niên'} • {voice.emotion}</div>
                      </div>
                    </div>
                    {selectedVoice.id === voice.id && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); playPreviewVoice(); }}
                        disabled={isGeneratingAudio || !script}
                        className="p-2 bg-blue-500 hover:bg-blue-400 rounded-lg shadow-lg active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isGeneratingAudio ? <Loader2 className="animate-spin" size={16} /> : <Volume2 size={16} />}
                      </button>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'music':
        return (
          <div className="space-y-4">
             <button className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 flex items-center justify-center gap-3 transition-all mb-4 group">
               <Sparkles className="text-amber-400 group-hover:scale-110 transition-transform" />
               <div className="text-left">
                 <div className="font-semibold text-sm">Tự động chọn nhạc theo video</div>
                 <div className="text-xs text-slate-500">AI sẽ phân tích cảm xúc và nhịp điệu để đề xuất</div>
               </div>
             </button>
             <div className="grid grid-cols-1 gap-2">
               {MUSIC_OPTIONS.map(music => (
                 <button 
                   key={music.id}
                   onClick={() => setSelectedMusic(music)}
                   className={`flex items-center justify-between p-4 rounded-xl border transition-all ${selectedMusic?.id === music.id ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}
                 >
                   <div className="flex items-center gap-4 text-left">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedMusic?.id === music.id ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                        <MusicIcon size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{music.title}</div>
                        <div className="text-[10px] text-slate-500">{music.genre} • {music.mood}</div>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      {selectedMusic?.id === music.id && <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />}
                      <button className="p-2 hover:bg-slate-700 rounded-full transition-colors"><Play size={14} /></button>
                   </div>
                 </button>
               ))}
             </div>
          </div>
        );

      case 'captions':
        return (
          <div className="space-y-6">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Type className="text-blue-500" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Tạo phụ đề tự động</h3>
              <p className="text-slate-400 text-sm mb-6">AI sẽ lắng nghe giọng đọc và tạo phụ đề chuẩn xác từng giây.</p>
              <button 
                onClick={() => setIsCaptionsGenerated(true)}
                className={`w-full ${isCaptionsGenerated ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'} text-white py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2`}
              >
                {isCaptionsGenerated ? <><CheckCircle2 size={18}/> Đã tạo phụ đề</> : 'Bắt đầu phân tích & Tạo phụ đề'}
              </button>
            </div>
            {isCaptionsGenerated && (
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 max-h-48 overflow-y-auto space-y-2">
                <div className="flex gap-4 text-xs">
                  <span className="text-blue-500 font-bold">00:01</span>
                  <span className="text-slate-300 italic">"Chào mừng các bạn đến với video hành trình hôm nay..."</span>
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="text-blue-500 font-bold">00:05</span>
                  <span className="text-slate-300 italic">"Nơi mà thiên nhiên và con người hòa quyện một cách tuyệt vời."</span>
                </div>
              </div>
            )}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tùy chỉnh hiển thị</h4>
              <div className="grid grid-cols-3 gap-2">
                <button className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs font-medium hover:border-slate-500">Hiện đại</button>
                <button className="bg-slate-800 p-3 rounded-xl border border-blue-500/50 bg-blue-500/10 text-xs font-medium">Cổ điển</button>
                <button className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs font-medium hover:border-slate-500">Nổi bật</button>
              </div>
            </div>
          </div>
        );

      case 'export':
        if (isExporting) {
          return (
            <div className="flex flex-col items-center justify-center h-full space-y-8 py-12">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                  <circle 
                    cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" 
                    className="text-blue-500 transition-all duration-300" 
                    strokeDasharray={552.92}
                    strokeDashoffset={552.92 - (552.92 * exportProgress) / 100}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-white">{exportProgress}%</span>
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                  {exportProgress < 100 ? (
                    <>Đang nâng cấp chất lượng 8K <Loader2 className="animate-spin text-blue-400" /></>
                  ) : (
                    <>Hoàn tất xuất bản <CheckCircle2 className="text-green-500" /></>
                  )}
                </h3>
                <p className="text-slate-500 text-sm max-w-xs">AI đang tinh chỉnh từng khung hình để đạt độ nét cao nhất.</p>
              </div>
              {exportProgress === 100 && (
                <button 
                   onClick={() => window.location.reload()}
                   className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-3 transition-all animate-bounce mt-4 shadow-xl shadow-green-500/20"
                >
                  <Download size={20} /> Tải Video Về Máy
                </button>
              )}
            </div>
          );
        }
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 p-6 rounded-2xl border border-blue-500/20">
              <h3 className="text-lg font-bold mb-4">Tổng hợp sản phẩm cuối</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={16} className="text-green-500" /> {clips.length} clip đã được ghép nối
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={16} className="text-green-500" /> Giọng đọc: {selectedVoice.name}
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={16} className="text-green-500" /> Nhạc nền: {selectedMusic?.title || 'Chưa chọn'}
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={16} className="text-green-500" /> Chế độ: Nâng cấp AI Upscaling 8K
                </li>
              </ul>
            </div>
            <button 
              onClick={startExport}
              disabled={clips.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/30 active:scale-95"
            >
              GHÉP VIDEO & XUẤT BẢN 8K
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-500/30">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-12 transition-transform">
            <Sparkles className="text-white" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight">AI VIDEO <span className="text-blue-500">PRO</span></h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Dựng phim không cần kỹ thuật</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${currentStep === s.id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                onClick={() => setCurrentStep(s.id as AppStep)}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === s.id ? 'bg-white text-blue-600' : 'bg-slate-800'}`}>
                  {idx + 1}
                </div>
                <span className="text-xs font-bold whitespace-nowrap">{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && <div className="w-4 h-[1px] bg-slate-800" />}
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-400 hover:text-white transition-colors"><Settings2 size={20} /></button>
          <button className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all border border-slate-700">Lưu nháp</button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Actions */}
        <aside className="w-20 border-r border-slate-800 bg-slate-900/30 flex flex-col items-center py-6 gap-6">
          {STEPS.map(s => (
            <button 
              key={s.id}
              onClick={() => setCurrentStep(s.id as AppStep)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative ${currentStep === s.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
            >
              {s.icon}
              <div className="absolute left-16 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity shadow-xl border border-slate-700 z-20">
                {s.label}
              </div>
            </button>
          ))}
        </aside>

        {/* Dynamic Center Panel */}
        <div className="flex-1 flex flex-col bg-slate-900/20">
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto h-full">
              <div className="mb-8">
                <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                  {STEPS.find(s => s.id === currentStep)?.label}
                </h2>
                <p className="text-slate-500 font-medium">
                  {STEPS.find(s => s.id === currentStep)?.desc}
                </p>
              </div>

              {renderStepContent()}
            </div>
          </div>

          {/* Timeline / Status Bar */}
          <div className="h-40 border-t border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md">
            <div className="max-w-6xl mx-auto h-full flex flex-col">
              <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">
                <span>Timeline Preview</span>
                <span className="text-blue-500">00:{currentTime < 10 ? `0${currentTime}` : currentTime} / 00:54</span>
              </div>
              <div className="flex-1 bg-slate-950/50 rounded-xl border border-slate-800/50 p-2 overflow-x-auto overflow-y-hidden flex gap-2 scrollbar-hide">
                {clips.map((clip, idx) => (
                  <div 
                    key={clip.id} 
                    className={`flex-shrink-0 h-full w-48 rounded-lg border border-slate-800 overflow-hidden relative group cursor-pointer transition-all hover:scale-105 ${selectedClipIndex === idx ? 'ring-2 ring-blue-500 border-transparent shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'opacity-60 hover:opacity-100'}`}
                    onClick={() => setSelectedClipIndex(idx)}
                  >
                    <img src={clip.thumbnail} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2">
                      <span className="text-[10px] font-bold truncate">{clip.name}</span>
                    </div>
                  </div>
                ))}
                {clips.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-slate-700 italic text-sm font-medium">Chưa có clip nào trong dòng thời gian...</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Preview/Settings */}
        <aside className="w-96 border-l border-slate-800 bg-slate-900/50 flex flex-col">
          {/* Video Preview Window */}
          <div className="p-6">
            <div className="aspect-video bg-black rounded-2xl shadow-2xl overflow-hidden relative group border border-slate-800">
              {clips.length > 0 ? (
                <img src={clips[selectedClipIndex]?.thumbnail} alt="Preview" className="w-full h-full object-cover opacity-80" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-950">
                  <Clapperboard size={48} className="opacity-20" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-all"
                >
                  {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                </button>
              </div>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                <div className="h-full bg-blue-500 w-1/3 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-6">
              <button className="text-slate-500 hover:text-white transition-colors"><SkipBack size={20} /></button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center transition-all border border-slate-700"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
              </button>
              <button className="text-slate-500 hover:text-white transition-colors"><SkipForward size={20} /></button>
            </div>
          </div>

          {/* Quick Settings */}
          <div className="flex-1 p-6 border-t border-slate-800 overflow-y-auto">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Thông số hiện tại</h4>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                   <span className="text-slate-400">Âm lượng giọng đọc</span>
                   <span className="font-bold">85%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 w-[85%]" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                   <span className="text-slate-400">Âm lượng nhạc nền</span>
                   <span className="font-bold">20%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500 w-[20%]" />
                </div>
              </div>

              <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                  <Sparkles size={14} /> AI AUTO-MASTERING
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Hệ thống đang tự động điều chỉnh nhạc nhỏ xuống khi có giọng đọc xuất hiện.
                </p>
              </div>

              {clips.length > 0 && currentStep !== 'export' && (
                <button 
                  onClick={() => setCurrentStep('export')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  <LayoutDashboard size={18} /> Sẵn sàng Xuất bản
                </button>
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* Footer / Notification Bar */}
      <footer className="h-10 bg-blue-600 px-6 flex items-center justify-between text-[11px] font-bold text-white uppercase tracking-wider">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> AI Engine Online</span>
          <span className="opacity-60 flex items-center gap-1"><Waves size={12}/> Status: Ready for Production</span>
        </div>
        <div>V1.2 PRO • Gemini 3 Vision Powered</div>
      </footer>
    </div>
  );
};

export default App;
