import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['archerId', 'name', 'roles', 'active'],
  },
  fields: [
    {
      name: 'archerId',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Unique archer ID used to log in (e.g. AM0032)',
        position: 'sidebar',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'dateOfBirth',
      type: 'date',
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['archer'],
      options: [
        { label: 'Archer', value: 'archer' },
        { label: 'Coach',  value: 'coach'  },
        { label: 'Admin',  value: 'admin'  },
      ],
    },
    {
      name: 'bowType',
      type: 'select',
      options: [
        { label: 'Recurve',  value: 'recurve'  },
        { label: 'Compound', value: 'compound' },
      ],
    },
    {
      name: 'gender',
      type: 'select',
      options: [
        { label: 'Male',   value: 'male'   },
        { label: 'Female', value: 'female' },
      ],
    },
    {
      name: 'level',
      type: 'select',
      options: [
        { label: 'Beginner',     value: 'beginner'     },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Elite',        value: 'elite'        },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'clanId',
      type: 'relationship',
      relationTo: 'clans',
      hasMany: false,
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'avatarUrl',
      type: 'text',
      admin: {
        description: 'Vercel Blob URL for the user avatar',
      },
    },
    {
      name: 'faceEnrolled',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the user has enrolled a face descriptor',
      },
    },
    {
      name: 'setupComplete',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the user has completed the first-login onboarding (avatar + face ID choice)',
        position: 'sidebar',
      },
    },
  ],
}
