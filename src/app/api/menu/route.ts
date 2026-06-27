import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const getFilePath = () => path.join(process.cwd(), 'src', 'data', 'menu.json');

export async function GET() {
  try {
    const filePath = getFilePath();
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const menuData = JSON.parse(fileContent);
    return NextResponse.json(menuData);
  } catch (error) {
    console.error('Error reading menu file, falling back:', error);
    // If file doesn't exist yet, we can return empty or fallback
    return NextResponse.json({ error: 'Failed to read menu data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, menuData } = body;

    // Simple security check (admin authorization)
    const adminPassword = process.env.ADMIN_PASSWORD || 'akta2026';
    if (password !== adminPassword) {
      return NextResponse.json({ error: 'Unauthorized credentials' }, { status: 401 });
    }

    if (!menuData || !Array.isArray(menuData)) {
      return NextResponse.json({ error: 'Invalid menu data format' }, { status: 400 });
    }

    const filePath = getFilePath();
    await fs.writeFile(filePath, JSON.stringify(menuData, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true, message: 'Menu data updated successfully' });
  } catch (error) {
    console.error('Error updating menu file:', error);
    return NextResponse.json({ error: 'Failed to update menu data' }, { status: 500 });
  }
}
