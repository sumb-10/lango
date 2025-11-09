// lib/hooks/useAuth.ts
"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null;
  credit_balance: number;
  subscription_status: "free" | "basic" | "standard" | "pro";
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ✅ 세션은 서버 API에서만 읽어온다
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/auth/session", {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("세션 조회 실패");
        }

        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
      } catch (err) {
        console.error("Error loading session:", err);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const supabase = createClient();

  const logout = async () => {
    try {
      // 1) 서버 쿠키 세션 정리
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // 2) 클라이언트 상태 정리
      setUser(null);
      setProfile(null);

      // 3) 홈으로 보내기 (원하면 /auth/login 같은 곳으로 변경 가능)
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const login = () => {
    router.push("/api/auth/login");
  };

  return {
    user,
    profile,
    loading,
    logout,
    login,
    isAuthenticated: !!user,
  };
}
