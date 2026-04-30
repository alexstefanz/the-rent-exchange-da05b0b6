import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Upload, Loader2, ImagePlus } from "lucide-react";
import { uploadProductImage, deleteProductImage } from "@/features/products/imageApi";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.8;
const COMPRESS_THRESHOLD = 1 * 1024 * 1024; // 1MB

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (file.size <= COMPRESS_THRESHOLD) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
          });
          resolve(compressed);
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Nu am putut procesa imaginea"));
    };

    img.src = url;
  });
};

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
  const { t } = useLanguage();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast({
        title: t("Prea multe imagini", "Too many images"),
        description: t(`Poți încărca maxim ${maxImages} imagini`, `You can upload up to ${maxImages} images`),
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: t("Fișier invalid", "Invalid file"),
          description: t("Poți încărca doar imagini", "You can only upload images"),
          variant: "destructive",
        });
        continue;
      }

      try {
        const processedFile = await compressImage(file);
        const url = await uploadProductImage(processedFile, userId);
        newImages.push(url);
      } catch (error) {
        toast({
          title: t("Eroare la încărcare", "Upload error"),
          description: t("Nu am putut încărca imaginea", "Could not upload the image"),
          variant: "destructive",
        });
      }
    }

    if (newImages.length > 0) {
      onChange([...images, ...newImages]);
      toast({
        title: t("Imagini încărcate", "Images uploaded"),
        description: t(
          `${newImages.length} ${newImages.length === 1 ? "imagine încărcată" : "imagini încărcate"} cu succes`,
          `${newImages.length} ${newImages.length === 1 ? "image uploaded" : "images uploaded"} successfully`
        ),
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
        title: t("Imagine ștearsă", "Image deleted"),
        description: t("Imaginea a fost eliminată", "The image has been removed"),
      });
    } catch (error) {
      toast({
        title: t("Eroare", "Error"),
        description: t("Nu am putut șterge imaginea", "Could not delete the image"),
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
              {t("Se încarcă...", "Uploading...")}
            </>
          ) : (
            <>
              <ImagePlus className="mr-2 h-4 w-4" />
              {t("Adaugă imagini", "Add images")} ({images.length}/{maxImages})
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
                  {t("Principal", "Main")}
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
          <p>{t("Click pentru a încărca imagini", "Click to upload images")}</p>
          <p className="text-sm">{t("sau trage fișierele aici", "or drag files here")}</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
