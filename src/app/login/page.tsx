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

        <div className="flex min-h-screen items-center justify-center p-8 bg-background relative">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
            </div>

            <Link href="/" className="absolute top-6 left-6 md:top-8 md:left-8 text-sm font-medium text-muted-foreground hover:text-white flex items-center gap-2 transition-colors group">
                <div className="p-2 rounded-full bg-secondary group-hover:bg-primary group-hover:text-black transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </div>
                Volver al Inicio
            </Link>

            <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl border border-white/5 shadow-2xl relative backdrop-blur-sm">
                <div>
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" /></svg>
                    </div>
                    <h2 className="text-center text-3xl font-bold tracking-tight text-white">
                        Bienvenido de Nuevo
                    </h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                        o{' '}
                        <Link href="/register" className="font-medium text-primary hover:text-emerald-400 focus:outline-none focus:underline transition-all">
                            crea una cuenta para reservar
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
                            <label htmlFor="email" className="block text-sm font-bold text-muted-foreground mb-1.5 uppercase text-xs tracking-wider">
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
                                className={`block w-full rounded-lg border bg-secondary/50 py-3 text-white ring-0 placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 px-4 transition-all ${fieldErrors.email
                                    ? 'border-destructive focus:ring-destructive'
                                    : 'border-white/5 focus:border-primary/50 focus:ring-primary/50'
                                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="ejemplo@correo.com"
                            />
                            <FieldError message={fieldErrors.email} />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-bold text-muted-foreground mb-1.5 uppercase text-xs tracking-wider">
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
                                className={`block w-full rounded-lg border bg-secondary/50 py-3 text-white ring-0 placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 px-4 transition-all ${fieldErrors.password
                                    ? 'border-destructive focus:ring-destructive'
                                    : 'border-white/5 focus:border-primary/50 focus:ring-primary/50'
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
                            className={`group relative flex w-full justify-center rounded-lg px-3 py-3.5 text-sm font-bold uppercase tracking-widest text-primary-foreground shadow-lg transition-all ${loading
                                ? 'bg-primary/80 cursor-wait'
                                : 'bg-primary hover:bg-emerald-400 hover:shadow-primary/30 transform hover:-translate-y-0.5'
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Entrando...
                                </span>
                            ) : 'Iniciar Sesión'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
