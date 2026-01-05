import { Helmet } from 'react-helmet-async';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  price?: number;
  currency?: string;
  availability?: 'instock' | 'outofstock';
}

export function SEO({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  price,
  currency = 'VND',
  availability = 'instock',
}: SEOProps) {
  const { data: settings } = useSiteSettings();
  
  const siteName = settings?.site_name || 'GOODTEAM';
  const defaultTitle = settings?.site_title || 'MuaHackVip.com - GOODTEAM GOODGAME | Mua Key Hackmap, Tool Game Giá Rẻ';
  const defaultDescription = 'MuaHackVip.com - GOODTEAM GOODGAME cung cấp key bản quyền phần mềm, game, hackmap, tool game chính hãng. Mua key Windows, Office, hackmap LMHT, AOV, Liên Quân giá rẻ. Giao key tự động 24/7, bảo hành uy tín. Chuyên hackmap LMHT, AOV, Liên Quân Mobile, tool auto farm.';
  const defaultKeywords = 'muahackvip, muahackvip.com, goodteam, goodgame, mua key, key bản quyền, hackmap, tool game, key windows, key office, hackmap lol, hackmap lmht, hackmap aov, hackmap liên quân, tool liên quân mobile, cheat aov, aov đài loan, aov thái lan, key giá rẻ, mua hack vip';
  const defaultImage = settings?.logo_url || '/logo.png';
  const siteUrl = 'https://muahackvip.com';
  
  const fullTitle = title ? `${title} - ${siteName}` : defaultTitle;
  const fullDescription = description || defaultDescription;
  const fullKeywords = keywords || defaultKeywords;
  const fullImage = image || defaultImage;
  const fullUrl = url || (typeof window !== 'undefined' ? window.location.href : siteUrl);

  // Make sure image URL is absolute
  const absoluteImage = fullImage.startsWith('http') ? fullImage : `${siteUrl}${fullImage}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <meta name="keywords" content={fullKeywords} />
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="vi_VN" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={absoluteImage} />
      
      {/* Product Specific (for Product pages) */}
      {type === 'product' && price && (
        <>
          <meta property="product:price:amount" content={price.toString()} />
          <meta property="product:price:currency" content={currency} />
          <meta property="product:availability" content={availability} />
        </>
      )}
      
      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta name="language" content="Vietnamese" />
      <meta name="author" content={siteName} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Schema.org Structured Data for better SEO */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === 'product' ? 'Product' : type === 'article' ? 'Article' : 'WebSite',
          "name": fullTitle,
          "description": fullDescription,
          "url": fullUrl,
          "image": absoluteImage,
          ...(type === 'product' && price ? {
            "offers": {
              "@type": "Offer",
              "price": price,
              "priceCurrency": currency,
              "availability": `https://schema.org/${availability === 'instock' ? 'InStock' : 'OutOfStock'}`,
              "url": fullUrl,
              "seller": {
                "@type": "Organization",
                "name": siteName
              }
            }
          } : {}),
          ...(type === 'website' ? {
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${siteUrl}/products?search={search_term_string}`
              },
              "query-input": "required name=search_term_string"
            }
          } : {})
        })}
      </script>
      
      {/* Organization Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": siteName,
          "url": siteUrl,
          "logo": absoluteImage,
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": settings?.contact_phone || "",
            "contactType": "customer service",
            "areaServed": "VN",
            "availableLanguage": "Vietnamese"
          },
          "sameAs": [
            settings?.facebook_url,
            settings?.zalo_url
          ].filter(Boolean)
        })}
      </script>
    </Helmet>
  );
}
