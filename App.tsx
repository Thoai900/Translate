import React, { useState } from 'react';
import { Languages, ImagePlus, ScanSearch, Menu, X, MonitorPlay } from 'lucide-react';
import Translator from './components/Translator';
import ImageEditor from './components/ImageEditor';
import ImageAnalyzer from './components/ImageAnalyzer';
import ScreenTranslator from './components/ScreenTranslator';
import { AppTab } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.TRANSLATE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const NavItem = ({ tab, icon: Icon, label }: { tab: AppTab; icon: any; label: string }) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-200 ${
        activeTab === tab
          ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-white border border-blue-500/30'
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
      }`}
    >
      <Icon size={22} className={activeTab === tab ? 'text-blue-400' : ''} />
      <span className="font-medium text-base">{label}</span>
      {activeTab === tab && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
      )}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden relative selection:bg-blue-500/30">
      
      {/* Mobile Menu Button */}
      <button 
        onClick={toggleSidebar}
        className="lg:hidden absolute top-4 left-4 z-50 p-2 bg-slate-800 rounded-md text-slate-200"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div 
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col p-6
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Languages className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Gemini Studio</h1>
            <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Phiên bản Live</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem tab={AppTab.TRANSLATE} icon={Languages} label="Phiên Dịch" />
          <NavItem tab={AppTab.IMAGE_EDIT} icon={ImagePlus} label="Chỉnh Sửa Ảnh" />
          <NavItem tab={AppTab.IMAGE_ANALYZE} icon={ScanSearch} label="Phân Tích Ảnh" />
          <NavItem tab={AppTab.SCREEN_TRANSLATOR} icon={MonitorPlay} label="Phiên Dịch Màn Hình" />
        </nav>

        <div className="pt-6 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-400 leading-relaxed text-center">
              Powered by Google Gemini 2.5 & 3.0 Pro Models
            </p>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="h-full pt-16 lg:pt-0">
          {activeTab === AppTab.TRANSLATE && <Translator />}
          {activeTab === AppTab.IMAGE_EDIT && <ImageEditor />}
          {activeTab === AppTab.IMAGE_ANALYZE && <ImageAnalyzer />}
          {activeTab === AppTab.SCREEN_TRANSLATOR && <ScreenTranslator />}
        </div>
      </main>
    </div>
  );
}

export default App;