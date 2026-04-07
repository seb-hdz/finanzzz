"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TagForm } from "@/components/tag-form";
import { useTags, deleteTag } from "@/lib/db-hooks";
import type { Tag } from "@/lib/types";

export default function TagsPage() {
  const tags = useTags();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | undefined>();
  const [deleting, setDeleting] = useState<Tag | undefined>();

  function handleEdit(tag: Tag) {
    setEditing(tag);
    setFormOpen(true);
  }

  function handleNew() {
    setEditing(undefined);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    await deleteTag(deleting.id);
    toast.success("Tag eliminado");
    setDeleting(undefined);
  }

  const predefined = tags.filter((t) => t.isPredefined);
  const custom = tags.filter((t) => !t.isPredefined);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
          <p className="text-sm text-muted-foreground">
            Etiquetas para categorizar tus gastos
          </p>
        </div>
        <Button className="mt-2 md:mt-0" onClick={handleNew} size="sm">
          <Plus className="size-4 mr-1" />
          Nuevo
        </Button>
      </div>

      {!!predefined.length && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Predefinidos
          </h2>
          <div className="flex flex-wrap gap-x-1 gap-y-2">
            {predefined.map((tag) => (
              <Badge
                key={tag.id}
                className="text-white cursor-pointer"
                style={{ backgroundColor: tag.color }}
                onClick={() => handleEdit(tag)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Personalizados
        </h2>
        {custom.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay tags personalizados. Crea uno para empezar.
          </p>
        ) : (
          <div className="flex flex-wrap gap-x-1 gap-y-2">
            {custom.map((tag) => (
              <Badge
                key={tag.id}
                className="text-white cursor-pointer"
                style={{ backgroundColor: tag.color }}
                onClick={() => handleEdit(tag)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <TagForm
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        tag={editing}
        onDeleteRequest={
          editing && !editing.isPredefined
            ? () => {
                setDeleting(editing);
                setFormOpen(false);
              }
            : undefined
        }
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={() => setDeleting(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tag?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará &quot;{deleting?.name}&quot;. Los gastos que lo usen
              perderán esta etiqueta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
