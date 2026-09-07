'use client'

import { useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import type { Category, Standing, ClanStanding } from '@/lib/categories'
import { CATEGORIES, CATEGORY_LABEL } from '@/lib/categories'

type Tab = Category | 'clans'

interface Props {
  byCategory: Record<Category, Standing[]>
  clans: ClanStanding[]
  clanEnabled: boolean
  season: string
  minimumSessions: number
  meId: string
  myCategory: Category
  initialTab?: string
}

const SHORT: Record<Category, string> = {
  beginner: 'Beginner',
  intermediate: 'Inter.',
  elite: 'Elite',
  compound: 'Compound',
}

const MEDAL = ['#D4A017', '#A8ADA2', '#B07437']

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function Avatar({
  name,
  src,
  size = 38,
  ring,
}: {
  name: string
  src?: string
  size?: number
  ring?: string
}) {
  return (
    <span
      className="rounded-full bg-[rgba(212,234,217,0.85)] border border-[rgba(255,255,255,0.85)] flex items-center justify-center flex-shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        boxShadow: ring ? `0 0 0 2px ${ring}` : undefined,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span
          className="font-display text-opac-green leading-none"
          style={{ fontSize: Math.round(size * 0.34) }}
        >
          {initials(name)}
        </span>
      )}
    </span>
  )
}

