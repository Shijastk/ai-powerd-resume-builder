import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { ResumeBuilder } from './pages/ResumeBuilder';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/builder" element={<ResumeBuilder />} />
                <Route path="/login" element={<LoginPage />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
