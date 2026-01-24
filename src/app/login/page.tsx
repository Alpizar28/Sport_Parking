'use client';

import { useState } from 'react';
import { login } from '../auth/actions';
import Link from 'next/link';
import { mapAuthError } from '@/lib/auth-errors';
import { FormError, FieldError } from '@/components/ui/FormErrors';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState<{ title: string; message: string } | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

    const validate = () => {
        const errors: { email?: string; password?: string } = {};
        let isValid = true;

        if (!email) {
            errors.email = 'El correo electrónico es obligatorio.';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Ingresa un correo válido.';
            isValid = false;
        }

        if (!password) {
            errors.password = 'La contraseña es obligatoria.';
            isValid = false;
        }

        setFieldErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError(null);

        if (!validate()) return;
        if (loading) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        try {
            // Call Server Action
            const result = await login(formData);

            if (result && result.error) {
                // Map technical error to UI
                const mapped = mapAuthError(result.error);
                setGeneralError(mapped);
            }
            // else: redirect happens on server
        } catch (err) {
            const mapped = mapAuthError(err);
            setGeneralError(mapped);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-8">
            <div className="w-full max-w-md space-y-8 bg-neutral-900 p-8 rounded-xl border border-neutral-800">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
                        Iniciar Sesión
                    </h2>
                    <p className="mt-2 text-center text-sm text-neutral-400">
                        o{' '}
                        <Link href="/register" className="font-medium text-emerald-500 hover:text-emerald-400 focus:outline-none focus:underline transition-all">
                            registra una cuenta nueva
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
                    {/* Global Error Alert */}
                    {generalError && (
                        <FormError title={generalError.title} message={generalError.message} />
                    )}

                    <div className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-1">
                                Correo Electrónico
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                disabled={loading}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`block w-full rounded-md border-0 bg-neutral-800 py-3 text-white ring-1 ring-inset placeholder:text-neutral-500 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 px-4 transition-colors ${fieldErrors.email
                                        ? 'ring-red-500 focus:ring-red-500'
                                        : 'ring-neutral-700 focus:ring-emerald-500'
                                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="tu@email.com"
                            />
                            <FieldError message={fieldErrors.email} />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-1">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                disabled={loading}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`block w-full rounded-md border-0 bg-neutral-800 py-3 text-white ring-1 ring-inset placeholder:text-neutral-500 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 px-4 transition-colors ${fieldErrors.password
                                        ? 'ring-red-500 focus:ring-red-500'
                                        : 'ring-neutral-700 focus:ring-emerald-500'
                                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="••••••••"
                            />
                            <FieldError message={fieldErrors.password} />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative flex w-full justify-center rounded-md px-3 py-3 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all ${loading
                                    ? 'bg-emerald-800 cursor-wait'
                                    : 'bg-emerald-600 hover:bg-emerald-500'
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Validando...
                                </span>
                            ) : 'Entrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
