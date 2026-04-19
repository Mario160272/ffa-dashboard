import { useEffect, useState } from 'react'
import type { GpsRow } from '../utils/types'
import { loadGpsData } from '../utils/excel'

type State = {
  data: GpsRow[]
  loading: boolean
  error: string | null
}

let cache: GpsRow[] | null = null
let loadingPromise: Promise<GpsRow[]> | null = null

export function useGpsData(): State {
  const [state, setState] = useState<State>({
    data: cache ?? [],
    loading: cache == null,
    error: null,
  })

  useEffect(() => {
    let mounted = true
    if (cache) {
      setState({ data: cache, loading: false, error: null })
      return
    }
    if (!loadingPromise) {
      loadingPromise = loadGpsData().then((d) => {
        cache = d
        return d
      })
    }
    loadingPromise
      .then((d) => {
        if (!mounted) return
        setState({ data: d, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setState({
          data: [],
          loading: false,
          error: err instanceof Error ? err.message : String(err),
        })
      })
    return () => {
      mounted = false
    }
  }, [])

  return state
}
