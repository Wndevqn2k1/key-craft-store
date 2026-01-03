import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SiteSettings {
  site_name: string;
  site_title: string;
  logo_url: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  facebook_url: string;
  zalo_url: string;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  bank_branch: string;
  bank_bin: string; // Mã BIN ngân hàng cho VietQR
}

const defaultSettings: SiteSettings = {
  site_name: 'KEYSTORE',
  site_title: 'KeyStore - Cửa hàng Key bản quyền',
  logo_url: '',
  contact_email: 'contact@keystore.vn',
  contact_phone: '0123 456 789',
  contact_address: '123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh',
  facebook_url: '',
  zalo_url: '',
  bank_name: 'Vietcombank',
  bank_account: '1234567890',
  bank_holder: 'NGUYEN VAN A',
  bank_branch: 'Chi nhánh Hà Nội',
  bank_bin: '970436', // Mã BIN Vietcombank mặc định
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) throw error;

      const settings: SiteSettings = { ...defaultSettings };
      data?.forEach((item) => {
        if (item.key in settings) {
          (settings as any)[item.key] = item.value || defaultSettings[item.key as keyof SiteSettings];
        }
      });

      return settings;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateSiteSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<SiteSettings>) => {
      const entries = Object.entries(updates);
      
      for (const [key, value] of entries) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value: value || '' })
          .eq('key', key);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    },
  });
}
