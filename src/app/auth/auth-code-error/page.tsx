'use client';

import Link from 'next/link';

export default function AuthErrorPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black text-white">
            <div className="w-full max-w-md p-8 bg-neutral-900 border border-white/10 rounded-2xl text-center space-y-6">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold">Error de Autenticación</h1>

                <p className="text-muted-foreground">
                    Hubo un problema al verificar tu sesión o el enlace ha expirado.
                </p>

                <div className="pt-4">
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors uppercase tracking-wider text-sm w-full"
                    >
                        Volver a Iniciar Sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}
