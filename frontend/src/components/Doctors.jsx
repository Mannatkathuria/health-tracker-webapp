// src/components/Doctors.jsx
import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, Timestamp, addDoc } from "firebase/firestore";
import { db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { cardStyle, buttonStyle } from "../styles";

function Doctors() {
  const [logs, setLogs] = useState([]);
  const [familyDoctors, setFamilyDoctors] = useState([]);
  const [newDoctorName, setNewDoctorName] = useState("");
  const [newDoctorEmail, setNewDoctorEmail] = useState("");
  const [nearbyDoctors, setNearbyDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const GOOGLE_API_KEY = "AIzaSyDl1tJJSR9jM-06OputSzTMV0gUXVgZLmE"; // Replace with your key

  // Fetch last 3 days logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const threeDaysAgo = Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
        const logsRef = collection(db, "healthLogs");
        const q = query(logsRef, where("timestamp", ">=", threeDaysAgo));
        const qs = await getDocs(q);
        const fetchedLogs = qs.docs.map(doc => {
          const d = doc.data();
          return {
            symptom: d.symptom || "N/A",
            medicine: d.medicine || "N/A",
            file: d.file || null,
            timestamp: d.timestamp?.toDate()
          };
        });
        setLogs(fetchedLogs);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLogs();
  }, []);

  // Nearby doctors logic omitted for brevity (same as before)

  // Fetch family doctors on component mount
  useEffect(() => {
    const fetchFamilyDoctors = async () => {
      try {
        const q = collection(db, "familyDoctors");
        const qs = await getDocs(q);
        const docs = qs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFamilyDoctors(docs);
      } catch (err) {
        console.error(err);
      }
    };
    fetchFamilyDoctors();
  }, []);

  // Add new family doctor
  const addFamilyDoctor = async () => {
    if (!newDoctorName) return alert("Enter doctor name");
    const doctor = { name: newDoctorName, email: newDoctorEmail };
    
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

  // Delete family doctor
  const deleteFamilyDoctor = async (id) => {
    try {
      await db.collection("familyDoctors").doc(id).delete(); // or using the modular syntax below
      setFamilyDoctors(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete doctor");
    }
  };

  // Upload file
  const handleFileUpload = async (file, index) => {
    if (!file) return;
    try {
      const storageRef = ref(storage, `healthFiles/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setLogs(prev => {
        const newLogs = [...prev];
        newLogs[index].file = url;
        return newLogs;
      });

      alert("File uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("File upload failed!");
    }
  };

  // Generate CSV content
  const generateCSV = () => {
    if (logs.length === 0) return null;

    // Count recurring symptoms
    const symptomCount = {};
    logs.forEach(l => {
      const s = l.symptom.toLowerCase();
      symptomCount[s] = (symptomCount[s] || 0) + 1;
    });

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Timestamp,Symptom,Medicine,File URL,Flag\n";

    logs.forEach(l => {
      const ts = l.timestamp?.toLocaleString() || "N/A";
      const fileLink = l.file ? `=HYPERLINK("${l.file}", "View")` : "N/A";

      // Flag alarming symptoms or frequent ones
      const freq = symptomCount[l.symptom.toLowerCase()] || 0;
      const flag = freq >= 2 || ["high fever", "severe pain"].includes(l.symptom.toLowerCase()) ? "⚠" : "";

      csvContent += `"${ts}","${l.symptom}","${l.medicine}","${fileLink}","${flag}"\n`;
    });

    return csvContent;
  };

  // Download CSV
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

  // Email CSV (hook to backend)
  const emailCSV = async () => {
    const csvContent = generateCSV();
    if (!csvContent) return alert("No logs to share!");

    const emails = familyDoctors.map(d => d.email).join(",");
    alert(`This will send CSV to: ${emails}`);
  };

  return (
    <div>
      <h2 style={{ textAlign: "center", color: "#4CAF50" }}>Doctors</h2>

      <h4>Family Doctors:</h4>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {familyDoctors.map((d, i) =>
          <li key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
            <span>{d.name} - {d.email}</span>
            <span
              style={{ color: "red", cursor: "pointer", fontWeight: "bold" }}
              onClick={() => deleteFamilyDoctor(d.id)}
            >
              delete
            </span>
          </li>
        )}
      </ul>
      <input type="text" placeholder="Doctor Name" value={newDoctorName} onChange={e => setNewDoctorName(e.target.value)} />
      <input type="email" placeholder="Doctor Email" value={newDoctorEmail} onChange={e => setNewDoctorEmail(e.target.value)} />
      <button onClick={addFamilyDoctor} style={buttonStyle}>Add Doctor</button>

      <h4 style={{ marginTop: "30px" }}>Last 3 Days Health Logs:</h4>
      {logs.length === 0 ? <p>No logs in last 3 days.</p> :
        <ul>
          {logs.map((l, i) =>
            <li key={i}>
              <strong>Symptom:</strong> {l.symptom}, 
              <strong>Medicine:</strong> {l.medicine}, 
              <strong>File:</strong> {l.file ? <a href={l.file} target="_blank">View</a> : "N/A"},
              <input type="file" onChange={e => handleFileUpload(e.target.files[0], i)} />
              <strong>Time:</strong> {l.timestamp?.toLocaleString() || "N/A"}
            </li>
          )}
        </ul>
      }

      <div style={{ textAlign: "center", marginTop: "15px", display: "flex", gap: "15px", justifyContent: "center" }}>
        <button onClick={downloadCSV} style={buttonStyle}>Download CSV</button>
        <button onClick={emailCSV} style={buttonStyle}>Email CSV</button>
      </div>

      <h4 style={{ marginTop: "30px" }}>Nearby Doctors:</h4>
      {loadingDoctors ? <p>Loading nearby doctors...</p> :
        nearbyDoctors.length === 0 ? <p>No nearby doctors found.</p> :
          <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
            {nearbyDoctors.map((d, i) =>
              <div key={i} style={cardStyle}>
                <strong>{d.name}</strong>
                <p>{d.vicinity || d.formatted_address}</p>
                <p>Rating: {d.rating || "N/A"}</p>
              </div>
            )}
          </div>
      }
    </div>
  );
}

export default Doctors;
