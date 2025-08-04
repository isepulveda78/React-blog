// SEO utility functions for dynamic meta tag management

export const updateMetaTags = (seoData = {}) => {
  const {
    title = 'BlogCraft - Modern Blog Platform',
    description = 'A modern blog platform featuring advanced content management, user authentication, and SEO optimization tools.',
    keywords = ['blog', 'platform', 'cms'],
    ogTitle = title,
    ogDescription = description,
    ogImage = 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630',
    canonicalUrl = window.location.href,
    seoTitle = title,
    focusKeyword = ''
  } = seoData;

  // Update document title
  document.title = seoTitle || title;

  // Update meta description
  updateMetaTag('name', 'description', description);
  
  // Update meta keywords
  const keywordString = Array.isArray(keywords) ? keywords.join(', ') : keywords;
  updateMetaTag('name', 'keywords', keywordString);

  // Update Open Graph tags
  updateMetaTag('property', 'og:title', ogTitle);
  updateMetaTag('property', 'og:description', ogDescription);
  updateMetaTag('property', 'og:image', ogImage);
  updateMetaTag('property', 'og:url', canonicalUrl);

  // Update Twitter tags
  updateMetaTag('name', 'twitter:title', ogTitle);
  updateMetaTag('name', 'twitter:description', ogDescription);
  updateMetaTag('name', 'twitter:image', ogImage);

  // Update canonical URL
  updateLinkTag('canonical', canonicalUrl);

  // Update structured data for blog posts
  if (seoData.type === 'article') {
    updateStructuredData({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": description,
      "image": ogImage,
      "author": {
        "@type": "Person",
        "name": seoData.authorName || "BlogCraft Team"
      },
      "publisher": {
        "@type": "Organization",
        "name": "BlogCraft",
        "logo": {
          "@type": "ImageObject",
          "url": "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"
        }
      },
      "datePublished": seoData.publishedAt,
      "dateModified": seoData.updatedAt || seoData.publishedAt,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonicalUrl
      }
    });
  }
};

const updateMetaTag = (attribute, value, content) => {
  let tag = document.querySelector(`meta[${attribute}="${value}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, value);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

const updateLinkTag = (rel, href) => {
  let tag = document.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
};

const updateStructuredData = (data) => {
  let script = document.getElementById('structured-data');
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'structured-data';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
};

// SEO validation helpers
export const validateSEO = (postData) => {
  const issues = [];
  
  // Title validation
  if (!postData.title || postData.title.length < 10) {
    issues.push({ field: 'title', message: 'Title should be at least 10 characters long' });
  }
  if (postData.title && postData.title.length > 60) {
    issues.push({ field: 'title', message: 'Title should be under 60 characters for better SEO' });
  }

  // Meta description validation
  if (!postData.metaDescription) {
    issues.push({ field: 'metaDescription', message: 'Meta description is required for SEO' });
  }
  if (postData.metaDescription && postData.metaDescription.length < 120) {
    issues.push({ field: 'metaDescription', message: 'Meta description should be at least 120 characters' });
  }
  if (postData.metaDescription && postData.metaDescription.length > 160) {
    issues.push({ field: 'metaDescription', message: 'Meta description should be under 160 characters' });
  }

  // Focus keyword validation
  if (postData.focusKeyword && postData.title && !postData.title.toLowerCase().includes(postData.focusKeyword.toLowerCase())) {
    issues.push({ field: 'focusKeyword', message: 'Focus keyword should appear in the title' });
  }

  // OG Image validation
  if (!postData.ogImage && !postData.featuredImage) {
    issues.push({ field: 'ogImage', message: 'Open Graph image is recommended for social sharing' });
  }

  return {
    isValid: issues.length === 0,
    issues,
    score: Math.max(0, 100 - (issues.length * 15)) // Basic scoring system
  };
};

// Generate SEO-friendly slug
export const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim('-'); // Remove leading/trailing hyphens
};

// Extract keywords from content
export const extractKeywords = (content, limit = 10) => {
  const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
  const words = text.toLowerCase().split(/\s+/);
  const wordCount = {};
  
  // Common stop words to exclude
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'this', 'that', 'these', 'those'];
  
  words.forEach(word => {
    if (word.length > 3 && !stopWords.includes(word)) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });

  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([word]) => word);
};