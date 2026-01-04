import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminTableShellProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  minWidth?: number;
}

export const AdminTableShell = ({
  title,
  description,
  actions,
  children,
  minWidth = 768,
}: AdminTableShellProps) => {
  return (
    <Card className="overflow-hidden">
      {(title || description || actions) && (
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <div style={{ minWidth: `${minWidth}px` }} className="overflow-x-auto">
            {children}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