export default function LeaderboardClient({
  byCategory,
  clans,
  clanEnabled,
  season,
  minimumSessions,
  meId,
  myCategory,
  initialTab,
}: Props) {
  const validInitial =
    initialTab === 'clans' && clanEnabled
      ? 'clans'
      : (CATEGORIES as readonly string[]).includes(initialTab ?? '')
        ? (initialTab as Category)
        : myCategory
  const [tab, setTab] = useState<Tab>(validInitial)

  const tabs: { id: Tab; label: string }[] = [
    ...CATEGORIES.map((c) => ({ id: c as Tab, label: SHORT[c] })),
    ...(clanEnabled ? [{ id: 'clans' as Tab, label: 'Clans' }] : []),
  ]

  const rows = tab === 'clans' ? [] : (byCategory[tab as Category] ?? [])
  const podium = rows.slice(0, 3)
  const rest = rows.slice(3)

  return (
    <div className="flex flex-col gap-4">
      {/* ── Class / clan tabs ─────────────────────────────────────────── */}
      <LayoutGroup id="lb-tabs">
        <div
          className="glass-well rounded-[15px] p-1 flex gap-0.5 overflow-x-auto"
          role="tablist"
          aria-label="Leaderboard category"
        >
          {tabs.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`relative flex-1 min-w-[74px] h-9 rounded-[12px] font-body text-[12.5px] font-semibold whitespace-nowrap transition-colors duration-200 ${
                  active ? 'text-white' : 'text-opac-ink-60 hover:text-opac-ink'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="lb-tab-thumb"
                    className="glass-green absolute inset-0 rounded-[12px]"
                    transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                  />
                )}
                <span className="relative z-[1]">{t.label}</span>
              </button>
            )
          })}
        </div>
      </LayoutGroup>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-3"
        >
          {/* ── CLAN STANDINGS ───────────────────────────────────────── */}
          {tab === 'clans' ? (
            clans.length === 0 ? (
              <div className="glass-card rounded-[18px] p-8 text-center">
                <p className="font-body text-[15px] text-opac-ink-60">
                  No clans set up yet.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {clans.map((c) => (
                  <div
                    key={c.id}
                    className="glass-card rounded-[16px] p-4 flex items-center gap-3.5 relative overflow-hidden"
                    style={{ borderLeft: `3px solid ${c.colour}` }}
                  >
                    <span
                      className="font-mono text-[15px] font-semibold w-6 flex-shrink-0 text-center"
                      style={{ color: c.rank <= 3 ? MEDAL[c.rank - 1] : '#ADADAA' }}
                    >
                      {c.rank}
                    </span>
                    {c.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.logoUrl}
                        alt=""
                        className="w-12 h-12 rounded-[13px] object-cover flex-shrink-0 border border-[rgba(255,255,255,0.8)]"
                      />
                    ) : (
                      <span
                        className="w-12 h-12 rounded-[13px] flex items-center justify-center flex-shrink-0 border border-[rgba(255,255,255,0.8)]"
                        style={{ background: c.colour + '26' }}
                        aria-hidden="true"
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M12 3l7 3v5.5c0 4.2-2.9 7.9-7 9.1-4.1-1.2-7-4.9-7-9.1V6l7-3z"
                            stroke={c.colour}
                            strokeWidth="1.7"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-[17px] text-opac-ink leading-tight truncate">
                        {c.name}
                      </p>
                      <p className="font-body text-[12px] text-opac-ink-60 truncate">
                        {c.motto
                          ? c.motto
                          : `${c.members} member${c.members === 1 ? '' : 's'}`}
                      </p>
                      {(c.leader || c.coLeader) && (
                        <div className="flex items-center gap-1.5 mt-1.5 min-w-0">
                          {c.leader && (
                            <span className="inline-flex items-center gap-1.5 min-w-0">
                              <Avatar
                                name={c.leader.name}
                                src={c.leader.avatarUrl}
                                size={18}
                                ring={c.colour}
                              />
                              <span className="font-body text-[11.5px] text-opac-ink truncate">
                                {c.leader.name.split(' ')[0]}
                                <span className="text-opac-gold font-semibold ml-1">
                                  Leader
                                </span>
                              </span>
                            </span>
                          )}
                          {c.leader && c.coLeader && (
                            <span
                              className="w-px h-3 bg-[rgba(26,26,24,0.14)] flex-shrink-0"
                              aria-hidden="true"
                            />
                          )}
                          {c.coLeader && (
                            <span className="inline-flex items-center gap-1.5 min-w-0">
                              <Avatar
                                name={c.coLeader.name}
                                src={c.coLeader.avatarUrl}
                                size={18}
                              />
                              <span className="font-body text-[11.5px] text-opac-ink-60 truncate">
                                {c.coLeader.name.split(' ')[0]}
                                <span className="font-semibold ml-1">Co</span>
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-mono text-[20px] font-semibold text-opac-green leading-none">
                        {c.points}
                      </p>
                      <p className="font-body text-[10px] text-opac-ink-30 mt-1">pts</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : rows.length === 0 ? (
            <div className="glass-card rounded-[18px] p-8 text-center">
              <p className="font-body text-[15px] text-opac-ink-60">
                No archers in the {CATEGORY_LABEL[tab as Category]} class yet.
              </p>
            </div>
          ) : (
            <>
              {/* ── Podium ───────────────────────────────────────────── */}
              {podium.length >= 2 && (
                <div className="glass-card rounded-[20px] p-5 pb-4">
                  <div className="flex items-end justify-center gap-2.5">
                    {[1, 0, 2].map((slot) => {
                      const s = podium[slot]
                      if (!s) return <div key={slot} className="flex-1" />
                      const isFirst = slot === 0
                      const h = isFirst ? 78 : slot === 1 ? 58 : 44
                      const isMe = s.archerId === meId
                      return (
                        <div
                          key={s.archerId}
                          className="flex-1 flex flex-col items-center min-w-0"
                        >
                          <Avatar
                            name={s.name}
                            src={s.avatarUrl}
                            size={isFirst ? 54 : 42}
                            ring={MEDAL[slot]}
                          />
                          <p
                            className={`font-body text-[12px] mt-1.5 text-center leading-tight truncate w-full ${
                              isMe
                                ? 'font-bold text-opac-green'
                                : 'font-semibold text-opac-ink'
                            }`}
                          >
                            {s.name.split(' ')[0]}
                          </p>
                          <p className="font-mono text-[13px] font-semibold text-opac-ink-60">
                            {s.points}
                          </p>
                          <div
                            className="w-full rounded-t-[10px] mt-1.5 flex items-start justify-center pt-1.5"
                            style={{
                              height: h,
                              background: `linear-gradient(180deg, ${MEDAL[slot]}38, ${MEDAL[slot]}12)`,
                              borderTop: `2px solid ${MEDAL[slot]}`,
                            }}
                          >
                            <span
                              className="font-display text-[19px]"
                              style={{ color: MEDAL[slot] }}
                            >
                              {slot + 1}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── Ranked rows ──────────────────────────────────────── */}
              <div className="flex flex-col gap-2">
                {(podium.length >= 2 ? rest : rows).map((s) => {
                  const isMe = s.archerId === meId
                  return (
                    <div
                      key={s.archerId}
                      className={`glass-card rounded-[14px] px-3.5 py-3 flex items-center gap-3 ${
                        isMe ? 'border-l-[3px] border-l-opac-green' : ''
                      }`}
                    >
                      <span
                        className={`font-mono text-[14px] font-semibold w-6 text-center flex-shrink-0 ${
                          isMe ? 'text-opac-green' : 'text-opac-ink-30'
                        }`}
                      >
                        {s.rank}
                      </span>
                      <Avatar name={s.name} src={s.avatarUrl} size={36} />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-body text-[14px] truncate ${
                            isMe ? 'font-bold text-opac-green' : 'font-semibold text-opac-ink'
                          }`}
                        >
                          {s.name}
                          {isMe && (
                            <span className="font-body text-[11px] font-semibold text-opac-ink-30 ml-1.5">
                              you
                            </span>
                          )}
                        </p>
                        <p className="font-body text-[11.5px] text-opac-ink-60 truncate">
                          {s.clanName ?? 'No clan'} · {s.sessions} session
                          {s.sessions === 1 ? '' : 's'}
                          {!s.qualified && minimumSessions > 0 && (
                            <span className="text-opac-gold"> · unqualified</span>
                          )}
                        </p>
                      </div>
                      <span className="font-mono text-[17px] font-semibold text-opac-ink flex-shrink-0">
                        {s.points}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <p className="font-body text-[12px] text-opac-ink-30 text-center px-4 leading-relaxed">
        Season {season}. Points come from attendance and from events an admin records —
        pointing day, dueling and competitions. Training scores do not affect standings.
      </p>
    </div>
  )
}
