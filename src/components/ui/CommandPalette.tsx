'use client';

import React, { useState } from 'react';
import { Command } from 'cmdk';
import { Search, CheckCircle, Calendar, ClipboardList, Target } from 'lucide-react';
import { useShortcutContext } from '@/components/providers/ShortcutProvider';
import { addTask } from '@/app/actions';

export function CommandPalette() {
    const { isCommandPaletteOpen, setCommandPaletteOpen } = useShortcutContext();
    const [query, setQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddTask = async () => {
        if (isSubmitting) return;

        const title = query.trim() || 'New Unnamed Task';
        setIsSubmitting(true);
        setError(null);

        try {
            await addTask(title, 'MEDIUM', true);
            setQuery('');
            setCommandPaletteOpen(false);
        } catch (insertError) {
            console.error('Command palette task creation failed', insertError);
            setError('Could not create task. Try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isCommandPaletteOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm shadow-2xl"
            onClick={() => setCommandPaletteOpen(false)}
        >
            <div
                className="w-full max-w-[600px] bg-[#1A1A24] border border-neutral-700 rounded-xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <Command label="Command Menu" className="w-full h-full flex flex-col bg-transparent">
                    <div className="flex items-center px-4 py-4 border-b border-neutral-800">
                        <Search className="text-neutral-500 mr-3 shrink-0" size={20} />
                        <Command.Input
                            autoFocus
                            placeholder="Search or command (⌘K)... Type 'Assign' to delegate."
                            className="bg-transparent w-full text-white text-lg outline-none placeholder:text-neutral-600 font-light border-none focus:ring-0"
                            value={query}
                            onValueChange={(value) => {
                                setQuery(value);
                                if (error) setError(null);
                            }}
                        />
                    </div>

                    <Command.List className="p-2 max-h-[300px] overflow-y-auto">
                        <Command.Empty className="text-neutral-500 text-sm py-6 text-center">
                            No results found. Press <span className="bg-neutral-800 px-1 rounded text-neutral-400 font-mono text-xs">Enter</span> to create as task.
                        </Command.Empty>

                        <Command.Group heading="Quick Actions" className="text-xs text-neutral-500 font-medium px-2 py-2">
                            <CommandItem
                                icon={<CheckCircle size={16} />}
                                label="Add Task to NOW"
                                shortcut="T"
                                onSelect={handleAddTask}
                            />
                            <CommandItem
                                icon={<Target size={16} />}
                                label="Focus Now (Clear Screen)"
                                shortcut="F"
                                onSelect={() => setCommandPaletteOpen(false)}
                            />
                            <CommandItem icon={<Calendar size={16} />} label="View Upcoming Schedule" shortcut="S" onSelect={() => setCommandPaletteOpen(false)} />
                            <CommandItem icon={<ClipboardList size={16} />} label="Show Delegated Items" shortcut="D" onSelect={() => setCommandPaletteOpen(false)} />
                        </Command.Group>
                        {error && <p className="px-3 py-2 text-xs font-mono text-red-400">{error}</p>}
                        {isSubmitting && <p className="px-3 py-2 text-xs font-mono text-neutral-500">Creating task...</p>}
                    </Command.List>
                </Command>
            </div>
        </div>
    );
}

function CommandItem({
    icon,
    label,
    shortcut,
    onSelect
}: {
    icon: React.ReactNode;
    label: string;
    shortcut: string;
    onSelect: () => void;
}) {
    return (
        <Command.Item
            onSelect={onSelect}
            className="flex items-center justify-between px-3 py-3 mt-1 rounded-lg cursor-pointer text-neutral-300 hover:bg-blue-600/20 hover:text-blue-400 aria-selected:bg-blue-600/20 aria-selected:text-blue-400 outline-none transition-colors"
        >
            <div className="flex items-center gap-3">
                {icon}
                <span className="text-sm">{label}</span>
            </div>
            <span className="text-[10px] font-mono text-neutral-500 bg-[#0E0E11] px-1.5 py-0.5 rounded border border-neutral-800">{shortcut}</span>
        </Command.Item>
    );
}
