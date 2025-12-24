import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  addDoc,
  doc,
  deleteDoc
} from "firebase/firestore";
import { db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { cardStyle, buttonStyle, inputStyle } from "../styles";

function Doctors() {
  const [logs, setLogs] = useState([]);
  const [familyDoctors, setFamilyDoctors] = useState([]);
  const [newDoctorName, setNewDoctorName] = useState("");
  const [newDoctorEmail, setNewDoctorEmail] = useState("");
  const [loadingDoctors] = useState(false); 
  const [nearbyDoctors, setNearbyDoctors] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  const GOOGLE_API_KEY = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;

  // --- Fetch last 3 days logs ---
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const threeDaysAgo = Timestamp.fromDate(
          new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        );
        const logsRef = collection(db, "healthLogs");
        const q = query(logsRef, where("timestamp", ">=", threeDaysAgo));
        const qs = await getDocs(q);
        const fetchedLogs = qs.docs.map(dref => {
          const d = dref.data();
          return {
            id: dref.id,
            symptom: (d.symptom || "N/A").trim(),
            medicine: d.medicine || "N/A",
            file: d.file || null,
            timestamp: d.timestamp?.toDate()
          };
        });
        
        fetchedLogs.sort(
          (a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
        );
        setLogs(fetchedLogs);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLogs();
  }, []);

  // --- Fetch family doctors ---
  useEffect(() => {
    const fetchFamilyDoctors = async () => {
      try {
        const qs = await getDocs(collection(db, "familyDoctors"));
        const docs = qs.docs.map(dref => ({ id: dref.id, ...dref.data() }));
        setFamilyDoctors(docs);
      } catch (err) {
        console.error(err);
      }
    };
    fetchFamilyDoctors();
  }, []);

  // --- Add new family doctor ---
  const addFamilyDoctor = async () => {
    if (!newDoctorName.trim()) return alert("Enter doctor name");
    const doctor = {
      name: newDoctorName.trim(),
      email: newDoctorEmail.trim()
    };
    try {
      const docRef = await addDoc(collection(db, "familyDoctors"), doctor);
      setFamilyDoctors(prev => [...prev, { id: docRef.id, ...doctor }]);
      setNewDoctorName("");
      setNewDoctorEmail("");
    } catch (err) {
      console.error(err);
      alert("Failed to add doctor");
    }
  };

  // --- Delete family doctor ---
  const deleteFamilyDoctor = async id => {
    try {
      await deleteDoc(doc(db, "familyDoctors", id));
      setFamilyDoctors(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete doctor");
    }
  };

  // --- Upload file ---
  const handleFileUpload = async (file, index) => {
    if (!file) return;
    try {
      const storageRef = ref(storage, `healthFiles/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setLogs(prev =>
        prev.map((l, i) => (i === index ? { ...l, file: url } : l))
      );
      alert("File uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("File upload failed!");
    }
  };

  // --- Generate CSV ---
  const generateCSV = () => {
    if (!logs.length) return null;

    const symptomCount = {};
    logs.forEach(l => {
      const s = (l.symptom || "N/A").toLowerCase();
      symptomCount[s] = (symptomCount[s] || 0) + 1;
    });

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Timestamp,Symptom,Medicine,File URL,Flag\n";

    logs.forEach(l => {
      const ts = l.timestamp?.toLocaleString() || "N/A";
      const fileLink = l.file ? `=HYPERLINK("${l.file}", "View")` : "N/A";
      const freq = symptomCount[(l.symptom || "N/A").toLowerCase()] || 0;
      const urgentTerms = ["high fever", "severe pain"];
      const flag = freq >= 2 || urgentTerms.includes((l.symptom || "").toLowerCase()) ? "⚠" : "";
      csvContent += `"${ts}","${l.symptom}","${l.medicine}","${fileLink}","${flag}"\n`;
    });

    return csvContent;
  };

  // --- Download CSV ---
  const downloadCSV = () => {
    const csvContent = generateCSV();
    if (!csvContent) return alert("No logs to share!");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "health_logs_last_3_days.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Email CSV (placeholder) ---
  const emailCSV = async () => {
    const csvContent = generateCSV();
    if (!csvContent) return alert("No logs to share!");

    const emails = familyDoctors.map(d => d.email).join(",");
    alert(`This would send CSV to: ${emails}`);
    // await fetch('/api/send-csv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emails, csvContent }) });
  };

  // --- Fetch Nearby Doctors ---
  const fetchNearbyDoctors = () => {
    setLoadingNearby(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `http://127.0.0.1:8000/nearby-doctors?lat=${latitude}&lng=${longitude}`
          );
          const data = await response.json();
          
          if (data.doctors) {
            setNearbyDoctors(data.doctors);
          }
        } catch (err) {
          console.error("Failed to fetch nearby doctors:", err);
          alert("Could not connect to backend server.");
        } finally {
          setLoadingNearby(false);
        }
      },
      (error) => {
        setLoadingNearby(false);
        alert("Location access denied. Please enable GPS.");
      }
    );
  };

  return (
    <div>
      <h2 style={{ textAlign: "center", color: "#4CAF50" }}>Doctors</h2>

      <h4>Family Doctors:</h4>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {familyDoctors.map(d => (
          <li
            key={d.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "5px"
            }}
          >
            <span>
              {d.name} - {d.email}
            </span>
            <span
              style={{ color: "red", cursor: "pointer", fontWeight: "bold" }}
              onClick={() => deleteFamilyDoctor(d.id)}
            >
              delete
            </span>
          </li>
        ))}
      </ul>

      <input
        type="text"
        placeholder="Doctor Name"
        value={newDoctorName}
        style={inputStyle} 
        onFocus={e => (e.currentTarget.style.border = "1px solid #4CAF50")}
        onBlur={e => (e.currentTarget.style.border = inputStyle.border || "1px solid #ccc")} // safe fallback
        onChange={e => setNewDoctorName(e.target.value)}
      />

      <input
        type="email"
        placeholder="Doctor Email"
        value={newDoctorEmail}
        style={inputStyle} 
        onFocus={e => (e.currentTarget.style.border = "1px solid #4CAF50")}
        onBlur={e => (e.currentTarget.style.border = inputStyle.border || "1px solid #ccc")} // safe fallback
        onChange={e => setNewDoctorEmail(e.target.value)}
      />

      <button
        style={buttonStyle}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#45a049")}
        onMouseLeave={e =>
          (e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor)
        }
        onClick={addFamilyDoctor}
      >
        Add Doctor
      </button>

      <h4 style={{ marginTop: "30px" }}>Last 3 Days Health Logs:</h4>
      {logs.length === 0 ? (
        <p>No logs in last 3 days.</p>
      ) : (
        <ul>
          {logs.map((l, i) => (
            <li key={i}>
              <strong>Symptom:</strong> {l.symptom},{" "}
              <strong>Medicine:</strong> {l.medicine},{" "}
              <strong>File:</strong>{" "}
              {l.file ? (
                <a href={l.file} target="_blank" rel="noreferrer">
                  View
                </a>
              ) : (
                "N/A"
              )}
              <input
                type="file"
                onChange={e => handleFileUpload(e.target.files[0], i)}
              />{" "}
              <strong>Time:</strong> {l.timestamp?.toLocaleString() || "N/A"}
            </li>
          ))}
        </ul>
      )}

      <div
        style={{
          textAlign: "center",
          marginTop: "15px",
          display: "flex",
          gap: "15px",
          justifyContent: "center"
        }}
      >
        <button
          style={buttonStyle}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#45a049")}
          onMouseLeave={e =>
            (e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor)
          }
          onClick={downloadCSV}
        >
          Download CSV
        </button>

        <button
          style={buttonStyle}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#45a049")}
          onMouseLeave={e =>
            (e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor)
          }
          onClick={emailCSV}
        >
          Email CSV
        </button>
      </div>

      <h4 style={{ marginTop: "30px" }}>Nearby Doctors:</h4>
      <button 
        style={{ ...buttonStyle, marginBottom: "20px", backgroundColor: "#2196F3" }}
        onClick={fetchNearbyDoctors}
        disabled={loadingNearby}
      >
        {loadingNearby ? "Searching..." : "Find Doctors Near Me"}
      </button>

      {nearbyDoctors.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
          {nearbyDoctors.map((doc, index) => (
            <div key={index} style={{ ...cardStyle, borderLeft: "5px solid #2196F3" }}>
              <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{doc.name}</div>
              <div style={{ color: "#666", fontSize: "0.9rem" }}>{doc.address}</div>
              <div style={{ marginTop: "5px" }}>
                <span style={{ 
                  backgroundColor: "#e3f2fd", 
                  color: "#1976d2", 
                  padding: "2px 8px", 
                  borderRadius: "4px", 
                  fontSize: "0.8rem",
                  textTransform: "capitalize"
                }}>
                  {doc.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loadingNearby && <p style={{ color: "#888" }}>Click the button to see doctors in your area.</p>
      )}
    </div>
  );
}

export default Doctors;