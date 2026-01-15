// api/download.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('Missing URL parameter');
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

    // Set headers agar browser mengenali ini sebagai file download
    res.setHeader('Content-Disposition', 'attachment; filename="dream-ai-generated.jpg"');
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');

    // Streaming response body (chunk per chunk) ke client
    response.body.pipe(res);

  } catch (error) {
    console.error(error);
    res.status(500).send('Error downloading image');
  }
}
  
