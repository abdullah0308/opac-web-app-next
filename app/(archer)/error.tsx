'use client'
import { PageError } from '@/components/ui/opac/PageError'
export default function ArcherError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError error={error} reset={reset} />
}
