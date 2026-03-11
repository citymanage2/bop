import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { FileSpreadsheet, ScanLine, Shield, Cookie } from 'lucide-react';
import UploadPage from './pages/UploadPage';
import EstimateView from './pages/EstimateView';
import DecompositionPage from './pages/DecompositionPage';
import VORPreview from './pages/VORPreview';
import MaterialsPreview from './pages/MaterialsPreview';
import ScanPage from './pages/ScanPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';

function App() {
  const location = useLocation();
  const p = location.pathname;

  const nav = (to: string, label: string, icon: React.ReactNode) => {
    const active = to === '/' ? p === '/' : p.startsWith(to);
    return (
      <Link to={to} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${active ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}>
        {icon}{label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 bg-[#0F1011]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-bold text-white hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Сметный парсер
            </span>
          </Link>
          <nav className="flex gap-1.5">
            {nav('/', 'Сметы', <FileSpreadsheet className="w-4 h-4" />)}
            {nav('/scan', 'Скан', <ScanLine className="w-4 h-4" />)}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/estimate/:id" element={<EstimateView />} />
          <Route path="/estimate/:id/decompose" element={<DecompositionPage />} />
          <Route path="/estimate/:id/vor" element={<VORPreview />} />
          <Route path="/estimate/:id/materials" element={<MaterialsPreview />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/cookies" element={<CookiePolicy />} />
        </Routes>
      </main>

      <footer className="border-t border-white/5 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <span className="text-gray-600">citymanage@yandex.ru</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="flex items-center gap-1 hover:text-gray-300 transition-colors">
              <Shield className="w-3.5 h-3.5" />Конфиденциальность
            </Link>
            <Link to="/cookies" className="flex items-center gap-1 hover:text-gray-300 transition-colors">
              <Cookie className="w-3.5 h-3.5" />Cookie
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
