import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Key, 
  ShoppingCart, 
  Users, 
  LogOut,
  FolderOpen,
  Wallet,
  Settings,
  Bell,
  Image,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Package, label: 'Sản phẩm', path: '/admin/products' },
  { icon: FolderOpen, label: 'Danh mục', path: '/admin/categories' },
  { icon: Key, label: 'Keys', path: '/admin/keys' },
  { icon: ShoppingCart, label: 'Đơn hàng', path: '/admin/orders' },
  { icon: Wallet, label: 'Nạp tiền', path: '/admin/deposits' },
  { icon: Users, label: 'Người dùng', path: '/admin/users' },
  { icon: Image, label: 'Banners', path: '/admin/banners' },
  { icon: Bell, label: 'Thông báo', path: '/admin/announcements' },
  { icon: Settings, label: 'Cài đặt', path: '/admin/settings' },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, isAdmin, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const currentSection = useMemo(() => {
    const item = menuItems.find((menu) => location.pathname.startsWith(menu.path));
    return item?.label || 'Admin';
  }, [location.pathname]);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Không có quyền truy cập</h1>
          <Button onClick={() => navigate('/')}>Quay lại trang chủ</Button>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex w-72 flex-col bg-card">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            G
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">GOODTEAM Admin</p>
            <p className="text-xs text-muted-foreground">Quản trị hệ thống</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-shrink-0 lg:border-r lg:border-border lg:bg-card">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <div className={cn('fixed inset-0 z-40 lg:hidden', isSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none')}>
        <div
          className={cn('absolute inset-0 bg-black/40 transition-opacity', isSidebarOpen ? 'opacity-100' : 'opacity-0')}
          onClick={() => setIsSidebarOpen(false)}
        />
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-72 -translate-x-full transform bg-card shadow-xl transition-transform duration-300',
            isSidebarOpen && 'translate-x-0'
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-base font-semibold">Menu</p>
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          {sidebarContent}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Khu vực quản trị</p>
                <h2 className="text-lg font-semibold leading-none">{currentSection}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Thông báo">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
};
