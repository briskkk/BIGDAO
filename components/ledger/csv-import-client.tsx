"use client";

import { useMemo, useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { csvTemplateHeaders, defaultMapping, parseCsv, validateImportRows, type CsvMapping } from "@/lib/csv/transaction-importer";
import { importTransactionsAction } from "@/lib/actions/wealth-actions";
import type { WealthRepositoryData } from "@/lib/repository";

export function CsvImportClient({ repo }: { repo: WealthRepositoryData }) {
  const [filename, setFilename] = useState("");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<CsvMapping>({});
  const [autoCreateAccounts, setAutoCreateAccounts] = useState(true);
  const [autoCreateInstruments, setAutoCreateInstruments] = useState(true);
  const [result, setResult] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const validated = useMemo(
    () =>
      validateImportRows({
        rows,
        mapping,
        accounts: repo.operational.accounts,
        instruments: repo.operational.instruments,
        autoCreateAccounts,
        autoCreateInstruments
      }),
    [rows, mapping, repo.operational.accounts, repo.operational.instruments, autoCreateAccounts, autoCreateInstruments]
  );
  const validRows = validated.filter((row) => row.errors.length === 0 && !row.duplicate && row.normalized);
  const invalidRows = validated.filter((row) => row.errors.length > 0);
  const duplicateRows = validated.filter((row) => row.duplicate);

  async function handleFile(file: File) {
    if (file.size > 1024 * 1024 * 2) {
      setResult("文件过大，请控制在 2MB 以内。");
      return;
    }
    const text = await file.text();
    const parsed = parseCsv(text);
    setFilename(file.name);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setMapping(defaultMapping(parsed.headers));
    setResult("");
  }

  function submitImport() {
    startTransition(async () => {
      const response = await importTransactionsAction({
        filename,
        totalRows: rows.length,
        validRows: validRows.map((row) => row.normalized!),
        invalidRows: invalidRows.length,
        duplicateRows: duplicateRows.length,
        autoCreateAccounts,
        autoCreateInstruments
      });
      setResult(response?.demo ? "Demo Mode：已完成浏览器侧校验，未写入数据库。" : `导入完成：${response?.importedRows ?? 0} 行。`);
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle>上传与字段映射</CardTitle></CardHeader>
      <div className="space-y-5">
        <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          <Upload className="mb-3 h-5 w-5 text-primary" />
          上传 UTF-8 CSV，浏览器本地解析。请勿包含身份证、银行卡号等敏感字段。
          <input className="hidden" type="file" accept=".csv,text/csv" onChange={(event) => event.target.files?.[0] && handleFile(event.target.files[0])} />
        </label>

        {filename ? <p className="text-sm text-muted-foreground">文件：{filename} · {rows.length} 行 · 列：{headers.join(" / ")}</p> : null}

        {headers.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {csvTemplateHeaders.map((field) => (
              <label key={field} className="text-sm text-muted-foreground">
                {field}
                <Select className="mt-1" value={mapping[field] ?? ""} onChange={(event) => setMapping((current) => ({ ...current, [field]: event.target.value }))}>
                  <option value="">不映射</option>
                  {headers.map((header) => <option key={header} value={header}>{header}</option>)}
                </Select>
              </label>
            ))}
          </div>
        ) : null}

        {headers.length > 0 ? (
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <label><input className="mr-2 accent-[hsl(var(--primary))]" type="checkbox" checked={autoCreateAccounts} onChange={(event) => setAutoCreateAccounts(event.target.checked)} />未知账户自动创建</label>
            <label><input className="mr-2 accent-[hsl(var(--primary))]" type="checkbox" checked={autoCreateInstruments} onChange={(event) => setAutoCreateInstruments(event.target.checked)} />未知标的自动创建</label>
          </div>
        ) : null}

        {validated.length > 0 ? (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <Stat label="有效行" value={validRows.length} />
              <Stat label="错误行" value={invalidRows.length} />
              <Stat label="重复行" value={duplicateRows.length} />
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/30">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="text-left text-muted-foreground"><tr><th className="px-3 py-2">行</th><th className="px-3 py-2">账户</th><th className="px-3 py-2">标的</th><th className="px-3 py-2">类型</th><th className="px-3 py-2">金额</th><th className="px-3 py-2">状态</th></tr></thead>
                <tbody>
                  {validated.slice(0, 20).map((row) => (
                    <tr key={row.index} className="border-t border-border/30">
                      <td className="px-3 py-2">{row.index + 1}</td>
                      <td className="px-3 py-2">{row.normalized?.accountName ?? row.row.account}</td>
                      <td className="px-3 py-2">{row.normalized?.instrumentSymbol ?? "-"}</td>
                      <td className="px-3 py-2">{row.normalized?.transactionType ?? "-"}</td>
                      <td className="px-3 py-2">{row.normalized?.grossAmount ?? "-"}</td>
                      <td className="px-3 py-2">{row.errors.length ? row.errors.join("；") : row.duplicate ? "重复" : "可导入"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button disabled={isPending || validRows.length === 0} onClick={submitImport}>{isPending ? "导入中..." : "确认导入有效行"}</Button>
          </>
        ) : null}
        {result ? <p className="text-sm text-primary">{result}</p> : null}
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-border/30 bg-muted/25 p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>;
}
