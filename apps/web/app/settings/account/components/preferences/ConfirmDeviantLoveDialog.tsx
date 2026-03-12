"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  onConfirm: () => void;
};

export default function ConfirmDeviantLoveDialog({ open, setOpen, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deviant Love Warning</DialogTitle>
          <DialogDescription>
            By checking this box, you confirm that you are not under any pressure and that you accept responsibility for what you choose to view. This content may be extreme.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>
            No, I do not want to continue.
          </Button>
          <Button type="button" onClick={onConfirm}>
            Yes, I understand.
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
