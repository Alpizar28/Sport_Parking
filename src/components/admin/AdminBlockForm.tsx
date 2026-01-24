'use client';

import { useState } from 'react';

export default function AdminBlockForm() {
    const [start, setStart] = useState(''); // datetime-local format
    const [end, setEnd] = useState('');
    const [resourceId, setResourceId] = useState('field_a');
    const [loading, setLoading] = useState(false);

    const handleBlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/admin/blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start: new Date(start).toISOString(),
                    end: new Date(end).toISOString(),
                    resources: [{ resource_id: resourceId, quantity: 1 }], // Simple block
                    note: 'Manual Block'
                })
            });

            if (res.ok) {
                alert('Bloqueo creado con éxito');
                setStart('');
                setEnd('');
            } else {
                const data = await res.json();
                alert(`Error: ${data.error} - ${data.details || ''}`);
            }
        } catch (err) {
            alert('Error de red');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleBlock} className="space-y-4">
            <div>
                <label className="block text-sm text-neutral-400 mb-1">Inicio</label>
                <input
                    type="datetime-local"
                    required
                    value={start}
                    onChange={e => setStart(e.target.value)}
                    className="w-full bg-neutral-800 border-neutral-700 rounded text-white p-2"
                />
            </div>
            <div>
                <label className="block text-sm text-neutral-400 mb-1">Fin</label>
                <input
                    type="datetime-local"
                    required
                    value={end}
                    onChange={e => setEnd(e.target.value)}
                    className="w-full bg-neutral-800 border-neutral-700 rounded text-white p-2"
                />
            </div>
            <div>
                <label className="block text-sm text-neutral-400 mb-1">Recurso</label>
                <select
                    value={resourceId}
                    onChange={e => setResourceId(e.target.value)}
                    className="w-full bg-neutral-800 border-neutral-700 rounded text-white p-2"
                >
                    <option value="field_a">Cancha A</option>
                    <option value="field_b">Cancha B</option>
                    {/* Add more as needed */}
                </select>
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-900 border border-red-800 text-red-200 hover:bg-red-800 rounded py-2 font-medium"
            >
                {loading ? 'Bloqueando...' : 'Crear Bloqueo'}
            </button>
        </form>
    );
}
