'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useShortcutContext } from '@/components/providers/ShortcutProvider';
import { addTask } from '@/app/actions';

export function QuickNoteModal() {
    const { isQuickNoteOpen, setQuickNoteOpen } = useShortcutContext();
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isQuickNoteOpen && inputRef.current) {
            inputRef.current.focus();
            setError(null);
        }
    }, [isQuickNoteOpen]);

    if (!isQuickNoteOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={() => setQuickNoteOpen(false)}
        >
            <div
                className="w-full max-w-2xl bg-transparent p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <p className="text-blue-500 font-mono text-xs uppercase tracking-widest mb-4">Quick Capture Active</p>
                <textarea
                    ref={inputRef}
                    placeholder="Jot down a thought..."
                    className="w-full bg-transparent text-white text-4xl font-light outline-none placeholder:text-neutral-700 resize-none h-40 focus:ring-0 overflow-hidden"
                    onKeyDown={async (e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            if (isSaving) return;

                            const value = e.currentTarget.value.trim();
                            if (!value) {
                                setError('Type a note before saving.');
                                return;
                            }

                            setIsSaving(true);
                            setError(null);

                            try {
                                await addTask(`Quick Note: ${value}`, 'LOW', true);
                                if (inputRef.current) inputRef.current.value = '';
                                setQuickNoteOpen(false);
                            } catch (saveError) {
                                console.error('Quick note task creation failed', saveError);
                                setError('Could not save note as task. Try again.');
                            } finally {
                                setIsSaving(false);
                            }
                        }
                    }}
                />
                <div className="flex justify-between items-center border-t border-neutral-800 pt-4 mt-4">
                    <p className="text-neutral-600 text-sm">FlowState memory layer.</p>
                    <p className="text-neutral-500 text-xs font-mono bg-neutral-900 px-2 py-1 rounded">
                        {isSaving ? 'Saving...' : '⌘+Enter to save'}
                    </p>
                </div>
                {error && <p className="mt-3 text-xs font-mono text-red-400">{error}</p>}
            </div>
        </div>
    );
}
