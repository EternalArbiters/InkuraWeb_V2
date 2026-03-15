import { describe, expect, it } from "vitest";

import {
  buildAutoTranslatePartialCandidates,
  replaceAutoTranslateKnownPhrases,
} from "@/lib/uiLanguageAutoTranslate";
import { parseUILanguageCatalog } from "@/lib/uiLanguageCatalog";

const sourceCatalog = parseUILanguageCatalog(
  "EN",
  `==========
Audit
==========

Rate
unread
Open collection
Page
more
Subtitle
Link
images added to the page queue.
images ready to upload.
images were extracted from the ZIP successfully.
PDF pages were converted to images successfully.
Aggregate rebuilt for
day(s).`
);

const translatedCatalog = parseUILanguageCatalog(
  "ID",
  `==========
Audit
==========

Rate = Beri rating
unread = belum dibaca
Open collection = Buka koleksi
Page = Halaman
more = lagi
Subtitle = Subjudul
Link = Tautan
images added to the page queue. = gambar ditambahkan ke antrean halaman.
images ready to upload. = gambar siap diunggah.
images were extracted from the ZIP successfully. = gambar berhasil diekstrak dari ZIP.
PDF pages were converted to images successfully. = halaman PDF berhasil diubah menjadi gambar.
Aggregate rebuilt for = Agregat dibangun ulang untuk
day(s). = hari`,
  sourceCatalog
);

const catalogs = { EN: sourceCatalog, ID: translatedCatalog } as const;

describe("ui partial opt-in audit coverage", () => {
  it("keeps audited mixed strings natural after partial replacement", () => {
    const partialCandidates = buildAutoTranslatePartialCandidates(catalogs, sourceCatalog);

    expect(replaceAutoTranslateKnownPhrases("Rate 5", translatedCatalog, sourceCatalog, partialCandidates)).toBe(
      "Beri rating 5"
    );
    expect(replaceAutoTranslateKnownPhrases("12 unread", translatedCatalog, sourceCatalog, partialCandidates)).toBe(
      "12 belum dibaca"
    );
    expect(replaceAutoTranslateKnownPhrases("Open collection (4)", translatedCatalog, sourceCatalog, partialCandidates)).toBe(
      "Buka koleksi (4)"
    );
    expect(replaceAutoTranslateKnownPhrases("Page 7", translatedCatalog, sourceCatalog, partialCandidates)).toBe("Halaman 7");
    expect(replaceAutoTranslateKnownPhrases("+3 more", translatedCatalog, sourceCatalog, partialCandidates)).toBe("+3 lagi");
    expect(replaceAutoTranslateKnownPhrases("Subtitle 2", translatedCatalog, sourceCatalog, partialCandidates)).toBe(
      "Subjudul 2"
    );
    expect(replaceAutoTranslateKnownPhrases("Link 4", translatedCatalog, sourceCatalog, partialCandidates)).toBe(
      "Tautan 4"
    );
    expect(
      replaceAutoTranslateKnownPhrases("5 images ready to upload.", translatedCatalog, sourceCatalog, partialCandidates)
    ).toBe("5 gambar siap diunggah.");
    expect(
      replaceAutoTranslateKnownPhrases(
        "4 PDF pages were converted to images successfully.",
        translatedCatalog,
        sourceCatalog,
        partialCandidates
      )
    ).toBe("4 halaman PDF berhasil diubah menjadi gambar.");
    expect(
      replaceAutoTranslateKnownPhrases("Aggregate rebuilt for 3 day(s).", translatedCatalog, sourceCatalog, partialCandidates)
    ).toBe("Agregat dibangun ulang untuk 3 hari");
  });
});
