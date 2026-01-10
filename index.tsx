import React from 'react';
import './src/index.css';
import { createRoot } from 'react-dom/client';
import { ResumeBuilder } from './src/pages/ResumeBuilder.tsx';

const root = createRoot(document.getElementById('root')!);
root.render(<ResumeBuilder />);
