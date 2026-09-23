import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-2" style={{ color: "var(--color-accent)" }}>
          404
        </h1>
        <p className="text-lg mb-6" style={{ color: "var(--color-text-secondary)" }}>
          Pagina non trovata
        </p>
        <Link href="/" className="btn-primary px-6 py-2.5 text-sm">
          Torna alla home
        </Link>
      </div>
    </div>
  );
}
