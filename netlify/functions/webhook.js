exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  const payload = event.body || "{}";
  console.log("[Bland Webhook]", payload);
  // TODO: render call summary on frontend
  return { statusCode: 200, body: "ok" };
};