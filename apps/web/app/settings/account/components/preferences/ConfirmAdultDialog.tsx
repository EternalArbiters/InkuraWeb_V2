"use client";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
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
  const t = useUILanguageText("Shared Dialogs");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("18+ Warning")}</DialogTitle>
          <DialogDescription>
            {t("By checking this box, you acknowledge that you are responsible for the content you choose to read. The developers are not responsible for what you access. This is your final warning.")}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>
            {t("No, I do not want to continue.")}
          </Button>
          <Button type="button" onClick={onConfirm}>
            {t("Yes, I understand.")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
