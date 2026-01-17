import React, { useState, useCallback } from 'react';
import { ArrowRightLeft, Copy, Check, Sparkles } from 'lucide-react';
import { SUPPORTED_LANGUAGES, LanguageOption } from '../types';
import { translateText } from '../services/geminiService';

const Translator: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [sourceLang, setSourceLang] = useState<string>('en');
  const [targetLang, setTargetLang] = useState<string>('vi');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    try {
      const sourceName = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang)?.name || sourceLang;
      const targetName = SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;
      
      const result = await translateText(inputText, sourceName, targetName);
      setOutputText(result);
    } catch (error) {
      setOutputText("Đã xảy ra lỗi khi dịch. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }, [inputText, sourceLang, targetLang]);

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(outputText);
    setOutputText(inputText);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col p-6 max-w-5xl mx-auto w-full">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          Phiên Dịch Thông Minh
        </h2>
        <p className="text-slate-400 mt-2">Sử dụng Gemini 3 Flash cho tốc độ vượt trội</p>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-1 flex-1 flex flex-col md:flex-row gap-1 shadow-xl overflow-hidden">
        {/* Input Section */}
        <div className="flex-1 flex flex-col p-4 bg-slate-900">
          <div className="flex justify-between items-center mb-4">
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="bg-slate-800 text-slate-200 text-sm font-medium py-2 px-4 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer hover:bg-slate-750"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={`source-${lang.code}`} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="flex-1 w-full bg-transparent resize-none text-lg text-slate-200 placeholder-slate-500 focus:outline-none"
            placeholder="Nhập văn bản cần dịch..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            spellCheck="false"
          />
          <div className="mt-4 flex justify-between items-center text-slate-500 text-sm">
            <span>{inputText.length} ký tự</span>
          </div>
        </div>

        {/* Controls (Desktop: Vertical Divider/Button, Mobile: Horizontal) */}
        <div className="relative bg-slate-800/50 w-full h-12 md:w-12 md:h-full flex items-center justify-center border-y md:border-y-0 md:border-x border-slate-800">
          <button
            onClick={handleSwapLanguages}
            className="p-2 rounded-full bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white transition-all transform hover:scale-110 shadow-lg border border-slate-600"
            title="Đổi ngôn ngữ"
          >
            <ArrowRightLeft size={18} />
          </button>
        </div>

        {/* Output Section */}
        <div className="flex-1 flex flex-col p-4 bg-slate-900/50">
          <div className="flex justify-between items-center mb-4">
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-slate-800 text-slate-200 text-sm font-medium py-2 px-4 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={`target-${lang.code}`} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            {outputText && (
              <button
                onClick={copyToClipboard}
                className="text-slate-400 hover:text-white transition-colors"
                title="Sao chép"
              >
                {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
              </button>
            )}
          </div>
          
          <div className="flex-1 relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="text-sm text-slate-400 animate-pulse">Đang dịch...</span>
                </div>
              </div>
            ) : (
              <textarea
                className="w-full h-full bg-transparent resize-none text-lg text-slate-100 placeholder-slate-600 focus:outline-none"
                placeholder="Bản dịch sẽ hiện ở đây..."
                value={outputText}
                readOnly
              />
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleTranslate}
          disabled={isLoading || !inputText.trim()}
          className="group flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full font-semibold shadow-lg shadow-blue-900/20 transition-all transform hover:-translate-y-0.5"
        >
          {isLoading ? (
            <span>Đang xử lý...</span>
          ) : (
            <>
              <Sparkles size={20} className="group-hover:animate-pulse" />
              <span>Dịch Ngay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Translator;