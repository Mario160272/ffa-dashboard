import { useEffect, useState } from 'react'
import { loadConvalida, type MatchFixture } from '../data/convalida'

export function useConvalida(): MatchFixture[] {
  const [data, setData] = useState<MatchFixture[]>([])
  useEffect(() => {
    let mounted = true
    loadConvalida().then((d) => mounted && setData(d))
    return () => {
      mounted = false
    }
  }, [])
  return data
}
