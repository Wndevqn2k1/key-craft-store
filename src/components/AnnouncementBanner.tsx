import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, Bell, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: string;
  title: string;
  content: string;
  show_contact_button: boolean;
  contact_button_text: string | null;
  contact_button_url: string | null;
}

const HIDE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export function AnnouncementBanner() {
  const [hiddenAnnouncements, setHiddenAnnouncements] = useState<Record<string, number>>({});

  // Load hidden announcements from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("hidden_announcements");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        // Filter out expired hidden announcements
        const valid: Record<string, number> = {};
        for (const [id, hiddenAt] of Object.entries(parsed)) {
          if (now - (hiddenAt as number) < HIDE_DURATION_MS) {
            valid[id] = hiddenAt as number;
          }
        }
        setHiddenAnnouncements(valid);
        localStorage.setItem("hidden_announcements", JSON.stringify(valid));
      } catch {
        localStorage.removeItem("hidden_announcements");
      }
    }
  }, []);

  const { data: announcements } = useQuery({
    queryKey: ["active-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, content, show_contact_button, contact_button_text, contact_button_url")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const handleHide = (id: string) => {
    const newHidden = { ...hiddenAnnouncements, [id]: Date.now() };
    setHiddenAnnouncements(newHidden);
    localStorage.setItem("hidden_announcements", JSON.stringify(newHidden));
  };

  // Filter out hidden announcements
  const visibleAnnouncements = announcements?.filter(
    (a) => !hiddenAnnouncements[a.id]
  );

  if (!visibleAnnouncements || visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {visibleAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border border-primary/30 rounded-lg p-4 mx-4 mt-4 animate-fade-in"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">{announcement.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                {announcement.content}
              </p>
              {announcement.show_contact_button && announcement.contact_button_url && (
                <a
                  href={announcement.contact_button_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-3"
                >
                  <Button size="sm" className="gap-1">
                    {announcement.contact_button_text || "Liên hệ"}
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </a>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 hover:bg-destructive/10"
              onClick={() => handleHide(announcement.id)}
              title="Ẩn trong 2 giờ"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
