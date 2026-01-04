import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconClassName?: string;
  badgeClassName?: string;
  loading?: boolean;
}

export const AdminStatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName,
  badgeClassName,
  loading,
}: AdminStatCardProps) => {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("rounded-lg p-2", badgeClassName)}>
          <Icon className={cn("h-5 w-5", iconClassName)} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-3xl font-bold">
            {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
          </div>
        )}
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
};
