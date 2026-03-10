import "server-only";

import { getAdminAnalyticsData } from "@/server/services/admin/analytics";

type AnalyticsData = Awaited<ReturnType<typeof getAdminAnalyticsData>>;

type QueryArgs = {
  start?: string | null;
  end?: string | null;
  days?: number | null;
  limit?: number | null;
};

type PdfTextOptions = {
  size?: number;
  font?: "regular" | "bold";
  color?: [number, number, number];
};

type PdfRectOptions = {
  stroke?: [number, number, number];
  fill?: [number, number, number];
  lineWidth?: number;
};

class PdfBuilder {
  private readonly width = 595;
  private readonly height = 842;
  private pages: string[][] = [];
  private currentPage = -1;

  addPage() {
    this.pages.push([]);
    this.currentPage = this.pages.length - 1;
  }

  private push(command: string) {
    if (this.currentPage < 0) this.addPage();
    this.pages[this.currentPage]?.push(command);
  }

  private textY(top: number, size: number) {
    return this.height - top - size;
  }

  text(x: number, top: number, value: string, options: PdfTextOptions = {}) {
    const size = options.size ?? 11;
    const font = options.font === "bold" ? "F2" : "F1";
    const color = options.color ?? [0.12, 0.14, 0.18];
    const safe = sanitizePdfText(value);
    this.push(`BT /${font} ${size} Tf ${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} rg 1 0 0 1 ${x.toFixed(2)} ${this.textY(top, size).toFixed(2)} Tm (${safe}) Tj ET`);
  }

  line(x1: number, y1Top: number, x2: number, y2Top: number, color: [number, number, number] = [0.83, 0.85, 0.9], width = 1) {
    const y1 = this.height - y1Top;
    const y2 = this.height - y2Top;
    this.push(`${width.toFixed(2)} w ${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }

  rect(x: number, top: number, w: number, h: number, options: PdfRectOptions = {}) {
    const y = this.height - top - h;
    const fill = options.fill;
    const stroke = options.stroke;
    const lineWidth = options.lineWidth ?? 1;
    if (fill && stroke) {
      this.push(`${lineWidth.toFixed(2)} w ${stroke[0].toFixed(3)} ${stroke[1].toFixed(3)} ${stroke[2].toFixed(3)} RG ${fill[0].toFixed(3)} ${fill[1].toFixed(3)} ${fill[2].toFixed(3)} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re B`);
      return;
    }
    if (fill) {
      this.push(`${fill[0].toFixed(3)} ${fill[1].toFixed(3)} ${fill[2].toFixed(3)} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
      return;
    }
    this.push(`${lineWidth.toFixed(2)} w ${(stroke ?? [0.83, 0.85, 0.9])[0].toFixed(3)} ${(stroke ?? [0.83, 0.85, 0.9])[1].toFixed(3)} ${(stroke ?? [0.83, 0.85, 0.9])[2].toFixed(3)} RG ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
  }

  polyline(points: Array<[number, number]>, color: [number, number, number], width = 1.6) {
    if (points.length < 2) return;
    const [firstX, firstYTop] = points[0]!;
    const firstY = this.height - firstYTop;
    const tail = points
      .slice(1)
      .map(([x, top]) => `${x.toFixed(2)} ${(this.height - top).toFixed(2)} l`)
      .join(" ");
    this.push(`${width.toFixed(2)} w ${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} RG ${firstX.toFixed(2)} ${firstY.toFixed(2)} m ${tail} S`);
  }

  buildBuffer() {
    const objects: string[] = ["", ""];
    const addObject = (content: string) => {
      objects.push(content);
      return objects.length;
    };

    const fontRegularId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const fontBoldId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

    const pageIds: number[] = [];
    for (const commands of this.pages) {
      const stream = commands.join("\n");
      const streamLength = Buffer.byteLength(stream, "utf8");
      const contentId = addObject(`<< /Length ${streamLength} >>\nstream\n${stream}\nendstream`);
      const pageId = addObject(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.width} ${this.height}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`
      );
      pageIds.push(pageId);
    }

    objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[1] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`;

    let output = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    const offsets: number[] = [0];

    for (let index = 0; index < objects.length; index += 1) {
      const objectId = index + 1;
      offsets.push(Buffer.byteLength(output, "utf8"));
      output += `${objectId} 0 obj\n${objects[index]}\nendobj\n`;
    }

    const xrefOffset = Buffer.byteLength(output, "utf8");
    output += `xref\n0 ${objects.length + 1}\n`;
    output += "0000000000 65535 f \n";
    for (let index = 1; index < offsets.length; index += 1) {
      output += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
    }
    output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return Buffer.from(output, "utf8");
  }
}

function sanitizePdfText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
}

function integer(value: number) {
  return new Intl.NumberFormat("en").format(Number(value || 0));
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

function titleCase(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function clampText(value: string, max = 42) {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 3)).trimEnd()}...`;
}

