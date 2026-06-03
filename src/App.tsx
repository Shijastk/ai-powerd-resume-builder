import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ResumeBuilder } from './pages/ResumeBuilder';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/builder" element={<Navigate to="/builder/editor" replace />} />
                <Route path="/builder/:tab" element={<ResumeBuilder />} />
                <Route path="/login" element={<LoginPage />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
