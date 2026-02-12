import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GameHub from './GameHub';
import SubwayGame from './games/subway/SubwayGame';
import RaceGame from './games/race/RaceGame';

function App() {
  return (
    <BrowserRouter>
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <Routes>
          <Route path="/" element={<GameHub />} />
          <Route path="/subway" element={<SubwayGame />} />
          <Route path="/race" element={<RaceGame />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
