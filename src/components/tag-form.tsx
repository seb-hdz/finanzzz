"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Tag } from "@/lib/types";
import { PRESET_COLORS } from "@/lib/types";
import { addTag, updateTag } from "@/lib/db-hooks";
import { cn } from "@/lib/utils";

interface TagFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: Tag;
  /** Shown below the footer when editing a custom (non-predefined) tag */
  onDeleteRequest?: () => void;
}

export function TagForm({
  open,
  onOpenChange,
  tag,
  onDeleteRequest,
}: TagFormProps) {
  const [name, setName] = useState(tag?.name ?? "");
  const [color, setColor] = useState(tag?.color ?? PRESET_COLORS[4]);

  const isEditing = !!tag;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing) {
      await updateTag(tag.id, { name: name.trim(), color });
    } else {
      await addTag({ name: name.trim(), color, isPredefined: false });
    }

    onOpenChange(false);
    if (!isEditing) {
      setName("");
      setColor(PRESET_COLORS[4]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Tag" : "Nuevo Tag"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tag-name">Nombre</Label>
            <Input
              id="tag-name"
              placeholder="Ej: Restaurantes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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

          {tag && !tag.isPredefined && onDeleteRequest ? (
            <DialogFooter className="flex flex-col gap-2 sm:flex-col">
              <div className="flex w-full flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-w-0 flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="min-w-0 flex-1">
                  {isEditing ? "Guardar" : "Crear"}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full border-destructive bg-destructive/20 text-destructive",
                  "hover:border-destructive hover:bg-destructive/30 hover:text-destructive",
                  "dark:bg-destructive/35 dark:hover:bg-destructive/45"
                )}
                onClick={onDeleteRequest}
              >
                Eliminar tag
              </Button>
            </DialogFooter>
          ) : (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{isEditing ? "Guardar" : "Crear"}</Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
