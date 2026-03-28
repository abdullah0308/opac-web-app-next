import type { CollectionConfig } from 'payload'

export const FaceData: CollectionConfig = {
  slug: 'face-data',
  admin: {
    defaultColumns: ['user', 'enrolledAt', 'blobUrl'],
    description: 'Stores face-api.js 128-float descriptors for facial recognition attendance',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'descriptor',
      type: 'json',
      required: true,
      admin: {
        description: 'Float32Array stored as number[] — 128 floats from face-api.js',
      },
    },
    {
      name: 'enrolledAt',
      type: 'date',
      required: true,
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'blobUrl',
      type: 'text',
      admin: {
        description: 'Vercel Blob URL of the JSON descriptor file',
      },
    },
  ],
}
