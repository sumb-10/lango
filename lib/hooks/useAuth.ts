// lib/hooks/useAuth.ts

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

// ✅ public.users 테이블과 맞는 타입
export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null;
  credit_balance: number;
  subscription_status: "free" | "basic" | "standard" | "pro";
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);            // auth.users
  const [profile, setProfile] = useState<UserProfile | null>(null); // public.users
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();


    const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, name, cefr_level, credit_balance, subscription_status")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error loading user profile:", error);
        setProfile(null);
        return;
      }

      setProfile(data as UserProfile);
    } catch (err) {
      console.error("Unexpected error loading profile:", err);
      setProfile(null);
    }
  };

  useEffect(() => {
    // 초기 세션 확인
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const authUser = session?.user ?? null;
        setUser(authUser);

        if (authUser) {
          await loadProfile(authUser.id);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error getting session:", error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);

      if (authUser) {
        await loadProfile(authUser.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);


  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const login = () => {
    router.push("/api/auth/login");
  };

  return {
    user,              // auth.users
    profile,           // ✅ public.users
    loading,
    logout,
    login,
    isAuthenticated: !!user,
  };
}

