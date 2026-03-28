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
