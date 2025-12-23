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

export const useProvidersStore = create<ProvidersState>()(
  persist(
    (set, get) => ({
      providers: [],
      activeProviderId: null,

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
    }
  )
)
