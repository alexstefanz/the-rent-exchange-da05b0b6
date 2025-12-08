import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Star, Shield, MessageCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { mockItems } from "@/data/mockItems";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

const ItemDetail = () => {
  const { id } = useParams();
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const item = mockItems.find((i) => i.id === id);

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <h1 className="font-heading text-2xl font-semibold">Item not found</h1>
          <Button asChild className="mt-4">
            <Link to="/browse">Back to Browse</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleRentRequest = () => {
    if (!dateRange.from || !dateRange.to) {
      toast({
        title: "Please select dates",
        description: "Choose your rental period to continue",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Rental Request Sent!",
      description: `Your request for ${item.title} has been sent to the owner.`,
    });
  };

  const days = dateRange.from && dateRange.to 
    ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;
  const totalPrice = days * item.price;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/browse">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Browse
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2">
            {/* Main Image */}
            <div className="overflow-hidden rounded-2xl">
              <img
                src={item.images[0]}
                alt={item.title}
                className="h-[400px] w-full object-cover md:h-[500px]"
              />
            </div>

            {/* Item Info */}
            <div className="mt-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge className="mb-3">{item.category}</Badge>
                  <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
                    {item.title}
                  </h1>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2">
                  <Star className="h-5 w-5 fill-primary text-primary" />
                  <span className="font-semibold">{item.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({item.reviewCount})
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{item.location}</span>
              </div>

              <Separator className="my-6" />

              <div>
                <h2 className="font-heading text-xl font-semibold">About this item</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>

              {/* Features */}
              <div className="mt-8">
                <h2 className="font-heading text-xl font-semibold">Features</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {item.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-accent" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Owner */}
              <div>
                <h2 className="font-heading text-xl font-semibold">Listed by</h2>
                <div className="mt-4 flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={item.owner.avatar} />
                    <AvatarFallback>{item.owner.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{item.owner.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Member since {item.owner.memberSince}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl bg-card p-6 shadow-card">
              <div className="mb-6 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">${item.price}</span>
                <span className="text-muted-foreground">/ {item.priceUnit}</span>
              </div>

              {/* Date Selection */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium">Rental Period</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                          </>
                        ) : (
                          format(dateRange.from, "MMM d, yyyy")
                        )
                      ) : (
                        "Select dates"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                      numberOfMonths={1}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Price Breakdown */}
              {days > 0 && (
                <div className="mb-6 space-y-2 rounded-lg bg-secondary/50 p-4">
                  <div className="flex justify-between text-sm">
                    <span>${item.price} × {days} {days === 1 ? "day" : "days"}</span>
                    <span>${totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Service fee</span>
                    <span>${Math.round(totalPrice * 0.1)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${totalPrice + Math.round(totalPrice * 0.1)}</span>
                  </div>
                </div>
              )}

              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={handleRentRequest}
              >
                Request to Rent
              </Button>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Protected by RentHub Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ItemDetail;
