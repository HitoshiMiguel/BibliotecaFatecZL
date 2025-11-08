'use client';
import React from 'react';

const icons = {
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M1 21h22L12 2 1 21z"/><path fill="currentColor" d="M11 15h2v2h-2zm0-8h2v6h-2z"/>
    </svg>
  ),
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M11 17h2v-6h-2v6zm0-8h2V7h-2v2z"/>
      <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
    </svg>
  ),
};

export default function Alert({ kind = 'info', message, id }) {
  if (!message) return null;
  return (
    <div className={`alert alert--${kind}`} role="alert" aria-live="polite" id={id}>
      {icons[kind] || icons.info}
      <div>{message}</div>
    </div>
  );
}
