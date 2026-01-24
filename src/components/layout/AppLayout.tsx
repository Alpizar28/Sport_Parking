'use client';

import { ReactNode } from 'react';

// This component provides the background and base styles for Pages that aren't the Reservation Flow
// but still need the glass/light theme (like Dashboard).
export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen relative font-sans text-gray-900">
            {/* Background Layer */}
            <div className="fixed inset-0 -z-10 bg-black">
                {/* Fallback gradient if image fails */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 to-black" />
                <img
                    src="/bg-field-dark.png"
                    alt="Background"
                    className="w-full h-full object-cover opacity-90"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                />
            </div>

            {children}
        </div>
    );
}
