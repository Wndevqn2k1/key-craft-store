import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole } from '@/types/database';

export function useUserRole() {
  return useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle to handle no rows

      // If no record exists, default to 'user'
      if (error) {
        console.error('Error fetching user role:', error);
        return 'user' as AppRole;
      }
      
      return (data?.role as AppRole) || 'user';
    },
    staleTime: 30 * 1000, // Cache 30 giây (ngắn hơn để cập nhật nhanh)
    refetchOnWindowFocus: true, // Refetch khi focus lại tab
  });
}

export function useIsReseller() {
  const { data: role } = useUserRole();
  return role === 'reseller';
}
