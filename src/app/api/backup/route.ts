import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    
    if (!fs.existsSync(dbPath)) {
      return new NextResponse("Base de datos no encontrada", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(dbPath);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `respaldo-pulperia-${timestamp}.db`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/x-sqlite3",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error en el respaldo:", error);
    return new NextResponse("Error al generar el respaldo", { status: 500 });
  }
}
