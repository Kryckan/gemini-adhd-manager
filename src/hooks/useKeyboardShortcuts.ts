'use client';

import { useEffect } from 'react';

type ShortcutMap = {
    [key: string]: (e: KeyboardEvent) => void;
};

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();

            // Handle Cmd/Ctrl + K
            if (key === 'k' && (e.metaKey || e.ctrlKey)) {
                if (shortcuts['cmd+k']) {
                    e.preventDefault();
                    shortcuts['cmd+k'](e);
                }
            }

            // Handle Cmd/Ctrl + Shift + N
            if (key === 'n' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
                if (shortcuts['cmd+shift+n']) {
                    e.preventDefault();
                    shortcuts['cmd+shift+n'](e);
                }
            }

            // Handle Escape
            if (key === 'escape') {
                if (shortcuts['escape']) {
                    shortcuts['escape'](e);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
}
