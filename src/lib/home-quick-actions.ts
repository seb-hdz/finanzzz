import type { LucideIcon } from "lucide-react";
import { Ban, FileText, Plus, RefreshCw } from "lucide-react";
import {
  HOME_QUICK_ACTION_CONFIG_NONE,
  HOME_QUICK_ACTION_PATHS,
  type HomeQuickActionId,
} from "./home-quick-action-paths";

export type {
  HomeQuickActionId,
  HomeQuickActionConfigId,
} from "./home-quick-action-paths";
export {
  HOME_QUICK_ACTION_ORDER,
  HOME_QUICK_ACTION_PATHS,
  HOME_QUICK_ACTION_CONFIG_NONE,
  HOME_QUICK_ACTION_SETTINGS_HASH,
  HOME_QUICK_ACTION_SETTINGS_HREF,
  DEFAULT_HOME_QUICK_ACTION_ID,
  isHomeQuickActionId,
  isValidId as isHomeQuickActionConfigId,
  resolveHomeQuickActionConfigId,
  resolveHomeQuickActionId,
} from "./home-quick-action-paths";

export type HomeQuickActionDef = {
  id: HomeQuickActionId;
  label: string;
  description: string;
  href: string;
  Icon: LucideIcon;
  ariaLabel: string;
};

export const HOME_QUICK_ACTIONS: Record<HomeQuickActionId, HomeQuickActionDef> =
  {
    new_expense: {
      id: "new_expense",
      label: "Nuevo gasto",
      description: "Abre el formulario para registrar un gasto",
      href: HOME_QUICK_ACTION_PATHS.new_expense,
      Icon: Plus,
      ariaLabel: "Nuevo gasto",
    },
    sync_shared: {
      id: "sync_shared",
      label: "Sincronizar cuenta compartida",
      description: "Ir a sincronización de cuentas compartidas",
      href: HOME_QUICK_ACTION_PATHS.sync_shared,
      Icon: RefreshCw,
      ariaLabel: "Sincronizar cuenta compartida",
    },
    report: {
      id: "report",
      label: "Generar reporte",
      description: "Abre la sección de reportes",
      href: HOME_QUICK_ACTION_PATHS.report,
      Icon: FileText,
      ariaLabel: "Generar reporte",
    },
  };

/** Select + settings copy for “Ninguno”. */
export const HOME_QUICK_ACTION_NONE_OPTION = {
  value: HOME_QUICK_ACTION_CONFIG_NONE,
  label: "Ninguno",
  description: "No se muestra un atajo en Inicio. Puedes configurar uno aquí.",
  Icon: Ban,
} as const;
