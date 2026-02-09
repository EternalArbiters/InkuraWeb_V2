import { create } from "zustand";

type ModalType = "login" | "signup" | null;

interface AuthModalState {
  isOpen: boolean;
  type: ModalType;
  onOpen: (type: ModalType) => void;
  onClose: () => void;
}

export const useAuthModal = create<AuthModalState>((set) => ({
  isOpen: false,
  type: null,

  onOpen: (type) => set({ isOpen: true, type }),
  onClose: () => set({ isOpen: false, type: null }),
}));
