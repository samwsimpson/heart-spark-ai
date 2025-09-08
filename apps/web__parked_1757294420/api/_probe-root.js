export default function handler(req, res) {
  res.status(200).json({ ok: true, from: "repo-root/api/_probe-root.js" });
}
