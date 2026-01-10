import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, User, ArrowRight, Zap, Check } from 'lucide-react';
import { PRIVATE_DATA } from '../data/initialData';

export const LoginPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (username === 'shijas' && password === 'admin123') {
            localStorage.setItem('is_admin', 'true');
            // We force a navigation to builder, which will read the localStorage
            navigate('/builder');
            window.location.reload(); // Ensure state is refreshed
        } else {
            setError('Invalid credentials. Please try again.');
            setPassword('');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-700"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-3xl animate-pulse"></div>
            </div>

            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-slate-200 p-10 rounded-[2.5rem] shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="bg-gradient-to-tr from-slate-900 to-slate-800 p-4 rounded-2xl shadow-lg mb-4 rotate-3">
                        <Zap size={28} className="text-yellow-400 fill-yellow-400" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Welcome Back</h1>
                    <p className="text-slate-500 text-sm">Sign in to access your personal workspace</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Key size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2"
                    >
                        <span>Sign In</span>
                        <ArrowRight size={18} />
                    </button>

                    <button type="button" onClick={() => navigate('/')} className="w-full text-center text-xs font-bold text-slate-400 uppercase hover:text-slate-600 transition-colors mt-4">
                        Back to Home
                    </button>
                </form>
            </div>

            <div className="absolute bottom-6 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                Secured by LuxeCV Identity
            </div>
        </div>
    );
};
