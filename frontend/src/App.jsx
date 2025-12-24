import React, { useState, useEffect } from "react";
import Profile from "./components/Profile";
import Logs from "./components/Logs";
import Doctors from "./components/Doctors";

function App() {
  const [activeTab, setActiveTab] = useState("profile");
  const tabs = [
    { id:"profile", label:"Profile" },
    { id:"logs", label:"Health Logs" },
    { id:"doctors", label:"Doctors" },
  ];

  return (
    <div style={{ fontFamily:"Arial, sans-serif", maxWidth:"1000px", margin:"auto", padding:"20px" }}>
      <h1 style={{textAlign:"center", color:"#4CAF50"}}>HealthVault Campus</h1>

      <div style={{ display:"flex", justifyContent:"center", marginBottom:"30px"}}>
        {tabs.map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
            style={{
              padding:"12px 25px",
              margin:"0 5px",
              border:"none",
              borderRadius:"8px 8px 0 0",
              cursor:"pointer",
              backgroundColor: activeTab===tab.id ? "#4CAF50" : "#ddd",
              color: activeTab===tab.id ? "#fff" : "#333",
              fontWeight:"bold",
              transition:"0.3s"
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{padding:"20px", border:"1px solid #ddd", borderRadius:"0 8px 8px 8px", minHeight:"400px", backgroundColor:"#f9f9f9"}}>
        {activeTab==="profile" && <Profile />}
        {activeTab==="logs" && <Logs />}
        {activeTab==="doctors" && <Doctors />}
      </div>
    </div>
  );
}

export default App;
