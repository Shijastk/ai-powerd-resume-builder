import React from 'react';
import './src/index.css';
import { createRoot } from 'react-dom/client';
import App from './src/App.tsx';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
