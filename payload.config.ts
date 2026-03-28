import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { Users }         from './collections/Users'
import { Scores }        from './collections/Scores'
import { Sessions }      from './collections/Sessions'
import { Attendance }    from './collections/Attendance'
import { Payments }      from './collections/Payments'
import { Pathways }      from './collections/Pathways'
import { ArcherPathways } from './collections/ArcherPathways'
import { Clans }         from './collections/Clans'
import { ForumPosts }    from './collections/ForumPosts'
import { Messages }      from './collections/Messages'
import { FaceData }      from './collections/FaceData'
import { GlobalSettings } from './globals/GlobalSettings'

const filename = fileURLToPath(import.meta.url)
const dirname  = path.dirname(filename)

export default buildConfig({
  // ── Admin panel ────────────────────────────────────────────────────────────
  admin: {
    user: 'users',
    meta: {
      titleSuffix: '— OPAC Admin',
    },
  },

  // ── Collections ────────────────────────────────────────────────────────────
  collections: [
    Users,
    Scores,
    Sessions,
    Attendance,
    Payments,
    Pathways,
    ArcherPathways,
    Clans,
    ForumPosts,
    Messages,
    FaceData,
  ],

  // ── Globals ────────────────────────────────────────────────────────────────
  globals: [GlobalSettings],

  // ── Rich text editor ───────────────────────────────────────────────────────
  editor: lexicalEditor(),

  // ── Secret ─────────────────────────────────────────────────────────────────
  secret: process.env.PAYLOAD_SECRET || 'placeholder-secret-replace-before-deploy',

  // ── TypeScript types output ────────────────────────────────────────────────
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // ── Database ───────────────────────────────────────────────────────────────
  // Uses SQLite locally (no DATABASE_URL needed) and Neon Postgres in production.
  db: process.env.DATABASE_URL
    ? postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL } })
    : sqliteAdapter({ client: { url: `file:${path.resolve(dirname, 'dev.db')}` } }),

  // ── CORS / CSRF for the Vercel deployment ─────────────────────────────────
  cors: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ],
  csrf: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ],
})
