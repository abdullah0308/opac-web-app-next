import type { CollectionConfig } from 'payload'

export const Clans: CollectionConfig = {
  slug: 'clans',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'colour', 'points', 'season'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'colour',
      type: 'text',
      required: true,
      admin: {
        description: 'Hex colour code, e.g. #2E7D4F',
      },
    },
    {
      name: 'points',
      type: 'number',
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'season',
      type: 'text',
      admin: {
        description: 'Season identifier, e.g. "2026"',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
    },
  ],
}
