import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center text-center max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
          Sport Parking <span className="text-emerald-400">Reservas</span>
        </h1>
        <p className="text-lg text-neutral-400">
          Sistema de reservas oficial. Rápido, seguro y confiable.
        </p>

        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-8 py-3 transition-colors"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-neutral-700 hover:bg-neutral-800 px-8 py-3 transition-colors"
          >
            Registrarse
          </Link>
        </div>
      </main>
    </div>
  );
}
