import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ProviderConfig } from "@/types"

interface ProvidersState {
  providers: ProviderConfig[]
  activeProviderId: string | null

  addProvider: (provider: Omit<ProviderConfig, "id">) => void
  removeProvider: (id: string) => void
  updateProvider: (id: string, updates: Partial<ProviderConfig>) => void
  setActiveProvider: (id: string | null) => void
  toggleProvider: (id: string) => void

  getActiveProvider: () => ProviderConfig | null
  getEnabledProviders: () => ProviderConfig[]
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

// Pre-configured Comet provider with RealDebrid
// Config: maxResultsPerResolution=0, maxSize=0, cachedOnly=false, removeTrash=true, resultFormat=all, debridService=realdebrid
const DEFAULT_COMET_URL = "https://comet.elfhosted.com/eyJtYXhSZXN1bHRzUGVyUmVzb2x1dGlvbiI6MCwibWF4U2l6ZSI6MCwiY2FjaGVkT25seSI6ZmFsc2UsInJlbW92ZVRyYXNoIjp0cnVlLCJyZXN1bHRGb3JtYXQiOlsiYWxsIl0sImRlYnJpZFNlcnZpY2UiOiJyZWFsZGVicmlkIiwiZGVicmlkQXBpS2V5IjoiVjZPMzVXMlBUTlkyRU9JSUxYTjJaTkRPVlpFNU9JMlBIUVJVWFVRTzVDREg1QzdQVlVNQSIsImRlYnJpZFN0cmVhbVByb3h5UGFzc3dvcmQiOiIiLCJsYW5ndWFnZXMiOnsiZXhjbHVkZSI6W10sInByZWZlcnJlZCI6WyJlbiJdfSwicmVzb2x1dGlvbnMiOnsicjIxNjBwIjpmYWxzZX0sIm9wdGlvbnMiOnsicmVtb3ZlX3JhbmtzX3VuZGVyIjotMTAwMDAwMDAwMDAsImFsbG93X2VuZ2xpc2hfaW5fbGFuZ3VhZ2VzIjpmYWxzZSwicmVtb3ZlX3Vua25vd25fbGFuZ3VhZ2VzIjpmYWxzZX19/manifest.json"

const DEFAULT_PROVIDER: ProviderConfig = {
  id: "comet-default",
  name: "Comet (RealDebrid)",
  url: DEFAULT_COMET_URL,
  enabled: true,
}

export const useProvidersStore = create<ProvidersState>()(
  persist(
    (set, get) => ({
      providers: [DEFAULT_PROVIDER],
      activeProviderId: "comet-default",

      addProvider: (provider) => {
        const newProvider: ProviderConfig = {
          ...provider,
          id: generateId(),
        }
        set((state) => ({
          providers: [...state.providers, newProvider],
          activeProviderId: state.activeProviderId ?? newProvider.id,
        }))
      },

      removeProvider: (id) => {
        set((state) => {
          const newProviders = state.providers.filter((p) => p.id !== id)
          return {
            providers: newProviders,
            activeProviderId:
              state.activeProviderId === id
                ? newProviders[0]?.id ?? null
                : state.activeProviderId,
          }
        })
      },

      updateProvider: (id, updates) => {
        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }))
      },

      setActiveProvider: (id) => {
        set({ activeProviderId: id })
      },

      toggleProvider: (id) => {
        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === id ? { ...p, enabled: !p.enabled } : p
          ),
        }))
      },

      getActiveProvider: () => {
        const state = get()
        return (
          state.providers.find((p) => p.id === state.activeProviderId) ?? null
        )
      },

      getEnabledProviders: () => {
        return get().providers.filter((p) => p.enabled)
      },
    }),
    {
      name: "stream-king-providers",
      version: 3,
      migrate: (persistedState, version) => {
        const state = persistedState as ProvidersState

        // v3 migration: Update default provider URL
        if (version < 3 && state.providers) {
          state.providers = state.providers.map(p => {
            if (p.id === 'comet-default') {
              return { ...p, url: DEFAULT_COMET_URL }
            }
            return p
          })
        }

        // If no providers configured, add the default Comet provider
        if (!state.providers || state.providers.length === 0) {
          return {
            ...state,
            providers: [DEFAULT_PROVIDER],
            activeProviderId: "comet-default",
          }
        }
        return state
      },
    }
  )
)
