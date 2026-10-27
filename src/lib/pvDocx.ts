import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageOrientation,
} from "docx";
import { format } from "date-fns";
import type { RentalFullDetail, PvDocument } from "@/features/rentals/rentalDetailPageApi";
import { getPvFileSignedUrl } from "@/features/rentals/rentalDetailPageApi";
import { buildPvRichContent, noDia, COMPANY, type PvRun } from "./pvContent";
import rentliLogoUrl from "@/assets/rentli_logo.png";

async function fetchAsArrayBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  return await res.arrayBuffer();
}

async function loadImage(path: string): Promise<{ data: ArrayBuffer; type: "jpg" | "png" } | null> {
  try {
    const url = await getPvFileSignedUrl(path);
    const data = await fetchAsArrayBuffer(url);
    const lower = path.toLowerCase();
    const type: "jpg" | "png" = lower.endsWith(".png") ? "png" : "jpg";
    return { data, type };
  } catch {
    return null;
  }
}

function runsToTextRuns(runs: PvRun[], opts: { size?: number; italics?: boolean; color?: string } = {}) {
  return runs.map(
    (r) =>
      new TextRun({
        text: noDia(r.text),
        bold: r.bold,
        italics: opts.italics,
        size: opts.size ?? 22,
        color: opts.color,
        font: "Arial",
      }),
  );
}

function pRich(runs: PvRun[], opts: { align?: (typeof AlignmentType)[keyof typeof AlignmentType]; size?: number; italics?: boolean; color?: string; after?: number } = {}) {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    spacing: { after: opts.after ?? 160, line: 320 },
    children: runsToTextRuns(runs, { size: opts.size, italics: opts.italics, color: opts.color }),
  });
}

function centerLine(text: string, bold = false, size = 20) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: noDia(text), bold, size, font: "Arial" })],
  });
}

