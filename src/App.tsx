import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { IntroPage } from './pages/IntroPage';
import { HomePage } from './pages/HomePage';
import { FortunePage } from './pages/FortunePage';
import { SajuPage } from './pages/SajuPage';
import { TarotPage } from './pages/TarotPage';
import { CompatPage } from './pages/CompatPage';
import { MyPage } from './pages/MyPage';
import { ConsultPage } from './pages/ConsultPage';
import { TossCallbackPage } from './pages/TossCallbackPage';

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.VITE_BASENAME ?? '/'}>
      <Routes>
        <Route path="/" element={<IntroPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/fortune" element={<FortunePage />} />
        <Route path="/saju" element={<SajuPage />} />
        <Route path="/tarot" element={<TarotPage />} />
        <Route path="/compat" element={<CompatPage />} />
        <Route path="/my" element={<MyPage />} />
        <Route path="/consult" element={<ConsultPage />} />
        <Route path="/auth/toss/callback" element={<TossCallbackPage />} />
      </Routes>
    </BrowserRouter>
  );
}
