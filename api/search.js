const { handleApiRequest, searchHandler } = require("./_lib/core");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  return handleApiRequest(req, res, "/api/search", searchHandler);
};
