import { Routes, Route, Link, useLocation } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import EstimateView from './pages/EstimateView';
import DecompositionPage from './pages/DecompositionPage';
import VORPreview from './pages/VORPreview';
import MaterialsPreview from './pages/MaterialsPreview';

function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-blue-700 hover:text-blue-800">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Сметный парсер
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/" className={`px-3 py-1 rounded ${isHome ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
              Загрузка
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/estimate/:id" element={<EstimateView />} />
          <Route path="/estimate/:id/decompose" element={<DecompositionPage />} />
          <Route path="/estimate/:id/vor" element={<VORPreview />} />
          <Route path="/estimate/:id/materials" element={<MaterialsPreview />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
