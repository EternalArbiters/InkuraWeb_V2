"use client";

import * as React from "react";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import { Bold, Italic, Underline, Strikethrough, Heading2, Heading3, List, ListOrdered, Quote, Undo2, Redo2, Eraser, ImagePlus, Minus, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { presignAndUpload } from "@/lib/r2UploadClient";
import { prepareUploadFile } from "@/lib/uploadOptimization";
import { normalizeNovelContentForStorage, novelContentHasMeaningfulContent } from "@/lib/novelContent";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  workId: string;
  chapterId?: string;
};

type ToolbarButtonProps = {
  title: string;
  onPress: () => void;
  children?: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
};

const ALIGNABLE_BLOCK_SELECTOR = "p, div, blockquote, li, h1, h2, h3, h4, figure, figcaption";

type Alignment = "left" | "center" | "right";

function ToolbarButton({ title, onPress, children, disabled, active = false }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onPointerDown={(event) => {
        event.preventDefault();
        if (!disabled) onPress();
      }}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-50 ${active ? "border-gray-400 bg-gray-200/95 text-gray-950 dark:border-gray-500 dark:bg-gray-100/15 dark:text-white" : "border-gray-200 bg-white/80 text-gray-900 hover:brightness-110 dark:border-gray-800 dark:bg-gray-900/70 dark:text-gray-100"}`}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function ToolbarRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/92 px-3 py-2 shadow-[0_-16px_40px_-24px_rgba(15,23,42,0.7)] backdrop-blur dark:border-gray-800 dark:bg-gray-950/92 md:static md:border-none md:bg-transparent md:px-0 md:py-0 md:shadow-none">
      <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  );
}

function getClosestEditableBlock(editor: HTMLDivElement, node: Node | null) {
  const baseElement = node instanceof Element ? node : node?.parentElement ?? null;
  return baseElement?.closest(ALIGNABLE_BLOCK_SELECTOR) as HTMLElement | null;
}

function getSelectedEditableBlocks(editor: HTMLDivElement, range: Range) {
  const blocks = Array.from(editor.querySelectorAll<HTMLElement>(ALIGNABLE_BLOCK_SELECTOR)).filter((element) => {
    try {
      return range.intersectsNode(element);
    } catch {
      return false;
    }
  });

  if (blocks.length) return blocks;

  const fallbackBlock = getClosestEditableBlock(editor, range.commonAncestorContainer);
  return fallbackBlock ? [fallbackBlock] : [];
}

export default function NovelRichTextEditor({ value, onChange, placeholder = "Write the chapter content...", workId, chapterId }: Props) {
  const t = useUILanguageText("Page Studio");
  const editorRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const selectionRef = React.useRef<Range | null>(null);

  const [isEmpty, setIsEmpty] = React.useState(!novelContentHasMeaningfulContent(value));
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [helperText, setHelperText] = React.useState<string | null>(null);
  const [activeFormats, setActiveFormats] = React.useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    h2: false,
    h3: false,
    bullet: false,
    ordered: false,
    quote: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
  });

  const syncRawFromDom = React.useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const next = editor.innerHTML;
    setIsEmpty(!novelContentHasMeaningfulContent(next));
    onChange(next);
  }, [onChange]);

  const normalizeDom = React.useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const next = normalizeNovelContentForStorage(editor.innerHTML);
    if (editor.innerHTML !== next) editor.innerHTML = next;
    setIsEmpty(!novelContentHasMeaningfulContent(next));
    onChange(next);
  }, [onChange]);

  React.useEffect(() => {
    const normalized = normalizeNovelContentForStorage(value);
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== normalized) {
      editor.innerHTML = normalized;
    }
    setIsEmpty(!novelContentHasMeaningfulContent(normalized));
  }, [value]);

  React.useEffect(() => {
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {
      // ignore
    }
  }, []);

  const clearActiveFormats = React.useCallback(() => {
    setActiveFormats({
      bold: false,
      italic: false,
      underline: false,
      strikeThrough: false,
      h2: false,
      h3: false,
      bullet: false,
      ordered: false,
      quote: false,
      alignLeft: false,
      alignCenter: false,
      alignRight: false,
    });
  }, []);

  const updateToolbarState = React.useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) {
      clearActiveFormats();
      return;
    }

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      clearActiveFormats();
      return;
    }

    const formatBlockValue = String(document.queryCommandValue("formatBlock") || "")
      .replace(/[<>]/g, "")
      .trim()
      .toLowerCase();

    const selectedBlock = getClosestEditableBlock(editor, selection.anchorNode) ?? getClosestEditableBlock(editor, range.commonAncestorContainer);
    const explicitTextAlignRaw = selectedBlock?.style.textAlign || selectedBlock?.getAttribute("align") || "";
    const explicitTextAlign = String(explicitTextAlignRaw || "").trim().toLowerCase();
    const normalizedTextAlign = explicitTextAlign === "start" ? "left" : explicitTextAlign === "end" ? "right" : explicitTextAlign;

    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      h2: formatBlockValue === "h2",
      h3: formatBlockValue === "h3",
      bullet: document.queryCommandState("insertUnorderedList"),
      ordered: document.queryCommandState("insertOrderedList"),
      quote: formatBlockValue === "blockquote",
      alignLeft: normalizedTextAlign === "left",
      alignCenter: normalizedTextAlign === "center",
      alignRight: normalizedTextAlign === "right",
    });
  }, [clearActiveFormats]);

  React.useEffect(() => {
    const handleSelectionChange = () => {
      const editor = editorRef.current;
      const selection = window.getSelection();
      if (!editor || !selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) {
        selectionRef.current = range.cloneRange();
        updateToolbarState();
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [updateToolbarState]);

  const saveSelection = React.useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange();
      updateToolbarState();
      return;
    }
    clearActiveFormats();
  }, [clearActiveFormats, updateToolbarState]);

  const restoreSelection = React.useCallback(() => {
    const selection = window.getSelection();
    const range = selectionRef.current;
    const editor = editorRef.current;
    if (!selection || !range || !editor) return;
    try {
      editor.focus({ preventScroll: true });
    } catch {
      editor.focus();
    }
    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  const runCommand = React.useCallback(
    (command: string, commandValue?: string) => {
      const editor = editorRef.current;
      if (!editor) return;
      restoreSelection();
      try {
        document.execCommand("styleWithCSS", false, "true");
      } catch {
        // ignore
      }
      document.execCommand(command, false, commandValue);
      saveSelection();
      updateToolbarState();
      syncRawFromDom();
    },
    [restoreSelection, saveSelection, syncRawFromDom, updateToolbarState]
  );


  const toggleBlockFormat = React.useCallback(
    (tag: "h2" | "h3" | "blockquote") => {
      const isActive =
        (tag === "h2" && activeFormats.h2) ||
        (tag === "h3" && activeFormats.h3) ||
        (tag === "blockquote" && activeFormats.quote);
      runCommand("formatBlock", isActive ? "<p>" : `<${tag}>`);
    },
    [activeFormats.h2, activeFormats.h3, activeFormats.quote, runCommand]
  );

  const applyTextAlignment = React.useCallback(
    (alignment: Alignment) => {
      const editor = editorRef.current;
      if (!editor) return;
      restoreSelection();
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      const blocks = getSelectedEditableBlocks(editor, range);
      if (!blocks.length) return;

      const allAlreadyAligned = blocks.every((block) => {
        const rawValue = block.style.textAlign || block.getAttribute("align") || "";
        const currentAlignment = String(rawValue || "").trim().toLowerCase();
        const normalized = currentAlignment === "start" ? "left" : currentAlignment === "end" ? "right" : currentAlignment;
        return normalized === alignment;
      });

      blocks.forEach((block) => {
        if (allAlreadyAligned) {
          block.style.textAlign = "";
          block.removeAttribute("align");
          if (!block.getAttribute("style")?.trim()) {
            block.removeAttribute("style");
          }
          return;
        }
        block.style.textAlign = alignment;
        block.removeAttribute("align");
      });

      saveSelection();
      updateToolbarState();
      syncRawFromDom();
    },
    [restoreSelection, saveSelection, syncRawFromDom, updateToolbarState]
  );

  const insertHtmlAtCaret = React.useCallback(
    (html: string) => {
      const editor = editorRef.current;
      if (!editor) return;
      restoreSelection();
      const inserted = document.execCommand("insertHTML", false, html);
      if (!inserted) {
        editor.innerHTML = `${editor.innerHTML}${html}`;
      }
      saveSelection();
      updateToolbarState();
      syncRawFromDom();
    },
    [restoreSelection, saveSelection, syncRawFromDom, updateToolbarState]
  );

  const uploadAndInsertImages = React.useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      setUploadingImage(true);
      setHelperText(`Mengupload ${files.length} gambar...`);
      try {
        for (const [index, file] of files.entries()) {
          setHelperText(`Mengupload gambar ${index + 1}/${files.length}...`);
          const prepared = await prepareUploadFile({ scope: "pages", file });
          const upload = await presignAndUpload({
            scope: "pages",
            file,
            preparedFile: prepared,
            workId,
            chapterId,
            optimizationVersion: "pr14-novel-editor-inline-image-v1",
          });
          insertHtmlAtCaret(`<figure><img src="${upload.url}" alt="${file.name.replace(/\"/g, "")}"></figure><p><br></p>`);
        }
        setHelperText(t("Image inserted into the chapter content."));
      } catch (error) {
        setHelperText(error instanceof Error ? error.message : t("Failed to upload image."));
      } finally {
        setUploadingImage(false);
        window.setTimeout(() => setHelperText(null), 2200);
      }
    },
    [chapterId, insertHtmlAtCaret, t, workId]
  );

  const handleImagePick = React.useCallback(async (fileList: FileList | null) => {
    const files = Array.from(fileList || []).filter((file) => String(file.type || "").startsWith("image/"));
    await uploadAndInsertImages(files);
    if (inputRef.current) inputRef.current.value = "";
  }, [uploadAndInsertImages]);

  return (
    <div className="grid gap-3 pb-20 md:pb-0">
      <style>{`
        .novel-editor-surface p, .novel-editor-surface div { margin: 0 0 1rem; }
        .novel-editor-surface h1, .novel-editor-surface h2, .novel-editor-surface h3, .novel-editor-surface h4 { margin: 1.4rem 0 .8rem; font-weight: 700; line-height: 1.25; }
        .novel-editor-surface h1 { font-size: 1.75rem; }
        .novel-editor-surface h2 { font-size: 1.45rem; }
        .novel-editor-surface h3 { font-size: 1.2rem; }
        .novel-editor-surface ul, .novel-editor-surface ol { margin: 0 0 1rem 1.4rem; }
        .novel-editor-surface li { margin: .25rem 0; }
        .novel-editor-surface blockquote { margin: 1.2rem 0; border-left: 3px solid rgba(168,85,247,.75); padding-left: 1rem; opacity: .95; }
        .novel-editor-surface img { display: block; max-width: min(100%, 760px); height: auto; margin: 1.2rem auto; border-radius: 1rem; }
        .novel-editor-surface figure { margin: 1.2rem 0; }
        .novel-editor-surface table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        .novel-editor-surface td, .novel-editor-surface th { border: 1px solid rgba(148,163,184,.25); padding: .55rem .7rem; }
        .novel-editor-surface pre, .novel-editor-surface code { white-space: pre-wrap; }
      `}</style>
      <ToolbarRow>
        <ToolbarButton title="Bold" active={activeFormats.bold} onPress={() => runCommand("bold")}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={activeFormats.italic} onPress={() => runCommand("italic")}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Underline" active={activeFormats.underline} onPress={() => runCommand("underline")}>
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={activeFormats.strikeThrough} onPress={() => runCommand("strikeThrough")}>
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Heading 2" active={activeFormats.h2} onPress={() => toggleBlockFormat("h2")}>
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Heading 3" active={activeFormats.h3} onPress={() => toggleBlockFormat("h3")}>
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Bullet list" active={activeFormats.bullet} onPress={() => runCommand("insertUnorderedList")}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={activeFormats.ordered} onPress={() => runCommand("insertOrderedList")}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Quote" active={activeFormats.quote} onPress={() => toggleBlockFormat("blockquote")}>
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Align left" active={activeFormats.alignLeft} onPress={() => applyTextAlignment("left")}>
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Align center" active={activeFormats.alignCenter} onPress={() => applyTextAlignment("center")}>
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Align right" active={activeFormats.alignRight} onPress={() => applyTextAlignment("right")}>
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Horizontal line" onPress={() => runCommand("insertHorizontalRule")}>
          <Minus className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Upload image" onPress={() => inputRef.current?.click()} disabled={uploadingImage}>
          <ImagePlus className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Undo" onPress={() => runCommand("undo")}>
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Redo" onPress={() => runCommand("redo")}>
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Clear formatting" onPress={() => runCommand("removeFormat")}>
          <Eraser className="h-4 w-4" />
        </ToolbarButton>
      </ToolbarRow>

      <div className="border border-purple-400/80 bg-white/70 shadow-[0_0_0_1px_rgba(168,85,247,0.15)] dark:bg-gray-900/60">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => void handleImagePick(event.target.files)}
          className="hidden"
        />
        <div className="relative">
          {isEmpty ? <div className="pointer-events-none absolute left-5 top-4 text-2xl text-gray-400">{placeholder}</div> : null}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="novel-editor-surface min-h-[460px] px-5 py-4 text-base leading-8 text-gray-900 outline-none empty:before:text-gray-400 dark:text-gray-100"
            onInput={syncRawFromDom}
            onFocus={saveSelection}
            onBlur={() => {
              saveSelection();
              normalizeDom();
            }}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            onTouchEnd={saveSelection}
            onPaste={(event) => {
              const imageFiles = Array.from(event.clipboardData?.files || []).filter((file): file is File => String((file as File).type || "").startsWith("image/"));
              if (imageFiles.length) {
                event.preventDefault();
                void uploadAndInsertImages(imageFiles);
                return;
              }
              window.setTimeout(syncRawFromDom, 0);
            }}
            onDrop={(event) => {
              const imageFiles = Array.from(event.dataTransfer?.files || []).filter((file): file is File => String((file as File).type || "").startsWith("image/"));
              if (!imageFiles.length) return;
              event.preventDefault();
              void uploadAndInsertImages(imageFiles);
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
        {helperText ? <span>{helperText}</span> : null}
      </div>
    </div>
  );
}
