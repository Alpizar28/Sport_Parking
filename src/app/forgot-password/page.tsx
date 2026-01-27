'use client';

import { useState } from 'react';
import { resetPassword } from '../auth/actions';
import Link from 'next/link';
import { FormError, FieldError } from '@/components/ui/FormErrors';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [generalError, setGeneralError] = useState<{ title: string; message: string } | null>(null);
    const [fieldError, setFieldError] = useState<string | undefined>(undefined);

    const validate = () => {
        if (!email) {
            setFieldError('El correo electrónico es obligatorio.');
            return false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setFieldError('Ingresa un correo válido.');
            return false;
        }
        setFieldError(undefined);
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError(null);
        setSuccess(false);

        if (!validate()) return;
        if (loading) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('email', email);

        try {
            const result = await resetPassword(formData);

            if (result && result.error) {
                setGeneralError({ title: 'Error', message: result.error });
            } else {
                setSuccess(true);
            }
        } catch (err: any) {
            setGeneralError({ title: 'Error', message: err.message || 'Ocurrió un error inesperado.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-8 bg-background relative">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-0 right-1/2 translate-x-1/2 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
            </div>

            <Link href="/login" className="absolute top-6 left-6 md:top-8 md:left-8 text-sm font-medium text-muted-foreground hover:text-white flex items-center gap-2 transition-colors group">
                <div className="p-2 rounded-full bg-secondary group-hover:bg-primary group-hover:text-black transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </div>
                Volver al Login
            </Link>

            <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl border border-white/5 shadow-2xl relative backdrop-blur-sm">
                <div>
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    </div>
                    <h2 className="text-center text-3xl font-bold tracking-tight text-white">
                        Recuperar Contraseña
                    </h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                        Ingresa tu correo y te enviaremos un enlace para restablecerla.
                    </p>
                </div>

                {success ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center">
                        <h3 className="text-emerald-500 font-bold mb-2">¡Correo enviado!</h3>
                        <p className="text-sm text-emerald-100/70">
                            Revisa tu bandeja de entrada (y spam) para encontrar el enlace de recuperación.
                        </p>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
                        {generalError && (
                            <FormError title={generalError.title} message={generalError.message} />
                        )}

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
                                className={`block w-full rounded-lg border bg-secondary/50 py-3 text-white ring-0 placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 px-4 transition-all ${fieldError
                                    ? 'border-destructive focus:ring-destructive'
                                    : 'border-white/5 focus:border-primary/50 focus:ring-primary/50'
                                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="tu@email.com"
                            />
                            <FieldError message={fieldError} />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative flex w-full justify-center rounded-lg px-3 py-3.5 text-sm font-bold uppercase tracking-widest text-primary-foreground shadow-lg transition-all ${loading
                                ? 'bg-primary/80 cursor-wait'
                                : 'bg-primary hover:bg-emerald-400 hover:shadow-primary/30 transform hover:-translate-y-0.5'
                                }`}
                        >
                            {loading ? 'Enviando...' : 'Enviar Enlace'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
