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
          <DialogTitle>Peringatan Deviant Love</DialogTitle>
          <DialogDescription>
            Dengan mencentang ini. Anda menyatakan bahwa anda tidak sedang berada di bawah tekanan apapun. Anda bertanggung
            jawab sendiri atas apa yang anda lihat. Ini berisi konten yang mungkin ekstrem.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>
            Tidak, saya tidak mau.
          </Button>
          <Button type="button" onClick={onConfirm}>
            Ya, saya mengerti.
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
