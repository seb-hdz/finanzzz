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
import {
  SOURCE_TYPE_LABELS,
  PRESET_COLORS,
  SHARED_PUBLIC_ID_MAX_LEN,
  normalizeSharedPublicId,
  isValidSharedPublicId,
} from "@/lib/types";
import {
  addSource,
  updateSource,
  useSharedSyncState,
  setSharedSourceOutboundPassword,
} from "@/lib/db-hooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TextInitial } from "lucide-react";

interface SourceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: Source;
}

export function SourceForm({ open, onOpenChange, source }: SourceFormProps) {
  const [name, setName] = useState(source?.name ?? "");
  const [type, setType] = useState<SourceType>(source?.type ?? "bank_account");
  const [sharedPublicId, setSharedPublicId] = useState(
    source?.sharedPublicId ?? ""
  );
  const [linkPassword, setLinkPassword] = useState("");
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

  const syncState = useSharedSyncState(source?.id);
  const isEditing = !!source;

  const needsLinkPassword =
    type === "shared" &&
    (!syncState?.outboundPasswordLocked || !syncState?.outboundPassword);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    if (type === "shared") {
      const sid = normalizeSharedPublicId(sharedPublicId);
      if (!isValidSharedPublicId(sid)) {
        toast.error(
          `Id compartido: 1–${SHARED_PUBLIC_ID_MAX_LEN} caracteres (letras minúsculas, números, . _ -).`
        );
        return;
      }
      if (needsLinkPassword) {
        if (!linkPassword || linkPassword.length < 4) {
          toast.error(
            "La contraseña de enlace debe tener al menos 4 caracteres."
          );
          return;
        }
      }
    }

    const data: Omit<Source, "id" | "createdAt"> = {
      name: name.trim(),
      type,
      color,
      icon: type,
      maxLimit: maxLimit ? parseFloat(maxLimit) : -1,
      minLimit: minLimit ? parseFloat(minLimit) : -1,
      sharedPublicId:
        type === "shared" ? normalizeSharedPublicId(sharedPublicId) : undefined,
    };

    try {
      if (isEditing) {
        await updateSource(source.id, data);
        if (type === "shared" && needsLinkPassword && linkPassword) {
          await setSharedSourceOutboundPassword(source.id, linkPassword, true);
        }
      } else {
        const id = await addSource(data);
        if (type === "shared" && linkPassword) {
          await setSharedSourceOutboundPassword(id, linkPassword, true);
        }
      }

      onOpenChange(false);
      resetForm();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function resetForm() {
    if (!isEditing) {
      setName("");
      setType("bank_account");
      setSharedPublicId("");
      setLinkPassword("");
      setColor(PRESET_COLORS[0]);
      setMaxLimit("");
      setMinLimit("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
            <Select
              value={type}
              onValueChange={(v) => v && setType(v as SourceType)}
            >
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

          {type === "shared" && (
            <div className="space-y-2">
              <div className="space-y-2"></div>

              <Label htmlFor="sharedPublicId">Id compartido</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="sharedPublicId"
                  placeholder="ej: casa2024"
                  value={sharedPublicId}
                  onChange={(e) =>
                    setSharedPublicId(
                      normalizeSharedPublicId(e.target.value).slice(
                        0,
                        SHARED_PUBLIC_ID_MAX_LEN
                      )
                    )
                  }
                  maxLength={SHARED_PUBLIC_ID_MAX_LEN}
                  required
                  autoComplete="off"
                />
                {/* Solo
                minúsculas, números, y símbolos:{" "}
                <span className="font-mono text-foreground bg-muted rounded-md px-0.5 py-0.5">
                  .
                </span>
                ,{" "}
                <span className="font-mono text-foreground bg-muted rounded-md px-0.5 py-0.5">
                  _
                </span>{" "}
                o{" "}
                <span className="font-mono text-foreground bg-muted rounded-md px-0.5 py-0.5">
                  -
                </span> */}
                <div title="Solo minúsculas, números, y símbolos: ., _, -">
                  <TextInitial className="size-3.5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Debe ser el mismo en{" "}
                <span className="underline">ambos dispositivos</span>.
              </p>
            </div>
          )}

          {type === "shared" && needsLinkPassword && (
            <>
              <div className="space-y-2">
                <Label htmlFor="linkPw">Contraseña de enlace</Label>
                <Input
                  id="linkPw"
                  type="password"
                  value={linkPassword}
                  onChange={(e) => setLinkPassword(e.target.value)}
                  placeholder="Acordada fuera de la app"
                  autoComplete="new-password"
                />
              </div>
            </>
          )}

          {type === "shared" && syncState?.outboundPasswordLocked && (
            <p className="text-xs text-muted-foreground">
              La contraseña de enlace ya está definida en este dispositivo (solo
              lectura). Para sincronizar, usa &quot;Enviar actualización&quot;
              en Fuentes compartidas.
            </p>
          )}

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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">{isEditing ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
