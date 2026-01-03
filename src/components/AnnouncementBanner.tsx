import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, ExternalLink, X } from "lucide-react";
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

  // Show only the first announcement as a modal
  const announcement = visibleAnnouncements[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-white/20">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">{announcement.title}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
            {announcement.content}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-6 pt-0">
          {announcement.show_contact_button && announcement.contact_button_url && (
            <a
              href={announcement.contact_button_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button className="w-full gap-2" size="lg">
                <ExternalLink className="w-4 h-4" />
                {announcement.contact_button_text || "Liên hệ"}
              </Button>
            </a>
          )}
          <Button
            variant="outline"
            size="lg"
            className={announcement.show_contact_button && announcement.contact_button_url ? "" : "w-full"}
            onClick={() => handleHide(announcement.id)}
          >
            <X className="w-4 h-4 mr-2" />
            Ẩn trong 2 giờ
          </Button>
        </div>
      </div>
    </div>
  );
}
