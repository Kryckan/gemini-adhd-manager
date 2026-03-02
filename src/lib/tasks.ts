export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export function getTaskStatusStyles(status: string) {
    const normalizedStatus = status.toUpperCase();

    switch (normalizedStatus) {
        case 'DONE':
            return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
        case 'IN_PROGRESS':
            return 'text-sky-300 bg-sky-500/10 border-sky-500/25';
        case 'IN_REVIEW':
            return 'text-amber-300 bg-amber-500/10 border-amber-500/25';
        case 'BLOCKED':
            return 'text-rose-300 bg-rose-500/10 border-rose-500/25';
        default:
            return 'text-neutral-400 bg-neutral-800/50 border-neutral-700';
    }
}

export function getTaskPriorityStyles(priority: string) {
    const normalizedPriority = priority.toUpperCase();

    switch (normalizedPriority) {
        case 'CRITICAL':
            return 'text-red-300 bg-red-500/10 border-red-500/25';
        case 'HIGH':
            return 'text-orange-300 bg-orange-500/10 border-orange-500/25';
        case 'LOW':
            return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25';
        default:
            return 'text-neutral-400 bg-neutral-900 border-neutral-800';
    }
}
