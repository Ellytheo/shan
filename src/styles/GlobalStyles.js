// src/styles/GlobalStyles.js
import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    scroll-behavior: smooth;
  }

  body {
    font-family: ${props => props.theme.fonts.body}, ${props => props.theme.fonts.fallback};
    color: ${props => props.theme.colors.white};
    line-height: 1.6;
    background-color: ${props => props.theme.colors.white};
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${props => props.theme.fonts.heading}, ${props => props.theme.fonts.fallback};
    font-weight: 600;
    line-height: 1.3;
    margin-bottom: ${props => props.theme.spacing.medium};
  }

  a {
    text-decoration: none;
    color: inherit;
    transition: ${props => props.theme.transitions.fast};
  }

  ul, ol {
    list-style-position: inside;
  }

  img {
    max-width: 100%;
    height: auto;
    display: block;
  }

  button {
    cursor: pointer;
    font-family: inherit;
    transition: ${props => props.theme.transitions.fast};
  }

  section {
    padding: ${props => props.theme.spacing.xxlarge} 0;
  }

  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 ${props => props.theme.spacing.medium};
  }

  @media (max-width: ${props => props.theme.breakpoints.largeDesktop}) {
    html {
      font-size: 15px;
    }
  }

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    html {
      font-size: 14px;
    }
  }

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    html {
      font-size: 13px;
    }
  }
`;

export default GlobalStyles;
