exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  const payload = event.body || "{}";
  console.log("[Bland Webhook]", payload);
  // TODO: render summary on the frontend
  return { statusCode: 200, body: "ok" };
};