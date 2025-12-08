import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, Plus, DollarSign, MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { categories } from "@/data/mockItems";
import { toast } from "@/hooks/use-toast";

const ListItem = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    priceUnit: "day",
    category: "",
    location: "",
    features: [""],
  });
  const [images, setImages] = useState<string[]>([]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ""] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  const handleImageUpload = () => {
    // Mock image upload - in real app, this would handle file uploads
    const mockImages = [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    ];
    setImages([...images, mockImages[images.length % 2]]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.price || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Item Listed Successfully!",
      description: "Your item is now available for rent.",
    });
    
    navigate("/browse");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container max-w-3xl py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            List Your Item
          </h1>
          <p className="mt-2 text-muted-foreground">
            Share your items with the community and start earning
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Images */}
          <div className="rounded-2xl bg-card p-6 shadow-card">
            <Label className="text-lg font-semibold">Photos</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Add photos to showcase your item
            </p>
            
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {images.map((image, index) => (
                <div key={index} className="group relative aspect-square overflow-hidden rounded-lg">
                  <img src={image} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-foreground/80 p-1.5 text-background opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={handleImageUpload}
                className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/30 transition-colors hover:border-primary hover:bg-secondary/50"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="mt-2 text-sm text-muted-foreground">Add Photo</span>
              </button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="rounded-2xl bg-card p-6 shadow-card">
            <Label className="text-lg font-semibold">Basic Information</Label>
            
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Professional DSLR Camera"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your item, its condition, and what's included..."
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1.5 min-h-[120px]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter((c) => c !== "All").map((category) => (
                        <SelectItem key={category} value={category.toLowerCase()}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <div className="relative mt-1.5">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="location"
                      name="location"
                      placeholder="City, State"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-2xl bg-card p-6 shadow-card">
            <Label className="text-lg font-semibold">Pricing</Label>
            
            <div className="mt-4 flex gap-4">
              <div className="flex-1">
                <Label htmlFor="price">Price *</Label>
                <div className="relative mt-1.5">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    placeholder="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="w-32">
                <Label>Per</Label>
                <Select
                  value={formData.priceUnit}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priceUnit: value })
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hour">Hour</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="rounded-2xl bg-card p-6 shadow-card">
            <Label className="text-lg font-semibold">Features</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Highlight what makes your item special
            </p>
            
            <div className="mt-4 space-y-3">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="e.g., 4K Video Recording"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                  />
                  {formData.features.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFeature(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFeature}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Feature
              </Button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" variant="hero" className="flex-1">
              Publish Listing
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default ListItem;
