import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Bell } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  show_contact_button: boolean;
  contact_button_text: string | null;
  contact_button_url: string | null;
  created_at: string;
}

export default function AdminAnnouncements() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    is_active: true,
    show_contact_button: false,
    contact_button_text: "Liên hệ",
    contact_button_url: "",
  });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("announcements").insert({
        title: data.title,
        content: data.content,
        is_active: data.is_active,
        show_contact_button: data.show_contact_button,
        contact_button_text: data.contact_button_text || "Liên hệ",
        contact_button_url: data.contact_button_url || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      toast({ title: "Thành công", description: "Đã tạo thông báo mới" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể tạo thông báo", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("announcements")
        .update({
          title: data.title,
          content: data.content,
          is_active: data.is_active,
          show_contact_button: data.show_contact_button,
          contact_button_text: data.contact_button_text || "Liên hệ",
          contact_button_url: data.contact_button_url || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      toast({ title: "Thành công", description: "Đã cập nhật thông báo" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể cập nhật thông báo", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      toast({ title: "Thành công", description: "Đã xóa thông báo" });
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể xóa thông báo", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      is_active: true,
      show_contact_button: false,
      contact_button_text: "Liên hệ",
      contact_button_url: "",
    });
    setEditingAnnouncement(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      is_active: announcement.is_active,
      show_contact_button: announcement.show_contact_button,
      contact_button_text: announcement.contact_button_text || "Liên hệ",
      contact_button_url: announcement.contact_button_url || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quản lý thông báo</h1>
            <p className="text-muted-foreground">Tạo và quản lý các thông báo sự kiện</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm thông báo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingAnnouncement ? "Chỉnh sửa thông báo" : "Thêm thông báo mới"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tiêu đề</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nhập tiêu đề thông báo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Nội dung</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Nhập nội dung thông báo"
                    rows={4}
                    required
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Kích hoạt</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show_contact_button">Hiển thị nút liên hệ</Label>
                  <Switch
                    id="show_contact_button"
                    checked={formData.show_contact_button}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_contact_button: checked })}
                  />
                </div>
                {formData.show_contact_button && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="contact_button_text">Nội dung nút</Label>
                      <Input
                        id="contact_button_text"
                        value={formData.contact_button_text}
                        onChange={(e) => setFormData({ ...formData, contact_button_text: e.target.value })}
                        placeholder="Liên hệ"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_button_url">Link liên hệ</Label>
                      <Input
                        id="contact_button_url"
                        value={formData.contact_button_url}
                        onChange={(e) => setFormData({ ...formData, contact_button_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </>
                )}
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingAnnouncement ? "Cập nhật" : "Tạo mới"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Danh sách thông báo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Đang tải...</p>
            ) : announcements?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Chưa có thông báo nào</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Nút liên hệ</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements?.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell className="font-medium">{announcement.title}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          announcement.is_active 
                            ? "bg-green-500/20 text-green-500" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {announcement.is_active ? "Đang hiển thị" : "Đã tắt"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {announcement.show_contact_button ? (
                          <span className="text-primary">{announcement.contact_button_text}</span>
                        ) : (
                          <span className="text-muted-foreground">Không</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(announcement)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(announcement.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
