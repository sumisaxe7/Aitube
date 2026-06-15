"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { DEFAULT_FILE_SIZE_LIMIT_MB, getFileSizeLimit } from "@/lib/upload-limit";

type Translate = (key: string) => string;

export function UploadDropzone({
  file,
  onFile,
  disabled,
  t,
}: {
  file: File | null;
  onFile: (file: File) => void;
  disabled?: boolean;
  t: Translate;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const maxBytes = getFileSizeLimit(process.env.NEXT_PUBLIC_FILE_SIZE_LIMIT);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (disabled) return;
        const f = e.dataTransfer.files?.[0];
        if (f) {
          if (f.size > maxBytes) {
            window.alert(`File must be ${DEFAULT_FILE_SIZE_LIMIT_MB} MB or smaller.`);
            return;
          }
          onFile(f);
        }
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
        dragging ? "border-primary bg-accent" : "border-border",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            if (f.size > maxBytes) {
              window.alert(`File must be ${DEFAULT_FILE_SIZE_LIMIT_MB} MB or smaller.`);
              e.target.value = "";
              return;
            }
            onFile(f);
          }
        }}
      />
      <p className="font-medium">{file ? file.name : t("upload.dropzone")}</p>
      <p className="text-xs text-muted-foreground">
        {file
          ? `${(file.size / 1024 / 1024).toFixed(1)} MB of ${DEFAULT_FILE_SIZE_LIMIT_MB} MB allowed`
          : `${t("upload.dropzoneHint")} (max ${DEFAULT_FILE_SIZE_LIMIT_MB} MB)`}
      </p>
    </div>
  );
}
