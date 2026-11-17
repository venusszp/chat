const { createHash, timingSafeEqual } = require("node:crypto");
const { GoogleAuth } = require("google-auth-library");

const databaseScopes = [
  "https://www.googleapis.com/auth/firebase.database",
  "https://www.googleapis.com/auth/userinfo.email"
];
const validId = /^[A-Za-z0-9_-]{1,128}$/;
let auth;

function authorized(header, secret) {
  if (typeof header !== "string") return false;
  const hash = (value) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(header), hash(secret));
}

function chatUrl(id) {
  const url = new URL(process.env.FIREBASE_DATABASE_URL ||
    "https://disk-c98ee-default-rtdb.firebaseio.com");
  if (url.protocol !== "https:" || url.username || url.password || url.port ||
      !/^[a-z0-9-]+(?:\.[a-z0-9-]+)?\.(?:firebaseio\.com|firebasedatabase\.app)$/.test(url.hostname)) {
    throw new Error("Invalid Firebase database URL");
  }
  return new URL(id ? `/chat_snippets/${id}.json` : "/chat_snippets.json", url.origin);
}

function getAuth() {
  if (!auth) {
    const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    if (credentials.type !== "service_account" || !credentials.client_email || !credentials.private_key) {
      throw new Error("Invalid Firebase service account");
    }
    auth = new GoogleAuth({ credentials, scopes: databaseScopes });
  }
  return auth;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const secret = (process.env.CHAT_SECRET || "").trim();
  if (!secret || !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return res.status(503).json({ error: "Хранилище чата ещё не настроено." });
  }
  if (!authorized(req.headers["x-chat-secret"], secret)) {
    return res.status(401).json({ error: "Нужен ключ доступа к чату." });
  }

  const method = req.method;
  const id = req.query?.id;
  if (!["GET", "POST", "DELETE"].includes(method)) {
    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).end();
  }
  if (id !== undefined && (method !== "DELETE" || typeof id !== "string" || !validId.test(id))) {
    return res.status(400).json({ error: "Некорректный идентификатор сообщения." });
  }

  let message;
  if (method === "POST") {
    const { content, isCode, author } = req.body || {};
    if (typeof content !== "string" || !content.trim() || content.length > 100000 ||
        typeof isCode !== "boolean" || typeof author !== "string" || !author.trim() || author.length > 60) {
      return res.status(400).json({ error: "Сообщение должно содержать от 1 до 100 000 символов." });
    }
    message = { content, isCode, author, timestamp: Date.now() };
  }

  try {
    const url = chatUrl(id);
    const token = await getAuth().getAccessToken();
    if (!token) throw new Error("Missing Firebase access token");
    const upstream = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: message ? JSON.stringify(message) : undefined,
      signal: AbortSignal.timeout(8000),
      redirect: "error"
    });
    if (!upstream.ok) throw new Error(`Firebase returned HTTP ${upstream.status}`);
    if (method !== "GET") return res.status(204).end();

    const data = await upstream.json();
    const messages = Object.entries(data || {})
      .filter(([key, value]) => validId.test(key) && value &&
        typeof value.content === "string" && typeof value.author === "string")
      .map(([key, value]) => ({
        id: key,
        content: value.content,
        author: value.author,
        isCode: value.isCode === true,
        timestamp: typeof value.timestamp === "number" ? value.timestamp : 0
      }));
    return res.status(200).json(messages);
  } catch (error) {
    console.error("VDrop database operation failed", method, error.name);
    return res.status(502).json({ error: "Хранилище чата временно недоступно." });
  }
};
