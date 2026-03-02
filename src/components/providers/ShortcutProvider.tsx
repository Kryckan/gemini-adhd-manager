'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface ShortcutContextType {
    isCommandPaletteOpen: boolean;
    setCommandPaletteOpen: (open: boolean) => void;
    isQuickNoteOpen: boolean;
    setQuickNoteOpen: (open: boolean) => void;
}

const ShortcutContext = createContext<ShortcutContextType | undefined>(undefined);

export function ShortcutProvider({ children }: { children: ReactNode }) {
    const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [isQuickNoteOpen, setQuickNoteOpen] = useState(false);

    useKeyboardShortcuts({
        'cmd+k': () => setCommandPaletteOpen((prev) => !prev),
        'cmd+shift+n': () => setQuickNoteOpen((prev) => !prev),
        'escape': () => {
            setCommandPaletteOpen(false);
            setQuickNoteOpen(false);
        },
    });

    return (
        <ShortcutContext.Provider
            value={{
                isCommandPaletteOpen,
                setCommandPaletteOpen,
                isQuickNoteOpen,
                setQuickNoteOpen,
            }}
        >
            {children}
        </ShortcutContext.Provider>
    );
}

export function useShortcutContext() {
    const context = useContext(ShortcutContext);
    if (context === undefined) {
        throw new Error('useShortcutContext must be used within a ShortcutProvider');
    }
    return context;
}
