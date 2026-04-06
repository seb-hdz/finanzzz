"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { seedFakeData } from "@/lib/fake-data/seed";

export default function DevSeedFakeDataButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const r = await seedFakeData();
      toast.success(
        `Datos de prueba: +${r.tagsAdded} etiquetas, +${r.sourcesAdded} fuentes, +${r.expensesAdded} gastos`
      );
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Error al poblar datos de prueba"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={loading}
    >
      DEV: poblar con data de prueba
    </Button>
  );
}
