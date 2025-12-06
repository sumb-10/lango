"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  PenTool,
  MoreVertical,
  FolderPlus,
  Folder,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type MaterialStatus = "uploaded" | "processing" | "ready";

interface Material {
  id: number;
  title: string;
  author?: string | null;
  fileType: string;
  cefrLevel?: string | null;
  status: MaterialStatus;
}

interface FolderItem {
  id: number;
  name: string;
  parentId: number | null;
}

interface Stats {
  user: { creditBalance: number };
  materials: { total: number };
  learning: { completedSessions: number };
  vocabulary: { dueForReview: number };
}

// ⭐ NEW: LessonChunk 관련 타입
type CEFRLevel = "B2" | "C1" | "C2";

type LessonChunkConfigType =
  | "reading"
  | "structure"
  | "vocab"
  | "background"
  | "comprehension"
  | "writing";

interface LessonChunkConfig {
  type: LessonChunkConfigType;
  order: number;
}

const CHUNK_LABEL: Record<LessonChunkConfigType, string> = {
  reading: "Reading",
  structure: "Structure",
  vocab: "Vocab",
  background: "Background",
  comprehension: "Comprehension",
  writing: "Writing",
};

export default function DashboardPageClient() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);

  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  // track processing state per material id
  const [processingIds, setProcessingIds] = useState<number[]>([]);

  // ⭐ NEW: 모달/교재 설정용 상태
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessonLevel, setLessonLevel] = useState<CEFRLevel>("C1");
  const [chunkConfigs, setChunkConfigs] = useState<LessonChunkConfig[]>([
    { type: "reading", order: 1 },
    { type: "comprehension", order: 2 },
    { type: "structure", order: 3 },
    { type: "vocab", order: 4 },
    { type: "background", order: 5 },
    { type: "writing", order: 6 },
  ]);

  const fetchFolderContents = async (folderId: number | null = null) => {
    try {
      setLoadingMaterials(true);

      const qs = folderId !== null ? `?folderId=${folderId}` : "";
      const res = await fetch(`/api/materials${qs}`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to load materials");

      const data = await res.json();

      const rawMaterials = data?.materials ?? [];
      const normalizedMaterials: Material[] = Array.isArray(rawMaterials)
        ? rawMaterials.map((m: any) => ({
            id: m.id,
            title: m.title,
            author: m.author ?? null,
            fileType: m.file_type ?? m.fileType ?? "txt",
            cefrLevel: m.cefr_level ?? m.cefrLevel ?? null,
            status: (m.status as MaterialStatus) ?? "uploaded",
          }))
        : [];

      const rawFolders = data?.folders ?? [];
      const normalizedFolders: FolderItem[] = Array.isArray(rawFolders)
        ? rawFolders.map((f: any) => ({
            id: f.id,
            name: f.name,
            parentId: f.parent_id ?? null,
          }))
        : [];

      setMaterials(normalizedMaterials);
      setFolders(normalizedFolders);
      setCurrentFolderId(folderId);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "교재/폴더 로드에 실패했습니다");
    } finally {
      setLoadingMaterials(false);
    }
  };

  // ⭐ CHANGED: 파일 선택 시, 바로 업로드 X → 모달 오픈
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFile(file);
    setShowLessonModal(true);

    // 같은 파일 다시 선택해도 동작하도록 리셋
    e.target.value = "";
  };

  // ⭐ NEW: 모달에서 "교재 만들기" 클릭 시 실제 업로드 + lesson 빌드
  const handleCreateLessonFromPendingFile = async () => {
    if (!pendingFile) return;

    const file = pendingFile;
    const title = file.name.replace(/\.[^/.]+$/, "");
    const author = "user";

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("author", author);
      formData.append("file", file);
      if (currentFolderId !== null) {
        formData.append("folderId", String(currentFolderId));
      }
      formData.append("level", lessonLevel);
      formData.append("chunks", JSON.stringify(chunkConfigs));

      const res = await fetch("/api/materials/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error || "Upload failed");
      }

      const data = await res.json();
      const material = data.material;
      // const lesson = data.lesson; // 필요하면 나중에 콘솔에서 확인

      if (!material?.id) {
        throw new Error("업로드 응답에 material id가 없습니다");
      }

      toast.success("교재가 생성되었습니다.");

      await fetchFolderContents(currentFolderId);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "업로드 실패");
    } finally {
      setUploading(false);
      setPendingFile(null);
      setShowLessonModal(false);
    }
  };

  // ⭐ NEW: 모달 닫기(취소)
  const handleCancelLessonModal = () => {
    setShowLessonModal(false);
    setPendingFile(null);
  };

  // ⭐ NEW: chunk on/off 토글
  const handleToggleChunk = (type: LessonChunkConfigType) => {
    setChunkConfigs((prev) => {
      const exists = prev.find((c) => c.type === type);
      if (exists) {
        // 이미 있으면 제거
        return prev.filter((c) => c.type !== type);
      }
      // 없으면 맨 뒤에 추가
      const maxOrder = prev.reduce(
        (max, c) => (c.order > max ? c.order : max),
        0
      );
      return [...prev, { type, order: maxOrder + 1 }];
    });
  };

  // ⭐ NEW: chunk order 변경
  const handleChangeChunkOrder = (
    type: LessonChunkConfigType,
    orderStr: string
  ) => {
    const nextOrder = parseInt(orderStr, 10);
    if (Number.isNaN(nextOrder)) return;
    setChunkConfigs((prev) =>
      prev.map((c) =>
        c.type === type ? { ...c, order: nextOrder } : c
      )
    );
  };

  useEffect(() => {
    fetchFolderContents(null);
  }, []);

  // 🔹 여기서부터 조건부 return

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-muted-ink">로그인 상태를 확인하는 중입니다...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-4">
        <div className="text-muted-ink">로그인이 필요합니다</div>
        <Button
          variant="outline"
          onClick={() => router.push("/api/auth/login")}
        >
          Google로 로그인하기
        </Button>
      </div>
    );
  }

  const handleProcess = async (materialId: number) => {
    try {
      setProcessingIds((ids) => [...ids, materialId]);
      const res = await fetch("/api/materials/process", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.message || "Processing failed");
      }
      toast.success("교재 처리가 시작되었습니다");
      await fetchFolderContents(currentFolderId);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "처리 실패");
    } finally {
      setProcessingIds((ids) => ids.filter((id) => id !== materialId));
    }
  };

  const handleCreateFolderClick = async () => {
    const name = window.prompt("새 폴더 이름을 입력하세요.");
    if (!name || !name.trim()) {
      return;
    }

    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          parentId: currentFolderId,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error || "폴더 생성에 실패했습니다.");
      }

      toast.success("새 폴더가 생성되었습니다.");
      await fetchFolderContents(currentFolderId);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "폴더 생성 중 오류가 발생했습니다.");
    }
  };

  const handleFolderClick = (folderId: number) => {
    fetchFolderContents(folderId);
  };

  const handleGoRoot = () => {
    fetchFolderContents(null);
  };

  return (
    <div className="min-h-screen flex bg-bg">
      <div className="flex-1 flex flex-col">
        <Header variant="dashboard" />

        <main className="flex-1 px-4 md:px-8 py-6 overflow-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt, .pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="container">
            {/* Quick Actions */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleCreateFolderClick}
                className="p-6 bg-surface border-2 border-dashed border-primary/40 hover:border-primary/60 rounded-lg transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-highlight flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <FolderPlus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-ink mb-1">새 폴더</h3>
                <p className="text-sm text-muted-ink">
                  폴더를 만들어 교재를 디렉토리 방식으로 정리하세요
                </p>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-6 bg-surface border-2 border-dashed border-primary/40 hover:border-primary/60 rounded-lg transition-all text-left group disabled:opacity-60"
              >
                <Upload className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-ink mb-1">새 교재 업로드</h3>
                <p className="text-sm text-muted-ink">
                  TXT / PDF 파일을 업로드하여 학습을 시작하세요
                </p>
              </button>

              <Link
                href="/essay"
                className="block p-6 bg-surface border-2 border-dashed border-primary/40 hover:border-primary/60 rounded-lg transition-all group"
              >
                <PenTool className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-ink mb-1">긴글 작문 평가</h3>
                <p className="text-sm text-muted-ink">
                  작문을 제출하고 AI 평가를 받으세요
                </p>
              </Link>
            </div>

            {/* Materials */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-ink">내 교재</h2>
                {currentFolderId !== null && (
                  <button
                    type="button"
                    onClick={handleGoRoot}
                    className="text-xs text-muted-ink hover:text-primary underline underline-offset-2"
                  >
                    루트로 이동
                  </button>
                )}
              </div>

              {materials.length === 0 && folders.length === 0 && (
                <div className="text-center py-12 bg-surface rounded-lg border border-lango">
                  <p className="text-muted-ink">아직 업로드된 교재가 없습니다.</p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="mt-4 bg-primary hover:bg-primary/90 disabled:opacity-60"
                  >
                    첫 교재 업로드하기
                  </Button>
                </div>
              )}

              <div className="space-y-0">
                {/* 폴더들 */}
                {folders.map((folder) => (
                  <button
                    key={`folder-${folder.id}`}
                    type="button"
                    onClick={() => handleFolderClick(folder.id)}
                    className="w-full group flex items-center justify-between border border-lango bg-surface px-4 py-3 hover:border-primary/50 hover:bg-white/70 transition-all text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-highlight group-hover:bg-primary/15 transition-colors">
                        <Folder className="h-6 w-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {folder.name}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}

                {/* 파일(materials) */}
                {materials.map((material) => (
                  <div
                    key={material.id}
                    className="group flex items-center justify-between border border-lango bg-surface px-4 py-3 hover:border-primary/50 hover:bg-white/70 transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-highlight group-hover:bg-primary/15 transition-colors">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      {material.cefrLevel && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-highlight text-primary border border-primary/20">
                          {material.cefrLevel}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {material.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-ink">
                          {material.author || "user"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {material.status === "uploaded" && (
                        <Button
                          size="sm"
                          onClick={() => handleProcess(material.id)}
                          className="bg-primary text-white hover:bg-primary/90"
                          disabled={processingIds.includes(material.id)}
                        >
                          {processingIds.includes(material.id)
                            ? "처리중..."
                            : "처리 시작"}
                        </Button>
                      )}
                      {material.status === "ready" && (
                        <Link href={`/learning/${material.id}`}>
                          <Button
                            size="sm"
                            className="bg-primary text-white hover:bg-primary/90"
                          >
                            학습하기
                          </Button>
                        </Link>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded-full bg-white/80 hover:bg-white shadow-sm"
                          >
                            <MoreVertical className="h-4 w-4 text-muted-ink" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info(
                                "이름 변경 기능은 곧 추가될 예정입니다."
                              );
                            }}
                          >
                            이름 변경
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info(
                                "폴더로 이동 기능은 폴더 페이지와 연동 예정입니다."
                              );
                            }}
                          >
                            이동
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info(
                                "삭제 기능은 추후 안전장치와 함께 연결할 예정입니다."
                              );
                            }}
                          >
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ⭐ NEW: Lesson 구성 모달 */}
      {showLessonModal && pendingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-surface p-6 shadow-lg border border-lango">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">
                  새 교재 구성 설정
                </h2>
                <p className="text-xs text-muted-ink mt-1">
                  {pendingFile.name} 파일을 기반으로 LessonJson을 생성합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelLessonModal}
                className="text-muted-ink hover:text-ink text-sm"
              >
                닫기
              </button>
            </div>

            {/* Level 선택 */}
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-ink mb-1">
                CEFR 레벨
              </p>
              <div className="flex gap-2">
                {(["B2", "C1", "C2"] as CEFRLevel[]).map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => setLessonLevel(lv)}
                    className={`px-3 py-1 rounded-full text-xs border ${
                      lessonLevel === lv
                        ? "bg-primary text-white border-primary"
                        : "bg-surface text-ink border-lango"
                    }`}
                  >
                    {lv}
                  </button>
                ))}
              </div>
            </div>

            {/* Chunk 구성 선택 */}
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-ink mb-2">
                포함할 학습 요소 및 순서
              </p>
              <div className="space-y-2">
                {(Object.keys(CHUNK_LABEL) as LessonChunkConfigType[]).map(
                  (type) => {
                    const exist = chunkConfigs.find((c) => c.type === type);
                    return (
                      <div
                        key={type}
                        className="flex items-center justify-between gap-2 border border-lango rounded-lg px-3 py-2 bg-white/60"
                      >
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!exist}
                            onChange={() => handleToggleChunk(type)}
                          />
                          <span className="text-xs text-ink">
                            {CHUNK_LABEL[type]}
                          </span>
                        </label>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-muted-ink">
                            순서
                          </span>
                          <input
                            type="number"
                            min={1}
                            value={exist?.order ?? ""}
                            onChange={(e) =>
                              handleChangeChunkOrder(type, e.target.value)
                            }
                            disabled={!exist}
                            className="w-14 border border-lango rounded px-1 py-0.5 text-xs"
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
              <p className="mt-1 text-[11px] text-muted-ink">
                숫자가 작은 순서대로 Lesson에 배치됩니다. (동일한 숫자는 허용하지만
                가능한 겹치지 않게 설정하는 것을 추천)
              </p>
            </div>

            {/* 버튼 */}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={handleCancelLessonModal}
                className="text-xs px-3 py-1 h-8"
              >
                취소
              </Button>
              <Button
                type="button"
                onClick={handleCreateLessonFromPendingFile}
                disabled={uploading}
                className="text-xs px-4 py-1 h-8 bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {uploading ? "생성 중..." : "교재 만들기"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
