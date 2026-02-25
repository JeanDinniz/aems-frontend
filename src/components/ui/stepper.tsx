import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
    label: string;
    description?: string;
}

interface StepperProps {
    steps: Step[];
    currentStep: number; // 0-based
    className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
    return (
        <nav aria-label="Etapas do formulário" className={cn('w-full', className)}>
            <ol className="flex items-center gap-0">
                {steps.map((step, idx) => {
                    const isDone    = idx < currentStep;
                    const isActive  = idx === currentStep;
                    const isPending = idx > currentStep;
                    const isLast    = idx === steps.length - 1;

                    return (
                        <li key={idx} className={cn('flex items-center', !isLast && 'flex-1')}>
                            {/* Bullet + label */}
                            <div className="flex flex-col items-center gap-1.5 select-none">
                                {/* Bullet */}
                                <div className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-200',
                                    isDone    && 'bg-aems-primary-400 border-aems-primary-400 text-aems-neutral-900 shadow-[0_0_10px_rgba(252,175,22,0.3)]',
                                    isActive  && 'bg-white border-aems-primary-400 text-aems-primary-500 shadow-[0_0_0_3px_rgba(252,175,22,0.15)]',
                                    isPending && 'bg-white border-aems-neutral-200 text-aems-neutral-300',
                                )}>
                                    {isDone ? <Check className="w-4 h-4" /> : <span>{idx + 1}</span>}
                                </div>

                                {/* Label */}
                                <div className="text-center hidden sm:block">
                                    <p className={cn(
                                        'text-[11px] font-semibold leading-tight whitespace-nowrap',
                                        isDone   && 'text-aems-primary-500',
                                        isActive && 'text-aems-neutral-700',
                                        isPending && 'text-aems-neutral-300',
                                    )}>
                                        {step.label}
                                    </p>
                                    {step.description && (
                                        <p className={cn(
                                            'text-[10px] leading-tight whitespace-nowrap',
                                            isActive ? 'text-aems-neutral-400' : 'text-aems-neutral-300'
                                        )}>
                                            {step.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Connector line */}
                            {!isLast && (
                                <div className={cn(
                                    'flex-1 h-0.5 mx-3 mt-[-20px] sm:mt-[-24px] rounded-full transition-all duration-300',
                                    idx < currentStep ? 'bg-aems-primary-400' : 'bg-aems-neutral-150'
                                )} />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
