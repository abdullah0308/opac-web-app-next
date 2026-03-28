import type { CollectionConfig } from 'payload'

export const Payments: CollectionConfig = {
  slug: 'payments',
  admin: {
    defaultColumns: ['archer', 'amount', 'status', 'dueDate'],
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
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'dueDate',
      type: 'date',
      required: true,
    },
    {
      name: 'paidDate',
      type: 'date',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'due',
      options: [
        { label: 'Paid',    value: 'paid'    },
        { label: 'Due',     value: 'due'     },
        { label: 'Overdue', value: 'overdue' },
      ],
    },
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'markedPaidBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Admin who marked this payment as paid',
      },
    },
  ],
}
