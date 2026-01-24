'use client';

import { ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ReservationLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    showBack?: boolean;
    onBack?: () => void;
}

export default function ReservationLayout({
    children,
    title,
    subtitle,
    showBack = true,
    onBack
}: ReservationLayoutProps) {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    return (
        <div className="min-h-screen relative flex flex-col font-sans">
            {/* Background Layer */}
            <div className="fixed inset-0 -z-10 bg-black">
                <img
                    src="/bg-field-dark.png"
                    alt="Background"
                    className="w-full h-full object-cover opacity-80"
                />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 glass-panel border-b-0 border-white/20 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {showBack && (
                        <button
                            onClick={handleBack}
                            className="p-2 rounded-full hover:bg-black/5 transition-colors text-gray-700"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 leading-none">{title}</h1>
                        {subtitle && <p className="text-sm text-gray-600 font-medium">{subtitle}</p>}
                    </div>
                </div>

                <Link
                    href="/dashboard"
                    className="p-2 rounded-full hover:bg-red-500/10 text-gray-500 hover:text-red-600 transition-colors"
                    title="Cancelar y Salir"
                >
                    <X className="w-6 h-6" />
                </Link>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-3xl mx-auto p-4 md:p-8 space-y-6 pb-24">
                {children}
            </main>

        </div>
    );
}
