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
                // Resources might be tricky if data changes, but let's try
                // if (parsed.selectedResources) setSelectedResources(parsed.selectedResources);
            } catch (e) { console.error("Failed to load draft"); }
        } else {
            // Default date to today if no draft
            setDate(new Date().toISOString().split('T')[0]);
        }
    }, []);

    // Persistence Effect (Save)
    useEffect(() => {
        if (date) {
            localStorage.setItem('reservation_draft', JSON.stringify({
                date, startHour, duration, selectedResources
            }));
        }
    }, [date, startHour, duration, selectedResources]);


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
        else router.back();
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

            // Payment
            const paymentRes = await fetch('/api/payments/yappy/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reservation_id: data.reservation.id })
            });

            const paymentData = await paymentRes.json();
            if (!paymentRes.ok) throw new Error(paymentData.error?.message);

            router.push(paymentData.checkout_url);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleResource = (resId: string) => {
        // Logic for single selection for now or multi
        const exists = selectedResources.find(r => r.resource_id === resId);
        if (exists) {
            setSelectedResources(selectedResources.filter(r => r.resource_id !== resId));
        } else {
            setSelectedResources([...selectedResources, { resource_id: resId, quantity: 1 }]);
        }
    };


    // Render Steps
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-lg font-semibold text-gray-700">Selecciona la Fecha</h2>
                        <DatePicker selectedDate={date} onChange={setDate} />
                    </div>
                );
            case 2:
                // Filter busy hours? Passed to timepicker?
                // For MVP TimePicker handles generic selection, validation happens on Step 3 or Computed.
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-lg font-semibold text-gray-700">Elige tu Horario</h2>
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
                        <h2 className="text-lg font-semibold text-gray-700">Recursos Disponibles</h2>

                        {/* Resource Grid */}
                        <div className="glass-card p-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase">
                                {date} • {startHour}:00 - {(startHour || 0) + duration}:00
                            </h3>
                            {loading && <div className="text-emerald-600 font-medium">Verificando disponibilidad...</div>}

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
                                                w-full p-4 rounded-xl border-2 transition-all flex justify-between items-center text-left
                                                ${isResourceBusy
                                                    ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                                                    : isSelected
                                                        ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 shadow-md transform scale-[1.02]'
                                                        : 'border-white bg-white hover:border-emerald-200 hover:shadow-lg'
                                                }
                                            `}
                                        >
                                            <div>
                                                <div className="font-bold text-gray-800">{res.name}</div>
                                                <div className="text-xs text-gray-500 font-medium tracking-wide">{res.type}</div>
                                            </div>
                                            <div>
                                                {isResourceBusy ? (
                                                    <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold">OCUPADO</span>
                                                ) : isSelected ? (
                                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">SELECCIONADO</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-bold">LIBRE</span>
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
                        <h2 className="text-lg font-semibold text-gray-700">Resumen de Reserva</h2>
                        <div className="glass-card p-6 space-y-4">
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500">Fecha</span>
                                <span className="font-medium text-gray-900">{date}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500">Horario</span>
                                <span className="font-medium text-gray-900">{startHour}:00 - {(startHour || 0) + duration}:00 ({duration}h)</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500">Recursos</span>
                                <div className="text-right">
                                    {selectedResources.map(r => {
                                        const res = resourcesData.find(d => d.resource_id === r.resource_id);
                                        return <div key={r.resource_id} className="font-medium text-gray-900">{res?.name}</div>
                                    })}
                                </div>
                            </div>
                            <div className="pt-4 flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-800">Total Estimado</span>
                                <span className="text-xl font-bold text-emerald-600">$ --.--</span>
                            </div>
                        </div>
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
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
            subtitle="Configura tu experiencia"
            onBack={handleBack}
        >
            <Stepper steps={STEPS} currentStep={currentStep} />

            <div className="mt-6 min-h-[300px]">
                {renderStepContent()}
            </div>

            {/* Sticky Footer for Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 flex justify-center z-40">
                <div className="w-full max-w-3xl flex gap-4">
                    {currentStep > 1 && (
                        <button
                            onClick={handleBack}
                            disabled={loading}
                            className="flex-1 py-3 px-6 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                        >
                            Atrás
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        disabled={loading || (currentStep === 1 && !date) || (currentStep === 2 && !startHour) || (currentStep === 3 && selectedResources.length === 0)}
                        className={`flex-[2] py-3 px-6 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:scale-100 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/30'
                            }`}
                    >
                        {loading ? 'Procesando...' : currentStep === 4 ? 'Confirmar y Pagar' : 'Continuar'}
                    </button>
                </div>
            </div>
        </ReservationLayout>
    );
}
