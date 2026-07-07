import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import mammoth from 'mammoth';


export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const name = file.name;
    const ext = name.split('.').pop()?.toLowerCase();
    
    if (!ext || !['txt', 'pdf', 'docx'].includes(ext)) {
      return NextResponse.json({ 
        error: 'Format de fichier non supporté. Veuillez utiliser un fichier .txt, .pdf ou .docx.' 
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';

    if (ext === 'txt') {
      extractedText = buffer.toString('utf-8');
    } else if (ext === 'pdf') {
      const pdf = require('pdf-parse-debugging-disabled');
      const data = await pdf(buffer);
      extractedText = data.text || '';
    } else if (ext === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    }

    // Clean up text
    extractedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return NextResponse.json({
      success: true,
      text: extractedText,
      fileName: name
    });
  } catch (error: any) {
    console.error('Error during text extraction:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'extraction du texte : ' + (error.message || error) 
    }, { status: 500 });
  }
}
