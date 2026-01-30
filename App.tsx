import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  ChevronsRight, 
  ChevronsLeft,
  Settings,
  Target,
  ArrowDownToLine,
  ArrowUpFromLine,
  Trash2,
  Clock,
  Ruler,
  Users,
  History,
  Share2,
  Plus,
  MapPin,
  X,
  UserPlus
} from 'lucide-react';
import { DraggableLine } from './components/DraggableLine';
import { calculateJumpHeight, formatTime } from './utils/physics';
import { PlaybackSpeed, UserProfile, JumpRecord, ReferenceLineData, VideoMarker } from './types';

// Helper for local storage
const generateId = () => Math.random().toString(36).substr(2, 9);

export const App: React.FC = () => {
  // Video State
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [fps, setFps] = useState<number>(60);
  const [containerHeight, setContainerHeight] = useState(0);

  // Analysis State
  const [takeOffTime, setTakeOffTime] = useState<number | null>(null);
  const [landingTime, setLandingTime] = useState<number | null>(null);
  const [lines, setLines] = useState<ReferenceLineData[]>([
    { id: 'default', topPercent: 50, color: 'white' }
  ]);
  const [markers, setMarkers] = useState<VideoMarker[]>([]);

  // User & History State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [jumpHistory, setJumpHistory] = useState<JumpRecord[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialization
  useEffect(() => {
    // Load users
    const storedUsers = localStorage.getItem('jumplab_users');
    if (storedUsers) {
      const parsedUsers = JSON.parse(storedUsers);
      setUsers(parsedUsers);
      if (parsedUsers.length > 0) {
        setCurrentUser(parsedUsers[0]);
      }
    } else {
      // Create default guest user
      const guest = { id: generateId(), name: 'Guest', createdAt: Date.now() };
      setUsers([guest]);
      setCurrentUser(guest);
      localStorage.setItem('jumplab_users', JSON.stringify([guest]));
    }

    // Load history
    const storedHistory = localStorage.getItem('jumplab_history');
    if (storedHistory) {
      setJumpHistory(JSON.parse(storedHistory));
    }
  }, []);

  // Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setTakeOffTime(null);
      setLandingTime(null);
      setMarkers([]);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const stepFrames = useCallback((frames: number) => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      const frameTime = 1 / fps;
      const newTime = Math.min(Math.max(0, videoRef.current.currentTime + (frames * frameTime)), videoRef.current.duration);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [fps]);

  // Lines Management
  const addLine = () => {
    const colors = ['red', 'blue', 'green', 'yellow'];
    const nextColor = colors[lines.length % colors.length];
    setLines([...lines, { id: generateId(), topPercent: 40 + (lines.length * 5), color: nextColor }]);
  };

  const removeLine = (id: string) => {
    setLines(lines.filter(l => l.id !== id));
  };

  // Markers Management
  const addMarker = () => {
    const newMarker: VideoMarker = {
      id: generateId(),
      time: currentTime,
      label: `Mark ${markers.length + 1}`
    };
    setMarkers([...markers, newMarker].sort((a, b) => a.time - b.time));
  };

  const removeMarker = (id: string) => {
    setMarkers(markers.filter(m => m.id !== id));
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      setIsPlaying(false);
      videoRef.current.pause();
    }
  };

  // User Management
  const handleCreateUser = () => {
    if (!newUserName.trim()) return;
    const newUser: UserProfile = {
      id: generateId(),
      name: newUserName,
      createdAt: Date.now()
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setCurrentUser(newUser);
    localStorage.setItem('jumplab_users', JSON.stringify(updatedUsers));
    setNewUserName('');
    setIsUserModalOpen(false);
  };

  const handleSwitchUser = (user: UserProfile) => {
    setCurrentUser(user);
    setIsUserModalOpen(false);
  };

  // History & Saving
  const flightTime = (takeOffTime !== null && landingTime !== null) 
    ? Math.max(0, landingTime - takeOffTime) 
    : 0;
  
  const jumpHeight = flightTime > 0 ? calculateJumpHeight(flightTime) : 0;

  const saveResult = () => {
    if (!currentUser || flightTime <= 0) return;
    
    const record: JumpRecord = {
      id: generateId(),
      userId: currentUser.id,
      date: Date.now(),
      heightCm: jumpHeight,
      flightTime: flightTime
    };
    
    const updatedHistory = [record, ...jumpHistory];
    setJumpHistory(updatedHistory);
    localStorage.setItem('jumplab_history', JSON.stringify(updatedHistory));
    alert('計測結果を保存しました');
  };

  const deleteHistoryItem = (id: string) => {
    const updatedHistory = jumpHistory.filter(h => h.id !== id);
    setJumpHistory(updatedHistory);
    localStorage.setItem('jumplab_history', JSON.stringify(updatedHistory));
  };

  // Social Share
  const shareResult = async () => {
    const text = `JumpLabで垂直跳びを計測しました！\n記録: ${jumpHeight.toFixed(1)}cm (滞空時間: ${flightTime.toFixed(3)}秒)\n#JumpLab #VerticalJump`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'JumpLab Result',
          text: text,
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('結果をクリップボードにコピーしました！');
    }
  };

  // Resize Observer
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.offsetHeight);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [videoSrc]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col items-center">
      {/* Header */}
      <header className="w-full bg-slate-800 border-b border-slate-700 p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <ArrowUpFromLine size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">JumpLab <span className="text-slate-400 font-light text-sm ml-2">Vertical Jump Analyzer</span></h1>
            <h1 className="text-xl font-bold tracking-tight block sm:hidden">JumpLab</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* User Selector */}
            <button 
              onClick={() => setIsUserModalOpen(true)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-md transition-colors text-sm"
            >
              <Users size={16} />
              <span className="max-w-[100px] truncate">{currentUser?.name || 'User'}</span>
            </button>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
            >
              <Upload size={18} />
              <span className="hidden sm:inline">動画を選択</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="video/*" 
              className="hidden" 
            />
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Video Player */}
        <div className="flex-1 flex flex-col gap-4">
          <div 
            ref={containerRef}
            className="relative bg-black rounded-xl overflow-hidden shadow-2xl aspect-video border border-slate-700 flex items-center justify-center group"
          >
            {!videoSrc ? (
              <div className="text-center p-8 text-slate-500">
                <Upload size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">動画ファイルをアップロードしてください</p>
                <p className="text-sm mt-2">MP4, MOV, WebM 対応</p>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef}
                  src={videoSrc}
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  playsInline
                  onEnded={() => setIsPlaying(false)}
                />
                
                {/* Reference Lines */}
                {lines.map((line) => (
                  <DraggableLine 
                    key={line.id}
                    id={line.id}
                    containerHeight={containerHeight} 
                    initialTopPercent={line.topPercent}
                    color={line.color}
                    onDelete={lines.length > 1 ? removeLine : undefined}
                  />
                ))}
                
                {/* Play Overlay */}
                {!isPlaying && videoSrc && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none"
                    onClick={togglePlay}
                  >
                    <div className="bg-black/40 backdrop-blur-sm p-4 rounded-full pointer-events-auto cursor-pointer hover:bg-black/60 transition-all hover:scale-110">
                       <Play size={32} fill="currentColor" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Player Controls */}
          {videoSrc && (
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
              
              {/* Timeline */}
              <div className="mb-4 flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 w-16">{formatTime(currentTime)}</span>
                <input 
                  type="range" 
                  min="0" 
                  max={duration} 
                  step="0.001"
                  value={currentTime}
                  onChange={(e) => {
                    const time = parseFloat(e.target.value);
                    if (videoRef.current) videoRef.current.currentTime = time;
                    setCurrentTime(time);
                  }}
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                />
                <span className="text-xs font-mono text-slate-400 w-16 text-right">{formatTime(duration)}</span>
              </div>

              {/* Markers Indicators on Timeline track could go here visually, but simple list is cleaner for now */}

              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Transport Controls */}
                <div className="flex items-center gap-2">
                  <button onClick={() => stepFrames(-10)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300" title="-10フレーム">
                    <ChevronsLeft size={20} />
                  </button>
                  <button onClick={() => stepFrames(-1)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300" title="-1フレーム">
                    <SkipBack size={20} />
                  </button>
                  
                  <button 
                    onClick={togglePlay} 
                    className="w-12 h-12 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg transition-transform active:scale-95"
                  >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                  </button>

                  <button onClick={() => stepFrames(1)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300" title="+1フレーム">
                    <SkipForward size={20} />
                  </button>
                  <button onClick={() => stepFrames(10)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300" title="+10フレーム">
                    <ChevronsRight size={20} />
                  </button>
                </div>

                {/* Speed Control */}
                <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg">
                  <span className="text-xs text-slate-400 px-2">速度</span>
                  <select 
                    value={playbackRate} 
                    onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                    className="bg-transparent text-sm font-medium text-indigo-400 focus:outline-none cursor-pointer"
                  >
                    {Object.values(PlaybackSpeed).filter(v => typeof v === 'number').map((rate) => (
                      <option key={rate} value={rate}>x{rate}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Markers Section */}
          {videoSrc && (
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
               <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin size={18} />
                    <h2 className="font-semibold text-sm">ポイントマーカー</h2>
                  </div>
                  <button 
                    onClick={addMarker}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                  >
                    <Plus size={12} />
                    現在地をマーク
                  </button>
               </div>
               
               {markers.length > 0 ? (
                 <div className="flex flex-wrap gap-2">
                    {markers.map(marker => (
                      <div key={marker.id} className="group bg-slate-900 border border-slate-700 rounded-md pl-3 pr-1 py-1 flex items-center gap-2">
                        <button onClick={() => seekTo(marker.time)} className="text-xs font-mono text-indigo-400 hover:text-indigo-300">
                           {formatTime(marker.time)}
                        </button>
                        <button onClick={() => removeMarker(marker.id)} className="p-1 text-slate-500 hover:text-red-400 rounded">
                           <X size={12} />
                        </button>
                      </div>
                    ))}
                 </div>
               ) : (
                 <p className="text-xs text-slate-500">マーカーを追加して重要な瞬間を記録できます</p>
               )}
            </div>
          )}
        </div>

        {/* Right Column: Controls & Results */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          
          {/* Settings Panel */}
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-lg">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2 text-slate-300">
                 <Settings size={18} />
                 <h2 className="font-semibold">設定</h2>
               </div>
               {/* Add Line Button */}
               <button 
                 onClick={addLine}
                 className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                 title="基準線を追加"
               >
                 <Plus size={14} />
                 基準線追加
               </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">フレームレート (FPS)</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={fps} 
                    onChange={(e) => setFps(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <div className="flex gap-1">
                    {[30, 60, 120, 240].map(val => (
                      <button 
                        key={val}
                        onClick={() => setFps(val)}
                        className={`px-2 py-1 text-xs rounded border ${fps === val ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-600 text-slate-400 hover:border-slate-500'}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-lg">
            <div className="flex items-center gap-2 mb-4 text-slate-300">
              <Target size={18} />
              <h2 className="font-semibold">計測ツール</h2>
            </div>

            <div className="space-y-4">
              {/* Take Off Button */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-400">1. 離地 (Take Off)</span>
                  {takeOffTime !== null && (
                     <button onClick={() => seekTo(takeOffTime)} className="text-xs font-mono text-emerald-400 hover:underline">{formatTime(takeOffTime)}</button>
                  )}
                </div>
                <button 
                  onClick={() => setTakeOffTime(currentTime)}
                  disabled={!videoSrc}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all text-sm ${
                    takeOffTime !== null 
                      ? 'bg-slate-800 border-emerald-500/50 text-emerald-400' 
                      : 'bg-slate-700 border-transparent hover:bg-slate-600 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ArrowUpFromLine size={16} />
                  {takeOffTime !== null ? '再設定する' : 'セット'}
                </button>
              </div>

              {/* Landing Button */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-400">2. 着地 (Landing)</span>
                  {landingTime !== null && (
                     <button onClick={() => seekTo(landingTime)} className="text-xs font-mono text-emerald-400 hover:underline">{formatTime(landingTime)}</button>
                  )}
                </div>
                <button 
                  onClick={() => setLandingTime(currentTime)}
                  disabled={!videoSrc}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all text-sm ${
                    landingTime !== null 
                      ? 'bg-slate-800 border-emerald-500/50 text-emerald-400' 
                      : 'bg-slate-700 border-transparent hover:bg-slate-600 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ArrowDownToLine size={16} />
                  {landingTime !== null ? '再設定する' : 'セット'}
                </button>
              </div>
            </div>

            <hr className="my-6 border-slate-700" />

            {/* Results */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Ruler size={18} />
                <h3 className="font-semibold text-sm">計測結果</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-1 text-slate-500 text-xs mb-1">
                    <Clock size={12} />
                    滞空時間
                  </div>
                  <div className="text-xl font-mono font-bold text-white">
                    {flightTime > 0 ? flightTime.toFixed(3) : '---'} <span className="text-xs font-sans font-normal text-slate-500">秒</span>
                  </div>
                </div>
                
                <div className="bg-slate-900 p-3 rounded-lg border border-indigo-900/50 relative overflow-hidden">
                  <div className="flex items-center gap-1 text-indigo-300 text-xs mb-1">
                    <ArrowUpFromLine size={12} />
                    推定高さ
                  </div>
                  <div className="text-2xl font-mono font-bold text-white">
                    {flightTime > 0 ? jumpHeight.toFixed(1) : '---'} <span className="text-sm font-sans font-normal text-slate-400">cm</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                 <button 
                   onClick={saveResult}
                   disabled={flightTime <= 0}
                   className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                 >
                   保存
                 </button>
                 <button 
                   onClick={shareResult}
                   disabled={flightTime <= 0}
                   className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-2 rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2"
                 >
                   <Share2 size={16} />
                   共有
                 </button>
              </div>
            </div>
          </div>

          {/* History Panel */}
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-lg flex-1 overflow-hidden flex flex-col min-h-[300px]">
            <div className="flex items-center gap-2 mb-4 text-slate-300">
              <History size={18} />
              <h2 className="font-semibold">履歴 ({currentUser?.name})</h2>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-1 space-y-2 no-scrollbar">
              {jumpHistory.filter(h => h.userId === currentUser?.id).length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                   履歴がありません
                </div>
              ) : (
                jumpHistory
                  .filter(h => h.userId === currentUser?.id)
                  .sort((a, b) => b.date - a.date)
                  .map(record => (
                    <div key={record.id} className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex justify-between items-center group">
                       <div>
                          <div className="text-lg font-bold text-white">{record.heightCm.toFixed(1)} <span className="text-xs font-normal text-slate-500">cm</span></div>
                          <div className="text-[10px] text-slate-500">{new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString()}</div>
                       </div>
                       <button 
                         onClick={() => deleteHistoryItem(record.id)}
                         className="text-slate-600 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all"
                       >
                         <Trash2 size={14} />
                       </button>
                    </div>
                ))
              )}
            </div>
          </div>

        </div>

      </main>

      {/* User Selection Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden">
             <div className="p-4 border-b border-slate-700 flex justify-between items-center">
               <h3 className="font-bold text-lg">ユーザー切り替え</h3>
               <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-white">
                 <X size={20} />
               </button>
             </div>
             
             <div className="p-4 max-h-[300px] overflow-y-auto space-y-2">
               {users.map(user => (
                 <button
                   key={user.id}
                   onClick={() => handleSwitchUser(user)}
                   className={`w-full flex items-center justify-between p-3 rounded-lg border ${currentUser?.id === user.id ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'}`}
                 >
                   <span className="font-medium">{user.name}</span>
                   {currentUser?.id === user.id && <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>}
                 </button>
               ))}
             </div>

             <div className="p-4 bg-slate-900 border-t border-slate-700">
               <label className="block text-xs text-slate-400 mb-2">新規ユーザー作成</label>
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={newUserName}
                   onChange={(e) => setNewUserName(e.target.value)}
                   placeholder="名前を入力..."
                   className="flex-1 bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                 />
                 <button 
                   onClick={handleCreateUser}
                   disabled={!newUserName.trim()}
                   className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                 >
                   <UserPlus size={18} />
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};