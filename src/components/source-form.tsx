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
import { Separator } from "@/components/ui/separator";
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
import { Eye, EyeOff, Info, Regex, Trash2 } from "lucide-react";
import { ContextHint } from "@/components/ui/context-hint";
import { SourceTypeIcon } from "@/components/source-type-icon";

interface SourceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: Source;
  /** Al editar: abre el flujo de confirmación de borrado (p. ej. AlertDialog en la página). */
  onDeleteRequest?: (source: Source) => void;
}

export function SourceForm({
  open,
  onOpenChange,
  source,
  onDeleteRequest,
}: SourceFormProps) {
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
  const sharedTypeLocked =
    isEditing && source !== undefined && source.type === "shared";
  const [showOutboundPw, setShowOutboundPw] = useState(false);
  const [showLinkPassword, setShowLinkPassword] = useState(false);

  const needsLinkPassword =
    type === "shared" &&
    (!syncState?.outboundPasswordLocked || !syncState?.outboundPassword);

  const sharedPublicIdLocked =
    type === "shared" &&
    isEditing &&
    isValidSharedPublicId(
      normalizeSharedPublicId(source?.sharedPublicId ?? "")
    );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    if (type === "shared") {
      const sid = sharedPublicIdLocked
        ? normalizeSharedPublicId(source!.sharedPublicId ?? "")
        : normalizeSharedPublicId(sharedPublicId);
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
        type === "shared"
          ? sharedPublicIdLocked
            ? normalizeSharedPublicId(source!.sharedPublicId ?? "")
            : normalizeSharedPublicId(sharedPublicId)
          : undefined,
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
      setShowLinkPassword(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      disablePointerDismissal
    >
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
            <Label>Tipo de cuenta</Label>
            <Select
              value={type}
              onValueChange={(v) => v && setType(v as SourceType)}
              disabled={sharedTypeLocked}
            >
              <SelectTrigger className="w-full min-w-0">
                <span
                  className="inline-flex shrink-0 text-muted-foreground [&_svg]:pointer-events-none [&_svg]:size-4"
                  aria-hidden
                >
                  <SourceTypeIcon type={type} className="size-4" />
                </span>
                <span
                  data-slot="select-value"
                  className="min-w-0 flex-1 text-left"
                >
                  {SOURCE_TYPE_LABELS[type]}
                </span>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SOURCE_TYPE_LABELS) as SourceType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    <span className="flex min-w-0 items-center gap-2">
                      <SourceTypeIcon
                        type={t}
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                      <span className="min-w-0">{SOURCE_TYPE_LABELS[t]}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sharedTypeLocked ? (
              <p className="text-xs text-muted-foreground">
                El tipo de una cuenta compartida no se puede cambiar.
              </p>
            ) : null}
          </div>

          {type === "shared" && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Label htmlFor="sharedPublicId">Id compartido</Label>
                <ContextHint
                  mode="popover"
                  side="bottom"
                  aria-label="Reglas de formato del id compartido"
                  trigger={<Info className="size-3.5" />}
                  triggerClassName="size-5"
                >
                  <div className="flex items-start gap-2 text-sm leading-snug">
                    <Regex
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <span>Solo minúsculas, números, y símbolos</span>
                  </div>
                </ContextHint>
              </div>
              <Input
                id="sharedPublicId"
                placeholder="ej: casa2024"
                value={sharedPublicId}
                readOnly={sharedPublicIdLocked}
                onChange={(e) => {
                  if (sharedPublicIdLocked) return;
                  setSharedPublicId(
                    normalizeSharedPublicId(e.target.value).slice(
                      0,
                      SHARED_PUBLIC_ID_MAX_LEN
                    )
                  );
                }}
                maxLength={SHARED_PUBLIC_ID_MAX_LEN}
                required
                autoComplete="off"
                className={cn(sharedPublicIdLocked && "bg-muted/50")}
              />
              <p className="text-xs text-muted-foreground">
                {sharedPublicIdLocked ? (
                  <>Solo lectura. El id compartido no se puede cambiar.</>
                ) : (
                  <>
                    Debe ser el mismo en{" "}
                    <span className="underline">ambos dispositivos</span>.
                  </>
                )}
              </p>
            </div>
          )}

          {type === "shared" && needsLinkPassword && (
            <>
              <div className="space-y-2">
                <Label htmlFor="linkPw">Contraseña</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="linkPw"
                    type={showLinkPassword ? "text" : "password"}
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    placeholder="Contraseña para proteger la URL compartida"
                    autoComplete="new-password"
                    className="min-w-0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowLinkPassword((v) => !v)}
                    aria-label={
                      showLinkPassword
                        ? "Ocultar contraseña de enlace"
                        : "Mostrar contraseña de enlace"
                    }
                  >
                    {showLinkPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Debe introducirse al sincronizar en el{" "}
                  <span className="underline">otro dispositivo</span>.
                </p>
              </div>
            </>
          )}

          {type === "shared" && syncState?.outboundPasswordLocked && (
            <div className="space-y-2">
              <Label>Contraseña de enlace</Label>
              <div className="flex gap-2 items-center">
                <Input
                  readOnly
                  type={showOutboundPw ? "text" : "password"}
                  value={syncState.outboundPassword ?? ""}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowOutboundPw((v) => !v)}
                >
                  {showOutboundPw ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Solo lectura. Para sincronizar, usa &quot;Enviar
                actualización&quot; en Fuentes compartidas.
              </p>
            </div>
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
              <div className="flex flex-wrap items-center gap-1.5">
                <Label htmlFor="minLimit">Límite mínimo (S/)</Label>
                <ContextHint
                  mode="popover"
                  side="bottom"
                  aria-label="Qué es el límite mínimo"
                  trigger={<Info className="size-3.5" />}
                  triggerClassName="size-5"
                >
                  <p className="text-sm leading-snug">
                    Para pagos mínimo de tarjetas de crédito, cuotas de
                    mantenimiento u otro monto fijo que debas cubrir.
                  </p>
                </ContextHint>
              </div>
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
              <div className="flex flex-wrap items-center gap-1.5">
                <Label htmlFor="maxLimit">Límite máximo (S/)</Label>
                <ContextHint
                  mode="popover"
                  side="bottom"
                  aria-label="Qué es el límite máximo"
                  trigger={<Info className="size-3.5" />}
                  triggerClassName="size-5"
                >
                  <p className="text-sm leading-snug">
                    Puede ser el máximo real de la fuente (saldo, crédito o lo
                    que tengas disponible) o uno que elijas.
                  </p>
                </ContextHint>
              </div>
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

          {isEditing && onDeleteRequest && source ? (
            <div className="">
              <Separator className="mb-4" />
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full border-destructive bg-destructive/20 text-destructive",
                  "hover:border-destructive hover:bg-destructive/30 hover:text-destructive",
                  "dark:bg-destructive/35 dark:hover:bg-destructive/45"
                )}
                onClick={() => {
                  onDeleteRequest(source);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="size-3.5" />
                Eliminar fuente
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Solo se puede eliminar si no hay gastos asociados a la fuente.
              </p>
            </div>
          ) : null}

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
