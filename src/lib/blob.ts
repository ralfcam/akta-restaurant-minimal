import { put, del } from '@vercel/blob';

export async function uploadAsset(
  file: File, 
  prefix: 'uploads/images/' | 'uploads/files/',
  isPrivate: boolean = false
): Promise<{ url: string; pathname: string }> {
  const ext = file.name.split('.').pop() || '';
  const uuid = crypto.randomUUID();
  const filename = `${prefix}${uuid}.${ext}`;

  const blob = await put(filename, file, {
    access: isPrivate ? 'private' : 'public',
  });

  return {
    url: blob.url,
    pathname: blob.pathname
  };
}

export async function deleteAsset(url: string): Promise<void> {
  await del(url);
}
