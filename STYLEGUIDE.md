# Antigravity ADHD Manager - Style Guide

## 1. Design Philosophy: Intentional Minimalism
*   **Avant-Garde Aesthetics:** Reject standard "bootstrapped" layouts. Strive for bespoke layouts, asymmetry, and distinctive typography.
*   **The "Why" Factor:** Before placing any element, calculating its purpose is mandatory. If an element has no strict purpose, delete it.
*   **Zero Fluff:** Minimalism is the ultimate sophistication. Focus on content.
*   **Micro-interactions over clutter:** Use smooth micro-animations and perfect spacing rather than borders, drop shadows, or unnecessary colors. "Invisible" UX is the goal.

## 2. Core Constraints & Visual Rules
*   **Background:** Extremely dark monochromatic. Use `bg-[#0A0A0A]` or `--background` variable.
*   **Foreground/Text:** Soft neutral. Use `text-[#d4d4d4]` (neutral-300) or `--foreground` variable.
*   **Borders:** Remove them where possible. If a boundary is needed, use negative space (padding/margin) first. If a border is absolutely required, use a very subdued neutral (e.g., `border-neutral-800`).
*   **Accent Color:** Blue (`text-blue-500` or `bg-blue-500` for primary actions). Use sparingly.
*   **Scrollbars:** Hidden by default.
*   **Focus States:** Strict 2px solid blue outline (`outline-blue-500`) with 2px offset for accessibility keyboard navigation.

## 3. Component Architecture (CRITICAL)
*   **Library First:** If Shadcn UI, Radix UI, or another library component exists for a pattern (e.g., Modals, Dialogs, Dropdowns, Buttons), **YOU MUST USE IT**.
*   **No Re-inventing the Wheel:** Do not build custom UI primitives from scratch HTML/CSS if the primitive is available via the component library.
*   **Styling Overrides:** When styling library components to achieve the "Avant-Garde" look, use standard Tailwind classes (v4) to wrap or style the primitive, ensuring the underlying accessibility and state logic remains intact.

## 4. Typography
*   Ensure text hierarchy is distinct.
*   Use varying font weights and sizes to create structure rather than relying heavily on colors or boxes.

## 5. Development Workflow (Tailwind v4)
*   Avoid arbitrary values if standard tokens (e.g., `text-neutral-300`, `bg-neutral-900`) fulfill the need.
*   Do not pollute standard CSS files (`globals.css`) with components that can be composed using Tailwind utility classes within React/Next.js components.
