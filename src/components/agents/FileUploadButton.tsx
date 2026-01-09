import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  accept?: string;
  className?: string;
}

const DEFAULT_ACCEPT = ".txt,.pdf,.doc,.docx,.md,.csv,.json,.xlsx,.xls";

export function FileUploadButton({ 
  onFileSelect, 
  isUploading, 
  accept = DEFAULT_ACCEPT,
  className 
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      e.target.value = '';
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={`h-10 shrink-0 gap-1 ${className || ''}`}
        onClick={handleClick}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
      </Button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleChange}
      />
    </>
  );
}
