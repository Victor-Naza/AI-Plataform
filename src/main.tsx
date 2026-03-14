import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppController from './controllers/AppController';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppController />
  </StrictMode>
);
