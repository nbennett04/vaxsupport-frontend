"use client";
import { useEffect } from "react";

import { axiosInstance } from "@/utils/axiosInstance";
import { useRouter } from "@/i18n/routing";

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const verifySession = async () => {
    try {
      const session = await axiosInstance.get("/auth/check-session");

      if (session?.data?.isAuthenticated) {
        if (session?.data?.user?.role === "admin") {
          router.replace("/admin/users");
        }
        if (session?.data?.user?.role === "user") {
          router.replace("/chat");
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    verifySession();
  }, []);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        {children}
      </div>
    </section>
  );
}
