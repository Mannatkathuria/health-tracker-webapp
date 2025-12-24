import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { cardStyle, inputStyle, buttonStyle } from "../styles";

function Logs() {
  // ---------------- STATES ----------------
  const [allLogs, setAllLogs] = useState([]);
  const [fileUploads, setFileUploads] = useState([]);

  const [symptom, setSymptom] = useState("");
  const [medicine, setMedicine] = useState("");
  const [file, setFile] = useState(null);
  const [fileLabel, setFileLabel] = useState("");

  const [summary, setSummary] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [tips, setTips] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  // ---------------- FETCH DATA ----------------
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [logsSnap, filesSnap] = await Promise.all([
        getDocs(collection(db, "healthLogs")),
        getDocs(collection(db, "healthFiles"))
      ]);

      setAllLogs(
        logsSnap.docs
          .map(d => ({
            id: d.id,
            symptom: d.data().symptom || "—",
            medicine: d.data().medicine || "—",
            timestamp: d.data().timestamp?.toDate(),
          }))
          .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      );

      setFileUploads(
        filesSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          timestamp: d.data().timestamp?.toDate(),
        }))
      );
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  // ---------------- ADD LOGS ----------------
  const addLog = async (type, value, setter) => {
    if (!value) return alert(`Enter a ${type}`);
    try {
      await addDoc(collection(db, `${type}Logs`), { [type]: value, timestamp: serverTimestamp() });
      await addDoc(collection(db, "healthLogs"), { [type]: value, timestamp: serverTimestamp() });
      setter("");
      fetchAllData();
    } catch (err) {
      console.error("Add log error:", err);
      alert(`Failed to add ${type}`);
    }
  };

  // ---------------- FILE UPLOAD ----------------
  const handleFileUpload = async () => {
    if (!file || !fileLabel) return alert("Select file and label!");

    try {
      const storageRef = ref(storage, `healthFiles/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "healthFiles"), {
        url,
        label: fileLabel,
        type: file.type,
        timestamp: serverTimestamp(),
      });

      setFile(null);
      setFileLabel("");
      fetchAllData();
      alert("File uploaded successfully ✅");
    } catch (err) {
      console.error("Upload error:", err);
      alert("File upload failed ❌");
    }
  };

  // ---------------- AI SUMMARY ----------------
  const generateAISummary = async () => {
    setLoadingAI(true);
    try {
      const cleanLogs = allLogs.map(log => ({
        symptom: String(log.symptom || ""),
        medicine: String(log.medicine || ""),
        date: log.timestamp ? log.timestamp.toLocaleString() : "N/A"
      }));

      const res = await fetch("http://127.0.0.1:8000/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs: cleanLogs }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Server Error");
      }

      setSummary(data.summary || "");
      setAlerts(data.alerts || []);
      setTips(data.tips || []);

    } catch (err) {
      alert(`AI server error: ${err.message} ❌`);
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  // ---------------- FILTERS ----------------
  const symptomLogs = allLogs.filter(l => l.symptom && l.symptom !== "—");
  const medicineLogs = allLogs.filter(l => l.medicine && l.medicine !== "—");

  // ---------------- UI ----------------
  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", color: "#4CAF50" }}>Health Logs</h2>

      <div style={{ display: "flex", gap: "20px" }}>
        {/* LEFT: SYMPTOMS & MEDICINES */}
        <div style={{ flex: 1 }}>
          <h3>Symptoms</h3>
          <input
            style={inputStyle}
            placeholder="Add symptom"
            value={symptom}
            onChange={e => setSymptom(e.target.value)}
          />
          <button onClick={() => addLog("symptom", symptom, setSymptom)} style={buttonStyle}>Add</button>
          <ul>
            {symptomLogs.map((s, i) => (
              <li key={i}>{s.symptom} — {s.timestamp?.toLocaleString()}</li>
            ))}
          </ul>

          <h3>Medicines</h3>
          <input
            style={inputStyle}
            placeholder="Add medicine"
            value={medicine}
            onChange={e => setMedicine(e.target.value)}
          />
          <button onClick={() => addLog("medicine", medicine, setMedicine)} style={buttonStyle}>Add</button>
          <ul>
            {medicineLogs.map((m, i) => (
              <li key={i}>{m.medicine} — {m.timestamp?.toLocaleString()}</li>
            ))}
          </ul>
        </div>

        {/* RIGHT: FILE UPLOAD */}
        <div style={{ flex: 1 }}>
          <h3>Upload Scans / Reports</h3>
          <input type="file" onChange={e => setFile(e.target.files[0])} />
          <input
            style={inputStyle}
            placeholder="Label (X-ray, Blood Test)"
            value={fileLabel}
            onChange={e => setFileLabel(e.target.value)}
          />
          <button onClick={handleFileUpload} style={buttonStyle}>Upload</button>

          <ul>
            {fileUploads.map(f => (
              <li key={f.id}>
                <a href={f.url} target="_blank" rel="noreferrer">{f.label}</a> — {f.timestamp?.toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button onClick={generateAISummary} style={buttonStyle} disabled={loadingAI}>
          {loadingAI ? "Generating..." : "Generate AI Summary"}
        </button>
      </div>

      <div style={{
        display: "flex",
        gap: "16px",
        flexWrap: "wrap",
      }}>
        
        {summary && (
          <div style={{ ...cardStyle, flex: 1 }}>
            <h4>AI Summary</h4>
            <p>{summary}</p>
          </div>
        )}

        {alerts.length > 0 && (
          <div style={{ ...cardStyle, background: "#ffebee", flex: 1 }}>
            <h4 style={{ color: "#f44336" }}>⚠️ Alerts</h4>
            <ul>{alerts.map((a, i) => <li key={i}>{a}</li>)}</ul>
          </div>
        )}

        {tips.length > 0 && (
          <div style={{ ...cardStyle, background: "#e0f7fa", flex: 1 }}>
            <h4>💡 Health Tips</h4>
            <ul>{tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
          </div>
        )}

      </div>


      <h3>All Health Logs</h3>
      <ul>
        {allLogs.map((l, i) => (
          <li key={i}>{l.symptom} | {l.medicine} | {l.timestamp?.toLocaleString()}</li>
        ))}
      </ul>
    </div>
  );
}

export default Logs;
