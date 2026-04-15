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
    style: {
      borderColor: 'var(--color-success-dark)',
      backgroundColor: 'var(--color-success-light)',
      color: 'var(--color-success-dark)',
    } as React.CSSProperties,
    iconStyle: { color: 'var(--color-success)' } as React.CSSProperties,
  },
  error: {
    icon: XCircle,
    style: {
      borderColor: 'var(--color-danger-border)',
      backgroundColor: 'var(--color-danger-light)',
      color: 'var(--color-danger-text)',
    } as React.CSSProperties,
    iconStyle: { color: 'var(--color-danger)' } as React.CSSProperties,
  },
  warning: {
    icon: AlertCircle,
    style: {
      borderColor: 'var(--color-warning-border)',
      backgroundColor: 'var(--color-warning-light)',
      color: 'var(--color-warning-text)',
    } as React.CSSProperties,
    iconStyle: { color: 'var(--color-warning)' } as React.CSSProperties,
  },
  info: {
    icon: Info,
    style: {
      borderColor: 'var(--color-info-border)',
      backgroundColor: 'var(--color-info-light)',
      color: 'var(--color-info-text)',
    } as React.CSSProperties,
    iconStyle: { color: 'var(--color-info)' } as React.CSSProperties,
  },
};

export function Messages({ messages, className }: MessagesProps) {
  type ConfigKey = keyof typeof messageConfig;
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {messages.map((message, index) => {
        const config = messageConfig[message.type as ConfigKey];
        const Icon = config.icon;
        const messageId = message.id || `message-${index}`;

        return (
          <div
            key={messageId}
            className={cn("flex items-start gap-3 p-4 rounded-lg border")}
            style={config.style}
          >
            <Icon className="h-5 w-5 mt-0.5" style={config.iconStyle} />
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
