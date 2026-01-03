import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Image } from "lucide-react";
import { toast } from "sonner";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  button_text: string | null;
  button_url: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminBanners() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    button_text: "Khám phá ngay",
    button_url: "/products",
    image_url: "",
    display_order: 1,
    is_active: true,
  });

  const { data: banners, isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Banner[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("banners").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Đã thêm banner mới");
      resetForm();
    },
    onError: () => {
      toast.error("Không thể thêm banner");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("banners").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Đã cập nhật banner");
      resetForm();
    },
    onError: () => {
      toast.error("Không thể cập nhật banner");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Đã xóa banner");
    },
    onError: () => {
      toast.error("Không thể xóa banner");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      button_text: "Khám phá ngay",
      button_url: "/products",
      image_url: "",
      display_order: (banners?.length || 0) + 1,
      is_active: true,
    });
    setEditingBanner(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      description: banner.description || "",
      button_text: banner.button_text || "Khám phá ngay",
      button_url: banner.button_url || "/products",
      image_url: banner.image_url || "",
      display_order: banner.display_order,
      is_active: banner.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, data: formData });
    } else {
      if (banners && banners.length >= 5) {
        toast.error("Đã đạt giới hạn 5 banner. Vui lòng xóa banner cũ trước.");
        return;
      }
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa banner này?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quản lý Banner</h1>
            <p className="text-muted-foreground">
              Quản lý slider banner trang chủ (tối đa 5 banner)
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                  setFormData((prev) => ({
                    ...prev,
                    display_order: (banners?.length || 0) + 1,
                  }));
                }}
                disabled={banners && banners.length >= 5}
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingBanner ? "Chỉnh sửa banner" : "Thêm banner mới"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tiêu đề *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="KEY BẢN QUYỀN\nCHÍNH HÃNG"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Dùng \n để xuống dòng (dòng 2 sẽ có màu gradient)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle (badge)</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                    placeholder="Giao key tự động 24/7"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Cung cấp key phần mềm, game..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="button_text">Text nút</Label>
                    <Input
                      id="button_text"
                      value={formData.button_text}
                      onChange={(e) =>
                        setFormData({ ...formData, button_text: e.target.value })
                      }
                      placeholder="Khám phá ngay"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="button_url">Link nút</Label>
                    <Input
                      id="button_url"
                      value={formData.button_url}
                      onChange={(e) =>
                        setFormData({ ...formData, button_url: e.target.value })
                      }
                      placeholder="/products"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">URL ảnh nền (tùy chọn)</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_order">Thứ tự hiển thị</Label>
                    <Input
                      id="display_order"
                      type="number"
                      min={1}
                      max={5}
                      value={formData.display_order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          display_order: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trạng thái</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_active: checked })
                        }
                      />
                      <span>{formData.is_active ? "Hiển thị" : "Ẩn"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingBanner ? "Cập nhật" : "Thêm"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !banners || banners.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Chưa có banner nào. Thêm banner đầu tiên!
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">STT</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Subtitle</TableHead>
                  <TableHead className="w-20">Ảnh</TableHead>
                  <TableHead className="w-24">Trạng thái</TableHead>
                  <TableHead className="w-32">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell className="font-medium">
                      {banner.display_order}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{banner.title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-muted-foreground">
                        {banner.subtitle || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {banner.image_url ? (
                        <div className="w-12 h-8 rounded overflow-hidden bg-muted">
                          <img
                            src={banner.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-8 rounded bg-muted flex items-center justify-center">
                          <Image className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          banner.is_active
                            ? "bg-green-500/20 text-green-500"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {banner.is_active ? "Hiển thị" : "Ẩn"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(banner)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(banner.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <p>
            <strong>Hướng dẫn:</strong>
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Tối đa 5 banner, tự động chạy slider mỗi 5 giây</li>
            <li>Tiêu đề: dùng \n để xuống dòng, dòng 2 sẽ có màu gradient</li>
            <li>Thứ tự hiển thị: số nhỏ hơn sẽ hiển thị trước</li>
            <li>Ảnh nền: tùy chọn, nên dùng ảnh tối màu để text dễ đọc</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
