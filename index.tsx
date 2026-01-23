import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/queryClient';
import { ApiKeyProvider } from './contexts/ApiKeyContext';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ApiKeyProvider>
        <BrowserRouter>
          <App />
          <Toaster position="bottom-right" toastOptions={{
            style: {
              background: '#18181b',
              color: '#fff',
              border: '1px solid #27272a'
            }
          }} />
        </BrowserRouter>
      </ApiKeyProvider>
    </QueryClientProvider>
  </React.StrictMode>
);