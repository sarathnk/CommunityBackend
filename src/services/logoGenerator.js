import axios from 'axios';

// Professional SVG logo generation with sophisticated designs
export class LogoGenerator {
  static async generateLogo(communityName, type = 'Community') {
    try {
      const backgroundColor = this.getColorForType(type);
      const textColor = this.getContrastColor(backgroundColor);
      
      // Generate a simple, clean logo
      const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(communityName.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase())}&background=${backgroundColor.replace('#', '')}&color=${textColor.replace('#', '')}&size=300&bold=false&format=png&rounded=true&uppercase=true&font-size=0.7&length=2`;
      
      return {
        success: true,
        logoUrl: logoUrl,
        method: 'generated'
      };
    } catch (error) {
      console.error('Logo generation error:', error);
      return {
        success: false,
        error: 'Failed to generate logo'
      };
    }
  }

  static async generateAdvancedLogo(communityName, type, description) {
    try {
      const backgroundColor = this.getColorForType(type);
      const textColor = this.getContrastColor(backgroundColor);
      
      // Create a professional SVG logo
      const logoUrl = await this.createProfessionalSVGLogo(communityName, type, backgroundColor, textColor);
      
      return {
        success: true,
        logoUrl: logoUrl,
        method: 'professional_svg'
      };
    } catch (error) {
      console.error('Advanced logo generation error:', error);
      return {
        success: false,
        error: 'Failed to generate advanced logo'
      };
    }
  }

  static async generateCustomLogo(communityName, type, description) {
    try {
      const backgroundColor = this.getColorForType(type);
      const textColor = this.getContrastColor(backgroundColor);
      
      // Create a custom professional SVG logo
      const logoUrl = await this.createCustomProfessionalSVGLogo(communityName, type, backgroundColor, textColor);
      
      return {
        success: true,
        logoUrl: logoUrl,
        method: 'custom_svg'
      };
    } catch (error) {
      console.error('Custom logo generation error:', error);
      return {
        success: false,
        error: 'Failed to generate custom logo'
      };
    }
  }

  static async createProfessionalSVGLogo(communityName, type, backgroundColor, textColor) {
    try {
      const initials = communityName.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
      const icon = this.getIconForType(type);
      
      // Create a professional SVG logo with gradient and modern design
      const svg = this.createModernSVGLogo(communityName, initials, type, backgroundColor, textColor, icon);
      
      // Convert SVG to data URL for Flutter compatibility
      const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
      
      return svgDataUrl;
    } catch (error) {
      console.error('Professional SVG logo creation error:', error);
      // Fallback to simple logo
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${backgroundColor.replace('#', '')}&color=${textColor.replace('#', '')}&size=400&bold=true&format=png&rounded=true&uppercase=true&font-size=0.4&length=2`;
    }
  }

  static async createCustomProfessionalSVGLogo(communityName, type, backgroundColor, textColor) {
    try {
      const initials = communityName.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
      const icon = this.getIconForType(type);
      
      // Create a custom professional SVG logo with advanced design
      const svg = this.createAdvancedSVGLogo(communityName, initials, type, backgroundColor, textColor, icon);
      
      // Convert SVG to data URL for Flutter compatibility
      const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
      
      return svgDataUrl;
    } catch (error) {
      console.error('Custom professional SVG logo creation error:', error);
      // Fallback to simple logo
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${backgroundColor.replace('#', '')}&color=${textColor.replace('#', '')}&size=400&bold=true&format=png&rounded=true&uppercase=true&font-size=0.4&length=2`;
    }
  }

  static createModernSVGLogo(communityName, initials, type, backgroundColor, textColor, icon) {
    const width = 400;
    const height = 400;
    const radius = 180;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Create gradient colors
    const gradientColor1 = backgroundColor;
    const gradientColor2 = this.darkenColor(backgroundColor, 20);
    const accentColor = this.lightenColor(backgroundColor, 30);
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${gradientColor1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${gradientColor2};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${accentColor};stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:${textColor};stop-opacity:0.6" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>
  
  <!-- Background circle with gradient -->
  <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="url(#bgGradient)" filter="url(#shadow)"/>
  
  <!-- Inner circle for depth -->
  <circle cx="${centerX}" cy="${centerY}" r="${radius - 20}" fill="none" stroke="${accentColor}" stroke-width="2" opacity="0.3"/>
  
  <!-- Icon background -->
  <circle cx="${centerX}" cy="${centerY - 20}" r="60" fill="${accentColor}" opacity="0.2"/>
  
  <!-- Icon -->
  <text x="${centerX}" y="${centerY + 10}" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="${textColor}" opacity="0.8">${icon}</text>
  
  <!-- Initials -->
  <text x="${centerX}" y="${centerY + 80}" font-family="Arial, sans-serif" font-size="64" font-weight="bold" text-anchor="middle" fill="${textColor}">${initials}</text>
  
  <!-- Community name (smaller) -->
  <text x="${centerX}" y="${centerY + 120}" font-family="Arial, sans-serif" font-size="24" font-weight="normal" text-anchor="middle" fill="${textColor}" opacity="0.8">${communityName}</text>
  
  <!-- Type indicator -->
  <text x="${centerX}" y="${centerY + 150}" font-family="Arial, sans-serif" font-size="16" font-weight="normal" text-anchor="middle" fill="${textColor}" opacity="0.6">${type}</text>
</svg>`;
  }

  static createAdvancedSVGLogo(communityName, initials, type, backgroundColor, textColor, icon) {
    const width = 400;
    const height = 400;
    const radius = 180;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Create more sophisticated gradient colors
    const gradientColor1 = backgroundColor;
    const gradientColor2 = this.darkenColor(backgroundColor, 25);
    const gradientColor3 = this.lightenColor(backgroundColor, 15);
    const accentColor = this.getComplementaryColor(backgroundColor);
    const highlightColor = this.lightenColor(backgroundColor, 40);
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGradient" cx="30%" cy="30%" r="70%">
      <stop offset="0%" style="stop-color:${gradientColor3};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${gradientColor1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${gradientColor2};stop-opacity:1" />
    </radialGradient>
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${accentColor};stop-opacity:0.9" />
      <stop offset="100%" style="stop-color:${highlightColor};stop-opacity:0.7" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="rgba(0,0,0,0.4)"/>
    </filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background circle with sophisticated gradient -->
  <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="url(#bgGradient)" filter="url(#shadow)"/>
  
  <!-- Decorative rings -->
  <circle cx="${centerX}" cy="${centerY}" r="${radius - 15}" fill="none" stroke="${accentColor}" stroke-width="3" opacity="0.4"/>
  <circle cx="${centerX}" cy="${centerY}" r="${radius - 35}" fill="none" stroke="${highlightColor}" stroke-width="2" opacity="0.6"/>
  
  <!-- Icon background with gradient -->
  <circle cx="${centerX}" cy="${centerY - 25}" r="70" fill="url(#accentGradient)" opacity="0.3"/>
  <circle cx="${centerX}" cy="${centerY - 25}" r="50" fill="${accentColor}" opacity="0.1"/>
  
  <!-- Icon with glow effect -->
  <text x="${centerX}" y="${centerY + 5}" font-family="Arial, sans-serif" font-size="52" font-weight="bold" text-anchor="middle" fill="${textColor}" filter="url(#glow)">${icon}</text>
  
  <!-- Initials with sophisticated styling -->
  <text x="${centerX}" y="${centerY + 85}" font-family="Arial, sans-serif" font-size="72" font-weight="bold" text-anchor="middle" fill="${textColor}" filter="url(#shadow)">${initials}</text>
  
  <!-- Community name with elegant styling -->
  <text x="${centerX}" y="${centerY + 125}" font-family="Arial, sans-serif" font-size="26" font-weight="600" text-anchor="middle" fill="${textColor}" opacity="0.9">${communityName}</text>
  
  <!-- Type indicator with accent -->
  <rect x="${centerX - 60}" y="${centerY + 140}" width="120" height="25" rx="12" fill="${accentColor}" opacity="0.2"/>
  <text x="${centerX}" y="${centerY + 158}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="${accentColor}">${type.toUpperCase()}</text>
  
  <!-- Decorative elements -->
  <circle cx="${centerX - 120}" cy="${centerY - 120}" r="8" fill="${accentColor}" opacity="0.3"/>
  <circle cx="${centerX + 120}" cy="${centerY - 120}" r="8" fill="${accentColor}" opacity="0.3"/>
  <circle cx="${centerX - 120}" cy="${centerY + 120}" r="8" fill="${accentColor}" opacity="0.3"/>
  <circle cx="${centerX + 120}" cy="${centerY + 120}" r="8" fill="${accentColor}" opacity="0.3"/>
</svg>`;
  }

  static getColorForType(type) {
    const colorMap = {
      'Community': '#3B82F6',      // Blue
      'School': '#10B981',         // Green
      'Religious': '#8B5CF6',      // Purple
      'Sports': '#F59E0B',         // Orange
      'Non-Profit': '#EF4444',     // Red
      'Business': '#6B7280',       // Gray
      'Tech': '#06B6D4',           // Cyan
      'Health': '#EC4899',         // Pink
      'Education': '#84CC16',      // Lime
      'Arts': '#F97316',           // Orange
      'Environment': '#22C55E',    // Green
      'Social': '#A855F7',         // Purple
      'Professional': '#1F2937',   // Dark Gray
      'Youth': '#FBBF24',          // Yellow
      'Senior': '#6366F1',         // Indigo
      'Cultural': '#DC2626',       // Red
      'Volunteer': '#059669',      // Emerald
      'Charity': '#7C3AED',        // Violet
      'Club': '#EA580C',           // Orange
      'Association': '#0891B2'     // Sky
    };
    
    return colorMap[type] || '#3B82F6';
  }

  static getContrastColor(hexColor) {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white for dark backgrounds, black for light backgrounds
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  static darkenColor(hexColor, percent) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    const newR = Math.max(0, Math.floor(r * (1 - percent / 100)));
    const newG = Math.max(0, Math.floor(g * (1 - percent / 100)));
    const newB = Math.max(0, Math.floor(b * (1 - percent / 100)));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  static lightenColor(hexColor, percent) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    const newR = Math.min(255, Math.floor(r + (255 - r) * percent / 100));
    const newG = Math.min(255, Math.floor(g + (255 - g) * percent / 100));
    const newB = Math.min(255, Math.floor(b + (255 - b) * percent / 100));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  static getComplementaryColor(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Get complementary color by inverting RGB values
    const newR = 255 - r;
    const newG = 255 - g;
    const newB = 255 - b;
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  static getIconForType(type) {
    const iconMap = {
      'Community': '👥',
      'School': '🎓',
      'Religious': '⛪',
      'Sports': '⚽',
      'Non-Profit': '🤝',
      'Business': '💼',
      'Tech': '💻',
      'Health': '🏥',
      'Education': '📚',
      'Arts': '🎨',
      'Environment': '🌱',
      'Social': '👫',
      'Professional': '💼',
      'Youth': '👶',
      'Senior': '👴',
      'Cultural': '🎭',
      'Volunteer': '🙋',
      'Charity': '❤️',
      'Club': '🎯',
      'Association': '🏛️'
    };
    
    return iconMap[type] || '👥';
  }

  static async convertSVGToPNG(svg, type = 'Community') {
    try {
      // Use a service that converts SVG to PNG
      // For now, let's use a simple approach with ui-avatars.com but with better parameters
      const initials = this.extractInitialsFromSVG(svg);
      const backgroundColor = this.getColorForType(type);
      const textColor = this.getContrastColor(backgroundColor);
      
      // Create a professional-looking logo using ui-avatars.com with better parameters
      const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${backgroundColor.replace('#', '')}&color=${textColor.replace('#', '')}&size=400&bold=true&format=png&rounded=true&uppercase=true&font-size=0.3&length=2`;
      
      return logoUrl;
    } catch (error) {
      console.error('SVG to PNG conversion error:', error);
      // Fallback to a simple logo
      return `https://ui-avatars.com/api/?name=${encodeURIComponent('LOGO')}&background=3B82F6&color=FFFFFF&size=400&bold=true&format=png&rounded=true&uppercase=true&font-size=0.4&length=2`;
    }
  }

  static extractInitialsFromSVG(svg) {
    // Extract initials from SVG text content
    const match = svg.match(/<text[^>]*>([A-Z]{2})<\/text>/);
    return match ? match[1] : 'LO';
  }

  static extractColorsFromSVG(svg) {
    // Extract colors from SVG
    const backgroundMatch = svg.match(/stop-color:([^;]+)/);
    const textMatch = svg.match(/fill="([^"]+)"/);
    
    let background = '3B82F6';
    let text = 'FFFFFF';
    
    if (backgroundMatch) {
      const color = backgroundMatch[1];
      if (color && color !== 'url(bgGradient)') {
        background = color.replace('#', '');
      }
    }
    
    if (textMatch) {
      const color = textMatch[1];
      if (color && color !== 'url(bgGradient)') {
        text = color.replace('#', '');
      }
    }
    
    return {
      background: background,
      text: text
    };
  }
}