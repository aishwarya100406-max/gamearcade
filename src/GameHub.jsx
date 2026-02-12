import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GameCard = ({ title, emoji, color, path, description }) => {
    const navigate = useNavigate();
    const [hover, setHover] = useState(false);

    return (
        <div
            onClick={() => navigate(path)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                flex: 1,
                margin: '20px',
                padding: '40px',
                borderRadius: '20px',
                background: `linear-gradient(135deg, ${color}22, ${color}44)`,
                border: `2px solid ${hover ? color : 'rgba(255,255,255,0.1)'}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: hover ? 'scale(1.05) translateY(-10px)' : 'scale(1)',
                boxShadow: hover ? `0 20px 40px -10px ${color}66` : '0 10px 20px -5px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                textDecoration: 'none'
            }}
        >
            <div style={{ fontSize: '80px', marginBottom: '20px', filter: hover ? 'drop-shadow(0 0 20px rgba(255,255,255,0.5))' : 'none', transition: 'filter 0.3s' }}>
                {emoji}
            </div>
            <h2 style={{ fontSize: '32px', margin: '0 0 10px 0', fontFamily: 'Outfit, sans-serif' }}>{title}</h2>
            <p style={{ opacity: 0.7, textAlign: 'center', fontSize: '18px' }}>{description}</p>

            <div style={{
                marginTop: '30px',
                padding: '10px 30px',
                background: hover ? color : 'rgba(255,255,255,0.1)',
                borderRadius: '30px',
                fontWeight: 'bold',
                transition: 'background 0.3s'
            }}>
                PLAY NOW
            </div>
        </div>
    );
};

const GameHub = () => {
    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Outfit, sans-serif'
        }}>
            <h1 style={{
                fontSize: '60px',
                marginBottom: '60px',
                background: 'linear-gradient(to right, #60a5fa, #c084fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(192, 132, 252, 0.3)'
            }}>
                ARCADE HUB
            </h1>

            <div style={{
                display: 'flex',
                width: '80%',
                maxWidth: '1000px',
                height: '500px'
            }}>
                <GameCard
                    title="Cyber Runner"
                    emoji="🏃"
                    color="#3b82f6"
                    path="/subway"
                    description="Dodge obstacles and collect coins in this endless runner."
                />
                <GameCard
                    title="Neon Drift"
                    emoji="🏎️"
                    color="#ec4899"
                    path="/race"
                    description="High speed racing. Don't crash!"
                />
            </div>
        </div>
    );
};

export default GameHub;