function drawMetricCard(pdf: PdfBuilder, x: number, top: number, width: number, label: string, value: string, accent: [number, number, number]) {
  pdf.rect(x, top, width, 74, { fill: [0.97, 0.98, 1], stroke: [0.86, 0.89, 0.95] });
  pdf.rect(x + 12, top + 12, 10, 10, { fill: accent });
  pdf.text(x + 28, top + 13, label, { size: 10, font: "bold", color: [0.35, 0.39, 0.47] });
  pdf.text(x + 12, top + 36, value, { size: 24, font: "bold", color: [0.1, 0.12, 0.18] });
}

function drawSectionTitle(pdf: PdfBuilder, x: number, top: number, title: string, subtitle?: string) {
  pdf.text(x, top, title, { size: 16, font: "bold", color: [0.1, 0.12, 0.18] });
  if (subtitle) pdf.text(x, top + 20, subtitle, { size: 10, color: [0.42, 0.46, 0.55] });
}

function buildSeriesPoints(values: number[], x: number, top: number, width: number, height: number) {
  if (!values.length) return [] as Array<[number, number]>;
  const max = Math.max(...values, 1);
  const step = values.length === 1 ? 0 : width / (values.length - 1);
  return values.map((value, index) => {
    const pointX = x + index * step;
    const pointY = top + height - (value / max) * height;
    return [pointX, pointY] as [number, number];
  });
}

function drawTrafficChart(pdf: PdfBuilder, data: AnalyticsData, x: number, top: number, width: number, height: number) {
  pdf.rect(x, top, width, height, { fill: [0.985, 0.988, 0.996], stroke: [0.88, 0.9, 0.96] });
  drawSectionTitle(pdf, x + 18, top + 16, "Traffic trend", "Unique visitors and active users over the selected range");
  const chartX = x + 22;
  const chartTop = top + 52;
  const chartWidth = width - 44;
  const chartHeight = height - 84;
  for (let index = 0; index < 4; index += 1) {
    const y = chartTop + (chartHeight / 3) * index;
    pdf.line(chartX, y, chartX + chartWidth, y, [0.9, 0.92, 0.96], 0.8);
  }

  const visitorValues = data.overviewSeries.map((row) => Number(row.uniqueVisitors || 0));
  const activeValues = data.overviewSeries.map((row) => Number(row.activeUsers || 0));
  pdf.polyline(buildSeriesPoints(visitorValues, chartX, chartTop, chartWidth, chartHeight), [0.17, 0.43, 0.92], 2);
  pdf.polyline(buildSeriesPoints(activeValues, chartX, chartTop, chartWidth, chartHeight), [0.55, 0.25, 0.92], 2);

  const labels = data.overviewSeries;
  if (labels.length) {
    pdf.text(chartX, chartTop + chartHeight + 12, formatDate(labels[0]!.date), { size: 9, color: [0.5, 0.54, 0.62] });
    if (labels.length > 1) {
      const mid = labels[Math.floor((labels.length - 1) / 2)]!;
      pdf.text(chartX + chartWidth / 2 - 20, chartTop + chartHeight + 12, formatDate(mid.date), { size: 9, color: [0.5, 0.54, 0.62] });
      pdf.text(chartX + chartWidth - 46, chartTop + chartHeight + 12, formatDate(labels[labels.length - 1]!.date), { size: 9, color: [0.5, 0.54, 0.62] });
    }
  }

  pdf.rect(x + 18, top + height - 24, 10, 10, { fill: [0.17, 0.43, 0.92] });
  pdf.text(x + 34, top + height - 25, "Unique visitors", { size: 9, color: [0.4, 0.44, 0.52] });
  pdf.rect(x + 140, top + height - 24, 10, 10, { fill: [0.55, 0.25, 0.92] });
  pdf.text(x + 156, top + height - 25, "Active users", { size: 9, color: [0.4, 0.44, 0.52] });
}

function drawBarList(
  pdf: PdfBuilder,
  x: number,
  top: number,
  width: number,
  title: string,
  subtitle: string,
  items: Array<{ label: string; value: number }>,
) {
  pdf.rect(x, top, width, 220, { fill: [0.985, 0.988, 0.996], stroke: [0.88, 0.9, 0.96] });
  drawSectionTitle(pdf, x + 18, top + 16, title, subtitle);
  const max = Math.max(...items.map((item) => item.value), 1);
  items.slice(0, 6).forEach((item, index) => {
    const rowTop = top + 52 + index * 26;
    pdf.text(x + 18, rowTop, clampText(item.label, 22), { size: 10, font: "bold" });
    pdf.text(x + width - 58, rowTop, integer(item.value), { size: 10, color: [0.42, 0.46, 0.55] });
    pdf.rect(x + 18, rowTop + 12, width - 36, 7, { fill: [0.93, 0.95, 0.99] });
    pdf.rect(x + 18, rowTop + 12, Math.max(18, ((width - 36) * item.value) / max), 7, { fill: [0.2, 0.57, 0.92] });
  });
}

