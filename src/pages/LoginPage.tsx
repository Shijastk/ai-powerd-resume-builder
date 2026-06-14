import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, AtSign, Quote, Zap } from 'lucide-react'

export const LoginPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const adminUser = import.meta.env.VITE_ADMIN_USER || 'shijas';
    const adminPass = import.meta.env.VITE_ADMIN_PASS || 'admin123';
    console.log(adminUser ,"admin sy", adminPass)

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (username === adminUser && password === adminPass) {
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
        <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans">
            <div className="w-full bg-white overflow-hidden grid grid-cols-1 lg:grid-cols-2 h-[100vh]">

                {/* Left Panel - Form */}
                <div className="p-8 sm:p-12 lg:p-16 flex flex-col">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="bg-slate-900 p-1.5 rounded-lg">
                                <Zap size={16} className="text-yellow-400 fill-yellow-400" />
                            </div>
                            <Link className="font-black text-slate-900 tracking-tight" to={"/"}>LuxeCV</Link>
                        </div>
                        <p className="text-slate-400">
                            Need access?{' '}
                            <button onClick={() => navigate('/')} className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
                                Back Home
                            </button>
                        </p>
                    </div>

                    <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto py-10">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Welcome to LuxeCV</h1>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8">
                            Sign in to access your personal workspace and craft a resume that stands out.
                        </p>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block mb-1.5 ml-1 text-xs font-semibold text-slate-600">
                                    Username
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="block w-full appearance-none pl-4 pr-11 py-3.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-300 outline-none focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                                        placeholder="example@mail.com"
                                        required
                                    />
                                    <AtSign size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block mb-1.5 ml-1 text-xs font-semibold text-slate-600">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full appearance-none pl-4 pr-11 py-3.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-300 outline-none focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                                        placeholder="8+ strong character"
                                        required
                                    />
                                    <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-semibold flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all active:scale-[0.99] shadow-lg shadow-blue-600/20"
                            >
                                Sign In
                            </button>
                        </form>

                    </div>
                </div>

                {/* Right Panel - Testimonial */}
                <div className="hidden lg:flex relative bg-blue-700 p-16 flex-col justify-center overflow-hidden">
                    {/* Decorative rings */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white rounded-full"></div>
                        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-white rounded-full"></div>
                        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-white rounded-full"></div>
                    </div>

                    <div className="relative z-10">
                        <div className="w-14 h-14 rounded-full bg-emerald-400 flex items-center justify-center mb-10">
                            <Quote size={24} className="text-blue-900 fill-blue-900" />
                        </div>

                        <h2 className="text-5xl font-black text-white leading-[1.05] tracking-tight mb-12">
                            Build your<br />Dream.
                        </h2>

                        <div className="border-l-2 border-white/30 pl-6">
                            <p className="text-white/80 text-sm leading-relaxed mb-6 max-w-xs">
                                "LuxeCV turned my scattered experience into a resume that finally got me interviews. The polish is unreal."
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                                    WL
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">Waleed Lozano</p>
                                    <p className="text-white/50 text-xs">Product Designer</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
