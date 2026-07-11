'use client';

import React, { useState } from 'react';
import { useUploadStore } from '../../store';
import { UploadZone } from '../../components/upload/UploadZone';
import { FileCard } from '../../components/upload/FileCard';
import { PasteCSV } from '../../components/csv/PasteCSV';
import { PageContainer } from '../../components/common/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { CheckCircle2, ShieldCheck, Sparkles, HelpCircle, UploadCloud, ClipboardPaste } from 'lucide-react';

export default function ImportPage() {
  const { fileMeta } = useUploadStore();
  const [activeTab, setActiveTab] = useState<string>('upload');

  return (
    <PageContainer>
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">New Import</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Upload any contacts spreadsheet, map headers dynamically, and extract lead data using artificial intelligence.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left main: upload / paste action */}
        <div className="lg:col-span-2 space-y-4">
          {/* Only show tabs when no file is loaded yet */}
          {!fileMeta ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="upload">
                  <UploadCloud className="h-3.5 w-3.5" />
                  Upload CSV
                </TabsTrigger>
                <TabsTrigger value="paste">
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  Paste CSV
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload">
                <UploadZone onSuccess={() => {}} />
              </TabsContent>

              <TabsContent value="paste">
                <PasteCSV />
              </TabsContent>
            </Tabs>
          ) : (
            // Once a file (or pasted blob) is registered, show the FileCard
            <FileCard />
          )}
        </div>

        {/* Right side: AI Guide */}
        <div className="space-y-4 lg:col-span-1">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border mb-4 bg-muted/30">
              <div className="flex items-center gap-2 text-primary">
                <HelpCircle className="h-5 w-5" />
                <CardTitle className="text-base font-bold text-foreground">
                  AI Import Instructions
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex gap-3">
                <div className="mt-0.5 shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Fuzzy Column Mapping
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Our semantic analysis algorithm auto-detects column meanings, saving you from manual mapping configs.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-0.5 shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Lead Enrichment
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    The engine automatically formats phone numbers, normalizes corporate domains, and capitalizes names correctly.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-0.5 shrink-0">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Validation Checks
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Any records missing email fields or failing format checks are safely isolated to skipped reports.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
