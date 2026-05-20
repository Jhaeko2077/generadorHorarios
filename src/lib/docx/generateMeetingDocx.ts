import fs from "node:fs/promises";
import path from "node:path";

import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

import { prisma } from "@/lib/prisma";
import { meetingTemplateMapper } from "@/lib/docx/meetingTemplateMapper";

export async function generateMeetingDocx(meetingWeekId: string): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), "src", "templates", "vida-ministerio-template.docx");

  const file = await fs.readFile(templatePath);
  const zip = new PizZip(file);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  const data = await meetingTemplateMapper(meetingWeekId);
  doc.render(data);

  const buffer = doc
    .getZip()
    .generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    }) as Buffer;

  await prisma.exportLog.create({
    data: {
      meetingWeekId,
      fileName: `vida-ministerio-${meetingWeekId}.docx`,
    },
  });

  await prisma.meetingWeek.update({
    where: { id: meetingWeekId },
    data: { status: "exported" },
  });

  return buffer;
}
