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
            <header className="sticky top-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {showBack && (
                        <button
                            onClick={handleBack}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-xl font-bold text-white leading-none tracking-tight">{title}</h1>
                        {subtitle && <p className="text-sm text-muted-foreground font-medium">{subtitle}</p>}
                    </div>
                </div>

                <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/5 text-sm font-medium text-muted-foreground hover:text-white transition-colors border border-transparent hover:border-white/10"
                    title="Volver al Inicio"
                >
                    <span className="hidden sm:inline">Volver al Inicio</span>
                    <X className="w-5 h-5" />
                </Link>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-3xl mx-auto p-4 md:p-8 space-y-6 pb-24">
                {children}
            </main>

        </div>
    );
}
