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

const STEPS = ['Experiencia', 'Fecha', 'Hora', 'Recursos', 'Confirmar'];

export default function ReservationFlow({ initialType }: Props) {
    const router = useRouter();

    // State Machine
    const [reservationType, setReservationType] = useState<'FIELD' | 'TABLE_ROW'>('FIELD');
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

    // Table UX State
    const [tableFilter, setTableFilter] = useState<'A' | 'B'>('A');
    const [tableSearch, setTableSearch] = useState('');

    // Persistence Effect (Load)
    useEffect(() => {
        const saved = localStorage.getItem('reservation_draft');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.date) setDate(parsed.date);
                // Do NOT restore startHour to force explicit selection
                // if (parsed.startHour) setStartHour(parsed.startHour); 
                if (parsed.duration) setDuration(parsed.duration);
            } catch (e) { console.error("Failed to load draft"); }
        } else {
            // Let DatePicker handle default "today" via shared helper or empty
            // Better to let user pick or component default? 
            // Component defaults to today, so we can just set it here if we want consistency
        }
    }, []);

    // Persistence Effect (Save)
    useEffect(() => {
        if (date && !isSuccess) {
            localStorage.setItem('reservation_draft', JSON.stringify({
                date, startHour, duration, selectedResources, reservationType
            }));
        }
    }, [date, startHour, duration, selectedResources, isSuccess, reservationType]);


    // Fetch Availability
    // Fetch Availability
    const fetchAvailability = async () => {
        if (!date) return;
        // Keep loading true only if triggered manually or first load, logic inside useEffect handles it.
        // But for manual call we want to set loading.
        // We can pass a param or just check if it's already loading?
        // Let's just set loading.
        // To avoid flickering on silent refresh we could have a separate state, but "Just before confirm" implies a blocking check.
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
    };

    useEffect(() => {
        fetchAvailability();
    }, [date]);

    // Handlers
    const handleNext = () => {
        if (currentStep === 1 && !reservationType) return alert("Selecciona una experiencia");
        if (currentStep === 2 && !date) return alert("Selecciona una fecha");
        if (currentStep === 3 && startHour === null) return alert("Selecciona hora de inicio");
        if (currentStep === 4 && selectedResources.length === 0) return alert("Selecciona al menos un recurso");

        if (currentStep < 5) setCurrentStep(c => c + 1);
        else handleCreateHold();
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(c => c - 1);
        else router.push('/');
    };


    const handleCreateHold = async () => {
        setLoading(true);
        setError(null);

        // Security: Refresh availability before confirming
        try {
            const resRev = await fetch(`/api/availability?date=${date}`);
            const dataRev = await resRev.json();
            if (dataRev.resources) {
                setResourcesData(dataRev.resources);

                // Optional: Check if selected resources are still available in the new data
                // This is a client-side convenience check. The backend will enforce it anyway.
            }
        } catch (e) {
            console.error("Failed to refresh availability", e);
            // Continue anyway, backend is source of truth
        }

        // Timestamps


        try {
            const res = await fetch('/api/reservations/hold', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: reservationType,
                    dateLocal: date,
                    startHour: startHour,
                    duration: duration,
                    resources: selectedResources,
                    customer_note: "" // Could be added in UI later
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


    // Type Change Handler
    const handleTypeSelection = (type: 'FIELD' | 'TABLE_ROW') => {
        if (type === reservationType) return;
        setReservationType(type);
        // Reset state on type switch to avoid mixed resources leak
        setSelectedResources([]);
        setError(null);
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

                        {reservationType === 'FIELD' ? (
                            <>
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
                                        <span className="text-2xl font-black text-primary">${(duration * 35 * selectedResources.length).toFixed(2)}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Tu mesa ha sido confirmada. ¡Te esperamos!
                            </p>
                        )}

                        <p className="text-xs text-muted-foreground/50 italic">
                            * Tu reserva será confirmada una vez verifiquemos el pago.
                        </p>

                        <button
                            onClick={() => {
                                // Reset state to start over
                                setIsSuccess(false);
                                setCurrentStep(1);
                                setStartHour(null);
                                setSelectedResources([]);
                                setConfirmedReservation(null);
                                fetchAvailability(); // Refresh data
                            }}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-widest rounded-lg transition-all"
                        >
                            Reservar Nuevamente
                        </button>
                    </div>
                </div>
            )
        }

        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-xl font-bold text-white uppercase tracking-wide text-center">¿Qué deseas reservar hoy?</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                            {/* Card: CANCHAS */}
                            <button
                                onClick={() => handleTypeSelection('FIELD')}
                                className={`relative group p-8 rounded-2xl border transition-all duration-300 text-left h-[280px] flex flex-col justify-end overflow-hidden
                                    ${reservationType === 'FIELD'
                                        ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]'
                                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                                    }`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
                                <div className="absolute inset-0 grayscale group-hover:grayscale-0 transition-all duration-500 opacity-60">
                                    <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center" />
                                </div>

                                <div className="relative z-20 space-y-2">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${reservationType === 'FIELD' ? 'bg-primary text-black' : 'bg-white/10 text-white'}`}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    </div>
                                    <h3 className={`text-2xl font-black uppercase tracking-tighter ${reservationType === 'FIELD' ? 'text-primary' : 'text-white'}`}>Canchas Sintéticas</h3>
                                    <p className="text-sm text-gray-300 font-medium">Fútbol 5 y 7. Iluminación profesional y pasto de primera generación.</p>
                                </div>
                                {reservationType === 'FIELD' && (
                                    <div className="absolute top-4 right-4 z-20 bg-primary text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest animate-in zoom-in">
                                        Seleccionado
                                    </div>
                                )}
                            </button>

                            {/* Card: MESAS */}
                            <button
                                onClick={() => handleTypeSelection('TABLE_ROW')}
                                className={`relative group p-8 rounded-2xl border transition-all duration-300 text-left h-[280px] flex flex-col justify-end overflow-hidden
                                    ${reservationType === 'TABLE_ROW'
                                        ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500 shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]'
                                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                                    }`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
                                <div className="absolute inset-0 grayscale group-hover:grayscale-0 transition-all duration-500 opacity-60">
                                    <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=1935&auto=format&fit=crop')] bg-cover bg-center" />
                                </div>

                                <div className="relative z-20 space-y-2">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${reservationType === 'TABLE_ROW' ? 'bg-amber-500 text-black' : 'bg-white/10 text-white'}`}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    </div>
                                    <h3 className={`text-2xl font-black uppercase tracking-tighter ${reservationType === 'TABLE_ROW' ? 'text-amber-500' : 'text-white'}`}>Mesas Lounge</h3>
                                    <p className="text-sm text-gray-300 font-medium">Disfruta del partido, bebidas y comida en nuestra zona exclusiva.</p>
                                </div>
                                {reservationType === 'TABLE_ROW' && (
                                    <div className="absolute top-4 right-4 z-20 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest animate-in zoom-in">
                                        Seleccionado
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-lg font-bold text-white uppercase tracking-wide">Selecciona la Fecha</h2>
                        <DatePicker selectedDate={date} onChange={setDate} />
                    </div>
                );
            case 3:
                // AGGREGATED AVAILABILITY LOGIC ENDS HERE
                if (loading) {
                    return (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-in fade-in">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-muted-foreground font-medium animate-pulse">Consultando disponibilidad...</p>
                        </div>
                    );
                }

                // Aggregate availability for TimePicker (Step 3)
                const aggregatedSlots: Record<number, 'AVAILABLE' | 'HOLD' | 'CONFIRMED'> = {};

                // Get relevant resources
                const matchingResources = resourcesData.filter(r => r.type === reservationType);
                const totalResources = matchingResources.length;

                // Loop hours 8-23
                for (let h = 8; h < 24; h++) {
                    // We need to check not just this hour `h`, but the block `[h, h+duration)`
                    // If ANY hour in the block is unavailable for a resource, that resource is unavailable for the block.

                    let availableCount = 0;
                    let confirmedBlockCount = 0;
                    let holdBlockCount = 0;

                    if (totalResources === 0) {
                        aggregatedSlots[h] = 'AVAILABLE';
                        continue;
                    }

                    // For each resource, check if it's free for the ENTIRE duration starting at h
                    for (const res of matchingResources) {
                        let isFree = true;
                        let isConfirmedBlocked = false;
                        let isHoldBlocked = false; // Could be HOLD or PAYMENT_PENDING

                        for (let i = 0; i < duration; i++) {
                            const checkH = h + i;
                            // Strict closing time at 24:00.
                            // If duration pushes us to 24:00 (e.g. 23+1), that's fine (checkH=23).
                            // If duration pushes us into 24+ (e.g. 23+2 -> checkH=24), that is invalid (Next Day / Closed).
                            if (checkH >= 24) {
                                isFree = false;
                                // Debug log if needed
                                // console.log("Time out of bounds", checkH);
                                break;
                            }

                            const timeLabel = `${checkH.toString().padStart(2, '0')}:00`;
                            const slot = res.slots?.find(s => s.time === timeLabel);
                            const status = slot?.status || 'AVAILABLE';

                            if (status !== 'AVAILABLE') {
                                isFree = false;
                                if (status === 'CONFIRMED') isConfirmedBlocked = true;
                                else if (status === 'HOLD' || status === 'PAYMENT_PENDING') isHoldBlocked = true;
                            }
                        }

                        if (isFree) {
                            availableCount++;
                        } else {
                            if (isConfirmedBlocked) confirmedBlockCount++;
                            // Else if blocked by hold only (or mixed without confirm), count as hold
                            // Note: We care about "ALL blocked by confirm".
                        }
                    }

                    // Determine State
                    if (availableCount > 0) {
                        aggregatedSlots[h] = 'AVAILABLE';
                    } else {
                        // All blocked. By what?
                        // If ALL resources are blocked and at least one is blocked by CONFIRMED, 
                        // is the hour RED or YELLOW?
                        // "Si blockingConfirmed == totalResources => RED"
                        // But wait, if 1 is confirmed and 1 is hold, available=0.
                        // The prompt says: "Mezcla: 1 CONFIRMED y 1 HOLD (sin libres) => rojo"
                        // Wait, prompt case D says: "Mezcla: 1 CONFIRMED y 1 HOLD (sin libres) => rojo"
                        // This implies if ANY is confirmed blocked and we have 0 availability, it's 'confirmed' heavy?
                        // OR maybe it means we prioritize CONFIRMED visualization if it contributes to the full block.

                        // Re-reading Prompt Aggregation Logic:
                        // "Si disponibles == 0:
                        //    Si blockedConfirmed == totalResources => RESERVED (rojo)
                        //    Else => IN_REVIEW (amarillo)"
                        // Prompt Case D: "1 CONFIRMED y 1 HOLD => rojo" -> CONTRADICTS the rule above?
                        // Rule: "Si blockedConfirmed == totalResources => Red". In Case D (total 2), blockedConfirmed=1. So 1 != 2. result Yellow.
                        // BUT Case D says "rojo".
                        // Okay, let's follow the Case D implication: likely if availability is 0, we show RED if we can't book because things are taken.
                        // Actually, 'IN_REVIEW' (yellow) usually implies "maybe you can wait".
                        // Let's stick to a robust interpretation:
                        // If 0 available:
                        //   If we have ANY confirmed blockage that prevents booking, it feels 'hard blocked'.
                        //   But strict rule: "Si blockedConfirmed == totalResources => RESERVED (rojo)".
                        //   Let's follow the strict rule first. Wait, Case D might mean "Red" visually?
                        //   Let's adjust to: If available == 0, if ANY is confirmed, treat as Red?
                        //   No, let's stick to the prompt text rule 2.

                        // Revised Logic based on "blockedConfirmed == totalResources"
                        // Case D (1 Confirmed, 1 Hold): blockedConfirmed = 1. total = 2. Red? No per rule.
                        // Let's assume the user wants: "If I can't book, red is reserved, yellow is pending."
                        // If 1 is reserved and 1 is pending, the slot is effectively reserved+pending.
                        // Let's implement blockedConfirmed == totalResources for RED. If mixed, YELLOW.

                        // WAIT: Prompt note says "Nota: si hay mezcla de confirmed + holds, rojo debe cambiar si confirmed ya bloquea el total."
                        // This sounds like: if confirmed count + hold count == total.

                        // Let's try to infer intent:
                        // Green: Can book.
                        // Yellow: Can't book, but maybe opens up (holds expire).
                        // Red: Can't book, won't open up (confirmed).

                        // In Case D (1 Confirmed, 1 Hold): 
                        // Can it open up? The Hold might expire. Then we have 1 Available.
                        // So Case D should effectively be YELLOW (Pending) because a Hold *might* free up allowing a booking.
                        // If User wants D to be Red, then "Available > 0" check failed.

                        // Let's follow Rule 2 exactly:
                        // if available == 0:
                        //    if blockedConfirmed == totalResources -> RED
                        //    else -> YELLOW (implies some are Holds that might expire)

                        // Wait, check specific resource logic:
                        // A resource is blocked confirmed if it has a confirmed overlap.
                        // A resource is blocked pending if it has data but no confirmed overlap.

                        // Let's count accurately.
                        const blockedByConfirmed = matchingResources.filter(r => {
                            // Check if this resource has a CONFIRMED overlap in range
                            for (let i = 0; i < duration; i++) {
                                const timeLabel = `${(h + i).toString().padStart(2, '0')}:00`;
                                const slot = r.slots?.find(s => s.time === timeLabel);
                                if (slot?.status === 'CONFIRMED') return true;
                            }
                            return false;
                        }).length;

                        if (blockedByConfirmed > 0) {
                            aggregatedSlots[h] = 'CONFIRMED';
                        } else {
                            // Means all blocked by holds.
                            aggregatedSlots[h] = 'HOLD';
                        }
                    }
                }

                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-lg font-bold text-white uppercase tracking-wide">Elige tu Horario</h2>
                        <TimePicker
                            selectedStartHour={startHour}
                            duration={duration}
                            onChange={setStartHour}
                            onDurationChange={setDuration}
                            busyHours={[]}
                            selectedDate={date!}
                            slotStatuses={aggregatedSlots}
                        />


                        <div className="text-xs text-center text-muted-foreground mt-4 italic max-w-md mx-auto">
                            * Los colores indican la disponibilidad general. Podrás elegir tu cancha específica en el siguiente paso.
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white uppercase tracking-wide">Recursos Disponibles</h2>
                        </div>

                        {/* TABLE UX CONTROLS */}
                        {reservationType === 'TABLE_ROW' && (
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 self-start">
                                    <button
                                        onClick={() => setTableFilter('A')}
                                        className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${tableFilter === 'A' ? 'bg-amber-500 text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                                    >
                                        Fila A
                                    </button>
                                    <button
                                        onClick={() => setTableFilter('B')}
                                        className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${tableFilter === 'B' ? 'bg-amber-500 text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                                    >
                                        Fila B
                                    </button>
                                </div>
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Buscar mesa (ej: A-05)..."
                                        value={tableSearch}
                                        onChange={(e) => setTableSearch(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50 transition-colors uppercase"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Resource Grid */}
                        <div className="bg-card border border-white/5 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
                            <h3 className="text-sm font-bold text-muted-foreground mb-6 uppercase tracking-widest border-b border-white/5 pb-4">
                                {date} • {startHour}:00 - {(startHour || 0) + duration}:00
                            </h3>
                            {loading && <div className="text-primary font-bold animate-pulse mb-4">Verificando disponibilidad...</div>}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {resourcesData
                                    .filter(r => r.type === reservationType)
                                    .filter(r => {
                                        if (reservationType !== 'TABLE_ROW') return true;

                                        // Filter Row
                                        if (!r.name.includes(`Mesa ${tableFilter}-`)) return false;

                                        // Filter Search
                                        if (tableSearch && !r.name.toLowerCase().includes(tableSearch.toLowerCase())) return false;

                                        return true;
                                    })
                                    .map(res => {
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
            case 5:
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
                            {reservationType === 'FIELD' ? (
                                <>
                                    <div className="pt-4 flex justify-between items-center">
                                        <span className="text-xl font-bold text-white uppercase tracking-tighter">Total Estimado</span>
                                        <span className="text-2xl font-black text-emerald-500">${(duration * 35 * selectedResources.length).toFixed(2)}</span>
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
                                </>
                            ) : (
                                <div className="pt-4 text-center border-t border-white/5 mt-4">
                                    <span className="block text-amber-500 font-bold uppercase tracking-widest text-sm mb-1">Reserva Gratuita</span>
                                    <p className="text-xs text-muted-foreground">Tu mesa será reservada inmediatamente sin costo.</p>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                );
        }
    };

    return (
        <ReservationLayout
            title={reservationType === 'FIELD' ? 'Reserva de Cancha' : 'Reserva de Mesa'}
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
                            disabled={loading || (currentStep === 2 && !date) || (currentStep === 3 && !startHour) || (currentStep === 4 && selectedResources.length === 0)}
                            className={`flex-[2] py-4 px-6 rounded-sm font-bold text-primary-foreground uppercase tracking-widest text-sm shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] transition-all transform active:scale-95 disabled:opacity-50 disabled:scale-100 ${loading ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-emerald-400 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)]'
                                }`}
                        >
                            {loading ? 'Procesando...' : currentStep === 5 ? 'Solicitar Reserva' : 'Continuar'}
                        </button>
                    </div>
                </div>
            )}
        </ReservationLayout>
    );
}
