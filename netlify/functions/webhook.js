const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    console.log("[Bland Webhook]", payload);
    
    if (payload.call_id) {
      const store = getStore('webhook-data');
      await store.set(payload.call_id, JSON.stringify({
        ...payload,
        received_at: new Date().toISOString()
      }));
      console.log(`[Webhook] Stored data for call_id: ${payload.call_id}`);
    }
    
    return { statusCode: 200, body: "ok" };
  } catch (error) {
    console.error("[Webhook] Error processing payload:", error);
    return { statusCode: 200, body: "ok" };
  }
};