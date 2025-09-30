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

    } catch (error) {
      setError(error.message || "unknown error");
      //console.log(error.message)
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="wrapper">
        <h1 className="title">AIコールセンターに電話してみよう！</h1>
        <p className="subtitle">あなたの電話番号を入力してください。AIコールセンターから電話がかかってきます。</p>
        <p className="warning">*あくまでもシミュレーションです</p>

        <div className="inputWrapper">
          <PhoneInput
            defaultCountry="JP"
            placeholder="電話番号を入力してください"
            value={phone}
            onChange={setPhone}
          />

          <button onClick={startCall} disabled={loading} className="call-button">
            {loading ? "電話中..." : "電話をかける"}
          </button>
        </div>

        {error && <p style={{ color: "#c1121f", marginTop: 12 }}>
          {JSON.stringify(error)}
          </p>
        }

        {result && (
          <div className="result">
            <h2>Call Result</h2>
            <p><strong>status:</strong> {result.status || "(n/a)"} </p>
            <p><strong>call_id:</strong> {result.call_id || "(n/a)"} </p>
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