"use client";

import type { ReactNode, RefObject } from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ALL_SOURCE_SORT_OPTIONS,
  NonSharedTypeFilterSelect,
  SHARED_SOURCE_SORT_OPTIONS,
  SortOrderSelect,
  SOURCE_SORT_LABELS,
  type NonSharedTypeFilter,
  type SharedSourceSort,
  type SourceSort,
} from "@/components/sources-filter-selects";
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
import { SourceCard } from "@/components/source-card";
import { SourceForm } from "@/components/source-form";
import { SharedSourceSyncModal } from "@/components/modals/shared-source-sync-modal";
import {
  useSources,
  useExpensesInInterval,
  useGlobalConfig,
  deleteSource,
  useSharedSyncState,
  useSharedSourcePendingOutboundCount,
  isSharedSourceLinked,
} from "@/lib/db-hooks";
import type { Expense, Source } from "@/lib/types";
import { SOURCE_TYPE_LABELS } from "@/lib/types";

function useFocusInputWhen(
  ref: RefObject<HTMLInputElement | null>,
  when: boolean
) {
  useEffect(() => {
    if (when) ref.current?.focus();
  }, [when, ref]);
}

function SourceSectionFilterHeader({
  leading,
  children,
}: {
  leading: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-x-4">
      {leading}
      <div className="flex w-full min-w-0 flex-wrap items-center gap-2 md:w-auto md:shrink-0 md:justify-end justify-between">
        {children}
      </div>
    </div>
  );
}

type SourceSectionSearchConfig = {
  open: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  onOpen: () => void;
  onClose: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  placeholder: string;
  inputAriaLabel: string;
  openButtonAriaLabel: string;
  closeButtonAriaLabel: string;
};

