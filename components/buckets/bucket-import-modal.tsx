'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileJson, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { showToast } from '@/components/ui/toast';
import type { Bucket } from './bucket-card';

interface BucketImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (buckets: Partial<Bucket>[]) => void;
}

export function BucketImportModal({ isOpen, onClose, onImport }: BucketImportModalProps) {
  const [jsonData, setJsonData] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Partial<Bucket>[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  if (!isOpen) return null;
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/json') {
      setError('Please upload a JSON file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonData(content);
      validateAndPreview(content);
    };
    reader.readAsText(file);
  };
  
  const validateAndPreview = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      
      // Validate structure
      if (!Array.isArray(parsed)) {
        setError('JSON must be an array of buckets');
        return;
      }
      
      // Validate each bucket
      const validBuckets = parsed.map((bucket: any) => {
        if (!bucket.name || !bucket.color) {
          throw new Error('Each bucket must have a name and color');
        }
        
        return {
          name: bucket.name,
          description: bucket.description || '',
          color: bucket.color,
          icon: bucket.icon || 'folder',
          position: bucket.position || 0,
          isActive: bucket.isActive !== false,
        };
      });
      
      setPreview(validBuckets);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format');
      setPreview(null);
    }
  };
  
  const handleImport = () => {
    if (!preview || preview.length === 0) {
      setError('No valid buckets to import');
      return;
    }
    
    onImport(preview);
    showToast({
      type: 'success',
      title: 'Import successful',
      message: `Imported ${preview.length} bucket${preview.length > 1 ? 's' : ''}`,
    });
    onClose();
  };
  
  const handleReset = () => {
    setJsonData('');
    setError(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Import Buckets
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* File Upload */}
          <div>
            <Label htmlFor="file-upload">Upload JSON File</Label>
            <div className="mt-2">
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>
          </div>
          
          {/* JSON Input */}
          <div>
            <Label htmlFor="json-input">Or Paste JSON Data</Label>
            <Textarea
              id="json-input"
              value={jsonData}
              onChange={(e) => {
                setJsonData(e.target.value);
                validateAndPreview(e.target.value);
              }}
              placeholder={`[
  {
    "name": "Research Projects",
    "description": "Active research initiatives",
    "color": "#3B82F6",
    "icon": "folder"
  },
  {
    "name": "Grant Applications",
    "color": "#10B981",
    "icon": "trending"
  }
]`}
              className="mt-2 font-mono text-sm h-40"
            />
          </div>
          
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Preview */}
          {preview && preview.length > 0 && (
            <div>
              <Label>Preview ({preview.length} buckets)</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {preview.map((bucket, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: bucket.color }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">
                        {bucket.name}
                      </p>
                      {bucket.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {bucket.description}
                        </p>
                      )}
                    </div>
                    <FileJson className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Example Format */}
          <Alert>
            <FileJson className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Import buckets from a JSON file. Each bucket should have at minimum a name and color.
              Optional fields include description, icon, and position.
            </AlertDescription>
          </Alert>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t dark:border-gray-800">
          <Button variant="ghost" onClick={handleReset}>
            Clear
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!preview || preview.length === 0}
            >
              Import {preview ? `${preview.length} Bucket${preview.length > 1 ? 's' : ''}` : 'Buckets'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}