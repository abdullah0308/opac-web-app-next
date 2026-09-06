import type { CollectionConfig } from 'payload'

/**
 * The leaderboard ledger.
 *
 * Every point an archer holds comes from a row in here — attendance awarded
 * automatically when they are marked present, and event points entered by an
 * admin (individually or by uploading a sheet). Nothing else feeds the
 * standings, so a season can always be explained row by row.
 *
 * Competition class is NOT stored here: it is read from the archer's current
 * level / bow type at the time the table is drawn, so promoting an archer
 * moves their whole season into the new class.
 */
export const PointsEntries: CollectionConfig = {
  slug: 'points-entries',
  admin: {
    useAsTitle: 'eventName',
    defaultColumns: ['archer', 'source', 'points', 'date', 'season'],
  },
  fields: [
    {
      name: 'archer',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'competition',
      options: [
        { label: 'Attendance',   value: 'attendance'   },
        { label: 'Pointing Day', value: 'pointing-day' },
        { label: 'Dueling',      value: 'dueling'      },
        { label: 'Competition',  value: 'competition'  },
        { label: 'Other',        value: 'other'        },
      ],
      admin: {
        description: 'Attendance rows are created automatically; the rest are awarded by an admin.',
      },
    },
    {
      name: 'points',
      type: 'number',
      required: true,
      admin: {
        description: 'May be negative to correct a mistake.',
      },
    },
    {
      name: 'eventName',
      type: 'text',
      admin: {
        description: 'What this was for, e.g. "Pointing Day — March 2026"',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'season',
      type: 'text',
      index: true,
      admin: {
        description: 'Season identifier, e.g. "2026". Matched against Global Settings.',
      },
    },
    {
      name: 'note',
      type: 'textarea',
    },
    {
      name: 'awardedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Admin who entered this row. Empty for automatic attendance points.',
      },
    },
    {
      name: 'batchId',
      type: 'text',
      index: true,
      admin: {
        description: 'Groups rows created by a single sheet upload, so the whole upload can be undone.',
      },
    },
  ],
}
