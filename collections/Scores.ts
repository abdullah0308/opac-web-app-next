import type { CollectionConfig } from 'payload'

export const Scores: CollectionConfig = {
  slug: 'scores',
  admin: {
    useAsTitle: 'roundType',
    defaultColumns: ['archer', 'roundType', 'date', 'points', 'verified'],
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
      name: 'roundType',
      type: 'select',
      required: true,
      options: [
        { label: 'Training',    value: 'training'    },
        { label: 'Competition', value: 'competition' },
      ],
    },
    {
      name: 'scoringFormat',
      type: 'select',
      options: [
        { label: '300 Round (Beginner — 10 ends × 3 arrows)',  value: '300'  },
        { label: '720 Round (12 ends × 6 arrows)',             value: '720'  },
        { label: '1440 Round (24 ends × 6 arrows)',            value: '1440' },
      ],
    },
    {
      name: 'roundScores',
      type: 'json',
      admin: {
        description: 'Per-end arrow scores: number[][] e.g. [[10,9,8],[7,6,5],...]',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
    },
    {
      name: 'points',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'maxPoints',
      type: 'number',
      min: 0,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
