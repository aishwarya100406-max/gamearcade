import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GameCard = ({ title, emoji, color, path, description, disabled }) => {
    const navigate = useNavigate();
    const [hover, setHover] = useState(false);

    return (
        <div
            onClick={() => !disabled && navigate(path)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                flex: 1,
                margin: '20px',
                maxWidth: '400px',
                padding: '40px',
                borderRadius: '30px',
                background: `linear-gradient(135deg, ${color}11, ${color}22)`,
                border: `2px solid ${hover ? color : 'rgba(255,255,255,0.05)'}`,
                cursor: disabled ? 'default' : 'pointer',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                transform: hover && !disabled ? 'scale(1.05) translateY(-10px)' : 'scale(1)',
                boxShadow: hover && !disabled ? `0 20px 60px -10px ${color}44` : '0 10px 30px -10px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                textDecoration: 'none',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Background glow effect */}
            <div style={{
                position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                background: `radial-gradient(circle, ${color}22 0%, transparent 60%)`,
                transform: hover ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.5s'
            }} />

            <div style={{
                fontSize: '90px',
                marginBottom: '30px',
                filter: hover ? `drop-shadow(0 0 30px ${color})` : 'drop-shadow(0 0 10px rgba(0,0,0,0.5))',
                transition: 'filter 0.3s',
                transform: hover ? 'rotate(5deg)' : 'rotate(0deg)'
            }}>
                {emoji}
            </div>

            <h2 style={{
                fontSize: '42px', margin: '0 0 15px 0', fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                background: `linear-gradient(to right, #fff, ${color})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
                {title}
            </h2>

            <p style={{ opacity: 0.6, textAlign: 'center', fontSize: '18px', lineHeight: 1.6, maxWidth: '80%' }}>
                {description}
            </p>

            <div style={{
                marginTop: '40px',
                padding: '15px 40px',
                background: hover ? color : 'rgba(255,255,255,0.05)',
                borderRadius: '50px',
                fontWeight: 'bold',
                fontSize: '18px',
                letterSpacing: '1px',
                transition: 'all 0.3s',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: hover ? `0 0 20px ${color}66` : 'none'
            }}>
                {disabled ? 'COMING SOON' : 'PLAY NOW'}
            </div>
        </div>
    );
};

const GameHub = () => {
    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            background: '#050505',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Outfit, sans-serif',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated Background Gradients */}
            <div style={{
                position: 'absolute', width: '60vw', height: '60vw', background: '#3b82f6', opacity: 0.1, filter: 'blur(100px)', borderRadius: '50%',
                top: '-20%', left: '-10%', animation: 'float 10s infinite alternate'
            }} />
            <div style={{
                position: 'absolute', width: '50vw', height: '50vw', background: '#ec4899', opacity: 0.1, filter: 'blur(100px)', borderRadius: '50%',
                bottom: '-10%', right: '-10%', animation: 'float 8s infinite alternate-reverse'
            }} />

            <h1 style={{
                fontSize: '80px',
                marginBottom: '80px',
                fontWeight: 900,
                letterSpacing: '-2px',
                textAlign: 'center',
                zIndex: 1
            }}>
                <span style={{ color: '#fff' }}>ARCADE</span>
                <span style={{
                    background: 'linear-gradient(to right, #3b82f6, #ec4899)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginLeft: '20px'
                }}>
                    HUB
                </span>
            </h1>

            <div style={{
                display: 'flex',
                gap: '40px',
                flexWrap: 'wrap',
                justifyContent: 'center',
                zIndex: 1,
                width: '100%',
                maxWidth: '1200px'
            }}>
                <GameCard
                    title="NEON RUSH"
                    emoji="🚀"
                    color="#00ffcc"
                    path="/runner"
                    description="High-speed reflex challenge. Dodge obstacles in the cyber city."
                />
                <GameCard
                    title="COSMIC STACK"
                    emoji="🏗️"
                    color="#ec4899"
                    path="/stack"
                    description="Build the tallest tower in the galaxy. One block at a time."
                />
            </div>

            <style>{`
          @keyframes float {
              0% { transform: translate(0, 0) scale(1); }
              100% { transform: translate(50px, 50px) scale(1.1); }
          }
      `}</style>
        </div>
    );
};

export default GameHub;
