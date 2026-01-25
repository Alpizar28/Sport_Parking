import { XCircle } from 'lucide-react';

interface FormErrorProps {
    title: string;
    message: string;
}

export function FormError({ title, message }: FormErrorProps) {
    if (!message) return null;

    return (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 mb-6 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div>
                <h3 className="text-sm font-medium text-destructive">{title}</h3>
                <div className="mt-1 text-sm text-destructive/80">
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
        <p className="mt-1 text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
            {message}
        </p>
    );
}
