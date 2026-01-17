import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MonitorPlay, StopCircle, RefreshCw, Languages, Play, Pause } from 'lucide-react';
import { translateScreenFrame } from '../services/geminiService';
import { SUPPORTED_LANGUAGES } from '../types';
import ReactMarkdown from 'react-markdown';

const ScreenTranslator: React.FC = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [translation, setTranslation] = useState<string>('');
  const [targetLang, setTargetLang] = useState<string>('vi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: false
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsSharing(true);

      // Handle stream stop (via browser UI)
      stream.getTracks()[0].onended = () => {
        stopScreenShare();
      };

    } catch (err) {
      console.error("Error starting screen share:", err);
      alert("Không thể chia sẻ màn hình. Vui lòng cấp quyền.");
    }
  };

  const stopScreenShare = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSharing(false);
    setAutoTranslate(false);
  }, []);

  const captureAndTranslate = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isSharing || isProcessing) return;

    setIsProcessing(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Draw current video frame to canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Compress slightly to save bandwidth/processing
      const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      const targetLangName = SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;

      const result = await translateScreenFrame(base64Data, 'image/jpeg', targetLangName);
      setTranslation(result);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  }, [isSharing, isProcessing, targetLang]);

  // Handle Auto Translate Loop
  useEffect(() => {
    if (autoTranslate && isSharing) {
      intervalRef.current = window.setInterval(() => {
        captureAndTranslate();
      }, 3000); // Translate every 3 seconds
    } else if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [autoTranslate, isSharing, captureAndTranslate]);

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 max-w-[1600px] mx-auto w-full overflow-hidden">
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <MonitorPlay className="text-orange-400" />
            Phiên Dịch Màn Hình
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Chia sẻ cửa sổ hoặc màn hình để dịch trực tiếp nội dung hiển thị.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-2 rounded-xl border border-slate-800">
           {/* Language Selector */}
           <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
            <Languages size={16} className="text-slate-400" />
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-transparent text-slate-200 text-sm font-medium focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={`target-${lang.code}`} value={lang.code} className="bg-slate-800">
                  Dịch sang: {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Controls */}
          {!isSharing ? (
            <button
              onClick={startScreenShare}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-all"
            >
              <MonitorPlay size={18} />
              Bắt đầu chia sẻ
            </button>
          ) : (
            <>
              <button
                onClick={() => setAutoTranslate(!autoTranslate)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all border ${
                  autoTranslate 
                    ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50' 
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {autoTranslate ? <Pause size={16} /> : <Play size={16} />}
                {autoTranslate ? 'Đang tự động dịch' : 'Tự động dịch'}
              </button>
              
              <button
                onClick={captureAndTranslate}
                disabled={autoTranslate || isProcessing}
                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg border border-slate-700"
                title="Dịch thủ công ngay lập tức"
              >
                <RefreshCw size={18} className={isProcessing ? "animate-spin" : ""} />
              </button>

              <button
                onClick={stopScreenShare}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 text-sm font-bold rounded-lg transition-all"
              >
                <StopCircle size={18} />
                Dừng
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Video Area */}
        <div className="flex-[2] bg-black rounded-xl border border-slate-800 relative overflow-hidden flex items-center justify-center group">
          {!isSharing && (
            <div className="text-center text-slate-500">
              <MonitorPlay size={64} className="mx-auto mb-4 opacity-20" />
              <p>Nhấn "Bắt đầu chia sẻ" để chọn màn hình cần dịch</p>
            </div>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`max-w-full max-h-full object-contain ${!isSharing ? 'hidden' : ''}`}
          />
          {/* Hidden Canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />
          
          {isSharing && (
             <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-md border border-white/10">
               Live Preview
             </div>
          )}
        </div>

        {/* Translation Result Area */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col min-h-[300px] lg:min-h-0">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <h3 className="font-semibold text-slate-200">Kết quả dịch</h3>
            {lastUpdated && (
              <span className="text-xs text-slate-500">
                Cập nhật: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-950/30">
            {isProcessing && !translation ? (
              <div className="flex items-center justify-center h-full gap-3">
                 <div className="animate-spin h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full" />
                 <span className="text-slate-500 text-sm">Đang phân tích màn hình...</span>
              </div>
            ) : translation ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{translation}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 text-center p-4">
                <p>Nội dung dịch sẽ hiển thị tại đây.</p>
              </div>
            )}
            
            {/* Loading Overlay for Auto Mode updates */}
            {isProcessing && translation && (
               <div className="mt-4 flex items-center gap-2 text-xs text-orange-400/80">
                 <RefreshCw size={12} className="animate-spin" /> Đang cập nhật...
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreenTranslator;