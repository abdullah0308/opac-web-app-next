import type { CollectionConfig } from 'payload'

export const ArcherPathways: CollectionConfig = {
  slug: 'archer-pathways',
  admin: {
    defaultColumns: ['archer', 'pathwayStage', 'updatedBy'],
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
      name: 'pathwayStage',
      type: 'relationship',
      relationTo: 'pathways',
      required: true,
    },
    {
      name: 'coachNotes',
      type: 'textarea',
    },
    {
      name: 'updatedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Coach who last updated this pathway record',
      },
    },
    {
      name: 'completedRequirements',
      type: 'array',
      admin: {
        description: 'One boolean per requirement in the linked pathway stage',
      },
      fields: [
        {
          name: 'completed',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  ],
}
