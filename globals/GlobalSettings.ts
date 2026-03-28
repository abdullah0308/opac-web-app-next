import type { GlobalConfig } from 'payload'

export const GlobalSettings: GlobalConfig = {
  slug: 'global-settings',
  admin: {
    group: 'Settings',
  },
  fields: [
    {
      name: 'appName',
      type: 'text',
      defaultValue: 'OPAC',
      admin: {
        description: 'Display name used across the app',
      },
    },
    {
      name: 'season',
      type: 'text',
      defaultValue: '2026',
      admin: {
        description: 'Current competition season identifier',
      },
    },
    {
      name: 'seasonEndDate',
      type: 'date',
    },
    {
      name: 'faceRecognitionEnabled',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Enable Face ID attendance scanning across the app',
      },
    },
    {
      name: 'rankingMethod',
      type: 'select',
      defaultValue: 'average',
      options: [
        { label: 'Average Score',   value: 'average'  },
        { label: 'Total Score',     value: 'total'    },
        { label: 'Best 3 Rounds',   value: 'best3'    },
      ],
    },
    {
      name: 'minimumSessionsToQualify',
      type: 'number',
      defaultValue: 6,
      min: 1,
      admin: {
        description: 'Minimum sessions an archer must attend to appear on the leaderboard',
      },
    },
  ],
}
