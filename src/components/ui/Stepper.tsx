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
                            <div className={`absolute top-4 right-[50%] w-full h-[2px] -z-10 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200'
                                }`} />
                        )}

                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm
                            ${isActive
                                ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 scale-110'
                                : isCompleted
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-white text-gray-400 border border-gray-200'
                            }
                        `}>
                            {isCompleted ? '✓' : stepNum}
                        </div>
                        <span className={`mt-2 text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-emerald-700' : 'text-gray-400'
                            }`}>
                            {label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
