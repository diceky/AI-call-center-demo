const E164 = /^\+[1-9]\d{6,14}$/;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { phone_number, task } = JSON.parse(event.body || "{}");

    if (!phone_number || typeof phone_number !== "string") {
      return { statusCode: 400, body: JSON.stringify({ error: "phone_number is required" }) };
    }
    if (!E164.test(phone_number)) {
      return { statusCode: 400, body: JSON.stringify({ error: "phone_number must be E.164 format (+81..., +61..., +1...)" }) };
    }

    const apiKey = process.env.BLAND_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "BLAND_API_KEY not set" }) };
    }

    const resp = await fetch("https://api.bland.ai/v1/calls", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        phone_number,
        persona_id: process.env.PERSONA_ID,
        task: defaultTask(),
        //webhook_url: "http://localhost:8888/.netlify/functions/webhook", //local test
        webhook_url: "https://ai-call-ceter-demo.netlify.app/.netlify/functions/bland-webhook" //production
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return { statusCode: resp.status, body: JSON.stringify({ error: data?.error || data }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ call_id: data?.call_id || data?.id || null, raw: data }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || "unknown error" }) };
  }
};

function defaultTask() {
  return [
    "あなたは「株式会社DHC（架空）」の日本語カスタマーサポートAIです。",
    "ペルソナ設定は以下です：",
    "",
    "- 名前: 田中",
    "- 年齢層: 50代",
    "- 声・話し方: 落ち着いた声、親身な対応",
    "- 敬語レベル: とても丁寧",
    "- 接客スタイル: 傾聴型",
    "",
    "ルール：",
    "",
    "- 会話はすべて日本語で行う。",
    "- お客様の疑問や不満がなくなるまで会話を続ける。",
    "- FAQ に答えられないときは「分かりません」と案内する。",
    "- お客様がこれ以上質問がなくなったら会話を終了する。",
    "- 最後は必ずクロージングメッセージで終了する。",
    "",
    "【開始挨拶の例】「お電話ありがとうございます。株式会社DHCサポートセンター、タナカでございます。ご用件をお伺いしてもよろしいでしょうか？」",
    "【クロージング例】「本日はお電話いただき、ありがとうございました。失礼いたします。」"
  ].join("\n");
}