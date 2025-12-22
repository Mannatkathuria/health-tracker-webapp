// src/components/Logs.jsx
import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { cardStyle, inputStyle, buttonStyle } from "../styles";

function Logs() {
  // ---------------- STATES ----------------
  const [symptom, setSymptom] = useState("");
  const [medicine, setMedicine] = useState("");

  const [symptomsLogs, setSymptomsLogs] = useState([]);
  const [medicineLogs, setMedicineLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);

  const [summary, setSummary] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [tips, setTips] = useState([]);

  const [file, setFile] = useState(null);
  const [fileLabel, setFileLabel] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);

  //Fetch Data
  useEffect(() => {
    fetchAllLogs();
    fetchUploadedFiles();
  }, []);

  const fetchAllLogs = async () => {
    const sSnap = await getDocs(collection(db, "symptomsLogs"));
    const mSnap = await getDocs(collection(db, "medicineLogs"));
    const allSnap = await getDocs(collection(db, "healthLogs"));

    setSymptomsLogs(
      sSnap.docs.map(d => ({
        symptom: d.data().symptom,
        timestamp: d.data().timestamp?.toDate(),
      }))
    );

    setMedicineLogs(
      mSnap.docs.map(d => ({
        medicine: d.data().medicine,
        timestamp: d.data().timestamp?.toDate(),
      }))
    );

    setAllLogs(
      allSnap.docs
        .map(d => ({
          symptom: d.data().symptom || "—",
          medicine: d.data().medicine || "—",
          timestamp: d.data().timestamp?.toDate(),
        }))
        .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
    );
  };

  const fetchUploadedFiles = async () => {
    const snap = await getDocs(collection(db, "healthFiles"));
    setUploadedFiles(
      snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        timestamp: d.data().timestamp?.toDate(),
      }))
    );
  };

  //Add logs
  const addSymptom = async () => {
    if (!symptom) return alert("Enter a symptom");
    await addDoc(collection(db, "symptomsLogs"), { symptom, timestamp: serverTimestamp() });
    await addDoc(collection(db, "healthLogs"), { symptom, timestamp: serverTimestamp() });
    setSymptom("");
    fetchAllLogs();
  };

  const addMedicine = async () => {
    if (!medicine) return alert("Enter a medicine");
    await addDoc(collection(db, "medicineLogs"), { medicine, timestamp: serverTimestamp() });
    await addDoc(collection(db, "healthLogs"), { medicine, timestamp: serverTimestamp() });
    setMedicine("");
    fetchAllLogs();
  };

  //File Upload
  const handleFileUpload = async () => {
    if (!file || !fileLabel) {
      alert("Select file and label!");
      return;
    }

    try {
      const storageRef = ref(
        storage,
        `healthFiles/${Date.now()}_${file.name}`
      );

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
      fetchUploadedFiles();

      alert("File uploaded successfully ✅");
    } catch (err) {
      console.error("Upload error:", err);
      alert("File upload failed ❌");
    }
  };

  //AI summary
  const generateAISummary = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      setSummary("AI Analysis Generated");
      setAlerts(data.alerts || []);
      setTips(data.tips || []);
    } catch (e) {
      alert("AI server not running");
    }
  };

  //UI
  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", color: "#4CAF50" }}>Health Logs</h2>

      <div style={{ display: "flex", gap: "20px" }}>
        {/* LEFT SIDE */}
        <div style={{ flex: 1 }}>
          <h3>Symptoms</h3>
          <input
            style={inputStyle}
            placeholder="Add symptom"
            value={symptom}
            onChange={e => setSymptom(e.target.value)}
          />
          <button onClick={addSymptom} style={buttonStyle}>Add</button>

          <ul>
            {symptomsLogs.map((s, i) => (
              <li key={i}>
                {s.symptom} — {s.timestamp?.toLocaleString()}
              </li>
            ))}
          </ul>

          <h3>Medicines</h3>
          <input
            style={inputStyle}
            placeholder="Add medicine"
            value={medicine}
            onChange={e => setMedicine(e.target.value)}
          />
          <button onClick={addMedicine} style={buttonStyle}>Add</button>

          <ul>
            {medicineLogs.map((m, i) => (
              <li key={i}>
                {m.medicine} — {m.timestamp?.toLocaleString()}
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT SIDE */}
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
            {uploadedFiles.map(f => (
              <li key={f.id}>
                <a href={f.url} target="_blank" rel="noreferrer">
                  {f.label}
                </a>{" "}
                — {f.timestamp?.toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button onClick={generateAISummary} style={buttonStyle}>Generate AI Summary</button>
      </div>

      {summary && (
        <div style={cardStyle}>
          <h4>AI Summary</h4>
          <p>{summary}</p>
        </div>
      )}

      {alerts.length > 0 && (
        <div style={{ ...cardStyle, background: "#ffebee" }}>
          <h4 style={{ color: "#f44336" }}>⚠️ Alerts</h4>
          <ul>{alerts.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </div>
      )}

      {tips.length > 0 && (
        <div style={{ ...cardStyle, background: "#e0f7fa" }}>
          <h4>💡 Health Tips</h4>
          <ul>{tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      )}

      <h3>All Health Logs</h3>
      <ul>
        {allLogs.map((l, i) => (
          <li key={i}>
            {l.symptom} | {l.medicine} | {l.timestamp?.toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Logs;