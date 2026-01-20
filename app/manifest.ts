import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BrainSprint - Competitive Exam Engine',
    short_name: 'BrainSprint',
    description: 'Gamified reasoning and maths engine for competitive exams.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0B',
    theme_color: '#0A0A0B',
    orientation: 'portrait',
    categories: ['education', 'games'],
    icons: [
      {
        src: '/assets/images/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/assets/images/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/assets/images/adaptive-icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/assets/images/adaptive-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/assets/images/splash-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ],
    shortcuts: [
      {
        name: 'Dashboard',
        url: '/dashboard',
        icons: [{ src: '/assets/images/icon.png', sizes: '192x192' }]
      },
      {
        name: 'Profile',
        url: '/profile',
        icons: [{ src: '/assets/images/icon.png', sizes: '192x192' }]
      }
    ]
  }
}