export async function generatePvDocx(rental: RentalFullDetail, pv: PvDocument, phase: "handover" | "return"): Promise<Blob> {
  const c = buildPvRichContent(rental, phase);

  // Load embedded images (signatures + photos)
  const photosMeta = pv.photos_meta || [];
  const photoBuffers = await Promise.all(photosMeta.map((m) => loadImage(m.path)));

  const ownerSig = pv.owner_signature_data ? dataUrlToArrayBuffer(pv.owner_signature_data) : null;
  const renterSig = pv.renter_signature_data ? dataUrlToArrayBuffer(pv.renter_signature_data) : null;

  // Brand logo (Rentli) in header
  let logoBuffer: ArrayBuffer | null = null;
  try {
    logoBuffer = await fetchAsArrayBuffer(rentliLogoUrl);
  } catch {
    logoBuffer = null;
  }

  const children: (Paragraph | Table)[] = [];

  // Header
  if (logoBuffer) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new ImageRun({
        type: "png",
        data: logoBuffer,
        transformation: { width: 120, height: 40 },
        altText: { title: "Rentli", description: "Rentli logo", name: "rentli_logo" },
      }) as any],
    }));
  }
  children.push(centerLine(COMPANY.name, true, 22));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: noDia(COMPANY.address), size: 18, color: "6B7280", font: "Arial" })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: noDia(COMPANY.fiscal), size: 18, color: "6B7280", font: "Arial" })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: noDia(COMPANY.contact), size: 18, color: "6B7280", font: "Arial" })],
  }));
  // Thin divider line
  children.push(new Paragraph({
    spacing: { after: 200 },
    border: { bottom: { color: "E5E7EB", space: 1, style: BorderStyle.SINGLE, size: 6 } },
    children: [new TextRun({ text: "" })],
  }));

  // Title
  children.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 320 },
    children: [new TextRun({ text: noDia(c.title), bold: true, size: 30, font: "Arial" })],
  }));
  children.push(centerLine(c.subtitle, false, 18));
  children.push(pRich(c.headerRuns, { size: 18, after: 200 }));

  // Sections 1–7 of the official template
  for (const s of c.sections) {
    children.push(new Paragraph({
      spacing: { before: 160, after: 80 },
      children: [new TextRun({ text: noDia(s.heading), bold: true, size: 22, color: "D97706", font: "Arial" })],
    }));
    for (const p of s.paragraphs) children.push(pRich(p, { size: 20, after: 60, align: AlignmentType.LEFT }));
  }

  // Photos — 2-column grid with caption below each
  const validPhotos = photoBuffers
    .map((ph, i) => (ph ? { ph, i } : null))
    .filter(Boolean) as Array<{ ph: { data: ArrayBuffer; type: "jpg" | "png" }; i: number }>;
  if (validPhotos.length > 0) {
    children.push(new Paragraph({
      spacing: { before: 200, after: 120 },
      children: [new TextRun({
        text: noDia(phase === "handover" ? "Fotografii la predare" : "Fotografii la returnare"),
        bold: true, size: 18, color: "6B7280", font: "Arial",
      })],
    }));
    const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
    const cellNoBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
    function photoCell(item: { ph: { data: ArrayBuffer; type: "jpg" | "png" }; i: number } | null) {
      const inner: Paragraph[] = [];
      if (item) {
        inner.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new ImageRun({
            type: item.ph.type === "png" ? "png" : "jpg",
            data: item.ph.data,
            transformation: { width: 260, height: 180 },
            altText: { title: `Poza ${item.i + 1}`, description: `Poza ${item.i + 1}`, name: `poza${item.i + 1}` },
          }) as any],
        }));
        inner.push(new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [new TextRun({ text: `Poza ${item.i + 1}`, size: 16, color: "6B7280", font: "Arial" })],
        }));
      } else {
        inner.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
      }
      return new TableCell({
        borders: cellNoBorders,
        width: { size: 4680, type: WidthType.DXA },
        margins: { top: 60, bottom: 120, left: 60, right: 60 },
        children: inner,
      });
    }
    const rows: TableRow[] = [];
    for (let i = 0; i < validPhotos.length; i += 2) {
      rows.push(new TableRow({
        children: [photoCell(validPhotos[i] ?? null), photoCell(validPhotos[i + 1] ?? null)],
      }));
    }
    children.push(new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [4680, 4680],
      rows,
    }));
  }

  // Signatures — 2-column table
  const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

  function sigCell(roleLabel: string, name: string, sig: ArrayBuffer | null, signedAt: string | null) {
    const inner: Paragraph[] = [];
    inner.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: noDia(roleLabel), bold: true, size: 20, font: "Arial" })],
    }));
    inner.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [new TextRun({ text: noDia(name), size: 20, font: "Arial" })],
    }));
    if (sig) {
      inner.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new ImageRun({
          type: "png",
          data: sig,
          transformation: { width: 180, height: 60 },
          altText: { title: "Semnatura", description: "Semnatura", name: "semnatura" },
        }) as any],
      }));
    } else {
      inner.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: "— nesemnat —", italics: true, size: 18, color: "999999", font: "Arial" })],
      }));
    }
    // Thin divider line under signature
    inner.push(new Paragraph({
      spacing: { after: 40 },
      border: { bottom: { color: "111111", space: 1, style: BorderStyle.SINGLE, size: 6 } },
      children: [new TextRun({ text: "" })],
    }));
    inner.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: signedAt ? `Semnat: ${format(new Date(signedAt), "dd.MM.yyyy HH:mm")}` : "Semnatura", size: 16, color: "777777", font: "Arial" })],
    }));
    return new TableCell({
      borders: cellBorders,
      width: { size: 4680, type: WidthType.DXA },
      margins: { top: 200, bottom: 200, left: 200, right: 200 },
      children: inner,
    });
  }

  children.push(new Paragraph({ children: [new TextRun({ text: "" })], spacing: { before: 240 } }));

  const table = new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    rows: [new TableRow({
      children: [
        sigCell("Proprietar", c.ownerName, ownerSig, pv.owner_signed_at),
        sigCell("Chirias", c.renterName, renterSig, pv.renter_signed_at),
      ],
    })],
  });

  // Footer note
  const footer = new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 240 },
    children: [new TextRun({
      text: noDia(`Cod inchiriere: ${rental.public_id || "-"} | Generat: ${format(new Date(), "dd.MM.yyyy HH:mm")}`),
      size: 14, color: "999999", font: "Arial",
    })],
  });

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
      children: [...children, table, footer],
    }],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.split(",")[1] || "";
  const bin = atob(base64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}