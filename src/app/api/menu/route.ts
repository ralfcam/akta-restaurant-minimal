import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { kv } from '@vercel/kv';
import { verifyAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const getFilePath = () => path.join(process.cwd(), 'src', 'data', 'menu.json');

// Fallback to local file if DB/KV is not ready or fails
async function getLocalMenu() {
  const filePath = getFilePath();
  const fileContent = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

export async function GET() {
  try {
    // 1. Essayer de récupérer le menu depuis Vercel KV
    const kvData = await kv.get('menu');

    if (kvData) {
      const raw = kvData;
      const normalized = Array.isArray(raw)
        ? { mode: 'interactive', pdfUrl: '', pdfName: '', markdownFr: '', markdownEn: '', categories: raw }
        : { mode: 'interactive', pdfUrl: '', pdfName: '', markdownFr: '', markdownEn: '', categories: [], ...raw };
      return NextResponse.json(normalized, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store',
        }
      });
    }
  } catch (kvError) {
    console.warn('Vercel KV menu fetch error, falling back to local file:', kvError);
  }

  // 2. Fallback sur le fichier JSON local
  try {
    const menuData = await getLocalMenu();
    const normalized = Array.isArray(menuData)
      ? { mode: 'interactive', pdfUrl: '', pdfName: '', markdownFr: '', markdownEn: '', categories: menuData }
      : { mode: 'interactive', pdfUrl: '', pdfName: '', markdownFr: '', markdownEn: '', categories: [], ...menuData };
    return NextResponse.json(normalized, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      }
    });
  } catch (error) {
    console.error('Error reading fallback menu file:', error);
    return NextResponse.json({ error: 'Failed to read menu data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized credentials' }, { status: 401 });
    }

    const body = await request.json();
    const { menuData, mode, pdfUrl, pdfName, markdownFr, markdownEn, categories } = body;

    // Normaliser l'objet à sauvegarder
    let dataToSave: any = {};
    if (menuData && Array.isArray(menuData)) {
      dataToSave = {
        mode: mode || 'interactive',
        pdfUrl: pdfUrl || '',
        pdfName: pdfName || '',
        markdownFr: markdownFr || '',
        markdownEn: markdownEn || '',
        categories: menuData
      };
    } else {
      dataToSave = {
        mode: mode || 'interactive',
        pdfUrl: pdfUrl || '',
        pdfName: pdfName || '',
        markdownFr: markdownFr || '',
        markdownEn: markdownEn || '',
        categories: categories || []
      };
    }

    // 1. Sauvegarder dans Vercel KV
    let kvSaved = false;
    try {
      await kv.set('menu', dataToSave);
      kvSaved = true;
    } catch (err) {
      console.error('Vercel KV save error:', err);
    }

    // 2. Toujours essayer d'écrire localement au cas où (utile en développement)
    try {
      const filePath = getFilePath();
      await fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (fsErr) {
      console.warn('Failed to write local fallback menu file (normal on Vercel):', fsErr);
    }
    
    if (kvSaved) {
      return NextResponse.json({ success: true, message: 'Menu data updated successfully in Vercel KV' });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Vercel KV save failed. Please check Vercel KV environment variables.' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating menu:', error);
    return NextResponse.json({ error: 'Failed to update menu data' }, { status: 500 });
  }
}
