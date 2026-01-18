import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MonitorPlay, StopCircle, RefreshCw, Languages, Play, Pause, Scan, X, ExternalLink, Minimize2 } from 'lucide-react';
import { translateScreenFrame } from '../services/geminiService';
import { SUPPORTED_LANGUAGES } from '../types';
import ReactMarkdown from 'react-markdown';

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ScreenTranslator: React.FC = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [translation, setTranslation] = useState<string>('');
  const [targetLang, setTargetLang] = useState<string>('vi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Selection / Cropping State
  const [isSelecting, setIsSelecting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number, y: number } | null>(null);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);

  // PIP (Picture in Picture) State
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  const startScreenShare = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert("Trình duyệt của bạn không hỗ trợ tính năng chia sẻ màn hình.");
      return;
    }

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
      setCropRect(null); // Reset crop on new stream

      stream.getTracks()[0].onended = () => {
        stopScreenShare();
      };

    } catch (err: any) {
      console.error("Error starting screen share:", err);
      // Basic error handling
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
    setCropRect(null);
    closePip();
  }, []);

  const captureAndTranslate = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isSharing || isProcessing) return;

    setIsProcessing(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Determine dimensions
      const videoW = video.videoWidth;
      const videoH = video.videoHeight;
      
      // Default: Capture full screen
      let sx = 0, sy = 0, sWidth = videoW, sHeight = videoH;

      // If cropping is active, calculate source coordinates relative to video intrinsic size
      if (cropRect && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Calculate scale factor between displayed video and intrinsic video
        // Using object-fit: contain logic is tricky, so we assume the container matches aspect ratio or we calculate ratios
        // Simple approach: Map percentage of selection to intrinsic size
        
        // Note: This simple calculation assumes the video fills the container (object-fit: cover) OR
        // the selection overlay matches the rendered video size exactly.
        // For precision, we use the ratio of the displayed element vs intrinsic.
        
        const displayW = containerRef.current.clientWidth;
        const displayH = containerRef.current.clientHeight;

        const scaleX = videoW / displayW;
        const scaleY = videoH / displayH;

        sx = cropRect.x * scaleX;
        sy = cropRect.y * scaleY;
        sWidth = cropRect.width * scaleX;
        sHeight = cropRect.height * scaleY;
      }

      // Set canvas to the size of the captured region
      canvas.width = sWidth;
      canvas.height = sHeight;

      // Draw specific region
      context.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

      // Compress
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
  }, [isSharing, isProcessing, targetLang, cropRect]);

  // Handle Auto Translate Loop
  useEffect(() => {
    if (autoTranslate && isSharing) {
      intervalRef.current = window.setInterval(() => {
        captureAndTranslate();
      }, 3000); // Translate every 3 seconds
    } else {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [autoTranslate, isSharing, captureAndTranslate]);

  // Mouse Events for Cropping
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelecting || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setSelectionStart({ x, y });
    setCropRect({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectionStart || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Calculate width/height allowing for dragging in any direction
    const width = Math.abs(currentX - selectionStart.x);
    const height = Math.abs(currentY - selectionStart.y);
    const x = Math.min(currentX, selectionStart.x);
    const y = Math.min(currentY, selectionStart.y);

    setCropRect({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      // If rect is too small, cancel it
      if (cropRect && (cropRect.width < 10 || cropRect.height < 10)) {
        setCropRect(null);
      } else {
        setIsSelecting(false); // Stop selection mode after one draw
      }
    }
  };

  // Picture in Picture Logic
  const togglePip = async () => {
    if (pipWindow) {
      closePip();
    } else {
      try {
        // @ts-ignore - Document Picture-in-Picture API is new
        if (!window.documentPictureInPicture) {
          alert("Trình duyệt của bạn không hỗ trợ Document Picture-in-Picture. Vui lòng cập nhật Chrome/Edge mới nhất.");
          return;
        }

        // Check if running in iframe (preview mode)
        if (window.self !== window.top) {
             alert("Tính năng Popup (Cửa sổ nổi) không hoạt động trong chế độ xem trước (iframe).\n\nVui lòng mở ứng dụng trong một Tab mới của trình duyệt để sử dụng tính năng này.");
             return;
        }

        // @ts-ignore
        const pip = await window.documentPictureInPicture.requestWindow({
          width: 400,
          height: 600,
        });

        // Copy styles
        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
            const style = document.createElement('style');
            style.textContent = cssRules;
            pip.document.head.appendChild(style);
          } catch (e) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = styleSheet.href || '';
            pip.document.head.appendChild(link);
          }
        });

        // Add Tailwind via CDN for the popup if needed securely, 
        // or rely on the copied styles if Tailwind is built-in.
        // For this demo index.html uses CDN, so we copy that link.
        const tailwindLink = document.createElement('script');
        tailwindLink.src = "https://cdn.tailwindcss.com";
        pip.document.head.appendChild(tailwindLink);

        pip.document.body.className = "bg-slate-950 text-slate-100 overflow-hidden";
        
        // Handle close
        pip.addEventListener('pagehide', () => {
          setPipWindow(null);
        });

        setPipWindow(pip);
      } catch (err: any) {
        console.error("Failed to open PiP window:", err);
        if (err.name === 'NotAllowedError' || (err.message && err.message.includes("top-level"))) {
           alert("Không thể mở cửa sổ Popup. Vui lòng đảm bảo bạn đang mở ứng dụng trong Tab chính (không phải iframe/preview) và đã cấp quyền.");
        } else {
           alert("Lỗi khi mở Popup: " + (err.message || "Không xác định"));
        }
      }
    }
  };

  const closePip = () => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
    }
  };

  const ResultContent = () => (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 draggable-header">
        <div>
          <h3 className="font-semibold text-emerald-400 flex items-center gap-2">
            <Languages size={18} />
            {autoTranslate ? 'Đang dịch trực tiếp...' : 'Kết quả dịch'}
          </h3>
          {lastUpdated && (
            <span className="text-[10px] text-slate-400">
              Cập nhật: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        {isProcessing && <RefreshCw size={14} className="animate-spin text-emerald-500" />}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {translation ? (
          <div className="prose prose-invert prose-lg max-w-none leading-relaxed">
            <ReactMarkdown>{translation}</ReactMarkdown>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 opacity-60">
            <Scan size={32} />
            <p className="text-sm text-center">Chưa có nội dung.<br/>Đang chờ dữ liệu màn hình...</p>
          </div>
        )}
      </div>
      
      {cropRect && (
        <div className="p-2 text-xs text-center text-slate-500 border-t border-slate-800">
          Đang dịch vùng chọn ({Math.round(cropRect.width)}x{Math.round(cropRect.height)})
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 max-w-[1600px] mx-auto w-full overflow-hidden">
      {/* Header Controls */}
      <div className="mb-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <MonitorPlay className="text-orange-400" />
            Phiên Dịch Màn Hình Live
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Chọn vùng trên màn hình và xem bản dịch trong cửa sổ nổi.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-2 rounded-xl border border-slate-800">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
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

          {!isSharing ? (
            <button
              onClick={startScreenShare}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-blue-900/20"
            >
              <MonitorPlay size={18} />
              Bắt đầu chia sẻ
            </button>
          ) : (
            <>
              {/* Region Selector Button */}
              <button
                onClick={() => {
                  setIsSelecting(!isSelecting);
                  if (cropRect) setCropRect(null); // Click again to reset selection
                }}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg transition-all border ${
                  isSelecting || cropRect
                    ? 'bg-purple-600/20 text-purple-400 border-purple-500/50' 
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Chọn vùng để dịch"
              >
                {cropRect ? <X size={16} /> : <Scan size={16} />}
                {cropRect ? 'Hủy vùng chọn' : (isSelecting ? 'Đang chọn...' : 'Chọn vùng')}
              </button>

              {/* Auto Translate Toggle */}
              <button
                onClick={() => setAutoTranslate(!autoTranslate)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg transition-all border ${
                  autoTranslate 
                    ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50' 
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {autoTranslate ? <Pause size={16} /> : <Play size={16} />}
                {autoTranslate ? 'Auto Live' : 'Auto Live'}
              </button>
              
              {/* Manual Trigger */}
              <button
                onClick={captureAndTranslate}
                disabled={autoTranslate || isProcessing}
                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg border border-slate-700"
                title="Dịch ngay"
              >
                <RefreshCw size={18} className={isProcessing ? "animate-spin" : ""} />
              </button>

              {/* PiP Button */}
              <button
                onClick={togglePip}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg transition-all border ${
                  pipWindow
                    ? 'bg-blue-600 text-white border-blue-500' 
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Mở cửa sổ nổi (Popup)"
              >
                {pipWindow ? <Minimize2 size={16} /> : <ExternalLink size={16} />}
                Popup
              </button>

              <button
                onClick={stopScreenShare}
                className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 text-sm font-bold rounded-lg transition-all"
              >
                <StopCircle size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 relative">
        {/* Main Video Area */}
        <div 
          ref={containerRef}
          className={`flex-[3] bg-black rounded-xl border border-slate-800 relative overflow-hidden flex items-center justify-center group select-none ${isSelecting ? 'cursor-crosshair' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {!isSharing && (
            <div className="text-center text-slate-500 pointer-events-none">
              <MonitorPlay size={64} className="mx-auto mb-4 opacity-20" />
              <p>Nhấn "Bắt đầu chia sẻ" để kích hoạt camera màn hình</p>
            </div>
          )}
          
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-contain ${!isSharing ? 'hidden' : ''}`}
          />
          
          {/* Cropping Overlay UI */}
          {isSharing && (isSelecting || cropRect) && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Darken background if selecting */}
              <div className="absolute inset-0 bg-black/30" />
              
              {/* Selection Box */}
              {cropRect && (
                <div
                  className="absolute border-2 border-emerald-500 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none"
                  style={{
                    left: cropRect.x,
                    top: cropRect.y,
                    width: cropRect.width,
                    height: cropRect.height,
                  }}
                >
                  <div className="absolute -top-6 left-0 bg-emerald-500 text-black text-[10px] font-bold px-1 rounded-t">
                    TRANSLATE ZONE
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Helper Text */}
          {isSharing && isSelecting && !cropRect && !isDragging && (
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded-lg pointer-events-none animate-pulse">
               Kéo chuột để chọn vùng cần dịch
             </div>
          )}
          
          {/* Hidden Canvas */}
          <canvas ref={canvasRef} className="hidden" />
          
          {isSharing && !isSelecting && !cropRect && (
             <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md border border-white/10 pointer-events-none">
               Full Screen Mode
             </div>
          )}
        </div>

        {/* Translation Result Area - Only show if PiP is NOT active */}
        {!pipWindow && (
          <div className="flex-1 min-w-[300px] lg:max-w-md bg-slate-900 border border-slate-800 rounded-xl flex flex-col min-h-[300px] lg:min-h-0">
             <ResultContent />
          </div>
        )}

        {/* Portal for PiP Window */}
        {pipWindow && createPortal(
          <div className="h-full w-full flex flex-col" id="pip-root">
             <ResultContent />
          </div>,
          pipWindow.document.body
        )}
      </div>
    </div>
  );
};

export default ScreenTranslator;