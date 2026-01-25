export default function Stepper({ steps, currentStep }: { steps: string[], currentStep: number }) {
    return (
        <div className="flex items-center justify-between px-2 py-4">
            {steps.map((label, index) => {
                const stepNum = index + 1;
                const isActive = stepNum === currentStep;
                const isCompleted = stepNum < currentStep;

                return (
                    <div key={label} className="flex flex-col items-center flex-1 relative">
                        {/* Connecting Line */}
                        {index !== 0 && (
                            <div className={`absolute top-4 right-[50%] w-full h-[2px] -z-10 ${isCompleted ? 'bg-primary' : 'bg-secondary'
                                }`} />
                        )}

                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm border
                            ${isActive
                                ? 'bg-primary text-primary-foreground border-primary ring-4 ring-primary/20 scale-110'
                                : isCompleted
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-secondary text-muted-foreground border-border'
                            }
                        `}>
                            {isCompleted ? '✓' : stepNum}
                        </div>
                        <span className={`mt-2 text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-muted-foreground'
                            }`}>
                            {label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
