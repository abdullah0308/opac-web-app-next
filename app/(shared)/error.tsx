'use client'
import { PageError } from '@/components/ui/opac/PageError'
export default function SharedError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError error={error} reset={reset} />
}
