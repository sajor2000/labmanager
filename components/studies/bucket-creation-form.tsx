"use client";

import { useState } from "react";
import { X, AlertCircle, Palette } from "lucide-react";
import { BucketCreationSchema, type BucketCreationInput } from "@/lib/validations/bucket";
import { useStudyStore } from "@/lib/store/study-store";
import { z } from "zod";
import type { Bucket } from "@/types";
import { showToast } from "@/components/ui/toast";

interface BucketCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  { name: "Cyan", value: "#00BCD4" },
  { name: "Green", value: "#4CAF50" },
  { name: "Pink", value: "#E91E63" },
  { name: "Purple", value: "#9C27B0" },
  { name: "Orange", value: "#FF9800" },
  { name: "Blue", value: "#2196F3" },
  { name: "Indigo", value: "#3F51B5" },
  { name: "Teal", value: "#009688" },
  { name: "Amber", value: "#FFC107" },
  { name: "Red", value: "#F44336" },
];

export function BucketCreationForm({ isOpen, onClose }: BucketCreationFormProps) {
  const { addBucket } = useStudyStore();
  const [formData, setFormData] = useState<BucketCreationInput>({
    title: "",
    description: "",
    color: "#00BCD4",
    labId: "rhedas",
  });
  const [errors, setErrors] = useState<z.ZodFormattedError<BucketCreationInput> | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const result = BucketCreationSchema.safeParse(formData);
    
    if (!result.success) {
      setErrors(result.error.format());
      return;
    }
    
    setErrors(null);
    
    // Create new bucket
    const newBucket: Bucket = {
      id: `bucket-${Date.now()}`,
      title: result.data.title,
      description: result.data.description,
      color: result.data.color,
      studyIds: [],
      labId: result.data.labId,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    addBucket(newBucket);
    
    // Show success notification
    showToast({
      type: "success",
      title: "Bucket created successfully",
      message: `"${result.data.title}" has been added to your workspace.`
    });
    
    // Reset form
    setFormData({
      title: "",
      description: "",
      color: "#00BCD4",
      labId: "rhedas",
    });
    
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({
      ...prev,
      color
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          Create New Bucket
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bucket Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bucket Name *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter bucket name..."
              required
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white ${
                errors?.title 
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-gray-600"
              }`}
            />
            {errors?.title && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.title._errors[0]}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of this bucket..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Lab Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Lab *
            </label>
            <select
              name="labId"
              value={formData.labId}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="rhedas">RHEDAS - Rush Health Equity Data Analytics Studio</option>
              <option value="riccc">RICCC - Rush Interdisciplinary Consortium for Critical Care</option>
            </select>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bucket Color
            </label>
            <div className="flex items-center space-x-2 mb-3">
              <Palette className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="#00BCD4"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <div 
                className="h-8 w-8 rounded-lg border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: formData.color }}
              />
            </div>
            
            {/* Color Presets */}
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleColorSelect(preset.value)}
                  className={`h-8 w-full rounded-lg border-2 transition-all hover:scale-110 ${
                    formData.color === preset.value 
                      ? "border-gray-900 dark:border-white" 
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                />
              ))}
            </div>
            {errors?.color && (
              <p className="mt-2 text-xs text-red-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.color._errors[0]}
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create Bucket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}