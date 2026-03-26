// transfer.js — Google Drive, Email, and Download handlers
// These will call the Cloudflare Worker endpoint for file generation.
// Drive and Email paths require GOOGLE_OAUTH_TOKEN set in the Worker env.

const WORKER_URL = 'https://quiltcraft-export.workers.dev'; // set after wrangler deploy

async function generateViaWorker(gridState) {
  const response = await fetch(`${WORKER_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gridState)
  });
  if (!response.ok) throw new Error(`Worker error: ${response.status}`);
  return response.arrayBuffer();
}

async function downloadFile(gridState) {
  const buffer = await generateViaWorker(gridState);
  const machine = gridState.machine;
  const fmtMap = { brother: 'pes', janome: 'jef', bernina: 'exp', viking: 'vp3', singer: 'xxx', universal: 'dst' };
  const ext = fmtMap[machine] || 'dst';
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `QuiltCraft_Design.${ext}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function saveToGoogleDrive(gridState, oauthToken) {
  // TODO: implement via Google Drive MCP / API
  // Requires GOOGLE_OAUTH_TOKEN
  const buffer = await generateViaWorker(gridState);
  console.log('Google Drive upload: TODO — requires OAuth flow', buffer);
}

async function sendViaEmail(gridState, emailAddress) {
  // TODO: implement via Gmail MCP / API
  // Requires GOOGLE_OAUTH_TOKEN with Gmail scope
  const buffer = await generateViaWorker(gridState);
  console.log('Gmail send: TODO — requires OAuth flow', buffer);
}

export { downloadFile, saveToGoogleDrive, sendViaEmail, generateViaWorker };
