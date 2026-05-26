import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Note: Ensure GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY are set in .env
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

export async function createFolder(name: string, parentId?: string) {
  if (process.env.GOOGLE_CLIENT_EMAIL === undefined || process.env.GOOGLE_PRIVATE_KEY === undefined) {
    console.warn('Google Drive credentials missing. Mocking folder creation for:', name);
    return { id: 'mock_folder_id_' + Date.now(), link: 'https://drive.google.com/mock' };
  }

  try {
    const fileMetadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    };
    const file = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, webViewLink',
    });
    return { id: file.data.id, link: file.data.webViewLink };
  } catch (error) {
    console.error('Google Drive Error:', error);
    return null;
  }
}

export async function findOrCreateFolder(name: string, parentId?: string) {
  if (process.env.GOOGLE_CLIENT_EMAIL === undefined || process.env.GOOGLE_PRIVATE_KEY === undefined) {
    return { id: 'mock_folder_id_' + Date.now(), link: 'https://drive.google.com/mock' };
  }

  try {
    let query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }

    const res = await drive.files.list({
      q: query,
      fields: 'files(id, webViewLink)',
      spaces: 'drive',
    });

    if (res.data.files && res.data.files.length > 0) {
      return { id: res.data.files[0].id, link: res.data.files[0].webViewLink };
    } else {
      return await createFolder(name, parentId);
    }
  } catch (error) {
    console.error('Google Drive Search Error:', error);
    return await createFolder(name, parentId);
  }
}

export async function setupContentFolders(contentId: string, clientFolderId: string) {
  // Create Main Content Folder
  const mainFolder = await createFolder(contentId, clientFolderId);
  if (!mainFolder || !mainFolder.id) return null;

  // Create Subfolders and capture their links
  const scriptFolder = await createFolder('Script', mainFolder.id);
  const rawFolder = await createFolder('Raw Footage', mainFolder.id);
  const finalFolder = await createFolder('Final Content', mainFolder.id);

  return {
    id: mainFolder.id,
    link: mainFolder.link,
    scriptFolderLink: scriptFolder?.link || null,
    rawFolderLink: rawFolder?.link || null,
    finalFolderLink: finalFolder?.link || null,
  };
}

export async function setupGeneralTaskFolder(taskId: string) {
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) return null;

  // Find or create "Tasks" folder inside root
  const tasksParent = await findOrCreateFolder('Tasks', rootId);
  if (!tasksParent || !tasksParent.id) return null;

  // Create the actual task folder
  return await createFolder(taskId, tasksParent.id);
}

export async function deleteDriveFolder(folderId: string) {
  if (process.env.GOOGLE_CLIENT_EMAIL === undefined || process.env.GOOGLE_PRIVATE_KEY === undefined) {
    console.warn('Google Drive credentials missing. Mocking folder deletion for:', folderId);
    return true;
  }

  try {
    await drive.files.delete({ fileId: folderId });
    return true;
  } catch (error) {
    console.error('Google Drive Delete Error:', error);
    return false;
  }
}
