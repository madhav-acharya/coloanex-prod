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
    className:
      "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-100",
    iconClassName: "text-green-500 dark:text-green-400",
  },
  error: {
    icon: XCircle,
    className:
      "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-100",
    iconClassName: "text-red-500 dark:text-red-400",
  },
  warning: {
    icon: AlertCircle,
    className:
      "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-100",
    iconClassName: "text-yellow-500 dark:text-yellow-400",
  },
  info: {
    icon: Info,
    className:
      "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-100",
    iconClassName: "text-blue-500 dark:text-blue-400",
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
              config.className,
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
