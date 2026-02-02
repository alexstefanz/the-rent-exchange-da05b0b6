import { Shield, Info } from "lucide-react";
import { uxCopy } from "@/data/uxCopy";

type MessageType = "payment" | "cancellation" | "messaging" | "transaction";

interface ReassuranceMessageProps {
  type: MessageType;
  className?: string;
}

const ReassuranceMessage = ({ type, className = "" }: ReassuranceMessageProps) => {
  const messages: Record<MessageType, { icon: typeof Shield; text: string; color: string }> = {
    payment: {
      icon: Shield,
      text: uxCopy.reassurance.paymentProtected,
      color: "text-emerald-600 bg-emerald-50",
    },
    cancellation: {
      icon: Info,
      text: uxCopy.reassurance.freeCancellation,
      color: "text-blue-600 bg-blue-50",
    },
    messaging: {
      icon: Shield,
      text: uxCopy.reassurance.keepOnPlatform,
      color: "text-purple-600 bg-purple-50",
    },
    transaction: {
      icon: Shield,
      text: uxCopy.reassurance.secureTransaction,
      color: "text-emerald-600 bg-emerald-50",
    },
  };

  const message = messages[type];
  const Icon = message.icon;

  return (
    <div className={`flex items-start gap-2 rounded-lg p-3 ${message.color.split(" ")[1]} ${className}`}>
      <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${message.color.split(" ")[0]}`} />
      <p className={`text-sm ${message.color.split(" ")[0]}`}>
        {message.text}
      </p>
    </div>
  );
};

export default ReassuranceMessage;
