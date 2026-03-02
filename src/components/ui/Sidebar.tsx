'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Focus, Calendar, Search, Settings, FolderClosed, BarChart2 } from 'lucide-react';
import { useShortcutContext } from '@/components/providers/ShortcutProvider';

export function Sidebar() {
    const { setCommandPaletteOpen } = useShortcutContext();
    const pathname = usePathname();

    return (
        <aside className="w-20 border-r border-neutral-900 flex flex-col items-center py-6 gap-6 z-10 bg-[#0A0A0A] shrink-0">
            <div className="w-8 h-8 flex relative items-center justify-center mb-2">
                <div className="w-4 h-6 border-l-4 border-b-4 border-white skew-x-[-15deg]"></div>
            </div>

            <NavButton href="/projects" icon={<FolderClosed size={20} />} shortcut="P" label="Projects" isActive={pathname === '/projects'} />
            <NavButton href="/" icon={<Focus size={20} />} shortcut="F" label="Focus" isActive={pathname === '/'} />
            <NavButton href="/meetings" icon={<Calendar size={20} />} shortcut="M" label="Meetings" isActive={pathname === '/meetings'} />
            <NavButton href="/analytics" icon={<BarChart2 size={20} />} shortcut="A" label="Analytics" isActive={pathname === '/analytics'} />
            <NavButton href="/settings" icon={<Settings size={20} />} shortcut="S" label="Settings" isActive={pathname === '/settings'} />

            <div className="flex-1" />
            <button
                onClick={() => setCommandPaletteOpen(true)}
                className="relative w-14 flex flex-col items-center justify-center rounded-xl transition-all text-neutral-500 hover:text-white group"
            >
                <Search size={22} />
                <span className="absolute -top-1 -right-1 text-[8px] font-mono opacity-50 bg-neutral-900 px-1 rounded-sm border border-neutral-800">+S</span>
            </button>
        </aside>
    );
}

function NavButton({ href, icon, shortcut, label, isActive }: { href?: string, icon: React.ReactNode, shortcut: string, label: string, isActive?: boolean }) {
    const content = (
        <div className={`relative w-full flex text-sm flex-col items-center justify-center transition-all py-3 group rounded-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 ${isActive ? 'bg-neutral-900/40 text-white' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/20'}`}>
            <div className={`mb-1 relative`}>{icon}</div>
            <span className={`text-[10px] font-medium tracking-wide mt-1 ${isActive ? 'text-neutral-300' : 'text-neutral-500'}`}>{label}</span>
            <span className="absolute top-2 right-2 text-[9px] font-mono bg-[#1A1A1A] text-neutral-500 w-4 h-4 rounded flex items-center justify-center group-hover:text-neutral-300 border border-neutral-800">{shortcut}</span>
            {isActive && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#00A3FF] shadow-[0_0_12px_rgba(0,163,255,0.8)]" />}
        </div>
    );

    if (href) {
        return <Link href={href} className="w-full focus-visible:outline-none block">{content}</Link>;
    }
    return <button className="w-full focus-visible:outline-none block">{content}</button>;
}
