import type { CollectionConfig } from 'payload'

export const Attendance: CollectionConfig = {
  slug: 'attendance',
  admin: {
    defaultColumns: ['archer', 'session', 'status', 'method', 'timestamp'],
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
      name: 'session',
      type: 'relationship',
      relationTo: 'sessions',
      required: true,
      index: true,
    },
    {
      name: 'method',
      type: 'select',
      required: true,
      options: [
        { label: 'QR Code', value: 'qr'     },
        { label: 'Face ID', value: 'face'   },
        { label: 'Manual',  value: 'manual' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'present',
      options: [
        { label: 'Present', value: 'present' },
        { label: 'Absent',  value: 'absent'  },
      ],
    },
    {
      name: 'timestamp',
      type: 'date',
      required: true,
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'overriddenBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Coach/Admin who manually overrode this record',
      },
    },
  ],
}
