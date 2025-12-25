# 🩺 Health Tracker Web App

A modern web application that helps users manage their health profile, track daily health logs, receive AI-powered insights, and find nearby doctors using maps.

🔗 **Live Demo:**  
https://mannatkathuria.github.io/health-tracker-webapp/

---

## 🌟 Features

### 👤 Health Profile
- Create and manage personal health details
- Store basic medical information securely

### 📊 Health Logs
- Add daily health metrics (symptoms, vitals, notes)
- View health history in an organized manner

### 🤖 AI-Powered Health Insights
- AI-generated **health summaries**
- Smart **health tips** based on user data
- Automatic **alerts** for abnormal or risky values  
*(Powered by Google AI / Gemini API)*

### 🗺️ Nearby Doctors (Maps Integration)
- Find doctors near the user’s location
- Displays doctor name, address, and specialization
- Clean card-based UI for better readability

### 🎨 User Interface
- Responsive and clean UI
- Tab-based navigation for smooth experience
- Card-style layouts for better visual clarity

---

## 🧠 Google Technologies & AI Tools Used ⭐

- **Google Gemini API** – AI-generated summaries, tips, and alerts
- **Firebase** – Backend services and data handling

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite
- **Backend / Services:** Firebase
- **AI:** Google Gemini API
- **Maps:** OpenStreetMap API
- **Hosting:** GitHub Pages

---

## 🚀 Getting Started (Run Locally)

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Installation

```bash
git clone https://github.com/Mannatkathuria/health-tracker-webapp.git
cd health-tracker-webapp/frontend
npm install
npm run dev
The app will run on:
```
```arduino
Copy code
http://localhost:5173
🔐 Environment Variables
Create a .env file inside the frontend folder:
```
```env
Copy code
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
⚠️ Never commit your .env file to GitHub.

📂 Project Structure
txt
Copy code
frontend/
 ├── src/
 │   ├── components/
 │   ├── firebase.js
 │   ├── App.jsx
 │   └── main.jsx
 ├── public/
 ├── docs/        # GitHub Pages build output
 ├── vite.config.js
 └── package.json
📌 Future Enhancements
User authentication (login/signup)

Appointment booking with doctors

Health data charts and analytics

Improved AI personalization

Mobile-first UI improvements
```
👨‍💻 Author
Mannat Kathuria
GitHub: https://github.com/Mannatkathuria

⭐ Acknowledgements
Google AI (Gemini)

Firebase

React & Vite

🔗 **Reffer to**  
https://youtu.be/eBnH356SjqU
