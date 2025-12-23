import { Edit, Trash2, Eye } from "lucide-react";
import { DataCardProps } from "@/types/common";

export function DataCard({
  id,
  title,
  subtitle,
  metadata,
  icon: Icon,
  onView,
  onEdit,
  onDelete,
  viewTitle = "View",
  editTitle = "Edit",
  deleteTitle = "Delete",
}: DataCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
            {metadata && (
              <p className="text-xs text-gray-400 mt-1">{metadata}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1 mt-1">
          {onView && (
            <button
              onClick={() => onView(id)}
              className="p-2 hover:bg-gray-100 rounded transition-colors cursor-pointer"
              title={viewTitle}
            >
              <Eye className="w-4 h-4 text-gray-600" />
            </button>
          )}
          <button
            onClick={() => onEdit(id)}
            className="p-2 hover:bg-gray-100 rounded transition-colors cursor-pointer"
            title={editTitle}
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => onDelete(id)}
            className="p-2 hover:bg-red-50 rounded transition-colors cursor-pointer"
            title={deleteTitle}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
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
