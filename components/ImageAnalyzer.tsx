import React, { useState, useRef } from 'react';
import { Upload, Search, X, ScanEye, FileText } from 'lucide-react';
import { analyzeImage } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

const ImageAnalyzer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setAnalysisResult('');
      
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
    setAnalysisResult('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !previewUrl) return;

    setIsProcessing(true);
    setAnalysisResult('');
    try {
      const base64Data = previewUrl.split(',')[1];
      const mimeType = selectedFile.type;
      
      // Default prompt if empty
      const finalPrompt = prompt.trim() || "Hãy phân tích chi tiết hình ảnh này. Xác định các đối tượng, văn bản, màu sắc và ngữ cảnh.";

      const text = await analyzeImage(base64Data, mimeType, finalPrompt);
      setAnalysisResult(text);
    } catch (error) {
      setAnalysisResult("Lỗi: Không thể phân tích hình ảnh này.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 max-w-7xl mx-auto w-full overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <ScanEye className="text-emerald-400" />
          Phân Tích Hình Ảnh
        </h2>
        <p className="text-slate-400 mt-2">
          Sức mạnh hiểu biết hình ảnh vượt trội với <span className="text-emerald-300 font-mono text-sm bg-emerald-900/30 px-2 py-0.5 rounded">gemini-3-pro-preview</span>.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Left Panel: Image Upload & Input */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <div className="bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl min-h-[300px] flex-1 flex items-center justify-center relative overflow-hidden group">
            {previewUrl ? (
              <>
                <img 
                  src={previewUrl} 
                  alt="To Analyze" 
                  className="max-w-full max-h-full object-contain p-2"
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
                <h3 className="text-lg font-medium text-slate-300 mb-2">Chọn ảnh để phân tích</h3>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-medium rounded-lg border border-emerald-600/50 transition-all"
                >
                  Tải lên
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
              Câu hỏi cụ thể (Tuỳ chọn)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ví dụ: 'Món ăn này có bao nhiêu calo?' hoặc 'Dịch văn bản trong ảnh'"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-h-[100px] resize-none"
            />
            <button
              onClick={handleAnalyze}
              disabled={!selectedFile || isProcessing}
              className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                  <span>Đang suy nghĩ...</span>
                </>
              ) : (
                <>
                  <Search size={20} />
                  <span>Phân Tích Ngay</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Panel: Analysis Result */}
        <div className="w-full lg:w-2/3 bg-slate-900 border border-slate-800 rounded-xl p-6 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-800">
            <FileText className="text-slate-400" size={24} />
            <h3 className="text-xl font-semibold text-slate-200">Kết Quả Phân Tích</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 opacity-70">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <p className="text-slate-400 font-mono">Gemini đang quan sát...</p>
              </div>
            ) : analysisResult ? (
              <div className="prose prose-invert prose-slate max-w-none">
                <ReactMarkdown>{analysisResult}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600">
                <p>Chưa có dữ liệu phân tích.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageAnalyzer;