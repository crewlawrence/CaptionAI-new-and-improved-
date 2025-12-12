import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

interface UploadZoneProps {
  onImagesChange?: (files: File[]) => void;
}

export default function UploadZone({ onImagesChange }: UploadZoneProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    addImages(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addImages(files);
    }
  };

  const addImages = (files: File[]) => {
    const newImages: UploadedImage[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file)
    }));
    
    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    onImagesChange?.(updatedImages.map(img => img.file));
    console.log('Images added:', files.length);
  };

  const removeImage = (id: string) => {
    const updatedImages = images.filter(img => img.id !== id);
    setImages(updatedImages);
    onImagesChange?.(updatedImages.map(img => img.file));
    console.log('Image removed');
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-2xl min-h-[400px] 
          flex flex-col items-center justify-center p-8 transition-all
          ${isDragging 
            ? 'border-primary bg-accent/50 scale-[1.02]' 
            : 'border-border hover-elevate'
          }
        `}
        data-testid="zone-upload"
      >
        {images.length === 0 ? (
          <>
            <Upload className="h-16 w-16 text-muted-foreground mb-4" data-testid="icon-upload" />
            <h3 className="text-xl font-semibold mb-2" data-testid="text-upload-title">
              Drop your images here
            </h3>
            <p className="text-muted-foreground mb-6 text-center" data-testid="text-upload-description">
              or click to browse from your device
            </p>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              data-testid="input-file"
            />
            <label htmlFor="file-upload">
              <Button asChild data-testid="button-browse">
                <span>Browse Files</span>
              </Button>
            </label>
          </>
        ) : (
          <div className="w-full">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground" data-testid="text-image-count">
                {images.length} image{images.length !== 1 ? 's' : ''} uploaded
              </p>
              <input
                type="file"
                id="file-upload-more"
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleFileInput}
              />
              <label htmlFor="file-upload-more">
                <Button variant="outline" size="sm" asChild data-testid="button-add-more">
                  <span>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Add More
                  </span>
                </Button>
              </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((image) => (
                <div 
                  key={image.id} 
                  className="relative group aspect-square rounded-xl overflow-hidden bg-muted border border-border cursor-pointer hover-elevate"
                  data-testid={`image-preview-${image.id}`}
                  onClick={() => removeImage(image.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      removeImage(image.id);
                    }
                  }}
                  aria-label="Click to remove image"
                >
                  <img
                    src={image.preview}
                    alt="Upload preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/90 backdrop-blur-sm rounded-full p-3">
                      <X className="h-6 w-6 text-destructive-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
