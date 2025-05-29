import React from 'react';

function MinimalLogo({ className = '', style = {} }) {
  const logoStyle = {
    maxWidth: '120px',
    maxHeight: '40px',
    objectFit: 'contain',
    display: 'block',
    margin: '0 0 8px 0', // Sol hizalama için margin-left: 0
    ...style
  };

  return (
    <img 
      src="/logo.png" 
      alt="Firma Logosu" 
      className={`minimal-logo ${className}`}
      style={logoStyle}
    />
  );
}

export default MinimalLogo; 