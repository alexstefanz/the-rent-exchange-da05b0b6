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
import { buildPvContent, noDia, COMPANY } from "./pvContent";
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

function p(text: string, opts: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; size?: number } = {}) {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    spacing: { after: 160 },
    children: [new TextRun({ text: noDia(text), bold: opts.bold, size: opts.size ?? 22, font: "Arial" })],
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
  const c = buildPvContent(rental, phase);

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

  const children: Paragraph[] = [];

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
  children.push(centerLine(COMPANY.address, false, 18));
  children.push(centerLine(COMPANY.fiscal, false, 18));
  children.push(centerLine(COMPANY.contact, false, 18));
  children.push(new Paragraph({ children: [new TextRun({ text: "", size: 4 })], spacing: { after: 240 } }));

  // Title
  children.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 240 },
    children: [new TextRun({ text: noDia(c.title), bold: true, size: 28, font: "Arial" })],
  }));

  // Paragraphs
  children.push(p(c.intro));
  children.push(p(c.object));
  if (c.accessories) children.push(p(c.accessories));
  children.push(p(c.period));
  children.push(p(c.responsibility));
  children.push(p(c.finalClause));

  // Photos
  if (photoBuffers.some(Boolean)) {
    children.push(new Paragraph({
      spacing: { before: 200, after: 120 },
      children: [new TextRun({ text: noDia(phase === "handover" ? "FOTOGRAFII LA PREDARE" : "FOTOGRAFII LA RETURNARE"), bold: true, size: 22, font: "Arial" })],
    }));
    for (let i = 0; i < photoBuffers.length; i++) {
      const ph = photoBuffers[i];
      if (!ph) continue;
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new ImageRun({
          type: ph.type === "png" ? "png" : "jpg",
          data: ph.data,
          transformation: { width: 360, height: 240 },
          altText: { title: `Poza ${i + 1}`, description: `Poza ${i + 1}`, name: `poza${i + 1}` },
        }) as any],
      }));
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: `Poza ${i + 1}`, size: 18, font: "Arial", italics: true })],
      }));
    }
  }

  // Signatures — 2-column table
  const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

  function sigCell(roleLabel: string, name: string, sig: ArrayBuffer | null, signedAt: string | null) {
    const inner: Paragraph[] = [];
    inner.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: noDia(roleLabel), bold: true, size: 20, font: "Arial" })],
    }));
    inner.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: noDia(name), size: 20, font: "Arial" })],
    }));
    if (sig) {
      inner.push(new Paragraph({
        alignment: AlignmentType.CENTER,
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
        spacing: { before: 200, after: 60 },
        children: [new TextRun({ text: "— nesemnat —", italics: true, size: 18, color: "999999", font: "Arial" })],
      }));
    }
    inner.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40 },
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
        sigCell("Predator (proprietar)", c.ownerName, ownerSig, pv.owner_signed_at),
        sigCell("Primitor (chirias)", c.renterName, renterSig, pv.renter_signed_at),
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