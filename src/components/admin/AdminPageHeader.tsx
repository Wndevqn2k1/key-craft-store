import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminBreadcrumbItem, AdminBreadcrumbs } from "./AdminBreadcrumbs";
import { cn } from "@/lib/utils";

interface HeaderTab {
  value: string;
  label: string;
  count?: number;
}

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: AdminBreadcrumbItem[];
  actions?: React.ReactNode;
  tabs?: HeaderTab[];
  currentTab?: string;
  onTabChange?: (value: string) => void;
}

export const AdminPageHeader = ({
  title,
  description,
  breadcrumbs,
  actions,
  tabs,
  currentTab,
  onTabChange,
}: AdminPageHeaderProps) => {
  const [internalTab, setInternalTab] = useState<string | undefined>(currentTab || tabs?.[0]?.value);

  useEffect(() => {
    if (currentTab !== undefined) {
      setInternalTab(currentTab);
    }
  }, [currentTab]);

  useEffect(() => {
    if (!currentTab && tabs?.length) {
      setInternalTab(tabs[0].value);
    }
  }, [tabs, currentTab]);

  const handleTabChange = (value: string) => {
    if (!currentTab) {
      setInternalTab(value);
    }
    onTabChange?.(value);
  };

  return (
    <div className="space-y-4 border-b border-border pb-4">
      {breadcrumbs && <AdminBreadcrumbs items={breadcrumbs} />}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>

      {tabs?.length ? (
        <Tabs value={currentTab ?? internalTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "rounded-none border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground",
                  "data-[state=active]:border-primary data-[state=active]:text-primary"
                )}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span className="ml-2 text-xs text-muted-foreground">{tab.count}</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}
    </div>
  );
};
