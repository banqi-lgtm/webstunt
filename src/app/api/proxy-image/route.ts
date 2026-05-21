import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  try {
    console.log('[Proxy Image] Fetching:', imageUrl);
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      console.error('[Proxy Image] Error fetching external image:', response.statusText);
      return new NextResponse('Failed to fetch image', { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Leer como ArrayBuffer y convertir explícitamente a un Buffer de Node.js
    // Esto es el método más compatible y seguro en Next.js para enviar datos binarios reales
    // sin que se corrompa el cuerpo de la respuesta.
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Proxy Image] Internal error proxying image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