function SourceSectionFilters({
  leading,
  middleControls,
  search,
}: {
  leading: ReactNode;
  middleControls: ReactNode;
  search: SourceSectionSearchConfig;
}) {
  const {
    inputRef,
    open: searchOpen,
    query: searchQuery,
    onQueryChange,
    onOpen: onSearchOpen,
    onClose: onSearchClose,
    placeholder: searchPlaceholder,
    inputAriaLabel,
    openButtonAriaLabel,
    closeButtonAriaLabel,
  } = search;

  useFocusInputWhen(inputRef, searchOpen);

  return (
    <div className="space-y-2">
      <SourceSectionFilterHeader leading={leading}>
        {middleControls}
        {!searchOpen ? (
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label={openButtonAriaLabel}
            onClick={onSearchOpen}
          >
            <Search className="size-4" />
          </Button>
        ) : null}
      </SourceSectionFilterHeader>
      {searchOpen ? (
        <div className="flex w-full min-w-0 animate-in fade-in-0 slide-in-from-top-2 duration-200 motion-reduce:translate-y-0 motion-reduce:animate-none motion-reduce:opacity-100 items-center gap-2">
          <Input
            ref={inputRef}
            className="min-w-0 flex-1 py-4"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            aria-label={inputAriaLabel}
          />
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label={closeButtonAriaLabel}
            onClick={onSearchClose}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function expenseTotalsBySourceId(expenses: Expense[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of expenses) {
    m.set(e.sourceId, (m.get(e.sourceId) ?? 0) + e.amount);
  }
  return m;
}

function sourceMatchesQuery(source: Source, q: string): boolean {
  const n = q.trim().toLowerCase();
  if (!n) return true;
  if (source.name.toLowerCase().includes(n)) return true;
  if (source.sharedPublicId?.toLowerCase().includes(n)) return true;
  return false;
}

function sortSourcesList(
  list: Source[],
  sort: SourceSort,
  totals: Map<string, number>
): Source[] {
  const out = [...list];
  switch (sort) {
    case "created":
      out.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case "expenses_desc":
      out.sort((a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0));
      break;
    case "expenses_asc":
      out.sort((a, b) => (totals.get(a.id) ?? 0) - (totals.get(b.id) ?? 0));
      break;
    case "name":
      out.sort((a, b) => a.name.localeCompare(b.name, "es"));
      break;
    case "type":
      out.sort((a, b) => {
        const byLabel = SOURCE_TYPE_LABELS[a.type].localeCompare(
          SOURCE_TYPE_LABELS[b.type],
          "es"
        );
        return byLabel !== 0 ? byLabel : a.name.localeCompare(b.name, "es");
      });
      break;
    default:
      break;
  }
  return out;
}

function useNowMs(tickMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);
  return now;
}

function SharedSourceCardRow({
  source,
  expenses,
  config,
  onEdit,
  onOpenSync,
}: {
  source: Source;
  expenses: Parameters<typeof SourceCard>[0]["expenses"];
  config: Parameters<typeof SourceCard>[0]["config"];
  onEdit: (s: Source) => void;
  onOpenSync: (s: Source) => void;
}) {
  const now = useNowMs(60_000);
  const sync = useSharedSyncState(source.id);
  const linked = isSharedSourceLinked(sync ?? undefined);
  const pendingOutboundCount = useSharedSourcePendingOutboundCount(
    source.id,
    linked
  );
  const staleHours = config?.sharedStaleHours ?? 168;
  const stale =
    linked &&
    !!sync?.lastReceivedRemoteAt &&
    now - sync.lastReceivedRemoteAt > staleHours * 3_600_000;

  return (
    <SourceCard
      source={source}
      expenses={expenses}
      config={config}
      onEdit={onEdit}
      sharedMeta={{
        linked,
        stale,
        pendingOutboundCount,
        onOpenSync: () => onOpenSync(source),
      }}
    />
  );
}

export default function SourcesPage() {
  const sources = useSources();
  const config = useGlobalConfig();
  const expenses = useExpensesInInterval(config?.limitInterval ?? "monthly");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Source | undefined>();
  const [deleting, setDeleting] = useState<Source | undefined>();
  const [syncSource, setSyncSource] = useState<Source | null>(null);

  const [sharedSearchOpen, setSharedSearchOpen] = useState(false);
  const [sharedSearch, setSharedSearch] = useState("");
  const [sharedSort, setSharedSort] = useState<SharedSourceSort>("created");

  const [otherSearchOpen, setOtherSearchOpen] = useState(false);
  const [otherSearch, setOtherSearch] = useState("");
  const [otherTypeFilter, setOtherTypeFilter] =
    useState<NonSharedTypeFilter>("all");
  const [otherSort, setOtherSort] = useState<SourceSort>("created");

  const sharedSearchInputRef = useRef<HTMLInputElement>(null);
  const otherSearchInputRef = useRef<HTMLInputElement>(null);

  const totals = useMemo(() => expenseTotalsBySourceId(expenses), [expenses]);

  const sharedSourcesRaw = useMemo(
    () => sources.filter((s) => s.type === "shared"),
    [sources]
  );
  const otherSourcesRaw = useMemo(
    () => sources.filter((s) => s.type !== "shared"),
    [sources]
  );

  const sharedSources = useMemo(() => {
    const filtered = sharedSourcesRaw.filter((s) =>
      sourceMatchesQuery(s, sharedSearch)
    );
    return sortSourcesList(filtered, sharedSort, totals);
  }, [sharedSourcesRaw, sharedSearch, sharedSort, totals]);

  const otherSources = useMemo(() => {
    let list = otherSourcesRaw;
    if (otherTypeFilter !== "all") {
      list = list.filter((s) => s.type === otherTypeFilter);
    }
    list = list.filter((s) => sourceMatchesQuery(s, otherSearch));
    return sortSourcesList(list, otherSort, totals);
  }, [otherSourcesRaw, otherTypeFilter, otherSearch, otherSort, totals]);

  function handleEdit(source: Source) {
    setEditing(source);
    setFormOpen(true);
  }

  function handleNew() {
    setEditing(undefined);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteSource(deleting.id);
      toast.success("Fuente eliminada");
    } catch (err) {
      toast.error((err as Error).message);
    }
    setDeleting(undefined);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fuentes de Pago</h1>
          <p className="text-sm text-muted-foreground">
            Administra tus cuentas, tarjetas y métodos de pago
          </p>
        </div>
        <Button className="mt-2 md:mt-0" onClick={handleNew} size="sm">
          <Plus className="size-4 mr-1" />
          Nueva
        </Button>
      </div>

      {sources.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hay fuentes de pago configuradas.</p>
          <Button variant="outline" className="mt-4" onClick={handleNew}>
            Crear primera fuente
          </Button>
        </div>
      ) : (
        <>
          {sharedSourcesRaw.length > 0 && (
            <section className="space-y-3">
              <SourceSectionFilters
                leading={
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold tracking-tight">
                        Fuentes compartidas
                      </h2>
                      <Badge
                        variant="outline"
                        className="h-5 shrink-0 border-muted-foreground/35 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        BETA
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cuentas compartidas con el mismo id compartido en{" "}
                      <span className="underline">cada dispositivo</span>.
                    </p>
                  </div>
                }
                middleControls={
                  <SortOrderSelect
                    value={sharedSort}
                    optionKeys={SHARED_SOURCE_SORT_OPTIONS}
                    labels={SOURCE_SORT_LABELS}
                    onValueChange={setSharedSort}
                  />
                }
                search={{
                  open: sharedSearchOpen,
                  query: sharedSearch,
                  onQueryChange: setSharedSearch,
                  onOpen: () => setSharedSearchOpen(true),
                  onClose: () => {
                    setSharedSearch("");
                    setSharedSearchOpen(false);
                  },
                  inputRef: sharedSearchInputRef,
                  placeholder: "Buscar por nombre o id compartido…",
                  inputAriaLabel: "Buscar fuentes compartidas",
                  openButtonAriaLabel: "Buscar fuentes compartidas",
                  closeButtonAriaLabel: "Cerrar búsqueda",
                }}
              />
              {sharedSources.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ninguna fuente compartida coincide con la búsqueda.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {sharedSources.map((source) => (
                    <SharedSourceCardRow
                      key={source.id}
                      source={source}
                      expenses={expenses}
                      config={config}
                      onEdit={handleEdit}
                      onOpenSync={setSyncSource}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {otherSourcesRaw.length > 0 && (
            <section className="space-y-3">
              <SourceSectionFilters
                leading={
                  <h2 className="text-lg font-semibold tracking-tight md:min-w-0">
                    Mis fuentes
                  </h2>
                }
                middleControls={
                  <div className="flex items-center gap-2">
                    <NonSharedTypeFilterSelect
                      value={otherTypeFilter}
                      onValueChange={setOtherTypeFilter}
                    />
                    <SortOrderSelect
                      value={otherSort}
                      optionKeys={ALL_SOURCE_SORT_OPTIONS}
                      labels={SOURCE_SORT_LABELS}
                      onValueChange={setOtherSort}
                    />
                  </div>
                }
                search={{
                  open: otherSearchOpen,
                  query: otherSearch,
                  onQueryChange: setOtherSearch,
                  onOpen: () => setOtherSearchOpen(true),
                  onClose: () => {
                    setOtherSearch("");
                    setOtherSearchOpen(false);
                  },
                  inputRef: otherSearchInputRef,
                  placeholder: "Buscar por nombre…",
                  inputAriaLabel: "Buscar fuentes",
                  openButtonAriaLabel: "Buscar fuentes",
                  closeButtonAriaLabel: "Cerrar búsqueda",
                }}
              />
              {otherSources.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ninguna fuente coincide con los filtros.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {otherSources.map((source) => (
                    <SourceCard
                      key={source.id}
                      source={source}
                      expenses={expenses}
                      config={config}
                      onEdit={handleEdit}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      <SourceForm
        key={`${editing?.id ?? "new"}-${formOpen}`}
        open={formOpen}
        onOpenChange={setFormOpen}
        source={editing}
        onDeleteRequest={setDeleting}
      />

      <SharedSourceSyncModal
        source={syncSource}
        open={!!syncSource}
        onOpenChange={(o) => {
          if (!o) setSyncSource(null);
        }}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={() => setDeleting(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar fuente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará &quot;{deleting?.name}&quot;. Esta acción no se puede
              deshacer.
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
