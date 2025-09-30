// Simple storage for webhook data
global.webhookData = global.webhookData || {};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    console.log("[Bland Webhook]", payload);
    
    // Store the webhook payload using call_id as key
    if (payload.call_id) {
      global.webhookData[payload.call_id] = {
        ...payload,
        received_at: new Date().toISOString()
      };
      console.log(`[Webhook] Stored data for call_id: ${payload.call_id}`);
    }
    
    return { statusCode: 200, body: "ok" };
  } catch (error) {
    console.error("[Webhook] Error processing payload:", error);
    return { statusCode: 200, body: "ok" }; // Still return 200 to avoid retries
  }
};