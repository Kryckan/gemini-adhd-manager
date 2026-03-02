import React from 'react';
import { login, signup } from './actions';

type LoginPageProps = {
    searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const resolvedSearchParams = await searchParams;
    const isSignupEnabled = process.env.ENABLE_SIGNUP === 'true';
    const requiresSignupSecret = Boolean(process.env.OWNER_SIGNUP_SECRET);

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center font-sans">
            <div className="max-w-md w-full p-8 border border-neutral-800 rounded-xl bg-[#0f0f0f] shadow-2xl">
                <div className="flex justify-center mb-8">
                    <div className="w-12 h-12 flex relative items-center justify-center">
                        <div className="w-6 h-8 border-l-4 border-b-4 border-[#00A3FF] skew-x-[-15deg]"></div>
                    </div>
                </div>

                <h1 className="text-2xl font-mono text-white text-center mb-2 tracking-tight">FlowState Identity</h1>
                <p className="text-neutral-500 text-sm text-center mb-6 font-mono">Authenticate to access your dashboard.</p>

                {resolvedSearchParams?.error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded text-center">
                        {resolvedSearchParams.error}
                    </div>
                )}

                <form className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="manager@company.com"
                            className="w-full bg-[#1A1A1A] border border-neutral-800 text-neutral-300 rounded p-3 text-sm focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all font-mono"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full bg-[#1A1A1A] border border-neutral-800 text-neutral-300 rounded p-3 text-sm focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all font-mono pb-2"
                        />
                    </div>

                    {isSignupEnabled && requiresSignupSecret && (
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Signup Access Code</label>
                            <input
                                name="signupSecret"
                                type="password"
                                placeholder="Owner access code"
                                autoComplete="off"
                                className="w-full bg-[#1A1A1A] border border-neutral-800 text-neutral-300 rounded p-3 text-sm focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all font-mono pb-2"
                            />
                        </div>
                    )}

                    <div className="flex gap-4 mt-6">
                        <button formAction={login} className="flex-1 bg-white text-black font-medium py-3 rounded text-sm hover:bg-neutral-200 transition-colors flex items-center justify-center">
                            SIGN IN
                        </button>
                        {isSignupEnabled && (
                            <button formAction={signup} className="flex-1 bg-transparent border border-neutral-700 text-white font-medium py-3 rounded text-sm hover:bg-neutral-800 transition-colors flex items-center justify-center">
                                SIGN UP
                            </button>
                        )}
                    </div>
                </form>

                <div className="mt-8 pt-6 border-t border-neutral-900 border-dashed text-center">
                    <p className="text-[10px] font-mono text-neutral-600">Vercel Edge protected route.</p>
                </div>
            </div>
        </div>
    );
}
