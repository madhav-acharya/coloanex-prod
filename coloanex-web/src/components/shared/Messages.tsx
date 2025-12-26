import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message, MessageType } from "@/types/components";

interface MessagesProps {
  messages: Message[];
  className?: string;
}

const messageConfig = {
  success: {
    icon: CheckCircle2,
    className: "border-green-200 bg-green-50 text-green-800",
    iconClassName: "text-green-500",
  },
  error: {
    icon: XCircle,
    className: "border-red-200 bg-red-50 text-red-800",
    iconClassName: "text-red-500",
  },
  warning: {
    icon: AlertCircle,
    className: "border-yellow-200 bg-yellow-50 text-yellow-800",
    iconClassName: "text-yellow-500",
  },
  info: {
    icon: Info,
    className: "border-blue-200 bg-blue-50 text-blue-800",
    iconClassName: "text-blue-500",
  },
};

export function Messages({ messages, className }: MessagesProps) {
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {messages.map((message, index) => {
        const config = messageConfig[message.type];
        const Icon = config.icon;
        const messageId = message.id || `message-${index}`;

        return (
          <div
            key={messageId}
            className={cn(
              "flex items-start gap-3 p-4 rounded-lg border",
              config.className
            )}
          >
            <Icon className={cn("h-5 w-5 mt-0.5", config.iconClassName)} />
            <div className="flex-1 min-w-0">
              {message.title && (
                <h4 className="text-sm font-semibold mb-1">{message.title}</h4>
              )}
              <p className="text-sm">{message.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
