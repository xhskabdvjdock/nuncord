"use client";

import { create } from "zustand";

export type ReplyTarget = {
  id: string;
  content: string;
  authorName: string;
};

interface ReplyStore {
  target: ReplyTarget | null;
  setTarget: (target: ReplyTarget | null) => void;
  clearTarget: () => void;
}

export const useReplyStore = create<ReplyStore>((set) => ({
  target: null,
  setTarget: (target) => set({ target }),
  clearTarget: () => set({ target: null }),
}));

