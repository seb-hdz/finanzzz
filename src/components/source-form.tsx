"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Source, SourceType } from "@/lib/types";
import { SOURCE_TYPE_LABELS, PRESET_COLORS } from "@/lib/types";
import { addSource, updateSource } from "@/lib/db-hooks";
import { cn } from "@/lib/utils";

interface SourceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: Source;
}

export function SourceForm({ open, onOpenChange, source }: SourceFormProps) {
  const [name, setName] = useState(source?.name ?? "");
  const [type, setType] = useState<SourceType>(source?.type ?? "bank_account");
  const [color, setColor] = useState(source?.color ?? PRESET_COLORS[0]);
  const [maxLimit, setMaxLimit] = useState(
    source?.maxLimit !== undefined && source.maxLimit >= 0
      ? source.maxLimit.toString()
      : ""
  );
  const [minLimit, setMinLimit] = useState(
    source?.minLimit !== undefined && source.minLimit >= 0
      ? source.minLimit.toString()
      : ""
  );

  const isEditing = !!source;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      type,
      color,
      icon: type,
      maxLimit: maxLimit ? parseFloat(maxLimit) : -1,
      minLimit: minLimit ? parseFloat(minLimit) : -1,
    };

    if (isEditing) {
      await updateSource(source.id, data);
    } else {
      await addSource(data);
    }

    onOpenChange(false);
    resetForm();
  }

  function resetForm() {
    if (!isEditing) {
      setName("");
      setType("bank_account");
      setColor(PRESET_COLORS[0]);
      setMaxLimit("");
      setMinLimit("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Fuente" : "Nueva Fuente de Pago"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              placeholder="Ej: Ahorros - BCP"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => v && setType(v as SourceType)}>
              <SelectTrigger>
                <span data-slot="select-value">{SOURCE_TYPE_LABELS[type]}</span>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SOURCE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform",
                    color === c
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="minLimit">Límite mínimo (S/)</Label>
              <Input
                id="minLimit"
                type="number"
                step="0.01"
                placeholder="Sin límite"
                value={minLimit}
                onChange={(e) => setMinLimit(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLimit">Límite máximo (S/)</Label>
              <Input
                id="maxLimit"
                type="number"
                step="0.01"
                placeholder="Sin límite"
                value={maxLimit}
                onChange={(e) => setMaxLimit(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{isEditing ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
