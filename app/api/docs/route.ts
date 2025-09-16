import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Redirigir a la documentación Swagger
  return NextResponse.redirect(new URL("/swagger.html", request.url));
}
