import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-paper p-6 text-center text-ink">
      <div className="-rotate-2 rounded-nb border-5 border-ink bg-white p-8 shadow-nb-xl">
        <h1 className="font-display text-6xl font-black">404</h1>
        <p className="mt-2 text-lg font-bold text-muted">Halaman tidak ditemukan</p>
        <div className="mt-6 flex justify-center">
          <Link href="/host">
            <Button variant="primary">Kembali ke Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
