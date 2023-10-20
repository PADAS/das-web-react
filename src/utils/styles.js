export const injectStylesToElement = (element, styles) => Object.entries(styles)
  .forEach(([key, value]) => {
    element.style[key] = value;
  });

export const basePrintingStyles = `
    @page {
    size: auto !important;
    }
    
    @media print {
        html, body {
          /* Tell browsers to print background colors */
          -webkit-print-color-adjust: exact; /* Chrome/Safari/Edge/Opera */
          color-adjust: exact; /* Firefox */
        
          height: initial !important;
          overflow: initial !important;
          position: initial !important;
        }
    }
`;
