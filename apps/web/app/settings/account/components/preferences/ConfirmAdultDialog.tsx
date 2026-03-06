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

export default function ConfirmAdultDialog({ open, setOpen, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Peringatan 18+</DialogTitle>
          <DialogDescription>
            Dengan mencentang kotak ini. Anda sudah setuju bahwa dosa anda ditanggung sendiri. Developer tidak bertanggung jawab
            ataupun berbagi dosa dengan apapun yang anda baca. Ini adalah peringatan terakhir. Bacaan anda selanjutnya penuh
            dosa~ kami tidak akan ikut bertanggung jawab.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>
            Tidak, saya tidak mau.
          </Button>
          <Button type="button" onClick={onConfirm}>
            Ya, saya tau itu.
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
