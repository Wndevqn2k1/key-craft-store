import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Save } from 'lucide-react';
import type { PriceTier, Product } from '@/types/database';

interface PriceTierWithProduct extends PriceTier {
  products: Product;
}

export default function AdminResellerPrices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});

  // Fetch all price tiers with products
  const { data: priceTiers, isLoading } = useQuery({
    queryKey: ['admin-reseller-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_tiers')
        .select('*, products(id, name, category)')
        .order('product_id');

      if (error) throw error;
      return data as PriceTierWithProduct[];
    },
  });

  // Update reseller prices mutation
  const updatePricesMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; reseller_price: number }>) => {
      // Update each price tier individually using SQL
      for (const update of updates) {
        const { error } = await supabase
          .from('price_tiers')
          .update({ original_price: update.reseller_price })
          .eq('id', update.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reseller-prices'] });
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật giá reseller',
      });
      setEditedPrices({});
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handlePriceChange = (tierId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedPrices(prev => ({ ...prev, [tierId]: numValue }));
  };

  const handleSave = () => {
    const updates = Object.entries(editedPrices).map(([id, reseller_price]) => ({
      id,
      reseller_price,
    }));

    if (updates.length === 0) {
      toast({
        title: 'Thông báo',
        description: 'Không có thay đổi nào',
        variant: 'default',
      });
      return;
    }

    updatePricesMutation.mutate(updates);
  };

  const handleSetDiscount = (percentage: number) => {
    if (!priceTiers) return;

    const newPrices: Record<string, number> = {};
    priceTiers.forEach(tier => {
      newPrices[tier.id] = Math.round(tier.price * (1 - percentage / 100));
    });
    setEditedPrices(newPrices);

    toast({
      title: 'Áp dụng giảm giá',
      description: `Đã set giảm ${percentage}% cho tất cả sản phẩm`,
    });
  };

  const getCurrentPrice = (tier: PriceTier) => {
    return editedPrices[tier.id] !== undefined
      ? editedPrices[tier.id]
      : (tier.reseller_price || Math.round(tier.price * 0.9));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">Đang tải...</div>
        </div>
      </AdminLayout>
    );
  }

  const hasChanges = Object.keys(editedPrices).length > 0;

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Quản lý Giá Reseller"
        description="Thiết lập giá đặc biệt cho reseller"
      />

      <div className="grid gap-6 mb-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Giảm giá nhanh</CardTitle>
            <CardDescription>Áp dụng % giảm cho tất cả sản phẩm</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSetDiscount(10)}
            >
              Giảm 10%
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSetDiscount(15)}
            >
              Giảm 15%
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSetDiscount(20)}
            >
              Giảm 20%
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Thống kê</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng sản phẩm:</span>
                <span className="font-medium">{priceTiers?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đang chỉnh sửa:</span>
                <span className="font-medium text-orange-500">
                  {Object.keys(editedPrices).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Hành động</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={!hasChanges || updatePricesMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updatePricesMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
            {hasChanges && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setEditedPrices({})}
              >
                Hủy thay đổi
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Gói / Thời hạn</TableHead>
              <TableHead className="text-right">Giá bán thường</TableHead>
              <TableHead className="text-right">Giá Reseller</TableHead>
              <TableHead className="text-right">Chênh lệch</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {priceTiers?.map((tier) => {
              const currentResellerPrice = getCurrentPrice(tier);
              const discount = tier.price - currentResellerPrice;
              const discountPercent = ((discount / tier.price) * 100).toFixed(0);

              return (
                <TableRow key={tier.id}>
                  <TableCell className="font-medium">
                    {tier.products.name}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {tier.duration_label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(tier.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={currentResellerPrice}
                      onChange={(e) => handlePriceChange(tier.id, e.target.value)}
                      className="w-32 text-right ml-auto"
                      min="0"
                      step="1000"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium text-green-600">
                        -{formatCurrency(discount)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({discountPercent}%)
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
