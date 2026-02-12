import React, { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Environment, Stars, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../../store'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'

// Constants
const TUBE_RADIUS = 5
const TUBE_LENGTH = 100
const SEGMENTS = 16
const SPEED_INITIAL = 15
const ROTATION_SPEED = 3

// --- Components ---

const TunnelSegment = ({ position, color, index }) => {
    // A ring of boxes or a tube segment
    return (
        <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[TUBE_RADIUS, 0.2, 8, SEGMENTS]} />
            <meshStandardMaterial color={index % 2 === 0 ? '#333' : '#222'} emissive={color} emissiveIntensity={0.5} wireframe={true} />
        </mesh>
    )
}

const PlayerShip = ({ rotation }) => {
    const mesh = useRef()

    useFrame((state, delta) => {
        if (!mesh.current) return

        // Calculate position on the circle based on rotation angle
        // x = r * cos(theta), y = r * sin(theta)
        // Check coordinate system: Camera looks down -Z. 
        // Tunnel is along Z.
        // We want player to be at Z=0.
        // Rotation is around Z axis.

        const r = TUBE_RADIUS - 1
        const x = r * Math.cos(rotation)
        const y = r * Math.sin(rotation)

        mesh.current.position.set(x, y, 0)
        mesh.current.rotation.z = rotation + Math.PI / 2
    })

    return (
        <mesh ref={mesh}>
            <coneGeometry args={[0.5, 1.5, 3]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
        </mesh>
    )
}

const Obstacle = ({ z, angle, type }) => {
    // Obstacle is a block on the tunnel wall at specific angle
    // type: 'block' or 'coin'
    const r = TUBE_RADIUS - 1
    const x = r * Math.cos(angle)
    const y = r * Math.sin(angle)

    return (
        <group position={[x, y, z]} rotation={[0, 0, angle + Math.PI / 2]}>
            {type === 'obstacle' ? (
                <mesh>
                    <boxGeometry args={[1.5, 2, 0.5]} />
                    <meshStandardMaterial color="#ff0055" emissive="#ff0000" emissiveIntensity={1} />
                </mesh>
            ) : (
                <mesh rotation={[0, Math.PI / 2, 0]}>
                    <cylinderGeometry args={[0.5, 0.5, 0.2, 8]} />
                    <meshStandardMaterial color="gold" emissive="yellow" emissiveIntensity={0.8} />
                </mesh>
            )}
        </group>
    )
}

const GameScene = () => {
    const { addScore, endGame, currentGameState } = useGameStore()
    const [playerAngle, setPlayerAngle] = useState(0)
    const [obstacles, setObstacles] = useState([])
    const speed = useRef(SPEED_INITIAL)
    const tunnelRef = useRef()

    // Input handling
    const keys = useRef({ left: false, right: false })
    useEffect(() => {
        const handleDown = (e) => {
            if (e.code === 'ArrowLeft') keys.current.left = true
            if (e.code === 'ArrowRight') keys.current.right = true
        }
        const handleUp = (e) => {
            if (e.code === 'ArrowLeft') keys.current.left = false
            if (e.code === 'ArrowRight') keys.current.right = false
        }
        window.addEventListener('keydown', handleDown)
        window.addEventListener('keyup', handleUp)
        return () => {
            window.removeEventListener('keydown', handleDown)
            window.removeEventListener('keyup', handleUp)
        }
    }, [])

    useFrame((state, delta) => {
        if (currentGameState !== 'playing') return

        // Update Speed
        speed.current += delta * 0.1

        // Update Rotation
        if (keys.current.left) setPlayerAngle(a => a + ROTATION_SPEED * delta)
        if (keys.current.right) setPlayerAngle(a => a - ROTATION_SPEED * delta)

        // Spawn Obstacles
        if (Math.random() < 0.05) { // Spawn rate
            const angle = Math.floor(Math.random() * SEGMENTS) * (Math.PI * 2 / SEGMENTS)
            setObstacles(prev => [...prev, {
                id: Date.now() + Math.random(),
                z: -100, // Spawn far away
                angle: angle,
                type: Math.random() > 0.8 ? 'coin' : 'obstacle',
                active: true
            }])
        }

        // Update Obstacles
        setObstacles(prev => {
            const next = []
            for (let obs of prev) {
                obs.z += speed.current * delta

                // Collision
                if (obs.active && Math.abs(obs.z) < 1) { // Player Z is 0 approx
                    // Check Angle difference
                    const angleDiff = Math.atan2(Math.sin(playerAngle - obs.angle), Math.cos(playerAngle - obs.angle))
                    if (Math.abs(angleDiff) < 0.3) { // Hit
                        if (obs.type === 'obstacle') {
                            endGame()
                        } else {
                            addScore(50)
                            obs.active = false
                            // Visual feedback?
                        }
                    } else if (obs.type === 'obstacle') {
                        // Passed successfully
                        // addScore(1) // continuous score?
                    }
                }

                if (obs.z < 10) next.push(obs)
            }
            return next
        })

        // Continuous score
        if (Math.floor(state.clock.elapsedTime * 60) % 10 === 0) addScore(1)

        // Tunnel Visuals Loop (optional texture scroll or just move camera)
        // Here we move obstacles towards camera. 
    })

    return (
        <>
            <PlayerShip rotation={playerAngle} />

            {/* Visual Tunnel Rings */}
            {new Array(20).fill(0).map((_, i) => (
                <TunnelSegment key={i} index={i} position={[0, 0, -i * 10]} color={i % 5 === 0 ? '#00ffcc' : '#333'} />
            ))}

            {/* Dynamic Obstacles */}
            {obstacles.map(obs => (
                obs.active && <Obstacle key={obs.id} {...obs} />
            ))}

            {/* Particles/Stars */}
            <Stars radius={50} depth={50} count={2000} factor={4} speed={2} />
        </>
    )
}

const TunnelGame = () => {
    const { score, currentGameState, startGame, reset, highScore } = useGameStore()
    const navigate = useNavigate()

    useEffect(() => {
        reset()
        startGame()
    }, [])

    const isGameOver = currentGameState === 'gameover'

    return (
        <div style={{ width: '100%', height: '100vh', background: '#000' }}>
            <Canvas dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={75} />
                {/* Intense Fog for depth */}
                <fog attach="fog" args={['#000', 5, 60]} />
                <ambientLight intensity={0.5} />
                <pointLight position={[0, 0, 0]} intensity={2} color="#ffffff" distance={20} />

                <GameScene />

                <Environment preset="city" />
            </Canvas>

            {/* HUD */}
            <div className="ui-overlay" style={{ pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute', top: '20px', left: '20px',
                    fontSize: '32px', fontWeight: 'bold',
                    color: '#00ffff', textShadow: '0 0 10px #00ffff'
                }}>
                    SCORE: {score}
                </div>

                {/* Instructions */}
                {!isGameOver && score < 100 && (
                    <div style={{
                        position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)',
                        color: 'rgba(255,255,255,0.5)', fontSize: '18px', textAlign: 'center'
                    }}>
                        Left / Right to Rotate
                    </div>
                )}

                {isGameOver && (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        background: 'rgba(0, 0, 0, 0.9)', padding: '50px', borderRadius: '30px', textAlign: 'center', pointerEvents: 'auto',
                        border: '2px solid #00ffff', boxShadow: '0 0 50px rgba(0, 255, 255, 0.3)'
                    }}>
                        <h1 style={{ fontSize: '48px', margin: '0 0 20px 0', color: '#ff0055', fontFamily: 'monospace' }}>SYSTEM FAILURE</h1>
                        <div style={{ fontSize: '24px', color: '#888', marginBottom: '30px' }}>FINAL SCORE</div>
                        <div style={{ fontSize: '72px', color: '#fff', fontWeight: 'bold', marginBottom: '20px', textShadow: '0 0 20px white' }}>{score}</div>
                        <div style={{ fontSize: '16px', color: '#666', marginBottom: '40px' }}>BEST: {highScore}</div>

                        <div style={{ display: 'grid', gap: '15px' }}>
                            <button onClick={() => window.location.reload()} style={{
                                background: '#00ffff', border: 'none', padding: '15px 40px',
                                color: '#000', borderRadius: '5px', fontSize: '20px', fontWeight: 'bold',
                                cursor: 'pointer', fontFamily: 'monospace'
                            }}>
                                REBOOT SYSTEM
                            </button>
                            <button onClick={() => navigate('/')} style={{
                                background: 'transparent', border: '1px solid #333', padding: '15px 40px',
                                color: '#fff', borderRadius: '5px', fontSize: '18px',
                                cursor: 'pointer', fontFamily: 'monospace'
                            }}>
                                ABORT
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default TunnelGame
