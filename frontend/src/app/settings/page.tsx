'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSettingsStore, useResultsStore, useThemeStore } from '../../store';
import { PageContainer } from '../../components/common/PageContainer';
import { ImportService } from '../../services/api/importService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Dialog } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Settings, Sliders, AlertTriangle, ShieldCheck, Sun, Moon, Laptop, Trash2, RefreshCw } from 'lucide-react';
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
  aiProvider: z.enum(['openai', 'gemini', 'ollama', 'openrouter', 'mock']),
  batchSize: z.coerce
    .number()
    .min(1, { message: 'Batch size must be at least 1.' })
    .max(500, { message: 'Batch size cannot exceed 500.' }),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings, availableProviders } = useSettingsStore();
  const { clearHistory, history } = useResultsStore();
  const { theme, setTheme } = useThemeStore();

  const [isDangerDialogOpen, setIsDangerDialogOpen] = useState(false);

  // AI Connection Test State
  const [testProvider, setTestProvider] = useState<'openai' | 'gemini' | 'ollama' | 'openrouter'>('gemini');
  const [testModel, setTestModel] = useState<string>('gemini-3.5-flash');
  const [testPrompt, setTestPrompt] = useState<string>('Hello');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<any>(null);

  const testModelOptions = {
    openai: [
      { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
      { value: 'gpt-4o', label: 'gpt-4o' },
      { value: 'o1-mini', label: 'o1-mini' }
    ],
    gemini: [
      { value: 'gemini-3.5-flash', label: 'gemini-3.5-flash' },
      { value: 'gemini-1.5-flash', label: 'gemini-1.5-flash' },
      { value: 'gemini-1.5-pro', label: 'gemini-1.5-pro' }
    ],
    openrouter: [
      { value: 'openai/gpt-4o', label: 'openai/gpt-4o' },
      { value: 'openai/gpt-4o-mini', label: 'openai/gpt-4o-mini' },
      { value: 'anthropic/claude-3.5-sonnet', label: 'anthropic/claude-3.5-sonnet' }
    ],
    ollama: [
      { value: 'llama3', label: 'llama3' },
      { value: 'qwen2.5-coder:3b', label: 'qwen2.5-coder:3b' },
      { value: 'mistral', label: 'mistral' }
    ]
  };

  useEffect(() => {
    const defaultModels = {
      openai: 'gpt-4o-mini',
      gemini: 'gemini-3.5-flash',
      openrouter: 'openai/gpt-4o',
      ollama: 'llama3'
    };
    setTestModel(defaultModels[testProvider as keyof typeof defaultModels]);
  }, [testProvider]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestError(null);
    try {
      const data = await ImportService.testConnection({
        provider: testProvider,
        model: testModel,
        prompt: testPrompt
      });
      setTestResult(data);
      toast.success('AI provider is working successfully.');
    } catch (err: any) {
      console.error(err);
      const mappedError = err.errors || err;
      setTestError(mappedError);
      toast.error(mappedError.message || 'AI Connection Test failed.');
    } finally {
      setIsTesting(false);
    }
  };

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
      batchSize: settings.batchSize || 25,
    },
  });

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const backendSettings = await ImportService.getSettings();
        if (backendSettings) {
          const mapped = {
            aiProvider: backendSettings.defaultAiProvider || settings.aiProvider,
            rowsPerPage: backendSettings.rowsPerPage || settings.rowsPerPage,
            batchSize: backendSettings.batchSize || settings.batchSize || 25,
          };
          updateSettings(mapped);
          reset({
            confidenceThreshold: settings.confidenceThreshold,
            defaultLeadSource: settings.defaultLeadSource,
            rowsPerPage: backendSettings.rowsPerPage || settings.rowsPerPage,
            animationSpeed: settings.animationSpeed,
            defaultPreviewRows: settings.defaultPreviewRows,
            aiProvider: backendSettings.defaultAiProvider || settings.aiProvider,
            batchSize: backendSettings.batchSize || settings.batchSize || 25,
          });
        }
      } catch (err) {
        console.error('Failed to load settings from backend', err);
      }
    };
    loadSettings();
  }, [reset]);

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      updateSettings(values);
      await ImportService.updateSettings({
        defaultAiProvider: values.aiProvider,
        defaultModel: values.aiProvider === 'openai' ? 'gpt-4o-mini' : values.aiProvider === 'gemini' ? 'gemini-3.5-flash' : values.aiProvider === 'openrouter' ? 'openai/gpt-4o' : 'llama3',
        rowsPerPage: values.rowsPerPage,
        batchSize: values.batchSize,
      });
      toast.success('System preferences saved successfully!');
      reset(values); // reset dirty state
    } catch (err) {
      toast.error('Failed to save settings to backend');
    }
  };

  const handleClearHistory = () => {
    clearHistory();
    setIsDangerDialogOpen(false);
    toast.success('Ingestion pipeline logs history cleared!');
  };

  const providerOptions = [
    { value: 'openai', label: 'ChatGPT (gpt-4o-mini)' },
    { value: 'gemini', label: 'Gemini (gemini-3.5-flash)' },
    { value: 'openrouter', label: 'OpenRouter (openai/gpt-4o)' },
    { value: 'ollama', label: 'Local Llama (llama3 via Ollama)' },
    { value: 'mock', label: 'Mock Rule-Based Importer' },
  ].filter((opt) => {
    if (opt.value === 'openai') return availableProviders.openai;
    if (opt.value === 'gemini') return availableProviders.gemini;
    if (opt.value === 'openrouter') return availableProviders.openrouter;
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

              {/* Batch Size */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Records per Batch
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 25"
                  className={cn(errors.batchSize && 'border-destructive')}
                  {...register('batchSize')}
                />
                {errors.batchSize ? (
                  <span className="text-xs text-destructive font-mono mt-0.5 block">
                    {errors.batchSize.message}
                  </span>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Number of CSV rows sent to the AI in each parallel batch request. Lower values are safer for local models.
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

          {/* AI Connection Test Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border mb-4 bg-muted/30">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="h-5 w-5" />
                <CardTitle className="text-base font-bold text-foreground">
                  AI Connection Test
                </CardTitle>
              </div>
              <CardDescription>Verify AI credential mappings before importing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Provider Selector */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  AI Provider
                </label>
                <select
                  disabled={isTesting}
                  value={testProvider}
                  onChange={(e) => setTestProvider(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Select AI provider for testing"
                >
                  <option value="gemini">Gemini</option>
                  <option value="openai">OpenAI</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="ollama">Ollama (Local Llama)</option>
                </select>
              </div>

              {/* Model Selector */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Model name
                </label>
                <select
                  disabled={isTesting}
                  value={testModel}
                  onChange={(e) => setTestModel(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Select AI model for testing"
                >
                  {testModelOptions[testProvider].map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Editable Prompt */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  User Prompt
                </label>
                <textarea
                  disabled={isTesting}
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  rows={2}
                  className="w-full p-2 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 resize-none font-mono"
                  placeholder="Enter test prompt..."
                  aria-label="Prompt text input for testing"
                />
              </div>

              {/* Test Button */}
              <Button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="w-full text-xs"
                aria-label="Test AI connection"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing AI...
                  </>
                ) : (
                  'Test AI'
                )}
              </Button>

              {/* Test Output Results */}
              {(testResult || testError) && (
                <div className="pt-3 border-t border-border mt-3 space-y-3">
                  {testResult && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
                            Connected
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {testResult.latencyMs}ms
                        </span>
                      </div>
                      
                      {/* Tokens stats */}
                      <div className="grid grid-cols-3 gap-1 bg-muted/40 p-2 rounded-lg text-center text-[10px] font-mono select-none">
                        <div>
                          <div className="text-muted-foreground">Prompt</div>
                          <div className="font-bold text-foreground">{testResult.tokens?.prompt || 0}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Comp</div>
                          <div className="font-bold text-foreground">{testResult.tokens?.completion || 0}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Total</div>
                          <div className="font-bold text-foreground">{testResult.tokens?.total || 0}</div>
                        </div>
                      </div>

                      {/* Response view */}
                      <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-xs text-foreground max-h-36 overflow-y-auto font-sans leading-relaxed whitespace-pre-wrap">
                        {testResult.response}
                      </div>
                    </div>
                  )}

                  {testError && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
                          <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                            Error
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-2.5 rounded-lg border border-destructive/20 bg-destructive/5 text-xs text-destructive flex flex-col gap-1">
                        <span className="font-semibold">❌ {testError.message || 'Provider Unavailable'}</span>
                        {testError.retryAfter && (
                          <span className="text-[10px] text-destructive/80 font-mono">
                            Try again in {testError.retryAfter} seconds.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
