"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/providers/theme-provider";

export function SonnerToaster() {
  const { theme } = useTheme();
  return <Toaster richColors position="top-right" theme={theme} />;
}
