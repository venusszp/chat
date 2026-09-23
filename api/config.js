// Vercel Serverless Function: GET /api/config
module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-chat-secret");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const chatSecret = (process.env.CHAT_SECRET || "").trim();
  if (chatSecret) {
    const clientKey = (req.headers["x-chat-secret"] || req.query.secret || "").trim();
    if (clientKey !== chatSecret) {
      return res.status(200).json({
        protected: true,
        authenticated: false
      });
    }
  }

  return res.status(200).json({
    protected: Boolean(chatSecret),
    authenticated: true,
    apiKey: process.env.FIREBASE_API_KEY || "",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "disk-c98ee.firebaseapp.com",
    databaseURL: process.env.FIREBASE_DATABASE_URL || "https://disk-c98ee-default-rtdb.firebaseio.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "disk-c98ee",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "disk-c98ee.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "59577059636",
    appId: process.env.FIREBASE_APP_ID || "1:59577059636:web:e98f456d054cc360747d61"
  });
};
