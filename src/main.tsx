import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';
import { getOrCreateUser } from './lib/supabase';

// 앱 시작 시 user ID 미리 초기화 (DB 저장 시 재요청 방지)
getOrCreateUser().catch(console.warn);


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
