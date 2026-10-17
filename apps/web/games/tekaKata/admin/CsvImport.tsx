"use client";

import { useState } from "react";
import { tekaKataApi } from "../api";
import { errorMessage } from "@/lib/errors";
import { useAdminToken } from "@/lib/hostTokenContext";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { AdminPageHeader } from "@/components/shell/AdminPageHeader";

const DEFAULT_SAMPLE_CSV = `word,category,difficulty
BANDAR,Umum,Easy
BADAN,Umum,Easy
DANA,Umum,Easy
DARA,Umum,Easy
NADA,Umum,Easy
KOMPUTER,Teknologi,Medium
ROKET,Teknologi,Medium
KONSULTAN,Profesi,Hard
TELEKOMUNIKASI,Teknologi,Boss`;

export function TekaKataCsvImport() {
  const token = useAdminToken();
  const toast = useToast();
  const [csvContent, setCsvContent] = useState(DEFAULT_SAMPLE_CSV);
  const [previewData, setPreviewData] = useState<{
    preview?: Array<{ word: string; categoryName: string; difficulty: string }>;
    totalValid?: number;
    totalErrors?: number;
    errors?: Array<{ line: number; raw: string; error: string }>;
  } | null>(null);

  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleValidate = async () => {
    if (!csvContent.trim()) return;
    setValidating(true);
    try {
      const res = await tekaKataApi.importCsv(token, csvContent, true);
      setPreviewData(res as typeof previewData);
      toast("Validasi CSV selesai. Tinjau hasil pratinjau di bawah.", "success");
    } catch (err) {
      toast(errorMessage(err, "Gagal memvalidasi CSV."), "error");
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!csvContent.trim()) return;
    setImporting(true);
    try {
      const res = await tekaKataApi.importCsv(token, csvContent, false);
      toast(`Berhasil mengimpor ${res.importedCount ?? 0} kata ke Word Bank!`, "success");
      setPreviewData(null);
    } catch (err) {
      toast(errorMessage(err, "Gagal mengimpor kata."), "error");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <AdminPageHeader
        title="Import CSV — Susun Kata"
        description="Impor banyak kata sekaligus menggunakan format CSV (word,category,difficulty)."
      />

      <Card>
        <CardTitle>Format CSV</CardTitle>
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-ink">
          <p>
            Pastikan file CSV memiliki kolom header: <code className="bg-ink/10 px-1 py-0.5 rounded font-mono font-bold">word,category,difficulty</code>
          </p>
          <ul className="list-disc pl-5 space-y-1 text-muted">
            <li><strong className="text-ink">word:</strong> Panjang kata antara 3–12 huruf.</li>
            <li><strong className="text-ink">category:</strong> Kategori (misal: Umum, Hewan, Makanan, Teknologi, Profesi).</li>
            <li><strong className="text-ink">difficulty:</strong> Easy, Medium, Hard, atau Boss.</li>
          </ul>
        </div>
      </Card>

      <Card>
        <CardTitle>Input CSV</CardTitle>
        <div className="flex flex-col gap-4 pt-2">
          <textarea
            rows={10}
            value={csvContent}
            onChange={(e) => {
              setCsvContent(e.target.value);
              setPreviewData(null);
            }}
            placeholder="word,category,difficulty&#10;BANDAR,Umum,Easy"
            className="w-full rounded-nb-sm border-2 border-ink p-3 font-mono text-xs leading-normal bg-white"
          />

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleValidate}
              disabled={validating || importing || !csvContent.trim()}
            >
              {validating ? "Memvalidasi..." : "🔍 Preview & Validasi"}
            </Button>

            {previewData && (previewData.totalValid ?? 0) > 0 && (
              <Button
                variant="primary"
                className="bg-green font-bold text-ink"
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? "Mengimpor..." : `🚀 Konfirmasi & Impor ${previewData.totalValid} Kata`}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {previewData && (
        <Card padded={false} className="overflow-hidden">
          <div className="border-b-2 border-ink bg-paper-deep p-4">
            <h3 className="font-display text-base uppercase">Hasil Validasi CSV</h3>
            <div className="mt-1 flex items-center gap-4 text-xs font-bold">
              <span className="text-[#15803d]">✓ Valid: {previewData.totalValid ?? 0} baris</span>
              {(previewData.totalErrors ?? 0) > 0 && (
                <span className="text-red">⚠ Error: {previewData.totalErrors} baris</span>
              )}
            </div>
          </div>

          {previewData.errors && previewData.errors.length > 0 && (
            <div className="border-b-2 border-ink bg-red/10 p-4 text-xs">
              <span className="font-bold text-red">Daftar Error Validasi:</span>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-red">
                {previewData.errors.map((err, idx) => (
                  <li key={idx}>
                    Baris {err.line}: &quot;{err.raw}&quot; — <span className="font-semibold">{err.error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {previewData.preview && previewData.preview.length > 0 && (
            <div className="overflow-x-auto p-4">
              <span className="text-xs font-bold uppercase text-muted">Pratinjau Data Valid (Maks. 50):</span>
              <table className="mt-2 w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-ink font-bold uppercase text-muted">
                    <th className="py-2">Kata</th>
                    <th className="py-2">Kategori</th>
                    <th className="py-2">Difficulty</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.preview.map((p, idx) => (
                    <tr key={idx} className="border-t border-ink/20">
                      <td className="py-2 font-display text-sm font-bold uppercase">{p.word}</td>
                      <td className="py-2 font-medium">{p.categoryName}</td>
                      <td className="py-2 font-bold uppercase">{p.difficulty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
