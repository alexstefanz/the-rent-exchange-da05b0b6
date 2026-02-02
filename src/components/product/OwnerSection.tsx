import { Link } from "react-router-dom";
import { Check, Star, Clock, MessageCircle, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { uxCopy } from "@/data/uxCopy";

interface OwnerSectionProps {
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string | null;
  rating?: number;
  reviewCount?: number;
  memberSince?: string;
  responseTime?: string;
  responseRate?: string;
  onStartChat: () => void;
  isOwnProduct?: boolean;
}

const OwnerSection = ({
  ownerId,
  ownerName,
  ownerAvatar,
  rating = 4.9,
  reviewCount = 12,
  memberSince = "2024",
  responseTime = "< 1 oră",
  responseRate = "98%",
  onStartChat,
  isOwnProduct = false,
}: OwnerSectionProps) => {
  const ownerInitial = ownerName.charAt(0).toUpperCase();

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-6">
      {/* Desktop Layout */}
      <div className="hidden md:flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-primary/10">
            <AvatarImage src={ownerAvatar || undefined} />
            <AvatarFallback className="text-lg">{ownerInitial}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <Link
                to={`/utilizator/${ownerId}`}
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                {ownerName}
              </Link>
              <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                <Check className="mr-1 h-3 w-3" />
                {uxCopy.trust.verified}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({reviewCount} recenzii)</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {uxCopy.owner.memberSince} {memberSince}
            </p>
          </div>
        </div>
        {!isOwnProduct && (
          <Button variant="outline" size="sm" onClick={onStartChat}>
            <MessageCircle className="mr-2 h-4 w-4" />
            {uxCopy.owner.sendMessage}
          </Button>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="flex items-center gap-3 w-full">
          <Avatar className="h-14 w-14 flex-shrink-0 ring-2 ring-primary/10">
            <AvatarImage src={ownerAvatar || undefined} />
            <AvatarFallback>{ownerInitial}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/utilizator/${ownerId}`}
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                {ownerName}
              </Link>
              <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                <Check className="mr-1 h-3 w-3" />
                Verificat
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({reviewCount} recenzii)</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {uxCopy.owner.memberSince} {memberSince}
            </p>
          </div>
        </div>
        {!isOwnProduct && (
          <Button
            className="w-full mt-4"
            size="sm"
            onClick={onStartChat}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {uxCopy.owner.sendMessage}
          </Button>
        )}
      </div>

      <Separator className="my-4" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4 text-primary" />
          <span>Răspunde în {responseTime}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span>Rată răspuns: {responseRate}</span>
        </div>
      </div>

      {/* Insurance Badge */}
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/5 p-3 text-sm">
        <Shield className="h-5 w-5 text-primary" />
        <span className="text-foreground">{uxCopy.trust.insurance}</span>
      </div>
    </div>
  );
};

export default OwnerSection;
