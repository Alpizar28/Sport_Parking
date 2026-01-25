'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from '@/components/ui/DatePicker';
import TimePicker from '@/components/ui/TimePicker';
import Stepper from '@/components/ui/Stepper';
import ReservationLayout from '@/components/layout/ReservationLayout';

type Props = {
    initialType: string;
};

type Resource = {
    resource_id: string;
    name: string;
    type: 'FIELD' | 'TABLE_ROW';
    capacity: number;
    slots: { time: string, status: string }[];
};

const STEPS = ['Fecha', 'Hora', 'Recursos', 'Confirmar'];

export default function ReservationFlow({ initialType }: Props) {
    const router = useRouter();

    // State Machine
    const [currentStep, setCurrentStep] = useState(1);
    const [isSuccess, setIsSuccess] = useState(false);
    const [confirmedReservation, setConfirmedReservation] = useState<{ id: string } | null>(null);

    // Data State
    const [date, setDate] = useState<string>('');
    const [startHour, setStartHour] = useState<number | null>(null);
    const [duration, setDuration] = useState<number>(1);
    const [selectedResources, setSelectedResources] = useState<{ resource_id: string; quantity: number }[]>([]);

    // Async State
    const [resourcesData, setResourcesData] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Persistence Effect (Load)
    useEffect(() => {
        const saved = localStorage.getItem('reservation_draft');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.date) setDate(parsed.date);
                if (parsed.startHour) setStartHour(parsed.startHour);
                if (parsed.duration) setDuration(parsed.duration);
            } catch (e) { console.error("Failed to load draft"); }
        } else {
            setDate(new Date().toISOString().split('T')[0]);
        }
    }, []);

    // Persistence Effect (Save)
    useEffect(() => {
        if (date && !isSuccess) {
            localStorage.setItem('reservation_draft', JSON.stringify({
                date, startHour, duration, selectedResources
            }));
        }
    }, [date, startHour, duration, selectedResources, isSuccess]);


    // Fetch Availability
    useEffect(() => {
        if (!date) return;
        async function fetchAvailability() {
            setLoading(true);
            try {
                const res = await fetch(`/api/availability?date=${date}`);
                const data = await res.json();
                if (data.resources) {
                    setResourcesData(data.resources);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchAvailability();
    }, [date]);

    // Handlers
    const handleNext = () => {
        if (currentStep === 1 && !date) return alert("Selecciona una fecha");
        if (currentStep === 2 && startHour === null) return alert("Selecciona hora de inicio");
        if (currentStep === 3 && selectedResources.length === 0) return alert("Selecciona al menos un recurso");

        if (currentStep < 4) setCurrentStep(c => c + 1);
        else handleCreateHold();
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(c => c - 1);
        else router.push('/');
    };


    const handleCreateHold = async () => {
        setLoading(true);
        setError(null);

        // Timestamps
        const m = startHour!.toString().padStart(2, '0');
        const startIso = `${date}T${m}:00:00`;
        const endHour = startHour! + duration;
        const endM = endHour.toString().padStart(2, '0');
        const endIso = `${date}T${endM}:00:00`;

        const startDateObj = new Date(startIso);
        const endDateObj = new Date(endIso);

        try {
            const res = await fetch('/api/reservations/hold', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: initialType,
                    start: startDateObj.toISOString(),
                    end: endDateObj.toISOString(),
                    resources: selectedResources,
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error?.message || 'Error creating hold');
            }

            // Clear draft on success
            localStorage.removeItem('reservation_draft');
            setConfirmedReservation({ id: data.reservation.id });
            setIsSuccess(true);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleResource = (resId: string) => {
        const exists = selectedResources.find(r => r.resource_id === resId);
        if (exists) {
            setSelectedResources(selectedResources.filter(r => r.resource_id !== resId));
        } else {
            setSelectedResources([...selectedResources, { resource_id: resId, quantity: 1 }]);
        }
    };


    // Render Steps
    const renderStepContent = () => {
        if (isSuccess) {
            return (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="glass-panel p-8 text-center space-y-8 max-w-lg mx-auto border-emerald-500/30">
                        <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto ring-4 ring-amber-500/10">
                            <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>

                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Solicitud Recibida</h2>
                            <div className="inline-block px-4 py-1.5 bg-amber-500/20 rounded-full border border-amber-500/30">
                                <span className="text-amber-500 font-bold text-xs uppercase tracking-widest">Estado: En Revisión</span>
                            </div>
                        </div>

                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Hemos bloqueado tu espacio temporalmente. Para confirmar tu reserva, por favor realiza el pago manual a través de Yappy.
                        </p>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left space-y-4">
                            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                <div className="bg-primary/20 p-2 rounded-lg">
                                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-bold uppercase">Directorio Yappy</p>
                                    <p className="text-lg font-bold text-white tracking-wide">@SPORTPARKINGGROUP</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-sm font-medium text-gray-400">Total a Pagar</span>
                                <span className="text-2xl font-black text-primary">${(duration * 35).toFixed(2)}</span>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground/50 italic">
                            * Tu reserva será confirmada una vez verifiquemos el pago.
                        </p>

                        <button
                            onClick={() => router.push('/')}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-widest rounded-lg transition-all"
                        >
                            Volver al Inicio
                        </button>
                    </div>
                </div>
            )
        }

        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-lg font-bold text-white uppercase tracking-wide">Selecciona la Fecha</h2>
                        <DatePicker selectedDate={date} onChange={setDate} />
                    </div>
                );
            case 2:
                // Filter busy hours? Passed to timepicker?
                // For MVP TimePicker handles generic selection, validation happens on Step 3 or Computed.
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-lg font-bold text-white uppercase tracking-wide">Elige tu Horario</h2>
                        <TimePicker
                            selectedStartHour={startHour}
                            duration={duration}
                            onChange={setStartHour}
                            onDurationChange={setDuration}
                            busyHours={[]}
                        />
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-lg font-bold text-white uppercase tracking-wide">Recursos Disponibles</h2>

                        {/* Resource Grid */}
                        <div className="bg-card border border-white/5 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
                            <h3 className="text-sm font-bold text-muted-foreground mb-6 uppercase tracking-widest border-b border-white/5 pb-4">
                                {date} • {startHour}:00 - {(startHour || 0) + duration}:00
                            </h3>
                            {loading && <div className="text-primary font-bold animate-pulse mb-4">Verificando disponibilidad...</div>}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {resourcesData.map(res => {
                                    const isSelected = selectedResources.some(r => r.resource_id === res.resource_id);

                                    // Availability Check
                                    let isResourceBusy = false;
                                    if (startHour !== null) {
                                        for (let i = 0; i < duration; i++) {
                                            const timeLabel = `${(startHour + i).toString().padStart(2, '0')}:00`;
                                            const slot = res.slots?.find(s => s.time === timeLabel);
                                            if (!slot || slot.status !== 'AVAILABLE') isResourceBusy = true;
                                        }
                                    }

                                    return (
                                        <button
                                            key={res.resource_id}
                                            disabled={isResourceBusy}
                                            onClick={() => toggleResource(res.resource_id)}
                                            className={`
                                                w-full p-4 rounded-xl border transition-all flex justify-between items-center text-left group
                                                ${isResourceBusy
                                                    ? 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed grayscale'
                                                    : isSelected
                                                        ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]'
                                                        : 'border-white/10 bg-secondary/50 hover:bg-secondary hover:border-primary/50'
                                                }
                                            `}
                                        >
                                            <div>
                                                <div className={`font-bold transition-colors ${isSelected ? 'text-primary' : 'text-white group-hover:text-primary'}`}>
                                                    {res.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground font-medium tracking-wide">{res.type}</div>
                                            </div>
                                            <div>
                                                {isResourceBusy ? (
                                                    <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded text-[10px] font-bold uppercase tracking-wider border border-red-500/20">Ocupado</span>
                                                ) : isSelected ? (
                                                    <span className="px-2 py-1 bg-primary/20 text-primary rounded text-[10px] font-bold uppercase tracking-wider border border-primary/20">Listo</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-white/5 text-muted-foreground rounded text-[10px] font-bold uppercase tracking-wider group-hover:bg-primary/20 group-hover:text-primary transition-colors">Libre</span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-lg font-bold text-white uppercase tracking-wide">Resumen de Reserva</h2>
                        <div className="bg-card border border-white/5 p-6 rounded-2xl shadow-2xl space-y-4">
                            <div className="flex justify-between border-b border-white/5 pb-4">
                                <span className="text-muted-foreground font-medium">Fecha</span>
                                <span className="font-bold text-white">{date}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-4">
                                <span className="text-muted-foreground font-medium">Horario</span>
                                <span className="font-bold text-white">{startHour}:00 - {(startHour || 0) + duration}:00 ({duration}h)</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-4">
                                <span className="text-muted-foreground font-medium">Recursos</span>
                                <div className="text-right">
                                    {selectedResources.map(r => {
                                        const res = resourcesData.find(d => d.resource_id === r.resource_id);
                                        return <div key={r.resource_id} className="font-bold text-primary">{res?.name}</div>
                                    })}
                                </div>
                            </div>
                            <div className="pt-4 flex justify-between items-center">
                                <span className="text-xl font-bold text-white uppercase tracking-tighter">Total Estimado</span>
                                <span className="text-2xl font-black text-emerald-500">${(duration * 35).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 items-start">
                            <div className="text-blue-400 mt-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-1">Información de Pago</h4>
                                <p className="text-xs text-muted-foreground">Al confirmar, recibirás las instrucciones para realizar el pago por Yappy. Tu reserva quedará en estado "En Revisión" hasta validar el comprobante.</p>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium">
                                {error}
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <ReservationLayout
            title={initialType === 'FIELD' ? 'Reserva de Cancha' : 'Reserva de Evento'}
            subtitle={isSuccess ? 'Proceso Finalizado' : 'Configura tu experiencia'}
            showBack={!isSuccess}
            onBack={handleBack}
        >
            {!isSuccess && <Stepper steps={STEPS} currentStep={currentStep} />}

            <div className="mt-8 min-h-[300px]">
                {renderStepContent()}
            </div>

            {/* Sticky Footer for Actions */}
            {!isSuccess && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-xl border-t border-white/10 flex justify-center z-40">
                    <div className="w-full max-w-3xl flex gap-4">
                        <button
                            onClick={handleBack}
                            disabled={loading}
                            className="flex-1 py-4 px-6 rounded-sm border border-white/10 text-muted-foreground font-bold hover:bg-white/5 hover:text-white transition-colors uppercase tracking-widest text-sm"
                        >
                            {currentStep === 1 ? 'Cancelar' : 'Atrás'}
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={loading || (currentStep === 1 && !date) || (currentStep === 2 && !startHour) || (currentStep === 3 && selectedResources.length === 0)}
                            className={`flex-[2] py-4 px-6 rounded-sm font-bold text-primary-foreground uppercase tracking-widest text-sm shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] transition-all transform active:scale-95 disabled:opacity-50 disabled:scale-100 ${loading ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-emerald-400 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)]'
                                }`}
                        >
                            {loading ? 'Procesando...' : currentStep === 4 ? 'Solicitar Reserva' : 'Continuar'}
                        </button>
                    </div>
                </div>
            )}
        </ReservationLayout>
    );
}