function drawSimpleTable(
  pdf: PdfBuilder,
  x: number,
  top: number,
  width: number,
  title: string,
  columns: Array<{ label: string; width: number }>,
  rows: string[][],
  rowHeight = 22,
) {
  const totalHeight = 50 + rows.length * rowHeight;
  pdf.rect(x, top, width, totalHeight, { fill: [1, 1, 1], stroke: [0.86, 0.89, 0.95] });
  drawSectionTitle(pdf, x + 16, top + 14, title);
  const tableTop = top + 36;
  pdf.rect(x, tableTop, width, 24, { fill: [0.965, 0.972, 0.99] });
  let cursorX = x + 12;
  columns.forEach((column) => {
    pdf.text(cursorX, tableTop + 7, column.label, { size: 9, font: "bold", color: [0.42, 0.46, 0.55] });
    cursorX += column.width;
  });
  rows.forEach((row, rowIndex) => {
    const rowTop = tableTop + 24 + rowIndex * rowHeight;
    if (rowIndex % 2 === 0) pdf.rect(x, rowTop, width, rowHeight, { fill: [0.99, 0.995, 1] });
    let cellX = x + 12;
    row.forEach((cell, cellIndex) => {
      pdf.text(cellX, rowTop + 6, clampText(cell, Math.max(8, Math.floor(columns[cellIndex]!.width / 6))), {
        size: 9,
        font: cellIndex === 0 ? "bold" : "regular",
        color: cellIndex === 0 ? [0.12, 0.14, 0.18] : [0.32, 0.36, 0.43],
      });
      cellX += columns[cellIndex]!.width;
    });
  });
}

function buildHighlights(data: AnalyticsData) {
  const totalViews = Number(data.headline.totals.workViews || 0) + Number(data.headline.totals.chapterViews || 0);
  const bookmarkRate = totalViews ? (Number(data.headline.totals.bookmarkAdds || 0) / totalViews) * 100 : 0;
  const commentRate = totalViews ? (Number(data.headline.totals.commentsCreated || 0) / totalViews) * 100 : 0;
  const searchZeroRate = data.topSearches.length
    ? Math.round(
        (data.topSearches.reduce((sum, item) => sum + Number(item.zeroResultCount || 0), 0) /
          Math.max(1, data.topSearches.reduce((sum, item) => sum + Number(item.count || 0), 0))) *
          100,
      )
    : 0;

  return [
    `DAU ${integer(data.headline.dau)} with ${integer(data.headline.dailyVisitors)} unique visitors today.`,
    `${bookmarkRate.toFixed(1)}% of content views converted into bookmarks in the selected range.`,
    `${commentRate.toFixed(1)}% of content views led to comments.`,
    `Zero-result search share across top queries is ${searchZeroRate}%.`,
  ];
}

function drawHighlights(pdf: PdfBuilder, x: number, top: number, width: number, lines: string[]) {
  const height = 120;
  pdf.rect(x, top, width, height, { fill: [0.992, 0.995, 1], stroke: [0.88, 0.9, 0.96] });
  drawSectionTitle(pdf, x + 18, top + 16, "Quick insights", "Generated from aggregate analytics data");
  lines.slice(0, 4).forEach((line, index) => {
    const rowTop = top + 48 + index * 18;
    pdf.rect(x + 18, rowTop + 1, 7, 7, { fill: [0.21, 0.58, 0.92] });
    pdf.text(x + 32, rowTop, line, { size: 10, color: [0.24, 0.28, 0.35] });
  });
}

