<div align="center">
  <h1>🎵 Spot' 95</h1>
  <h3>Your AI-Powered Music Mood Analyzer with a Nostalgic Windows 95 Twist</h3>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Spotify](https://img.shields.io/badge/Spotify-1ED760?style=flat&logo=spotify&logoColor=white)](https://developer.spotify.com/)
  
  <img src="frontend/public/screenshot.png" alt="Spot' 95 Screenshot" width="800" />
</div>

## 🎶 About Spot' 95

Spot' 95 is a unique music experience that blends AI-powered mood analysis with the nostalgic charm of Windows 95. This React application brings together modern music technology with retro computing aesthetics for a truly distinctive user experience.

## ✨ Features

- **Nostalgic Windows 95 Interface**
  - Fully functional desktop environment
  - Draggable, resizable windows
  - Classic UI elements and styling
  - Working Start menu and taskbar

- **Music Analysis**
  - Mood-based music recommendations using a faux AI algorithm
  - Real-time Spotify integration
  - Multiple mood categories (Chill, Energetic, Melancholic, Focused)
  - Direct links to Spotify for immediate listening
  > **Note:** This project currently uses a faux AI algorithm for demonstration purposes, with predefined mood-based recommendations. Future versions may integrate actual machine learning for mood analysis.

- **Customization**
  - Changeable wallpapers
  - Responsive design
  - Interactive UI elements with authentic Windows 95 feel

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **UI/UX**: Framer Motion, React Icons, React Draggable
- **AI/ML**: Python (for mood analysis)
- **Music**: Spotify Web API
- **Styling**: Custom Windows 95 theme with pixel-perfect components

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Python 3.9+
- Spotify Developer Account (for API access)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dragfer/spot95.git
   cd spot95
   ```

2. **Set up the backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**
   Create a `.env` file in the backend directory with your Spotify API credentials:
   ```env
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
   ```

## 🖥️ Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## 🎨 Customization

### Changing Wallpapers
Click the wallpaper icon in the taskbar to cycle through different retro wallpapers that match the Windows 95 aesthetic.

### Mood Analysis
Use the mood analyzer to get personalized music recommendations based on your current vibe.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Windows 95 for the nostalgic UI inspiration
- Spotify for their amazing API
- All the open-source libraries that made this project possible
