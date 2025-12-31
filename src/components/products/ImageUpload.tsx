import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Upload, Loader2, ImagePlus } from "lucide-react";
import { uploadProductImage, deleteProductImage } from "@/features/products/imageApi";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  userId: string;
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

const ImageUpload = ({ userId, images, onChange, maxImages = 5 }: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast({
        title: "Prea multe imagini",
        description: `Poți încărca maxim ${maxImages} imagini`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Fișier invalid",
          description: "Poți încărca doar imagini",
          variant: "destructive",
        });
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fișier prea mare",
          description: "Dimensiunea maximă este 5MB",
          variant: "destructive",
        });
        continue;
      }

      try {
        const url = await uploadProductImage(file, userId);
        newImages.push(url);
      } catch (error) {
        toast({
          title: "Eroare la încărcare",
          description: "Nu am putut încărca imaginea",
          variant: "destructive",
        });
      }
    }

    if (newImages.length > 0) {
      onChange([...images, ...newImages]);
      toast({
        title: "Imagini încărcate",
        description: `${newImages.length} ${newImages.length === 1 ? "imagine încărcată" : "imagini încărcate"} cu succes`,
      });
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageUrl = images[index];
    
    try {
      await deleteProductImage(imageUrl);
      const newImages = images.filter((_, i) => i !== index);
      onChange(newImages);
      toast({
        title: "Imagine ștearsă",
        description: "Imaginea a fost eliminată",
      });
    } catch (error) {
      toast({
        title: "Eroare",
        description: "Nu am putut șterge imaginea",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || images.length >= maxImages}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Se încarcă...
            </>
          ) : (
            <>
              <ImagePlus className="mr-2 h-4 w-4" />
              Adaugă imagini ({images.length}/{maxImages})
            </>
          )}
        </Button>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((url, index) => (
            <div
              key={url}
              className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
            >
              <img
                src={url}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div 
          className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>Click pentru a încărca imagini</p>
          <p className="text-sm">sau trage fișierele aici</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
