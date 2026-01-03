import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const AdminKeys = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [keyValues, setKeyValues] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ['products-for-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price_tiers(id, duration_label)')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: keys, isLoading } = useQuery({
    queryKey: ['admin-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_keys')
        .select('*, products(name), price_tiers(duration_label)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const keyList = keyValues.split('\n').filter(k => k.trim());
      const keysToInsert = keyList.map(key => ({
        product_id: selectedProduct,
        price_tier_id: selectedTier,
        key_value: key.trim(),
        status: 'available' as const,
      }));
      
      const { error } = await supabase.from('product_keys').insert(keysToInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-keys'] });
      setIsDialogOpen(false);
      setSelectedProduct('');
      setSelectedTier('');
      setKeyValues('');
      toast({ title: 'Thành công', description: 'Đã thêm keys mới' });
    },
    onError: (error) => {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_keys').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-keys'] });
      toast({ title: 'Thành công', description: 'Đã xóa key' });
    },
    onError: (error) => {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    },
  });

  const selectedProductData = products?.find(p => p.id === selectedProduct);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default">Còn hàng</Badge>;
      case 'sold':
        return <Badge variant="secondary">Đã bán</Badge>;
      case 'expired':
        return <Badge variant="destructive">Hết hạn</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Quản lý Keys</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Thêm Keys</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Thêm Keys mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Sản phẩm</Label>
                <Select value={selectedProduct} onValueChange={(value) => {
                  setSelectedProduct(value);
                  setSelectedTier('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedProduct && (
                <div>
                  <Label>Gói thời hạn</Label>
                  <Select value={selectedTier} onValueChange={setSelectedTier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn gói" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProductData?.price_tiers?.map((tier: any) => (
                        <SelectItem key={tier.id} value={tier.id}>{tier.duration_label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label>Keys (mỗi key một dòng)</Label>
                <Textarea
                  value={keyValues}
                  onChange={(e) => setKeyValues(e.target.value)}
                  placeholder="XXXXX-XXXXX-XXXXX-XXXXX&#10;YYYYY-YYYYY-YYYYY-YYYYY"
                  rows={6}
                />
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => createMutation.mutate()}
                disabled={!selectedProduct || !selectedTier || !keyValues.trim() || createMutation.isPending}
              >
                Thêm Keys
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Gói</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Đang tải...</TableCell>
                </TableRow>
              ) : keys?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Chưa có key nào</TableCell>
                </TableRow>
              ) : (
                keys?.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.products?.name}</TableCell>
                    <TableCell>{key.price_tiers?.duration_label}</TableCell>
                    <TableCell className="font-mono text-sm">{key.key_value}</TableCell>
                    <TableCell>{getStatusBadge(key.status || 'available')}</TableCell>
                    <TableCell>{new Date(key.created_at!).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(key.id)}
                        disabled={key.status === 'sold' || deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminKeys;
