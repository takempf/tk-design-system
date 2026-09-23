import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'tk-design-system/fonts.css';
import 'tk-design-system/styles.css';
import './playground.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
