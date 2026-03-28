import type { CollectionConfig } from 'payload'

export const ForumPosts: CollectionConfig = {
  slug: 'forum-posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'pinned', 'locked', 'reported', 'createdAt'],
  },
  fields: [
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'pinned',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'locked',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'reported',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'comments',
      type: 'array',
      fields: [
        {
          name: 'author',
          type: 'relationship',
          relationTo: 'users',
          required: true,
        },
        {
          name: 'body',
          type: 'textarea',
          required: true,
        },
        {
          name: 'createdAt',
          type: 'date',
          admin: {
            date: { pickerAppearance: 'dayAndTime' },
          },
        },
      ],
    },
    {
      name: 'likes',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      admin: {
        description: 'Users who liked this post',
      },
    },
  ],
}
