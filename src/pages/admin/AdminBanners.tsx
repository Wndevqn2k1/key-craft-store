import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Pencil, Trash2, Loader2, Image, Upload } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("banners")
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: urlData.publicUrl });
      setPreviewUrl(urlData.publicUrl);
      toast.success("Đã tải ảnh lên thành công");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Không thể tải ảnh lên");
    } finally {
      setUploading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("banners").insert([{
        title: data.title,
        button_url: data.button_url,
        image_url: data.image_url,
        display_order: data.display_order,
        is_active: data.is_active,
      }]);
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
      const { error } = await supabase.from("banners").update({
        title: data.title,
        button_url: data.button_url,
        image_url: data.image_url,
        display_order: data.display_order,
        is_active: data.is_active,
      }).eq("id", id);
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
      button_url: "/products",
      image_url: "",
      display_order: (banners?.length || 0) + 1,
      is_active: true,
    });
    setEditingBanner(null);
    setPreviewUrl(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      button_url: banner.button_url || "/products",
      image_url: banner.image_url || "",
      display_order: banner.display_order,
      is_active: banner.is_active,
    });
    setPreviewUrl(banner.image_url);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.image_url) {
      toast.error("Vui lòng tải lên ảnh banner");
      return;
    }

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
              Slider banner trang chủ (tối đa 5 banner, kích thước 1170x390px)
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingBanner ? "Chỉnh sửa banner" : "Thêm banner mới"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Ảnh banner (1170x390px) *</Label>
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {previewUrl ? (
                      <div className="relative">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="w-full rounded-lg"
                          style={{ aspectRatio: '1170/390', objectFit: 'cover' }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <span className="text-white font-medium">Click để thay đổi</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8">
                        {uploading ? (
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">Click để tải ảnh lên</p>
                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG tối đa 5MB</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Tên banner (nội bộ)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Banner khuyến mãi tháng 1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="button_url">Link khi click vào banner</Label>
                  <Input
                    id="button_url"
                    value={formData.button_url}
                    onChange={(e) =>
                      setFormData({ ...formData, button_url: e.target.value })
                    }
                    placeholder="/products hoặc /product/abc123"
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
                    disabled={createMutation.isPending || updateMutation.isPending || uploading}
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
                  <TableHead className="w-48">Ảnh</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Link</TableHead>
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
                      {banner.image_url ? (
                        <div className="w-40 rounded overflow-hidden bg-muted">
                          <img
                            src={banner.image_url}
                            alt={banner.title}
                            className="w-full"
                            style={{ aspectRatio: '1170/390', objectFit: 'cover' }}
                          />
                        </div>
                      ) : (
                        <div className="w-40 h-12 rounded bg-muted flex items-center justify-center">
                          <Image className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{banner.title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-muted-foreground">
                        {banner.button_url || "-"}
                      </div>
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
            <li>Kích thước ảnh khuyến nghị: <strong>1170x390px</strong></li>
            <li>Tối đa 5 banner, tự động chạy slider mỗi 5 giây</li>
            <li>Thứ tự hiển thị: số nhỏ hơn sẽ hiển thị trước</li>
            <li>Định dạng ảnh: PNG, JPG, WEBP (tối đa 5MB)</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
