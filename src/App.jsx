import { useState, useEffect, useRef } from 'react'
import './App.css'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'


const E164 = /^\+[1-9]\d{6,14}$/;

export default function App() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [webhookData, setWebhookData] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingInterval = useRef(null);

  async function startCall() {
    setError(null);
    setResult(null);
    setWebhookData(null);
    
    if (!E164.test(phone)) {
      setError("電話番号はE.164形式（+81..., +61..., +1...）で入力してください。");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/start-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: phone,
        }),
      });
      const json = await res.json();
      if (!res.ok){
        //console.log(JSON.stringify(json?.error));
        throw new Error(json?.error.message || "Failed to start call");
      }
      setResult(json);
      
      // Start polling for webhook data
      if (json.call_id) {
        startPolling(json.call_id);
      }
    } catch (error) {
      setError(error.message || "unknown error");
      //console.log(error.message)
    } finally {
      setLoading(false);
    }
  }

  function startPolling(callId) {
    setIsPolling(true);
    pollingInterval.current = setInterval(async () => {
      try {
        const response = await fetch(`/.netlify/functions/get-webhook-data?call_id=${callId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.found) {
            setWebhookData(data.data);
            stopPolling();
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 2000); // Poll every 2 seconds
  }

  function stopPolling() {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    setIsPolling(false);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, []);

  return (
    <>
      <div className="wrapper">
        <h1 className="title">AIコールセンターに電話してみよう！</h1>
        <p className="subtitle">あなたの電話番号を入力してください。AIコールセンターから電話がかかってきます。</p>
        <p className="warning">*あくまでもシミュレーションです</p>

        <PhoneInput
          defaultCountry="JP"
          placeholder="電話番号を入力してください"
          value={phone}
          onChange={setPhone}
        />

        <button onClick={startCall} disabled={loading} className="call-button">
          {loading ? "電話中..." : "電話をかける"}
        </button>

        {error && <p style={{ color: "#c1121f", marginTop: 12 }}>
          {JSON.stringify(error)}
          </p>
        }

        {result && (
          <div className="result">
            <h2>Call Result</h2>
            <div><strong>status:</strong> {result.status || "(n/a)"} </div>
            <div><strong>call_id:</strong> {result.call_id || "(n/a)"} </div>
            
            {isPolling && (
              <div style={{ color: "#2196F3", marginTop: 12, padding: 8, background: "#e3f2fd", borderRadius: 4 }}>
                🔄 通話中...
              </div>
            )}
            
            {webhookData && (
              <div className="webhook-data" style={{ marginTop: 16 }}>
                <h3>📞 通話結果</h3>
                
                <div style={{ 
                  background: "#f0f8ff", 
                  padding: 16, 
                  borderRadius: 8, 
                  marginBottom: 12,
                  border: "1px solid #b3d9ff"
                }}>
                  <div><strong>通話時間:</strong> {webhookData.corrected_duration}秒</div>
                  <div><strong>開始時刻:</strong> {new Date(webhookData.started_at).toLocaleString('ja-JP')}</div>
                  <div><strong>終了時刻:</strong> {new Date(webhookData.end_at).toLocaleString('ja-JP')}</div>
                  <div><strong>通話料金:</strong> ${webhookData.price}</div>
                </div>

                {webhookData.summary && (
                  <div style={{ 
                    background: "#f8fff8", 
                    padding: 16, 
                    borderRadius: 8, 
                    marginBottom: 12,
                    border: "1px solid #c8e6c9"
                  }}>
                    <h4>📝 通話サマリー</h4>
                    <p style={{ lineHeight: 1.6 }}>{webhookData.summary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="footer">
        Made with 🫶 at
        <a
          href="https://duhhh.co"
          className="footer-link"
          target="_blank"
          rel="noreferrer"
        >
          duhhh
        </a>
      </div>
    </>
  );
}