import { XCircle } from 'lucide-react';

interface FormErrorProps {
    title: string;
    message: string;
}

export function FormError({ title, message }: FormErrorProps) {
    if (!message) return null;

    return (
        <div className="rounded-md bg-red-900/40 border border-red-900/60 p-4 mb-6 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
                <h3 className="text-sm font-medium text-red-200">{title}</h3>
                <div className="mt-1 text-sm text-red-300/90">
                    {message}
                </div>
            </div>
        </div>
    );
}

interface FieldErrorProps {
    message?: string;
}

export function FieldError({ message }: FieldErrorProps) {
    if (!message) return null;
    return (
        <p className="mt-1 text-sm text-red-400 font-medium animate-in fade-in slide-in-from-top-1">
            {message}
        </p>
    );
}
