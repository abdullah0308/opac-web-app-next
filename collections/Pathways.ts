import type { CollectionConfig } from 'payload'

export const Pathways: CollectionConfig = {
  slug: 'pathways',
  admin: {
    useAsTitle: 'stageName',
    defaultColumns: ['stageNumber', 'stageName', 'isDefault'],
  },
  fields: [
    {
      name: 'stageName',
      type: 'text',
      required: true,
    },
    {
      name: 'stageNumber',
      type: 'number',
      required: true,
      min: 1,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'requirements',
      type: 'array',
      fields: [
        {
          name: 'requirement',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Include in the default pathway sequence',
      },
    },
  ],
}
