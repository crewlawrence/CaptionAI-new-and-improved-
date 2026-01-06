import { useState, useCallback, useRef } from "react";
import { Upload, X, Image as ImageIcon, Camera, FolderOpen } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

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
      e.target.value = '';
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
  };

  const removeImage = (id: string) => {
    const updatedImages = images.filter(img => img.id !== id);
    setImages(updatedImages);
    onImagesChange?.(updatedImages.map(img => img.file));
  };

  const openPhotoLibrary = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        data-testid="input-file-library"
      />
      <input
        ref={cameraInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        data-testid="input-file-camera"
      />
      <input
        ref={addMoreInputRef}
        type="file"
        className="hidden"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        data-testid="input-file-add-more"
      />

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-2xl min-h-[280px] md:min-h-[400px] 
          flex flex-col items-center justify-center p-4 md:p-8 transition-all
          ${isDragging 
            ? 'border-primary bg-accent/50 scale-[1.02]' 
            : 'border-border hover-elevate'
          }
        `}
        data-testid="zone-upload"
      >
        {images.length === 0 ? (
          <div className="flex flex-col items-center text-center">
            <Upload className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" data-testid="icon-upload" />
            <h3 className="text-lg md:text-xl font-semibold mb-2" data-testid="text-upload-title">
              Upload your images
            </h3>
            <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-xs" data-testid="text-upload-description">
              Choose from your photo library, take a photo, or drag and drop
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <Button 
                onClick={openPhotoLibrary} 
                className="flex-1 gap-2"
                data-testid="button-photo-library"
              >
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Photo Library</span>
                <span className="sm:hidden">Photos</span>
              </Button>
              <Button 
                onClick={openCamera} 
                variant="outline" 
                className="flex-1 gap-2"
                data-testid="button-camera"
              >
                <Camera className="h-4 w-4" />
                <span>Camera</span>
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-4 hidden md:block">
              or drag and drop images here
            </p>
          </div>
        ) : (
          <div className="w-full">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 md:mb-6">
              <p className="text-sm text-muted-foreground" data-testid="text-image-count">
                {images.length} image{images.length !== 1 ? 's' : ''} uploaded
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addMoreInputRef.current?.click()}
                  data-testid="button-add-more"
                >
                  <ImageIcon className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Add More</span>
                  <span className="sm:hidden">Add</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={openCamera}
                  data-testid="button-add-camera"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-4">
              {images.map((image) => (
                <div 
                  key={image.id} 
                  className="relative group aspect-square rounded-xl overflow-hidden bg-muted border border-border cursor-pointer"
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
                  aria-label="Tap to remove image"
                >
                  <img
                    src={image.preview}
                    alt="Upload preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 active:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity bg-destructive/90 backdrop-blur-sm rounded-full p-2 md:p-3">
                      <X className="h-4 w-4 md:h-6 md:w-6 text-destructive-foreground" />
                    </div>
                  </div>
                  <div className="absolute top-1 right-1 md:hidden bg-destructive/80 rounded-full p-1">
                    <X className="h-3 w-3 text-destructive-foreground" />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Tap an image to remove it
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
