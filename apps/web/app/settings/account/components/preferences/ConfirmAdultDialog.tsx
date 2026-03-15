"use client";

import { useState } from "react";
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
  const [step, setStep] = useState<1 | 2>(1);

  function handleOpenChange(v: boolean) {
    if (!v) setStep(1);
    setOpen(v);
  }

  function handleIDontCare() {
    setStep(2);
  }

  function handleFinalConfirm() {
    setStep(1);
    setOpen(false);
    onConfirm();
  }

  function handleBack() {
    setStep(1);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("NSFW Warning")}</DialogTitle>
              <DialogDescription>
                {t("You are not allowed to unseal adult works if you are still a minor. Exit the settings and simply find works that are age-appropriate. There is nothing good about becoming an adult before your time. Even if you are an adult, unseal is still not recommended. Remember your Lord and leave this place; do not continue. The works that will appear if this seal is unseal will only increase your sins. It is time for you to repent and return to the right path.")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button variant="outline" type="button" onClick={() => handleOpenChange(false)} className="whitespace-normal text-center h-auto py-2">
                {t("I get it, thanks for reminding me.")}
              </Button>
              <Button type="button" onClick={handleIDontCare} className="whitespace-normal text-center h-auto py-2">
                {t("I don't care! Just open the seal!")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("NSFW Warning")}</DialogTitle>
              <DialogDescription>
                {t("I warned you, okay! If you don't heed my warning, then don't blame me or drag me to the court of justice in the afterlife. You must take full responsibility for yourself and the sins you've committed. I don't want any involvement in this.")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button type="button" onClick={handleFinalConfirm} className="w-full whitespace-normal text-center h-auto py-2">
                {t("Okay, okay! Shut up! I know that! I won't involve you!")}
              </Button>
              <Button variant="outline" type="button" onClick={handleBack} className="w-full whitespace-normal text-center h-auto py-2">
                {t(".... After I thought about it, I decided not to.")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
