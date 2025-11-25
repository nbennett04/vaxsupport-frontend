// app/auth.ts (Server Component)
import { cookies } from "next/headers";

import { axiosInstance } from "@/utils/axiosInstance";

export async function getUserSession() {
  const Cookies = await cookies();
  const cookie = Cookies.get("connect.sid")?.value;

  if (!cookie) return null;

  try {
    const res = await axiosInstance.get("/auth/check-session", {
      headers: { Cookie: `connect.sid=${cookie}` },
    });

    return res.data.isAuthenticated ? res.data.user : null;
  } catch (err) {
    return null;
  }
}
