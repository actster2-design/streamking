import { create } from "zustand"

interface DetailsModalState {
  open: boolean
  mediaId: number | null
  mediaType: "movie" | "tv" | null
}

interface UIState {
  detailsModal: DetailsModalState

  openDetails: (id: number, type: "movie" | "tv") => void
  closeDetails: () => void
}

export const useUIStore = create<UIState>((set) => ({
  detailsModal: {
    open: false,
    mediaId: null,
    mediaType: null,
  },

  openDetails: (id, type) =>
    set({
      detailsModal: {
        open: true,
        mediaId: id,
        mediaType: type,
      },
    }),

  closeDetails: () =>
    set({
      detailsModal: {
        open: false,
        mediaId: null,
        mediaType: null,
      },
    }),
}))
