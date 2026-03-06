export type Kind = "genres" | "tags" | "warning-tags" | "deviant-love-tags";

export type Item = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  isSystem: boolean;
  isLocked: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};
