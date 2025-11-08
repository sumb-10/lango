// components/StoreViewer.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, FileText, Sparkles, Clock } from "lucide-react";
import { toast } from "sonner";

type StoreMetadata = {
  short_description?: string;
  estimated_minutes?: number;
  tags?: string[];
  // 필요하면 여기에 더 추가
};

interface StoreMaterial {
  id: number;
  title: string;
  author?: string | null;
  file_type: string;
  file_url: string;
  file_size: number;
  cefr_level?: string | null;
  price: number;
  metadata?: StoreMetadata | null;
  // is_published, created_at 등은 서버에서 필터링/사용하므로 여기선 옵션
}

interface StorePageClientProps {
  materials: StoreMaterial[];
}

export default function StorePageClient({ materials }: StorePageClientProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handlePurchase = async (storeMaterialId: number) => {
    setLoadingId(storeMaterialId);
    try {
      const res = await fetch("/api/store/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ storeMaterialId }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(body?.error || "구매에 실패했습니다.");
        return;
      }

      const material = body?.material;

      // UX: 바로 학습 페이지로 이동
      if (material?.id) {
        toast.success("구매 완료! 바로 학습 페이지로 이동합니다.");
        router.push(`/learning/${material.id}`);
      } else {
        // 혹시 material이 없으면, 대시보드 새로고침만
        toast.success(
          "구매 완료! 대시보드의 ‘내 교재’에서 바로 사용할 수 있어요."
        );
        router.refresh();
      }
    } catch (error: any) {
      console.error("purchase error:", error);
      toast.error(error?.message || "구매 중 오류가 발생했습니다.");
    } finally {
      setLoadingId(null);
    }
  };

  const hasMaterials = materials && materials.length > 0;

  return (
    <div className="space-y-6">
      {/* 헤더 영역 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-ink">스토어 교재</h1>
          </div>
          <p className="text-sm text-muted-ink">
            교재를 구매하면, 내 대시보드 &quot;내 교재&quot;에 자동으로 추가됩니다.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-ink">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>구매 후 별도 업로드 없이 바로 학습 가능합니다.</span>
        </div>
      </div>

      {/* 리스트 영역 */}
      {!hasMaterials && (
        <div className="py-16 text-center bg-surface rounded-lg border border-lango">
          <p className="text-muted-ink mb-2">
            아직 준비된 스토어 교재가 없습니다.
          </p>
          <p className="text-xs text-muted-ink">
            새로운 교재는 곧 업데이트될 예정입니다.
          </p>
        </div>
      )}

      {hasMaterials && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {materials.map((m) => {
            const meta = (m.metadata ?? {}) as StoreMetadata;
            const description = meta.short_description;
            const estimatedMinutes = meta.estimated_minutes;

            return (
              <Card
                key={m.id}
                className="flex flex-col bg-surface border border-lango hover:border-primary/60 hover:shadow-md transition-all"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-highlight flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold line-clamp-2">
                          {m.title}
                        </CardTitle>
                        {m.author && (
                          <CardDescription className="text-xs mt-0.5">
                            {m.author}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {m.cefr_level && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {m.cefr_level}
                        </Badge>
                      )}
                      <span className="text-xs text-primary font-semibold">
                        {m.price > 0
                          ? `${m.price.toLocaleString()} 크레딧`
                          : "무료"}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between pt-0">
                  {/* 설명 / 메타 정보 */}
                  <div className="mb-3 space-y-1.5">
                    {description && (
                      <p className="text-xs text-ink line-clamp-3">
                        {description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-muted-ink">
                      <span>
                        파일형식: {m.file_type.toUpperCase()} ·{" "}
                        {(m.file_size / 1024).toFixed(0)} KB
                      </span>
                      {estimatedMinutes && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {estimatedMinutes}분 예상
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90 text-white"
                      disabled={loadingId === m.id}
                      onClick={() => handlePurchase(m.id)}
                    >
                      {loadingId === m.id ? "구매 중..." : "교재 구매"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
