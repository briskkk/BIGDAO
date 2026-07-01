import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CsvImportClient } from "@/components/ledger/csv-import-client";
import { getWealthRepository } from "@/lib/repository";

export default async function ImportsPage() {
  const repo = await getWealthRepository("imports");
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold">CSV 导入</h1>
          <p className="mt-2 text-sm text-muted-foreground">通用交易 CSV 模板，浏览器解析、预览、校验后再写入账本。</p>
        </div>
        <Button variant="secondary" asChild><a href="/api/csv-template"><Download className="h-4 w-4" />下载模板</a></Button>
      </div>
      <Card>
        <CardHeader><CardTitle>导入批次</CardTitle></CardHeader>
        <div className="grid gap-3 md:grid-cols-3">
          {repo.operational.importBatches.length === 0 ? <p className="text-sm text-muted-foreground">暂无导入批次。</p> : repo.operational.importBatches.slice(0, 6).map((batch) => (
            <div key={batch.id} className="rounded-xl border border-border/30 bg-muted/30 p-4 text-sm">
              <p className="font-medium">{batch.filename}</p>
              <p className="mt-1 text-muted-foreground">{batch.status} · 有效 {batch.validRows} / 错误 {batch.invalidRows} / 重复 {batch.duplicateRows}</p>
            </div>
          ))}
        </div>
      </Card>
      <CsvImportClient repo={repo} />
    </div>
  );
}
