"use client";

import { useCallback, useState } from "react";
import { Upload, File, X, Image as ImageIcon, Film } from "lucide-react";
import clsx from "clsx";
import { formatFileSize, generateId } from "@/lib/review-engine";
import type { UploadedFile } from "@/lib/types";
import { HelpTip } from "./ui";

const ACCEPTED =
  "image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.mp4,.mov,.webm,.png,.jpg,.jpeg,.gif,.webp";

export function FileUploader({
  files,
  onChange,
}: {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
}) {
  const [dragging, setDragging] = useState(false);

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const newFiles: UploadedFile[] = Array.from(fileList).map((f) => ({
        id: generateId(),
        name: f.name,
        size: f.size,
        type: f.type,
        previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      }));
      onChange([...files, ...newFiles]);
    },
    [files, onChange]
  );

  const removeFile = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
    onChange(files.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          processFiles(e.dataTransfer.files);
        }}
        className={clsx(
          "relative rounded-lg border-2 border-dashed p-10 text-center transition-colors",
          dragging
            ? "border-mckinsey-blue bg-blue-50/30"
            : "border-mckinsey-border bg-white hover:border-mckinsey-blue/50"
        )}
      >
        <input
          type="file"
          multiple
          accept={ACCEPTED}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => processFiles(e.target.files)}
        />
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mckinsey-mist">
          <Upload className="h-6 w-6 text-mckinsey-navy" strokeWidth={1.5} />
        </div>
        <p className="font-medium text-mckinsey-navy">
          Drag files here, or click to browse
        </p>
        <p className="mt-1 text-sm text-mckinsey-slate">
          Videos, images, PDFs, presentations, and documents
        </p>
      </div>

      <HelpTip>
        You can upload multiple files at once — for example, a video ad plus its script,
        or all frames in a social carousel.
      </HelpTip>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-3 rounded-md border border-mckinsey-border bg-white p-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-mckinsey-mist">
                {file.previewUrl ? (
                  <ImageIcon className="h-5 w-5 text-mckinsey-blue" />
                ) : file.type.startsWith("video/") ? (
                  <Film className="h-5 w-5 text-mckinsey-blue" />
                ) : (
                  <File className="h-5 w-5 text-mckinsey-blue" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-mckinsey-navy">{file.name}</p>
                <p className="text-xs text-mckinsey-slate">{formatFileSize(file.size)}</p>
              </div>
              {file.previewUrl && (
                <img
                  src={file.previewUrl}
                  alt=""
                  className="h-10 w-10 rounded object-cover"
                />
              )}
              <button
                onClick={() => removeFile(file.id)}
                className="rounded p-1 text-mckinsey-slate hover:bg-mckinsey-mist hover:text-mckinsey-danger"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
