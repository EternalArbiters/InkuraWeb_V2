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

export default function ConfirmDeviantLoveDialog({ open, setOpen, onConfirm }: Props) {
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
              <DialogTitle>{t("Deviant Love Warning")}</DialogTitle>
              <DialogDescription>
                {t("This work, which contains deviant love, clearly violates morals and social standards. The deviant love in question is a form of sexual deviance that is not a good idea to imitate. You are strongly advised not to open this seal, as viewing this type of work could lead you further away from being a normal human being. It's best to refrain from doing so.")}
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
              <DialogTitle>{t("Deviant Love Warning")}</DialogTitle>
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
