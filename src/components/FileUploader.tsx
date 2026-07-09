"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "@/components/motion";
import { Upload, File, X, Image as ImageIcon, Film } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatFileSize, generateId } from "@/lib/utils";
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
      <motion.div
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
        animate={{
          scale: dragging ? 1.01 : 1,
          borderColor: dragging ? "rgb(var(--accent))" : "rgb(var(--border))",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={cn(
          "relative rounded-xl border-2 border-dashed p-10 text-center transition-colors",
          dragging
            ? "border-accent bg-accent/5 shadow-glow"
            : "border-border bg-surface hover:border-accent/40"
        )}
      >
        <input
          type="file"
          multiple
          accept={ACCEPTED}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => processFiles(e.target.files)}
        />
        <motion.div
          animate={{ y: dragging ? -4 : 0 }}
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/20"
        >
          <Upload className="h-6 w-6 text-accent" strokeWidth={1.75} />
        </motion.div>
        <p className="font-medium text-primary">Drag files here, or click to browse</p>
        <p className="mt-1 text-sm text-secondary">
          Videos, images, PDFs, presentations, and documents
        </p>
      </motion.div>

      <HelpTip>
        You can upload multiple files at once — for example, a video ad plus its script,
        or all frames in a social carousel.
      </HelpTip>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {files.map((file, i) => (
              <motion.li
                key={file.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {file.previewUrl ? (
                    <ImageIcon className="h-5 w-5 text-accent" />
                  ) : file.type.startsWith("video/") ? (
                    <Film className="h-5 w-5 text-accent" />
                  ) : (
                    <File className="h-5 w-5 text-accent" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-primary">{file.name}</p>
                  <p className="font-mono text-xs text-secondary">{formatFileSize(file.size)}</p>
                </div>
                {file.previewUrl && (
                  <img src={file.previewUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                )}
                <button
                  onClick={() => removeFile(file.id)}
                  className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-danger/10 hover:text-danger"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
