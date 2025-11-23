/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { Client } from "basic-ftp";
import { Readable } from "stream";
import prisma from "@/lib/prisma";

async function uploadToFTP(file: File): Promise<string> {
  const client = new Client();
  const filename = `${Date.now()}-${file.name}`;

  try {
    await client.access({
      host: process.env.FTP_HOST!,
      user: process.env.FTP_USER!,
      password: process.env.FTP_PASS!,
      secure: false,
    });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const stream = Readable.from(buffer);

    await client.uploadFrom(stream, filename);
    client.close();

    return `https://${process.env.FTP_DOMAIN}/${filename}`;
  } catch (err) {
    console.error("FTP ERROR:", err);
    throw new Error("Falha no upload FTP");
  }
}

async function parseFormData(form: FormData): Promise<any[]> {
  const values: any[] = [];
  const fileFields: { [key: string]: File } = {};

  // Primeiro, separar arquivos e campos de valores
  for (const [key, value] of form.entries()) {
    if (value instanceof File) {
      fileFields[key] = value;
    } else if (key.startsWith("values[")) {
      const match = key.match(/values\[(\d+)\]\[(\w+)\](?:\[(\d+)\])?/);
      if (match) {
        const index = parseInt(match[1]);
        const field = match[2];
        const arrayIndex = match[3];
        
        if (!values[index]) values[index] = {};

        if (arrayIndex !== undefined) {
          // É um array (textLists)
          if (!values[index][field]) values[index][field] = [];
          values[index][field][parseInt(arrayIndex)] = value;
        } else {
          values[index][field] = value;
        }
      }
    }
  }

  // Fazer upload dos arquivos (imagens e vídeos)
  for (const [key, file] of Object.entries(fileFields)) {
    if (file.size > 0) {
      const url = await uploadToFTP(file);

      // Verificar se é imagem (file) ou vídeo (video)
      const matchFile = key.match(/file(\d+)/);
      const matchVideo = key.match(/video(\d+)/);

      if (matchFile) {
        const index = parseInt(matchFile[1]);
        if (!values[index]) values[index] = {};
        values[index].image = url;
      } else if (matchVideo) {
        const index = parseInt(matchVideo[1]);
        if (!values[index]) values[index] = {};
        values[index].video = url;
      }
    }
  }

  return values;
}

export async function POST(req: NextRequest) {
  try {
    const type = req.nextUrl.pathname.split("/").pop()!;
    const form = await req.formData();
    const values = await parseFormData(form);

    const saved = await prisma.formData.upsert({
      where: { type },
      update: { values },
      create: { type, values },
    });

    return NextResponse.json(saved);
  } catch (err) {
    console.error("POST ERROR:", err);
    return NextResponse.json({ error: (err as Error).message || "Erro" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const form = await req.formData();
    const id = form.get("id")?.toString();
    if (!id) return NextResponse.json({ error: "ID não enviado" }, { status: 400 });

    const existing = await prisma.formData.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });

    const newValues = await parseFormData(form);

    const updated = await prisma.formData.update({
      where: { id },
      data: { values: newValues },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT ERROR:", err);
    return NextResponse.json({ error: (err as Error).message || "Erro" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.pathname.split("/").pop()!;
  const list = await prisma.formData.findMany({
    where: { type },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(list);
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID não enviado" }, { status: 400 });

    await prisma.formData.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    return NextResponse.json({ error: "Erro ao excluir." }, { status: 500 });
  }
}