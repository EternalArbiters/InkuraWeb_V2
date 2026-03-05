import "client-only";

import { create } from "zustand";

type ModalType = "login" | "signup" | null;

interface AuthModalState {
  isOpen: boolean;
  type: ModalType;
  callbackUrl?: string | null;
  onOpen: (type: ModalType, callbackUrl?: string | null) => void;
  onClose: () => void;
}

export const useAuthModal = create<AuthModalState>((set) => ({
  isOpen: false,
  type: null,
  callbackUrl: null,

  onOpen: (type, callbackUrl) => set({ isOpen: true, type, callbackUrl: callbackUrl ?? null }),
  onClose: () => set({ isOpen: false, type: null, callbackUrl: null }),
}));
