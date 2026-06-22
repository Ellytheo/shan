// src/styles/theme.js



const theme = {
  colors: {
    primary: '#0F8F46',       // Luxury Emerald Green (Logo)
    accent: '#F58220',        // Luxury Gold/Orange (Logo)
    textDark: '#2C3E50',      // Luxury Dark text
    textLight: '#f5f7fa',     // Ivory text
    bgWhite: '#FFFFFF',       // Pure white section bg
    bgWarmWhite: '#FAF5EF',   // Sandy off-white section bg
    bgCoolWhite: '#F8F9FA',   // Cool off-white section bg
    bgSoftGray: '#F3F4F6',    // Soft gray section bg
    black: '#2C3E50',
    white: '#FFFFFF',
  },

  fonts: {
    heading: "'Playfair Display', serif",
    body: "'Segoe UI', sans-serif",
    fallback: "sans-serif",
  },

  spacing: {
    small: '8px',
    medium: '16px',
    large: '24px',
    xlarge: '32px',
    xxlarge: '64px',
  },

  breakpoints: {
    mobile: '576px',
    tablet: '768px',
    desktop: '992px',
    largeDesktop: '1200px',
  },

  transitions: {
    fast: '0.2s ease',
    medium: '0.3s ease',
    slow: '0.5s ease',
  }
};

export default theme;
