export type AuthError = {
    title: string;
    message: string;
    fieldErrors?: Record<string, string>;
};

export const mapAuthError = (error: any): AuthError => {
    // 1. Network / Generic Errors
    if (!error) return { title: 'Error desconocido', message: 'Ocurrió un error inesperado.' };
    const msg = typeof error === 'string' ? error : error.message || '';
    const code = error.code || '';

    // 2. Supabase / Auth Specific Codes
    if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        return {
            title: 'Credenciales Incorrectas',
            message: 'El correo o la contraseña no son correctos. Por favor verifica e intenta de nuevo.'
        };
    }

    if (msg.includes('User already registered') || code === '23505') {
        return {
            title: 'Usuario ya registrado',
            message: 'Este correo electrónico ya está en uso. Intenta iniciar sesión.'
        };
    }

    if (msg.includes('Rate limit exceeded') || code === '429') {
        return {
            title: 'Demasiados intentos',
            message: 'Por favor espera unos momentos antes de intentar nuevamente.'
        };
    }

    if (msg.includes('Password should be at least')) {
        return {
            title: 'Contraseña débil',
            message: 'La contraseña debe tener al menos 6 caracteres.'
        };
    }

    if (msg.includes('Email not confirmed')) {
        return {
            title: 'Correo no confirmado',
            message: 'Por favor revisa tu bandeja de entrada y confirma tu correo electrónico.'
        };
    }

    // 3. Fallback / Network
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('connection')) {
        return {
            title: 'Error de Conexión',
            message: 'No se pudo conectar con el servidor. Revisa tu conexión a internet.'
        };
    }

    // Default
    return {
        title: 'Error de Autenticación',
        message: 'Ocurrió un error al procesar tu solicitud. Intenta nuevamente.'
    };
};
