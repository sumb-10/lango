// app/(dashboard)/dashboard/page.tsx
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
    BookOpen,
    CreditCard,
    MoreVertical,      
    FolderPlus,
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

interface Stats {
    user: { creditBalance: number };
    materials: { total: number };
    learning: { completedSessions: number };
    vocabulary: { dueForReview: number };
}

export default function DashboardPageClient() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [materials, setMaterials] = useState<Material[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loadingMaterials, setLoadingMaterials] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 파일 이름에서 확장자(.txt 등) 제거한 걸 제목으로 사용
        const title = file.name.replace(/\.[^/.]+$/, "");
        const author = "user";

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("author", author);
            formData.append("file", file);

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

            if (!material?.id) {
            throw new Error("업로드 응답에 material id가 없습니다");
            }

            toast.success("교재가 업로드되고 처리가 시작되었습니다");

            // 목록 갱신
            await fetchMaterials();
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || "업로드 실패");
        } finally {
            setUploading(false);
            // 같은 파일 다시 선택해도 onChange가 잘 호출되도록 리셋
            e.target.value = "";
        }
    };


    // track processing state per material id
    const [processingIds, setProcessingIds] = useState<number[]>([]);

    const fetchMaterials = async () => {
        try {
            setLoadingMaterials(true);
            const res = await fetch("/api/materials", { credentials: "include" });
            if (!res.ok) throw new Error("Failed to load materials");

            const data = await res.json();

            // 서버 응답이 { materials: [...] } 라고 가정
            const raw = data?.materials ?? [];

            // 타입 맞게 normalize
            const normalized: Material[] = Array.isArray(raw)
            ? raw.map((m: any) => ({
                id: m.id,
                title: m.title,
                author: m.author ?? null,
                fileType: m.file_type ?? m.fileType ?? "txt",
                cefrLevel: m.cefr_level ?? m.cefrLevel ?? null,
                status: (m.status as MaterialStatus) ?? "uploaded",
                }))
            : [];

            setMaterials(normalized);
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || "교재 로드에 실패했습니다");
        } finally {
            setLoadingMaterials(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
        //fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 🔹 여기서부터 조건부 return

    // 1) 세션 로딩 중
    if (loading) {
        return (
        <div className="min-h-screen flex items-center justify-center bg-bg">
            <div className="text-muted-ink">로그인 상태를 확인하는 중입니다...</div>
        </div>
        );
    }

    // 2) 세션 확인 끝났는데 user 없음
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
            // refresh list & stats
            await fetchMaterials();
            //await fetchStats();
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || "처리 실패");
        } finally {
            setProcessingIds((ids) => ids.filter((id) => id !== materialId));
        }
    };

    const handleCreateFolderClick = () => {
    // 나중에 여기서 폴더 생성 다이얼로그 or API 연결
    toast.info("폴더 생성은 곧 /materials 페이지와 함께 연결할 예정입니다.");
    // 우선은 폴더 관리 페이지로 보내버리는 것도 UX상 괜찮음
    // router.push("/materials");
    };


    return (
        <div className="min-h-screen flex bg-bg">
            <div className="flex-1 flex flex-col">
                <Header variant="dashboard" />

                {/* Main Content */}
                <main className="flex-1 px-4 md:px-8 py-6 overflow-auto">
                    <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt"
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
                                <p className="text-sm text-muted-ink">폴더를 만들어 교재를 디렉토리 방식으로 정리하세요</p>
                            </button>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="p-6 bg-surface border-2 border-dashed border-primary/40 hover:border-primary/60 rounded-lg transition-all text-left group disabled:opacity-60"
                            >
                                <Upload className="h-8 w-8 text-primary mb-3" />
                                <h3 className="font-semibold text-ink mb-1">새 교재 업로드</h3>
                                <p className="text-sm text-muted-ink">TXT 파일을 업로드하여 학습을 시작하세요</p>
                            </button>

                            <Link href="/essay" className="block p-6 bg-surface border-2 border-dashed border-primary/40 hover:border-primary/60 rounded-lg transition-all group">
                                <PenTool className="h-8 w-8 text-primary mb-3" />
                                <h3 className="font-semibold text-ink mb-1">긴글 작문 평가</h3>
                                <p className="text-sm text-muted-ink">작문을 제출하고 AI 평가를 받으세요</p>
                            </Link>
                            {
                            /* 추후 구현 예정
                            <Link href="/vocabulary" className="block p-6 bg-surface border-2 border-dashed border-primary/40 hover:border-primary/60 rounded-lg transition-all group">
                                <BookOpen className="h-8 w-8 text-primary mb-3" />
                                <h3 className="font-semibold text-ink mb-1">단어장 복습</h3>
                                <p className="text-sm text-muted-ink">단어를 복습해보아요.</p>
                            </Link>*/
                            }

                        </div>

                        {/* Materials Grid */}
                        <div>
                            <h2 className="text-xl font-semibold text-ink mb-4">내 교재</h2>

                            {materials && materials.length === 0 && (
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {materials?.map((material) => (
                                    <div
                                        key={material.id}
                                        className="group relative overflow-hidden bg-surface border border-lango hover:border-primary/60 hover:shadow-md transition-all cursor-pointer aspect-square rounded-lg"
                                    >
                                        {/* Content */}
                                        <div className="absolute inset-0 p-4 flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 rounded-lg bg-highlight flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                                                <FileText className="h-8 w-8 text-primary" />
                                            </div>
                                            <p className="text-ink text-center mb-1 px-2 line-clamp-2 text-sm font-semibold">
                                                {material.title}
                                            </p>
                                            {material.author && (
                                                <p className="text-muted-ink text-center mb-2 text-xs">
                                                    {material.author}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-1 justify-center">
                                                {material.cefrLevel && (
                                                    <span className="px-2 py-0.5 text-xs bg-highlight text-primary rounded border border-primary/20">
                                                        {material.cefrLevel}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="absolute top-2 left-2">
                                            <span className="px-2 py-0.5 text-xs bg-white/80 text-muted-ink border border-lango rounded">
                                                {material.status === "uploaded" && "대기중"}
                                                {material.status === "processing" && "처리중"}
                                                {material.status === "ready" && "완료"}
                                            </span>
                                        </div>

                                        {/* Context Menu (⋮) */}
                                        <div className="absolute top-2 right-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                onClick={(e) => e.stopPropagation()} // 카드 hover/클릭 막기
                                                className="p-1 rounded-full bg-white/80 hover:bg-white shadow-sm"
                                            >
                                                <MoreVertical className="h-4 w-4 text-muted-ink" />
                                            </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                e.stopPropagation();
                                                // TODO: 이름 변경 다이얼로그 연결
                                                toast.info("이름 변경 기능은 곧 추가될 예정입니다.");
                                                }}
                                            >
                                                이름 변경
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                e.stopPropagation();
                                                // TODO: '폴더로 이동' 다이얼로그나 /materials로 라우팅
                                                toast.info("폴더로 이동 기능은 폴더 페이지와 연동 예정입니다.");
                                                }}
                                            >
                                                이동
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={(e) => {
                                                e.stopPropagation();
                                                // TODO: 실제 삭제 API 연결
                                                toast.info("삭제 기능은 추후 안전장치와 함께 연결할 예정입니다.");
                                                }}
                                            >
                                                삭제
                                            </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        </div>


                                        {/* Action Buttons Overlay */}
                                        <div className="absolute inset-0 bg-ink/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                                            {material.status === "uploaded" && (
                                                <Button
                                                    onClick={() => handleProcess(material.id)}
                                                    className="bg-primary text-white hover:bg-primary/90"
                                                    disabled={processingIds.includes(material.id)}
                                                >
                                                    {processingIds.includes(material.id) ? "처리중..." : "처리 시작"}
                                                </Button>
                                            )}
                                            {material.status === "ready" && (
                                                <Link href={`/learning/${material.id}`}>
                                                    <Button className="bg-primary text-white hover:bg-primary/90">
                                                        학습하기
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
