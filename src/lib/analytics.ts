// Google Analytics 4 Helper Functions
export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Declare gtag in window
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

// Initialize Google Analytics
export const initGA = () => {
  if (!GA_MEASUREMENT_ID) {
    console.warn('Google Analytics ID not found');
    return;
  }
  
  // Add GA script to head
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
  
  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;
  
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false // We'll manually send page views
  });
  

};

// Track page view
export const trackPageView = (url: string, title?: string) => {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  
  window.gtag('event', 'page_view', {
    page_path: url,
    page_title: title || document.title,
  });
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// E-commerce tracking - View item
export const trackViewItem = (item: {
  id: string;
  name: string;
  category?: string;
  price: number;
  currency?: string;
}) => {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  
  window.gtag('event', 'view_item', {
    currency: item.currency || 'VND',
    value: item.price,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
      },
    ],
  });
};

// E-commerce tracking - Add to cart
export const trackAddToCart = (item: {
  id: string;
  name: string;
  category?: string;
  price: number;
  quantity?: number;
  currency?: string;
}) => {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  
  window.gtag('event', 'add_to_cart', {
    currency: item.currency || 'VND',
    value: item.price * (item.quantity || 1),
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
        quantity: item.quantity || 1,
      },
    ],
  });
};

// E-commerce tracking - Begin checkout
export const trackBeginCheckout = (items: any[], value: number) => {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  
  window.gtag('event', 'begin_checkout', {
    currency: 'VND',
    value: value,
    items: items,
  });
};

// E-commerce tracking - Purchase
export const trackPurchase = (
  transactionId: string,
  value: number,
  items: any[],
  currency: string = 'VND'
) => {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  
  window.gtag('event', 'purchase', {
    transaction_id: transactionId,
    value: value,
    currency: currency,
    items: items,
  });
};

// Track search
export const trackSearch = (searchTerm: string) => {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  
  window.gtag('event', 'search', {
    search_term: searchTerm,
  });
};

// Track user signup
export const trackSignUp = (method: string = 'email') => {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  
  window.gtag('event', 'sign_up', {
    method: method,
  });
};

// Track user login
export const trackLogin = (method: string = 'email') => {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  
  window.gtag('event', 'login', {
    method: method,
  });
};
