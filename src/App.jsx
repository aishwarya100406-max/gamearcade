import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GameHub from './GameHub';
import NeonRush from './games/subway/SubwayGame'; // This is now the combined game
import StackGame from './games/stack/StackGame';

function App() {
  return (
    <BrowserRouter>
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
        <Routes>
          <Route path="/" element={<GameHub />} />
          <Route path="/runner" element={<NeonRush />} />
          <Route path="/stack" element={<StackGame />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
