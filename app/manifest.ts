import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BrainSprint - Competitive Exam Engine',
    short_name: 'BrainSprint',
    description: 'Gamified reasoning and maths engine for competitive exams.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0B',
    theme_color: '#EF4444',
    icons: [
      {
        src: '/assets/images/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
