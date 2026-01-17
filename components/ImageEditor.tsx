import React, { useState, useRef } from 'react';
import { Upload, Wand2, Download, Image as ImageIcon, X } from 'lucide-react';
import { editImage } from '../services/geminiService';

const ImageEditor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setResultUrl(null);
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviewUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!selectedFile || !prompt.trim() || !previewUrl) return;

    setIsProcessing(true);
    try {
      // Remove data url prefix for API
      const base64Data = previewUrl.split(',')[1];
      const mimeType = selectedFile.type;

      const generatedImageBase64 = await editImage(base64Data, mimeType, prompt);
      setResultUrl(generatedImageBase64);
    } catch (error) {
      alert("Không thể chỉnh sửa ảnh. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 max-w-6xl mx-auto w-full overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Wand2 className="text-purple-400" />
          Chỉnh Sửa Ảnh AI
        </h2>
        <p className="text-slate-400 mt-2">
          Sử dụng model <span className="text-purple-300 font-mono text-sm bg-purple-900/30 px-2 py-0.5 rounded">gemini-2.5-flash-image</span> để chỉnh sửa ảnh theo ý muốn.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
        {/* Source Column */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl flex-1 min-h-[400px] flex items-center justify-center relative overflow-hidden group">
            {previewUrl ? (
              <>
                <img 
                  src={previewUrl} 
                  alt="Original" 
                  className="max-w-full max-h-full object-contain"
                />
                <button 
                  onClick={handleRemoveImage}
                  className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-red-500/80 text-white rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </>
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-slate-700 transition-colors">
                  <Upload className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-medium text-slate-300 mb-2">Tải ảnh lên</h3>
                <p className="text-slate-500 text-sm mb-6">JPEG hoặc PNG</p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 transition-all"
                >
                  Chọn tệp
                </button>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden" 
            />
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Bạn muốn chỉnh sửa gì?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='Ví dụ: "Thêm hiệu ứng cổ điển", "Xóa người ở nền"...'
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <button
                onClick={handleGenerate}
                disabled={!selectedFile || !prompt.trim() || isProcessing}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all flex items-center gap-2"
              >
                {isProcessing ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <Wand2 size={20} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Result Column */}
        <div className="flex flex-col h-full">
          <div className="bg-slate-900 border border-slate-800 rounded-xl flex-1 min-h-[400px] flex items-center justify-center relative overflow-hidden">
            {isProcessing ? (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-purple-300 animate-pulse">Gemini đang vẽ lại...</p>
              </div>
            ) : resultUrl ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black/40">
                <img 
                  src={resultUrl} 
                  alt="Edited" 
                  className="max-w-full max-h-full object-contain"
                />
                <a 
                  href={resultUrl}
                  download={`edited-image-${Date.now()}.png`}
                  className="absolute bottom-6 right-6 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-transform hover:scale-105"
                  title="Tải xuống"
                >
                  <Download size={24} />
                </a>
              </div>
            ) : (
              <div className="text-center text-slate-600">
                <ImageIcon size={48} className="mx-auto mb-3 opacity-20" />
                <p>Kết quả sẽ hiển thị tại đây</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;