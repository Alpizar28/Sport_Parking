'use client';

import { useState } from 'react';
import { signup } from '../auth/actions';
import Link from 'next/link';
import { mapAuthError } from '@/lib/auth-errors';
import { FormError, FieldError } from '@/components/ui/FormErrors';
import { createClient } from '@/lib/supabase-client';

export default function RegisterPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState<{ title: string; message: string } | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ fullName?: string; email?: string; password?: string; confirm?: string }>({});

    const handleGoogleLogin = async () => {
        setLoading(true);
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=/`,
            },
        });
        if (error) {
            setGeneralError({ title: 'Error', message: error.message });
            setLoading(false);
        }
    };

    const validate = () => {
        const errors: { fullName?: string; email?: string; password?: string; confirm?: string } = {};
        let isValid = true;

        // Name
        if (!fullName.trim()) {
            errors.fullName = 'El nombre es obligatorio.';
            isValid = false;
        }

        // Email
        if (!email) {
            errors.email = 'El correo electrónico es obligatorio.';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Ingresa un correo válido.';
            isValid = false;
        }

        // Password
        if (!password) {
            errors.password = 'La contraseña es obligatoria.';
            isValid = false;
        } else if (password.length < 6) {
            errors.password = 'Debe tener al menos 6 caracteres.';
            isValid = false;
        }

        // Confirm
        if (password !== confirmPassword) {
            errors.confirm = 'Las contraseñas no coinciden.';
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
        formData.append('full_name', fullName);

        try {
            // Call Server Action
            const result = await signup(formData);

            if (result && result.error) {
                const mapped = mapAuthError(result.error);
                setGeneralError(mapped);
            }
            // else: redirect happens on server (or show success message if email confirm needed)
            // If redirect doesn't happen (because email confirm), Supabase usually returns nothing on success signup if not auto-logging in.
            // Check if action redirects. It does.
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
                <div className="absolute bottom-0 right-1/2 translate-x-1/2 w-[800px] h-[600px] bg-emerald-900/10 blur-[120px] rounded-full pointer-events-none" />
            </div>

            <Link href="/" className="absolute top-6 left-6 md:top-8 md:left-8 text-sm font-medium text-muted-foreground hover:text-white flex items-center gap-2 transition-colors group">
                <div className="p-2 rounded-full bg-secondary group-hover:bg-primary group-hover:text-black transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </div>
                Volver al Inicio
            </Link>

            <div className="w-full max-w-md space-y-8 bg-card p-6 md:p-8 rounded-2xl border border-white/5 shadow-2xl relative backdrop-blur-sm">
                <div>
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                    </div>
                    <h2 className="text-center text-3xl font-bold tracking-tight text-white">
                        Crear Cuenta
                    </h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                        o{' '}
                        <Link href="/login" className="font-medium text-primary hover:text-emerald-400 focus:outline-none focus:underline transition-all">
                            inicia sesión si ya tienes cuenta
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
                            <label htmlFor="fullName" className="block text-sm font-bold text-muted-foreground mb-1.5 uppercase text-xs tracking-wider">
                                Nombre Completo
                            </label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                autoComplete="name"
                                required
                                disabled={loading}
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className={`block w-full rounded-lg border bg-secondary/50 py-3 text-white ring-0 placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 px-4 transition-all ${fieldErrors.fullName
                                    ? 'border-destructive focus:ring-destructive'
                                    : 'border-white/5 focus:border-primary/50 focus:ring-primary/50'
                                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="Tu Nombre"
                            />
                            <FieldError message={fieldErrors.fullName} />
                        </div>
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
                                placeholder="tu@email.com"
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
                                autoComplete="new-password"
                                required
                                disabled={loading}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`block w-full rounded-lg border bg-secondary/50 py-3 text-white ring-0 placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 px-4 transition-all ${fieldErrors.password
                                    ? 'border-destructive focus:ring-destructive'
                                    : 'border-white/5 focus:border-primary/50 focus:ring-primary/50'
                                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="Mínimo 6 caracteres"
                            />
                            <FieldError message={fieldErrors.password} />
                        </div>

                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-bold text-muted-foreground mb-1.5 uppercase text-xs tracking-wider">
                                Confirmar Contraseña
                            </label>
                            <input
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                required
                                disabled={loading}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`block w-full rounded-lg border bg-secondary/50 py-3 text-white ring-0 placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 px-4 transition-all ${fieldErrors.confirm
                                    ? 'border-destructive focus:ring-destructive'
                                    : 'border-white/5 focus:border-primary/50 focus:ring-primary/50'
                                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="Repite la contraseña"
                            />
                            <FieldError message={fieldErrors.confirm} />
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
                                    Creando Cuenta...
                                </span>
                            ) : 'Registrarse'}
                        </button>
                    </div>
                </form>

                <div className="relative mt-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground font-bold tracking-widest">
                            O regístrate con
                        </span>
                    </div>
                </div>

                <div className="mt-6">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white rounded-lg px-3 py-3.5 text-sm font-bold uppercase tracking-widest border border-white/10 transition-all hover:border-white/20 hover:scale-[1.02]"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Google
                    </button>
                </div>
            </div>
        </div>
    );
}
