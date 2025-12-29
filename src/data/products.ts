export interface PriceTier {
  duration: string;
  durationLabel: string;
  price: number;
  originalPrice?: number;
  popular?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  features: string[];
  priceTiers: PriceTier[];
  badge?: string;
  inStock: boolean;
}

export const products: Product[] = [
  {
    id: "windows-11-pro",
    name: "Windows 11 Pro",
    description: "Hệ điều hành Windows 11 Pro bản quyền chính hãng Microsoft. Kích hoạt vĩnh viễn, hỗ trợ cập nhật trọn đời.",
    image: "https://images.unsplash.com/photo-1624571409108-e9a41746af53?w=400&h=300&fit=crop",
    category: "Hệ điều hành",
    rating: 4.9,
    reviews: 2847,
    features: ["Kích hoạt vĩnh viễn", "Cập nhật tự động", "Hỗ trợ 24/7", "Key chính hãng"],
    priceTiers: [
      { duration: "lifetime", durationLabel: "Vĩnh viễn", price: 350000 }
    ],
    badge: "Best Seller",
    inStock: true,
  },
  {
    id: "office-365",
    name: "Microsoft Office 365",
    description: "Bộ ứng dụng văn phòng Office 365 với Word, Excel, PowerPoint, Outlook và OneDrive 1TB.",
    image: "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=400&h=300&fit=crop",
    category: "Phần mềm văn phòng",
    rating: 4.8,
    reviews: 1923,
    features: ["5 thiết bị/tài khoản", "OneDrive 1TB", "Cập nhật liên tục", "Hỗ trợ kỹ thuật"],
    priceTiers: [
      { duration: "1-month", durationLabel: "1 Tháng", price: 89000 },
      { duration: "6-months", durationLabel: "6 Tháng", price: 450000, originalPrice: 534000, popular: true },
      { duration: "1-year", durationLabel: "1 Năm", price: 799000, originalPrice: 1068000 },
    ],
    badge: "Hot",
    inStock: true,
  },
  {
    id: "adobe-creative-cloud",
    name: "Adobe Creative Cloud",
    description: "Trọn bộ Adobe Creative Cloud với Photoshop, Illustrator, Premiere Pro, After Effects và hơn 20 ứng dụng khác.",
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=300&fit=crop",
    category: "Thiết kế",
    rating: 4.9,
    reviews: 1456,
    features: ["20+ ứng dụng Adobe", "100GB Cloud", "Adobe Fonts", "Cập nhật mới nhất"],
    priceTiers: [
      { duration: "1-month", durationLabel: "1 Tháng", price: 199000 },
      { duration: "3-months", durationLabel: "3 Tháng", price: 549000, originalPrice: 597000 },
      { duration: "1-year", durationLabel: "1 Năm", price: 1899000, originalPrice: 2388000, popular: true },
    ],
    badge: "Premium",
    inStock: true,
  },
  {
    id: "spotify-premium",
    name: "Spotify Premium",
    description: "Nghe nhạc không giới hạn, không quảng cáo. Tải về nghe offline trên mọi thiết bị.",
    image: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=300&fit=crop",
    category: "Giải trí",
    rating: 4.7,
    reviews: 3241,
    features: ["Không quảng cáo", "Nghe offline", "Chất lượng cao", "Đa nền tảng"],
    priceTiers: [
      { duration: "1-month", durationLabel: "1 Tháng", price: 59000 },
      { duration: "3-months", durationLabel: "3 Tháng", price: 159000, originalPrice: 177000, popular: true },
      { duration: "6-months", durationLabel: "6 Tháng", price: 299000, originalPrice: 354000 },
      { duration: "1-year", durationLabel: "1 Năm", price: 549000, originalPrice: 708000 },
    ],
    inStock: true,
  },
  {
    id: "netflix-premium",
    name: "Netflix Premium",
    description: "Xem phim, series không giới hạn với chất lượng 4K Ultra HD. Hỗ trợ 4 màn hình cùng lúc.",
    image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&h=300&fit=crop",
    category: "Giải trí",
    rating: 4.8,
    reviews: 2156,
    features: ["4K Ultra HD", "4 màn hình", "Tải offline", "Profile riêng"],
    priceTiers: [
      { duration: "1-month", durationLabel: "1 Tháng", price: 89000 },
      { duration: "3-months", durationLabel: "3 Tháng", price: 249000, originalPrice: 267000, popular: true },
      { duration: "6-months", durationLabel: "6 Tháng", price: 469000, originalPrice: 534000 },
    ],
    badge: "Popular",
    inStock: true,
  },
  {
    id: "youtube-premium",
    name: "YouTube Premium",
    description: "Xem YouTube không quảng cáo, phát nhạc nền, tải video offline và truy cập YouTube Music Premium.",
    image: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=300&fit=crop",
    category: "Giải trí",
    rating: 4.6,
    reviews: 1876,
    features: ["Không quảng cáo", "Phát nền", "Tải offline", "YouTube Music"],
    priceTiers: [
      { duration: "1-month", durationLabel: "1 Tháng", price: 79000 },
      { duration: "3-months", durationLabel: "3 Tháng", price: 219000, originalPrice: 237000 },
      { duration: "1-year", durationLabel: "1 Năm", price: 799000, originalPrice: 948000, popular: true },
    ],
    inStock: true,
  },
  {
    id: "canva-pro",
    name: "Canva Pro",
    description: "Công cụ thiết kế đồ họa chuyên nghiệp với hàng triệu template, ảnh stock và công cụ AI.",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop",
    category: "Thiết kế",
    rating: 4.8,
    reviews: 987,
    features: ["Triệu template", "100GB storage", "Brand Kit", "Magic AI"],
    priceTiers: [
      { duration: "1-month", durationLabel: "1 Tháng", price: 129000 },
      { duration: "6-months", durationLabel: "6 Tháng", price: 699000, originalPrice: 774000, popular: true },
      { duration: "1-year", durationLabel: "1 Năm", price: 1199000, originalPrice: 1548000 },
    ],
    badge: "New",
    inStock: true,
  },
  {
    id: "chatgpt-plus",
    name: "ChatGPT Plus",
    description: "Truy cập GPT-4, ưu tiên khi cao tải, tốc độ phản hồi nhanh hơn và các tính năng mới nhất.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop",
    category: "AI & Công cụ",
    rating: 4.9,
    reviews: 2341,
    features: ["GPT-4 Access", "Ưu tiên cao", "Phản hồi nhanh", "Tính năng mới"],
    priceTiers: [
      { duration: "1-month", durationLabel: "1 Tháng", price: 499000 },
      { duration: "3-months", durationLabel: "3 Tháng", price: 1399000, originalPrice: 1497000, popular: true },
    ],
    badge: "Trending",
    inStock: true,
  },
];

export const categories = [
  { id: "all", name: "Tất cả", icon: "Grid3X3" },
  { id: "he-dieu-hanh", name: "Hệ điều hành", icon: "Monitor" },
  { id: "phan-mem-van-phong", name: "Văn phòng", icon: "FileText" },
  { id: "thiet-ke", name: "Thiết kế", icon: "Palette" },
  { id: "giai-tri", name: "Giải trí", icon: "Play" },
  { id: "ai-cong-cu", name: "AI & Công cụ", icon: "Sparkles" },
];
