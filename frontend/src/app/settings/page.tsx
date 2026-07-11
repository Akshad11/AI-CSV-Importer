'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSettingsStore, useResultsStore, useThemeStore } from '../../store';
import { PageContainer } from '../../components/common/PageContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Dialog } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Settings, Sliders, AlertTriangle, ShieldCheck, Sun, Moon, Laptop, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

// Zod Validation Schema for configuration preferences
const settingsSchema = z.object({
  confidenceThreshold: z.coerce
    .number()
    .min(0, { message: 'Must be at least 0%.' })
    .max(100, { message: 'Cannot exceed 100%.' }),
  defaultLeadSource: z.string().min(1, { message: 'Lead Source cannot be empty.' }),
  rowsPerPage: z.coerce.number(),
  animationSpeed: z.enum(['slow', 'normal', 'fast']),
  defaultPreviewRows: z.coerce.number(),
  aiProvider: z.enum(['openai', 'gemini', 'ollama', 'mock']),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings, availableProviders } = useSettingsStore();
  const { clearHistory, history } = useResultsStore();
  const { theme, setTheme } = useThemeStore();
  
  const [isDangerDialogOpen, setIsDangerDialogOpen] = useState(false);

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      confidenceThreshold: settings.confidenceThreshold,
      defaultLeadSource: settings.defaultLeadSource,
      rowsPerPage: settings.rowsPerPage,
      animationSpeed: settings.animationSpeed,
      defaultPreviewRows: settings.defaultPreviewRows,
      aiProvider: settings.aiProvider,
    },
  });

  const onSubmit = (values: SettingsFormValues) => {
    updateSettings(values);
    toast.success('System preferences saved successfully!');
    reset(values); // reset dirty state
  };

  const handleClearHistory = () => {
    clearHistory();
    setIsDangerDialogOpen(false);
    toast.success('Ingestion pipeline logs history cleared!');
  };

  const providerOptions = [
    { value: 'openai', label: 'ChatGPT (gpt-4o-mini)' },
    { value: 'gemini', label: 'Gemini (gemini-1.5-flash)' },
    { value: 'ollama', label: 'Local Llama (llama3 via Ollama)' },
    { value: 'mock', label: 'Mock Rule-Based Importer' },
  ].filter((opt) => {
    if (opt.value === 'openai') return availableProviders.openai;
    if (opt.value === 'gemini') return availableProviders.gemini;
    if (opt.value === 'ollama') return availableProviders.ollama;
    return true;
  });

  return (
    <PageContainer>
      {/* Title */}
      <div className="select-none">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage database defaults, threshold filters, and user interface preferences.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left main settings column (col-span-2) */}
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-6">
          {/* AI Config card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border mb-4 bg-muted/30">
              <div className="flex items-center gap-2 text-primary">
                <Sliders className="h-5 w-5" />
                <CardTitle className="text-base font-bold text-foreground">
                  AI Mapping Configuration
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Confidence filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Certainty Threshold Filter (%)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 85"
                  className={cn(errors.confidenceThreshold && 'border-destructive')}
                  {...register('confidenceThreshold')}
                />
                {errors.confidenceThreshold ? (
                  <span className="text-xs text-destructive font-mono mt-0.5 block">
                    {errors.confidenceThreshold.message}
                  </span>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Matches with confidence levels below this threshold will automatically flag warning events.
                  </p>
                )}
              </div>

              {/* Default Lead Source */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Default Lead Source
                </label>
                <Input
                  placeholder="e.g. Organic Search"
                  className={cn(errors.defaultLeadSource && 'border-destructive')}
                  {...register('defaultLeadSource')}
                />
                {errors.defaultLeadSource ? (
                  <span className="text-xs text-destructive font-mono mt-0.5 block">
                    {errors.defaultLeadSource.message}
                  </span>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Fallback source assigned to CRM records if source columns are unmapped or missing values.
                  </p>
                )}
              </div>

              {/* Preferred AI Provider Select */}
              <Select
                label="Preferred AI Provider (Pipeline Engine)"
                options={providerOptions}
                {...register('aiProvider')}
              />
            </CardContent>
          </Card>

          {/* UI Preferences Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border mb-4 bg-muted/30">
              <div className="flex items-center gap-2 text-primary">
                <Settings className="h-5 w-5" />
                <CardTitle className="text-base font-bold text-foreground">
                  Interface Preferences
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Default Preview size */}
                <Select
                  label="Default Preview Rows Limit"
                  options={[
                    { value: '20', label: '20 Rows' },
                    { value: '50', label: '50 Rows' },
                    { value: '100', label: '100 Rows' },
                  ]}
                  {...register('defaultPreviewRows')}
                />
                {/* Default Rows Per Page */}
                <Select
                  label="Table Rows Per Page"
                  options={[
                    { value: '10', label: '10 Items' },
                    { value: '25', label: '25 Items' },
                    { value: '50', label: '50 Items' },
                  ]}
                  {...register('rowsPerPage')}
                />
              </div>

              {/* Animation Speed configuration */}
              <Select
                label="Framer Motion Speed"
                options={[
                  { value: 'slow', label: 'Slow (Enhanced Accessibility)' },
                  { value: 'normal', label: 'Normal (Standard)' },
                  { value: 'fast', label: 'Fast (Snappy Transitions)' },
                ]}
                {...register('animationSpeed')}
              />
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex items-center gap-3 justify-end select-none">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetSettings();
                toast.success('Default configuration restored.');
              }}
              className="border-border"
            >
              Restore Defaults
            </Button>
            <Button type="submit" disabled={!isDirty}>
              Save Configurations
            </Button>
          </div>
        </form>

        {/* Right side settings column (col-span-1) */}
        <div className="space-y-6 lg:col-span-1 select-none">
          {/* Theme card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border mb-4 bg-muted/30">
              <CardTitle className="text-base font-bold text-foreground">
                Application Theme
              </CardTitle>
              <CardDescription>Select color modes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all',
                    theme === 'light'
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-border hover:bg-accent text-muted-foreground'
                  )}
                >
                  <Sun className="h-5 w-5 shrink-0" />
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all',
                    theme === 'dark'
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-border hover:bg-accent text-muted-foreground'
                  )}
                >
                  <Moon className="h-5 w-5 shrink-0" />
                  Dark
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all',
                    theme === 'system'
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-border hover:bg-accent text-muted-foreground'
                  )}
                >
                  <Laptop className="h-5 w-5 shrink-0" />
                  System
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-destructive/20 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-destructive/15 bg-destructive/5 mb-4">
              <CardTitle className="text-base font-bold text-destructive">
                Danger Zone
              </CardTitle>
              <CardDescription className="text-destructive/85">Irreversible system actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                type="button"
                onClick={() => setIsDangerDialogOpen(true)}
                disabled={history.length === 0}
                className="w-full text-xs"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Ingestion History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Danger Zone Dialog */}
      <Dialog
        isOpen={isDangerDialogOpen}
        onClose={() => setIsDangerDialogOpen(false)}
        title="Clear Ingestion History?"
        description="This action cannot be undone. All past metrics logs will be permanently deleted."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsDangerDialogOpen(false)}
              className="w-full sm:w-auto text-muted-foreground hover:text-foreground border-border"
            >
              Keep History
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearHistory}
              className="w-full sm:w-auto shadow-sm shadow-destructive/10"
            >
              <Trash2 className="h-4.5 w-4.5 mr-1.5" />
              Delete Permanently
            </Button>
          </>
        }
      >
        <div className="flex gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-sans">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Irreversible Action</span>
            <p className="mt-0.5 leading-relaxed text-destructive">
              This completely clears your client-side session import log list history. The stats indicators on your overview dashboard will reset to zero.
            </p>
          </div>
        </div>
      </Dialog>
    </PageContainer>
  );
}
