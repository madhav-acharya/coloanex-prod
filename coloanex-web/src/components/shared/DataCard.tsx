import { Edit, Trash2, Eye } from "lucide-react";
import { DataCardProps } from "@/types/common";

export function DataCard({
  id,
  title,
  subtitle,
  metadata,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  onView,
  onEdit,
  onDelete,
  viewTitle = "View",
  editTitle = "Edit",
  deleteTitle = "Delete",
}: DataCardProps & { iconColor?: string; iconBg?: string }) {
  return (
    <div className="bg-card rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {Icon && (
            <div className={`p-2 ${iconBg} rounded-lg`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4
              className="font-semibold text-foreground truncate text-[14px]"
              title={title}
            >
              {title}
            </h4>
            {subtitle && (
              <p
                className="text-foreground mt-1 truncate text-[14px]"
                title={subtitle}
              >
                {subtitle}
              </p>
            )}
            {metadata && (
              <p
                className="!text-[12px] text-muted-foreground mt-1 truncate"
                title={metadata}
              >
                {metadata}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-1 mt-1">
          {onView && (
            <button
              onClick={() => onView(id)}
              className="p-2 hover:bg-muted/50 rounded transition-colors cursor-pointer"
              title={viewTitle}
            >
              <Eye className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={() => onEdit(id)}
            className="p-2 hover:bg-muted/50 rounded transition-colors cursor-pointer"
            title={editTitle}
          >
            <Edit className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => onDelete(id)}
            className="p-2 hover:bg-destructive/10 rounded transition-colors cursor-pointer"
            title={deleteTitle}
          >
            <Trash2
              className="w-4 h-4"
              style={{ color: "var(--color-danger)" }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

export function DataCardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  );
}
