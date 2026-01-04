import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminBreadcrumbItem {
  label: string;
  href?: string;
  className?: string;
}

interface AdminBreadcrumbsProps {
  items: AdminBreadcrumbItem[];
}

export const AdminBreadcrumbs = ({ items }: AdminBreadcrumbsProps) => {
  if (!items?.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center gap-1">
          {index !== 0 && <ChevronRight className="h-3.5 w-3.5 text-border" />}
          {item.href ? (
            <Link
              to={item.href}
              className={cn(
                "transition-colors hover:text-foreground",
                index === items.length - 1 && "text-foreground font-medium",
                item.className
              )}
            >
              {item.label}
            </Link>
          ) : (
            <span className={cn("text-foreground font-medium", item.className)}>{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
};
