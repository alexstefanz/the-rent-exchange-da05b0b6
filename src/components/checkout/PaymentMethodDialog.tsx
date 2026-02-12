import { useState } from "react";
import { CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMethod: (method: string) => void;
}

const PaymentMethodDialog = ({ open, onOpenChange, onSelectMethod }: PaymentMethodDialogProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    if (method === 'card') {
      setShowCardForm(true);
    } else {
      setShowCardForm(false);
    }
  };

  const handleConfirm = () => {
    if (selectedMethod === 'card' && (!cardNumber || !expiryDate || !cvv || !cardName)) {
      return;
    }
    onSelectMethod(selectedMethod || 'card');
    // Reset state
    setSelectedMethod(null);
    setShowCardForm(false);
    setCardNumber("");
    setExpiryDate("");
    setCvv("");
    setCardName("");
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-center font-semibold">
            Selectează metoda de plată
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-4">Sau plătește cu</p>
          
          <RadioGroup value={selectedMethod || ""} onValueChange={handleMethodSelect}>
            {/* Credit/Debit Card */}
            <div 
              className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                selectedMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleMethodSelect('card')}
            >
              <CreditCard className="h-6 w-6 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">Card de credit sau debit</div>
                <div className="flex items-center gap-2 mt-1">
                  {/* Visa */}
                  <svg className="h-5 w-8" viewBox="0 0 48 32" fill="none">
                    <rect width="48" height="32" rx="4" fill="#1A1F71"/>
                    <path d="M19.5 21.5L21.5 10.5H24.5L22.5 21.5H19.5Z" fill="white"/>
                    <path d="M32 10.7C31.3 10.4 30.2 10.1 28.8 10.1C25.3 10.1 22.8 12 22.8 14.7C22.8 16.7 24.5 17.8 25.8 18.5C27.2 19.2 27.7 19.6 27.7 20.2C27.7 21.1 26.5 21.5 25.4 21.5C23.9 21.5 23.1 21.3 21.9 20.7L21.4 20.5L20.8 24.1C21.8 24.5 23.5 24.9 25.3 24.9C29 24.9 31.5 23 31.5 20.1C31.5 18.5 30.5 17.3 28.5 16.3C27.3 15.7 26.6 15.3 26.6 14.6C26.6 14 27.3 13.3 28.8 13.3C30 13.3 30.9 13.5 31.6 13.8L32 14L32.5 10.6L32 10.7Z" fill="white"/>
                    <path d="M37.5 10.5H35C34.2 10.5 33.6 10.7 33.2 11.6L28 21.5H31.7L32.4 19.4H37L37.4 21.5H40.5L37.5 10.5ZM33.5 16.7C33.7 16.2 34.8 13.3 34.8 13.3L35.7 16.7H33.5Z" fill="white"/>
                    <path d="M17.5 10.5L14 18.3L13.6 16.4C13 14.4 11.1 12.2 9 11.1L12.2 21.5H16L21.5 10.5H17.5Z" fill="white"/>
                    <path d="M11.5 10.5H6L5.9 10.8C10.3 11.9 13.3 14.7 14.2 18L13.2 11.7C13.1 10.8 12.5 10.5 11.5 10.5Z" fill="#F9A533"/>
                  </svg>
                  {/* Mastercard */}
                  <svg className="h-5 w-8" viewBox="0 0 48 32" fill="none">
                    <rect width="48" height="32" rx="4" fill="#F7F7F7"/>
                    <circle cx="18" cy="16" r="9" fill="#EB001B"/>
                    <circle cx="30" cy="16" r="9" fill="#F79E1B"/>
                    <path d="M24 9.5C26.1 11.1 27.5 13.4 27.5 16C27.5 18.6 26.1 20.9 24 22.5C21.9 20.9 20.5 18.6 20.5 16C20.5 13.4 21.9 11.1 24 9.5Z" fill="#FF5F00"/>
                  </svg>
                  {/* Amex */}
                  <svg className="h-5 w-8" viewBox="0 0 48 32" fill="none">
                    <rect width="48" height="32" rx="4" fill="#006FCF"/>
                    <path d="M7 16L9.5 11H13L15.5 16L18 11H21.5L17 20H14L11.5 15.5L9 20H5.5L7 16Z" fill="white"/>
                    <path d="M22 11H31V13.5H25V14.5H30.5V17H25V18H31V20.5H22V11Z" fill="white"/>
                    <path d="M32 11H37L39 13.5L41 11H43L39 16L43 20.5H41L39 18L37 20.5H32L36 16L32 11Z" fill="white"/>
                  </svg>
                </div>
              </div>
              <RadioGroupItem value="card" className="ml-auto" />
            </div>

            {/* Card Form */}
            {showCardForm && selectedMethod === 'card' && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-4 animate-fade-in">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/5"
                  onClick={() => {
                    setCardNumber("4242 4242 4242 4242");
                    setExpiryDate("12/28");
                    setCvv("123");
                    setCardName("Test User");
                  }}
                >
                  🧪 Card de test (auto-fill)
                </Button>
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Număr card</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    className="h-12"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Data expirării</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                      maxLength={5}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      className="h-12"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cardName">Numele de pe card</Label>
                  <Input
                    id="cardName"
                    placeholder="Ion Popescu"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>
            )}

            <Separator className="my-4" />

            {/* Google Pay */}
            <div 
              className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                selectedMethod === 'google-pay' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleMethodSelect('google-pay')}
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <div className="flex-1">
                <div className="font-medium">Google Pay</div>
              </div>
              <RadioGroupItem value="google-pay" className="ml-auto" />
            </div>

            {/* Apple Pay */}
            <div 
              className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer mt-3 ${
                selectedMethod === 'apple-pay' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleMethodSelect('apple-pay')}
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <div className="flex-1">
                <div className="font-medium">Apple Pay</div>
              </div>
              <RadioGroupItem value="apple-pay" className="ml-auto" />
            </div>
          </RadioGroup>

          <Button 
            onClick={handleConfirm}
            className="w-full h-12 mt-6 bg-foreground text-background hover:bg-foreground/90"
            disabled={!selectedMethod || (selectedMethod === 'card' && (!cardNumber || !expiryDate || !cvv || !cardName))}
          >
            Confirmă metoda de plată
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodDialog;
