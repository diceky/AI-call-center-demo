exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { call_id } = event.queryStringParameters || {};
    
    if (!call_id) {
      return { statusCode: 400, body: JSON.stringify({ error: "call_id is required" }) };
    }

    // Check if we have webhook data for this call
    const webhookData = global.webhookData || {};
    const callData = webhookData[call_id];
    
    if (!callData) {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          found: false, 
          message: "Webhook data not yet received" 
        }) 
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        found: true, 
        data: callData 
      }),
    };
  } catch (e) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: e?.message || "unknown error" }) 
    };
  }
};
