"use client";
import { Card, CardBody } from "@heroui/card";
import { useEffect } from "react";

import AdminSideNav from "@/components/admin-side-nav";
import { axiosInstance } from "@/utils/axiosInstance";
import { useRouter } from "@/i18n/routing";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const verifySession = async () => {
    try {
      const session = await axiosInstance.get("/auth/check-session");

      if (
        !session?.data?.isAuthenticated ||
        session?.data?.user?.role !== "admin"
      ) {
        router.replace("/");
      }
    } catch (e) {
      console.log(e);
    }
  };

  // useEffect(() => {
  //   verifySession();
  // }, []);

  return (
    <section className="flex flex-col h-full items-center justify-center gap-4">
      <div className="inline-block w-full h-full justify-center py-6">
        <div className="flex flex-col sm:flex-row w-full h-full gap-10">
          <AdminSideNav />
          <Card className="h-[calc(100vh-64px-48px)] w-full">
            <CardBody>{children}</CardBody>
          </Card>
        </div>
      </div>
    </section>
  );
}
