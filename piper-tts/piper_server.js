const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

const BASE_DIR = __dirname;

function findPiperExe(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findPiperExe(full);
      if (found) return found;
    } else if (entry.name.toLowerCase() === "piper.exe") {
      return full;
    }
  }
  return null;
}

function findVoiceOnnx(dir) {
  if (!fs.existsSync(dir)) return null;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findVoiceOnnx(full);
      if (found) return found;
    } else if (entry.name.toLowerCase().endsWith(".onnx")) {
      return full;
    }
  }
  return null;
}

const PIPER_EXE = findPiperExe(BASE_DIR);
const VOICE_MODEL = findVoiceOnnx(path.join(BASE_DIR, "voices"));

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/tts") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  if (!PIPER_EXE || !VOICE_MODEL) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Piper o modelo .onnx no encontrado" }));
    return;
  }

  let rawBody = "";
  req.on("data", chunk => { rawBody += chunk.toString("utf8"); });
  req.on("end", () => {
    let text = "";
    try {
      const parsed = JSON.parse(rawBody || "{}");
      text = String(parsed.text || "").trim();
    } catch (e) {}

    if (!text) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Texto vacio" }));
      return;
    }

    const tmpWav = path.join(os.tmpdir(), `dc_piper_${Date.now()}_${Math.random().toString(36).slice(2)}.wav`);
    const child = spawn(PIPER_EXE, ["--model", VOICE_MODEL, "--output_file", tmpWav], {
      stdio: ["pipe", "ignore", "pipe"]
    });

    child.stdin.write(text + "\n");
    child.stdin.end();

    child.on("close", code => {
      if (code !== 0 || !fs.existsSync(tmpWav)) {
        try { if (fs.existsSync(tmpWav)) fs.unlinkSync(tmpWav); } catch (e) {}
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Error generando audio con Piper" }));
        return;
      }

      const wavBuffer = fs.readFileSync(tmpWav);
      try { fs.unlinkSync(tmpWav); } catch (e) {}

      res.writeHead(200, {
        "Content-Type": "audio/wav",
        "Content-Length": wavBuffer.length
      });
      res.end(wavBuffer);
    });
  });
});

server.listen(5050, "127.0.0.1", () => {
  console.log("Piper EXE:", PIPER_EXE);
  console.log("Modelo voz:", VOICE_MODEL);
  console.log("Servidor Piper TTS escuchando en http://127.0.0.1:5050/tts");
});