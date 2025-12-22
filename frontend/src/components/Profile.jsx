// src/components/Profile.jsx
import React, { useState } from "react";
import { buttonStyle, cardStyle } from "../styles";

function Profile() {
  const [profile, setProfile] = useState({
    name: "Mannat Kathuria",
    age: 22,
    email: "mannat@example.com",
    phone: "1234567890",
    address: "123 Street, City, Country",
    bloodGroup: "O+",
    height: "175 cm",
    weight: "70 kg",
    allergies: "None",
    chronicDiseases: "None",
    medications: "Vitamin D",
    familyDoctors: ["Dr. Sharma - dr.sharma@example.com"],
    emergencyContact: "9876543210",
    notes: "No major health issues",
  });

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ ...profile });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setProfile({ ...formData });
    setEditMode(false);
  };

  const formatLabel = (key) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());

  // ---------------- UI ----------------
  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "20px" }}>
      {editMode ? (
        <form onSubmit={handleSubmit} style={{ ...cardStyle, padding: "20px", width: "500px" }}>
          <h3 style={{ textAlign: "center", color: "#4CAF50" }}>Edit Profile</h3>
          {Object.keys(formData).map(key => (
            <div key={key} style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
                {formatLabel(key)}
              </label>
              <input
                type={key === "email" ? "email" : "text"}
                name={key}
                value={formData[key]}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
          ))}
          <div style={{ textAlign: "center", marginTop: "15px" }}>
            <button type="submit" style={buttonStyle}>Save</button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              style={{ ...buttonStyle, marginLeft: "10px", background: "#f44336" }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div style={{ ...cardStyle, padding: "20px", minWidth: "400px", maxWidth: "90vw" }}>
          <h3 style={{ textAlign: "center", color: "#4CAF50" }}>Profile</h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "max-content 1fr",
            rowGap: "10px",
            columnGap: "20px",
          }}>
            {Object.entries(profile).map(([key, value]) => (
              <React.Fragment key={key}>
                <div style={{ fontWeight: "bold", textAlign: "right" }}>{formatLabel(key)}:</div>
                <div style={{ textAlign: "left" }}>
                  {Array.isArray(value) ? value.join(", ") : value}
                </div>
              </React.Fragment>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "15px" }}>
            <button onClick={() => setEditMode(true)} style={buttonStyle}>Edit</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
