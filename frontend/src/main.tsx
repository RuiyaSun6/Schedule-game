import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { WorldLayoutProvider } from './components/MoveModeScene';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <WorldLayoutProvider><App /></WorldLayoutProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
