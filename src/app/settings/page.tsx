"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Download, Upload, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { LimitIntervalSelect } from "@/components/limit-interval-select";
import { useGlobalConfig, updateGlobalConfig } from "@/lib/db-hooks";
import { exportDatabase, importDatabase } from "@/lib/export-import";
import { useTheme } from "@/providers/theme-provider";

export default function SettingsPage() {
  const config = useGlobalConfig();
  const { theme, toggle } = useTheme();

  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);

  async function handleSaveConfig(field: string, value: string | number) {
    if (!config) return;
    await updateGlobalConfig({ [field]: value });
    toast.success("Configuración guardada");
  }

  async function handleExport() {
    if (!password) return;
    try {
      const blob = await exportDatabase(password);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finanzzz-backup-${new Date().toISOString().slice(0, 10)}.finanzzz`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Base de datos exportada");
      setExportOpen(false);
      setPassword("");
    } catch {
      toast.error("Error al exportar");
    }
  }

  async function handleImport() {
    if (!importFile || !password) return;
    setImporting(true);
    try {
      await importDatabase(importFile, password);
      toast.success("Base de datos importada correctamente");
      setImportOpen(false);
      setPassword("");
      setImportFile(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setImporting(false);
    }
  }

  if (!config) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ajustes</h1>
        <p className="text-sm text-muted-foreground">
          Configuración global de la aplicación
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Límites de Gasto</CardTitle>
          <CardDescription>
            Configura el límite global y los umbrales de alerta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Límite máximo total (S/)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Sin límite"
                defaultValue={config.totalMaxLimit > 0 ? config.totalMaxLimit : ""}
                onBlur={(e) => {
                  const val = e.target.value ? parseFloat(e.target.value) : -1;
                  handleSaveConfig("totalMaxLimit", val);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Intervalo del límite</Label>
              <LimitIntervalSelect
                value={config.limitInterval}
                onValueChange={(v) => handleSaveConfig("limitInterval", v)}
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Umbral de advertencia (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                defaultValue={Math.round(config.warningThreshold * 100)}
                onBlur={(e) => {
                  const val = parseInt(e.target.value) || 70;
                  handleSaveConfig("warningThreshold", val / 100);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Se muestra alerta amarilla al alcanzar este %
              </p>
            </div>
            <div className="space-y-2">
              <Label>Umbral de peligro (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                defaultValue={Math.round(config.dangerThreshold * 100)}
                onBlur={(e) => {
                  const val = parseInt(e.target.value) || 90;
                  handleSaveConfig("dangerThreshold", val / 100);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Se muestra alerta roja al alcanzar este %
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apariencia</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={toggle} className="gap-2">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Base de Datos</CardTitle>
          <CardDescription>
            Exporta o importa tu base de datos para mover entre dispositivos
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setExportOpen(true)} className="gap-2">
            <Download className="size-4" />
            Exportar
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
            <Upload className="size-4" />
            Importar
          </Button>
        </CardContent>
      </Card>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Exportar Base de Datos</DialogTitle>
            <DialogDescription>
              Ingresa una contraseña para encriptar el archivo de respaldo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="export-pw">Contraseña</Label>
            <Input
              id="export-pw"
              type="password"
              placeholder="Contraseña de encriptación"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={!password}>
              Exportar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Importar Base de Datos</DialogTitle>
            <DialogDescription>
              Selecciona un archivo .finanzzz y la contraseña usada al exportar.
              Esto reemplazará todos los datos actuales.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Archivo</Label>
              <Input
                ref={fileRef}
                type="file"
                accept=".finanzzz"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-pw">Contraseña</Label>
              <Input
                id="import-pw"
                type="password"
                placeholder="Contraseña de desencriptación"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || !password || importing}
            >
              {importing ? "Importando..." : "Importar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
