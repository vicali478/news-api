const http = require('http');
const { spawn } = require('child_process');

const PORT = 8000;
const clients = [];

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    // Serve basic player
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <h2>🎤 Live Radio</h2>
      <audio controls autoplay>
        <source src="/stream" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    `);
    
  } else if (req.url === '/stream') {
    // Stream audio to connected client
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Transfer-Encoding': 'chunked',
      'Connection': 'keep-alive',
    });

    clients.push(res);
    req.on('close', () => {
      const index = clients.indexOf(res);
      if (index !== -1) clients.splice(index, 1);
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`🎧 Live radio is running at http://localhost:${PORT}`);
});

// Start FFmpeg to capture audio and stream it
const ffmpeg = spawn('ffmpeg', [
  '-f', 'dshow',
  '-i', 'audio=Internal Microphone (Conexant ISST Audio)', // Replace with your actual mic name
  '-f', 'mp3',
  '-vn',
  'pipe:1',
]);

ffmpeg.stdout.on('data', (chunk) => {
  clients.forEach(res => res.write(chunk));
});

ffmpeg.stderr.on('data', (data) => {
  console.error('[FFmpeg]', data.toString());
});

ffmpeg.on('exit', (code) => {
  console.log(`FFmpeg exited with code ${code}`);
  clients.forEach(res => res.end());
});
