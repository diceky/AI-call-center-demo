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

    const body = JSON.stringify({
        phone_number,
        voice: "0bcb8f02-3950-4e87-a988-6c65be206f30",
        task: defaultTask(),
        first_sentence: "お電話ありがとうございます。株式会社DHCサポートセンター、タナカでございます。ご用件をお伺いしてもよろしいでしょうか？",
        language: "ja-JP",
        background_track: "office",
        record: false,
        summary_prompt: "「株式会社DHC」のカスタマーサポート宛に、お客様からの電話でした。お客様についての情報、お客様のお問い合わせ内容、そしてそれに対するオペレーターの案内の内容を完結に日本語で要約してください。",
        persona_id: "162ef5ca-4ab2-4c1a-beb5-efb126f6e230",
        webhook: "https://ai-call-ceter-demo.netlify.app/.netlify/functions/webhook",
        tools:["KB-bf7832cb-5ea6-4130-a23a-cc53702289c5"],
      });
    
    console.log("[Start Call] Request Body:", body);

    const resp = await fetch("https://api.bland.ai/v1/calls", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: body
    });

    const data = await resp.json();
    if (!resp.ok) {
      return { statusCode: resp.status, body: JSON.stringify({ error: data?.error || data }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ call_id: data?.call_id || null, status: data?.status, raw: data }),
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