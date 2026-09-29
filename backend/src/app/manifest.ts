import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'QuoaraAi',
    short_name: 'QuoaraAi',
    description: 'Owner-controlled personal AI workspace.',
    start_url: '/chat',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    orientation: 'portrait',
    icons: [
      { src: '/quoaraai-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/quoaraai-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
