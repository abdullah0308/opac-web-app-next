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
      name: 'pointsPerAttendance',
      type: 'number',
      defaultValue: 1,
      min: 0,
      admin: {
        description:
          'Points an archer earns each time they are marked present. Applied when attendance ' +
          'is recorded; changing it does not rewrite past sessions.',
      },
    },
    {
      name: 'clanLeaderboardEnabled',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Show the clan standings tab on the leaderboard.',
      },
    },
    {
      // Superseded by the points ledger — standings no longer derive from
      // scores at all. Kept so upgrading an existing database stays additive;
      // safe to delete once every deployment has migrated.
      name: 'rankingMethod',
      type: 'select',
      defaultValue: 'average',
      options: [
        { label: 'Average Score', value: 'average' },
        { label: 'Total Score',   value: 'total'   },
        { label: 'Best 3 Rounds', value: 'best3'   },
      ],
      admin: {
        description: 'Deprecated — the leaderboard now runs on points, not scores.',
        position: 'sidebar',
      },
    },
    {
      name: 'minimumSessionsToQualify',
      type: 'number',
      defaultValue: 6,
      min: 0,
      admin: {
        description:
          'Minimum sessions an archer must attend to appear in the individual standings. ' +
          'Set to 0 to list everyone.',
      },
    },
  ],
}
