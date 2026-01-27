'use client';

import { useState } from 'react';
import { updatePassword } from '../auth/actions';
import { FormError, FieldError } from '@/components/ui/FormErrors';
import Link from 'next/link';

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState<{ title: string; message: string } | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});

    const validate = () => {
        const errors: { password?: string; confirm?: string } = {};
        let isValid = true;

        if (password.length < 6) {
            errors.password = 'La contraseña debe tener al menos 6 caracteres.';
            isValid = false;
        }

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
        formData.append('password', password);
        formData.append('confirmPassword', confirmPassword);

        try {
            const result = await updatePassword(formData);
            if (result && result.error) {
                setGeneralError({ title: 'Error', message: result.error });
            }
            // On success, action redirects
        } catch (err: any) {
            setGeneralError({ title: 'Error', message: err.message || 'Error desconocido' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-8 bg-background relative">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute bottom-0 right-1/2 translate-x-1/2 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
            </div>

            <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl border border-white/5 shadow-2xl relative backdrop-blur-sm">
                <div>
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    </div>
                    <h2 className="text-center text-3xl font-bold tracking-tight text-white">
                        Nueva Contraseña
                    </h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                        Ingresa y confirma tu nueva contraseña.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
                    {generalError && (
                        <FormError title={generalError.title} message={generalError.message} />
                    )}

                    <div className="space-y-5">
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
                                placeholder="••••••••"
                            />
                            <FieldError message={fieldErrors.password} />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-bold text-muted-foreground mb-1.5 uppercase text-xs tracking-wider">
                                Confirmar Contraseña
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
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

                    <button
                        type="submit"
                        disabled={loading}
                        className={`group relative flex w-full justify-center rounded-lg px-3 py-3.5 text-sm font-bold uppercase tracking-widest text-primary-foreground shadow-lg transition-all ${loading
                            ? 'bg-primary/80 cursor-wait'
                            : 'bg-primary hover:bg-emerald-400 hover:shadow-primary/30 transform hover:-translate-y-0.5'
                            }`}
                    >
                        {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
}
