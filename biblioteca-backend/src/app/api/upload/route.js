import { NextResponse } from 'next/server';
import { uploadToDrive, makeFilePublic } from '@/src/lib/googleDrive';

// Se quiser garantir execução no Node (não edge)
export const runtime = 'nodejs';
// Para evitar cache desse endpoint
export const dynamic = 'force-dynamic';

function corsHeaders() {
  const origin = process.env.CORS_ORIGIN || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'OPTIONS, POST',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Pré-flight CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req) {
  try {
    const headers = corsHeaders();
    const formData = await req.formData();

    // arquivo
    const file = formData.get('file');
    if (!file) {
      return NextResponse.json({ success: false, error: 'Arquivo não enviado.' }, { status: 400, headers });
    }

    // tipo e metadados dinâmicos
    const tipo = formData.get('tipo') || 'generico';
    // Coleta todos os campos extras (título, autor, etc.)
    const meta = {};
    for (const [key, value] of formData.entries()) {
      if (key !== 'file') meta[key] = value;
    }

    // Buffer do arquivo
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // (Opcional) Subpastas por tipo (ex.: TCC/Artigo/Livro)
    // Se quiser organizar por subpastas, crie-as manualmente no Drive e coloque os IDs aqui:
    const SUBFOLDERS = {
      tcc: null,     // ex: '1AbCd...'  <- ID da pasta TCC
      artigo: null,  // ex: '2EfGh...'
      livro: null,   // ex: '3IjKl...'
    };

    const parents = [];
    if (process.env.GOOGLE_DRIVE_FOLDER_ID) parents.push(process.env.GOOGLE_DRIVE_FOLDER_ID);
    if (SUBFOLDERS[tipo]) parents.push(SUBFOLDERS[tipo]);

    // Nome de arquivo: mantém o nome original
    const filename = file.name || `upload-${Date.now()}.pdf`;
    const mimeType = file.type || 'application/pdf';

    // Sobe no Drive
    const driveFile = await uploadToDrive({
      buffer,
      filename,
      mimeType,
      parents,
    });

    // (Opcional) tornar público por link — descomente se desejar
    // const publicFile = await makeFilePublic(driveFile.id);

    // Dica: se quiser gravar metadados em DB, faça aqui (usando meta + driveFile)

    return NextResponse.json(
      {
        success: true,
        tipo,
        meta,
        driveFile, // ou publicFile se ativar a permissão pública
      },
      { status: 200, headers }
    );
  } catch (err) {
    console.error('Erro no upload:', err);
    return NextResponse.json(
      { success: false, error: err.message ?? 'Erro interno no upload.' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