export async function buildAdminAnalyticsPdf(args: QueryArgs = {}) {
  const data = await getAdminAnalyticsData(args);
  const pdf = new PdfBuilder();

  pdf.addPage();
  pdf.text(40, 42, "Inkura Analytics Report", { size: 24, font: "bold", color: [0.08, 0.12, 0.2] });
  pdf.text(40, 70, `Range: ${formatDate(data.range.start)} - ${formatDate(data.range.end)} (${data.range.days} days)`, {
    size: 11,
    color: [0.36, 0.4, 0.48],
  });
  pdf.text(40, 88, `Generated: ${new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date())}`, {
    size: 10,
    color: [0.5, 0.54, 0.62],
  });

  const cardWidth = 120;
  drawMetricCard(pdf, 40, 116, cardWidth, "DAU", integer(data.headline.dau), [0.17, 0.43, 0.92]);
  drawMetricCard(pdf, 173, 116, cardWidth, "WAU", integer(data.headline.wau), [0.56, 0.27, 0.92]);
  drawMetricCard(pdf, 306, 116, cardWidth, "MAU", integer(data.headline.mau), [0.1, 0.68, 0.43]);
  drawMetricCard(pdf, 439, 116, cardWidth, "Searches", integer(Number(data.headline.totals.searches || 0)), [0.92, 0.45, 0.22]);

  drawTrafficChart(pdf, data, 40, 214, 515, 220);
  drawHighlights(pdf, 40, 448, 515, buildHighlights(data));
  drawBarList(
    pdf,
    40,
    582,
    250,
    "Engagement mix",
    "How users interact after discovering content",
    [
      { label: "Bookmarks", value: Number(data.headline.totals.bookmarkAdds || 0) },
      { label: "Comments", value: Number(data.headline.totals.commentsCreated || 0) },
      { label: "Ratings", value: Number(data.headline.totals.ratingsSubmitted || 0) },
      { label: "Work likes", value: Number(data.headline.totals.workLikes || 0) },
      { label: "Chapter likes", value: Number(data.headline.totals.chapterLikes || 0) },
      { label: "Reports", value: Number(data.headline.totals.reportsCreated || 0) },
    ],
  );
  drawBarList(
    pdf,
    305,
    582,
    250,
    "Top genres",
    "Best-performing genres across the range",
    data.topGenres.slice(0, 6).map((item) => ({
      label: item.genre.name,
      value: Number(item.metrics.workViews || 0) + Number(item.metrics.chapterViews || 0),
    })),
  );

  pdf.addPage();
  pdf.text(40, 38, "Content, creators, and discovery", { size: 21, font: "bold", color: [0.08, 0.12, 0.2] });
  pdf.text(40, 60, "Exported from Inkura admin analytics dashboard.", { size: 10, color: [0.5, 0.54, 0.62] });

  drawSimpleTable(
    pdf,
    40,
    86,
    515,
    "Top works",
    [
      { label: "Work", width: 245 },
      { label: "Views", width: 72 },
      { label: "Readers", width: 72 },
      { label: "Bookmarks", width: 72 },
      { label: "Rating", width: 42 },
    ],
    data.topWorks.slice(0, 8).map((item) => [
      item.work.title,
      compact(item.metrics.views),
      compact(item.metrics.uniqueViewers),
      compact(item.metrics.bookmarkAdds),
      item.metrics.ratingsCount ? item.metrics.ratingAvg.toFixed(1) : "-",
    ]),
  );

  drawSimpleTable(
    pdf,
    40,
    334,
    515,
    "Top creators",
    [
      { label: "Creator", width: 220 },
      { label: "Viewers", width: 82 },
      { label: "Bookmarks", width: 82 },
      { label: "Likes", width: 62 },
      { label: "Follows", width: 57 },
    ],
    data.topCreators.slice(0, 7).map((item) => [
      item.creator.name || item.creator.username || "Unknown creator",
      compact(item.metrics.uniqueViewers),
      compact(item.metrics.bookmarkAdds),
      compact(item.metrics.likes),
      compact(item.metrics.followersGained),
    ]),
  );

  drawSimpleTable(
    pdf,
    40,
    560,
    250,
    "Top searches",
    [
      { label: "Query", width: 132 },
      { label: "Count", width: 42 },
      { label: "Zero", width: 36 },
      { label: "CTR", width: 28 },
    ],
    data.topSearches.slice(0, 6).map((item) => [
      item.query,
      integer(item.count),
      integer(item.zeroResultCount),
      `${item.count ? Math.round((item.clickCount / item.count) * 100) : 0}%`,
    ]),
    21,
  );

  drawSimpleTable(
    pdf,
    305,
    560,
    250,
    "Demographics",
    [
      { label: "Group", width: 150 },
      { label: "Users", width: 42 },
      { label: "Views", width: 36 },
      { label: "Likes", width: 22 },
    ],
    [
      ...data.demographics.byGender.slice(0, 4).map((item) => [
        `Gender: ${titleCase(item.gender || "unknown")}`,
        integer(Number(item.metrics.uniqueUsers || 0)),
        compact(Number(item.metrics.workViews || 0) + Number(item.metrics.chapterViews || 0)),
        compact(Number(item.metrics.likes || 0)),
      ]),
      ...data.demographics.byAgeBand.slice(0, 4).map((item) => [
        `Age: ${titleCase(item.ageBand)}`,
        integer(Number(item.metrics.uniqueUsers || 0)),
        compact(Number(item.metrics.workViews || 0) + Number(item.metrics.chapterViews || 0)),
        compact(Number(item.metrics.likes || 0)),
      ]),
    ],
    21,
  );

  return { data, buffer: pdf.buildBuffer() };
}
