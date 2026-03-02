import React from 'react';

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center font-sans">
            <div className="max-w-md w-full p-8 border border-neutral-800 rounded-xl bg-[#0f0f0f] shadow-2xl">
                <div className="flex justify-center mb-8">
                    <div className="w-12 h-12 flex relative items-center justify-center">
                        <div className="w-6 h-8 border-l-4 border-b-4 border-[#00A3FF] skew-x-[-15deg]"></div>
                    </div>
                </div>

                <h1 className="text-2xl font-mono text-white text-center mb-2 tracking-tight">FlowState Login</h1>
                <p className="text-neutral-500 text-sm text-center mb-10 font-mono">Authenticate to access your dashboard.</p>

                <form className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Email</label>
                        <input
                            type="email"
                            placeholder="manager@company.com"
                            className="w-full bg-[#1A1A1A] border border-neutral-800 text-neutral-300 rounded p-3 text-sm focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all font-mono"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full bg-[#1A1A1A] border border-neutral-800 text-neutral-300 rounded p-3 text-sm focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all font-mono pb-2"
                        />
                    </div>

                    <button type="button" className="mt-6 w-full bg-white text-black font-medium py-3 rounded text-sm hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2">
                        SIGN IN
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-neutral-900 border-dashed text-center">
                    <p className="text-[10px] font-mono text-neutral-600">Vercel Edge protected route.</p>
                </div>
            </div>
        </div>
    );
}
