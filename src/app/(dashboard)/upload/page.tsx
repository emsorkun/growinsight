'use client';

import { useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Check, X, Loader2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedFile {
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  message?: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList)
      .filter((file) => file.name.endsWith('.csv'))
      .map((file) => ({
        name: file.name,
        size: file.size,
        status: 'pending' as const,
      }));

    if (newFiles.length === 0) {
      alert('Please upload CSV files only');
      return;
    }

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        processFiles(e.target.files);
      }
    },
    [processFiles]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUpload = async () => {
    setIsUploading(true);

    // Simulate upload process
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'pending') {
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' as const } : f))
        );

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Randomly succeed or fail for demo
        const success = Math.random() > 0.2;
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: success ? ('success' as const) : ('error' as const),
                  message: success ? 'File processed successfully' : 'Error processing file',
                }
              : f
          )
        );
      }
    }

    setIsUploading(false);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  return (
    <div className="flex flex-col">
      <Header title="Upload Data" subtitle="Import CSV files to update your analytics" />

      <div className="flex-1 space-y-6 p-4 lg:p-6">
        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="flex items-start gap-4 p-4">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Expected CSV Format</p>
              <code className="text-xs bg-blue-100 px-2 py-1 rounded block overflow-x-auto">
                Channel, City, Month_Year, Month, Year, Location, Cuisine, Brand_Name, Orders,
                Net_Sales, Gross_Sales, Ads_Spend, Discount_Spend, Ads_Return
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <CardDescription>Drag and drop CSV files or click to browse</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-all duration-200',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <input
                type="file"
                accept=".csv"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <div className="flex flex-col items-center gap-4">
                <div
                  className={cn(
                    'rounded-full p-4 transition-colors',
                    isDragging ? 'bg-primary/10' : 'bg-muted'
                  )}
                >
                  <Upload
                    className={cn('h-8 w-8', isDragging ? 'text-primary' : 'text-muted-foreground')}
                  />
                </div>
                <div className="text-center">
                  <p className="font-medium">
                    {isDragging ? 'Drop files here' : 'Drag and drop files here'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse (CSV files only)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File List */}
        {files.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CardTitle>Files ({files.length})</CardTitle>
                  <div className="flex gap-2">
                    {successCount > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {successCount} uploaded
                      </Badge>
                    )}
                    {pendingCount > 0 && <Badge variant="secondary">{pendingCount} pending</Badge>}
                    {errorCount > 0 && <Badge variant="destructive">{errorCount} failed</Badge>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear all
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                          {file.message && ` • ${file.message}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.status === 'pending' && <Badge variant="outline">Pending</Badge>}
                      {file.status === 'uploading' && (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      )}
                      {file.status === 'success' && <Check className="h-5 w-5 text-green-600" />}
                      {file.status === 'error' && (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                      {(file.status === 'pending' || file.status === 'error') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {pendingCount > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleUpload} disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload {pendingCount} file{pendingCount > 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
