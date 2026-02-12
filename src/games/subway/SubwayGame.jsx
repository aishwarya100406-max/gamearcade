import React, { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Environment, Stars, Trail, Sparkles, Float } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../../store'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'

const LANE_WIDTH = 3
const PLAYER_SPEED = 20
const JUMP_FORCE = 8
const GRAVITY = 20
const SPAWN_DISTANCE = -120

// --- Utility Components ---
const NeonMaterial = ({ color }) => (
    <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2}
        roughness={0.2}
        metalness={0.8}
    />
)

const Player = () => {
    const mesh = useRef()
    const isJumping = useRef(false)
    const yVelocity = useRef(0)
    const xPos = useRef(0)
    const lane = useRef(0)

    // Store
    const { currentGameState, endGame, addScore } = useGameStore()

    // Use a ref to track the current game state internally to avoid stale closures in listeners
    const gameStateRef = useRef(currentGameState)
    useEffect(() => {
        gameStateRef.current = currentGameState
    }, [currentGameState])

    // Controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Check ref instead of closure for most accurate state
            if (gameStateRef.current !== 'playing') return

            if (e.key === 'ArrowLeft') lane.current = Math.max(-1, lane.current - 1)
            if (e.key === 'ArrowRight') lane.current = Math.min(1, lane.current + 1)

            if ((e.key === 'ArrowUp' || e.code === 'Space') && !isJumping.current && mesh.current && mesh.current.position.y <= 0.51) {
                isJumping.current = true
                yVelocity.current = JUMP_FORCE
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, []) // Listen for the entire lifecycle

    // Physics Loop
    useFrame((state, delta) => {
        if (currentGameState !== 'playing' || !mesh.current) return

        // Smooth X Movement (Lerp)
        const targetX = lane.current * LANE_WIDTH
        xPos.current = THREE.MathUtils.lerp(xPos.current, targetX, delta * 15)
        mesh.current.position.x = xPos.current

        // Jumping Physics
        if (isJumping.current || mesh.current.position.y > 0.5) {
            mesh.current.position.y += yVelocity.current * delta
            yVelocity.current -= GRAVITY * delta

            if (mesh.current.position.y <= 0.5) {
                mesh.current.position.y = 0.5
                isJumping.current = false
                yVelocity.current = 0
            }
        }

        // Tilt Effect
        mesh.current.rotation.z = (xPos.current - targetX) * -0.1
        mesh.current.rotation.x = isJumping.current ? -0.2 : 0

        // Collision Check
        if (window.gameObstacles) {
            for (let obs of window.gameObstacles) {
                const dx = Math.abs(mesh.current.position.x - obs.x)
                const dz = Math.abs(mesh.current.position.z - obs.z) // Player at Z=0
                const dy = Math.abs(mesh.current.position.y - 0.5)

                if (dz < 1.2 && dx < 1.0 && dy < 1.0) {
                    if (obs.type === 'obstacle') {
                        endGame()
                    } else if (obs.type === 'coin' && !obs.hit) {
                        obs.hit = true
                        obs.visible = false
                        addScore(50)
                        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } })
                    }
                }
            }
        }
    })

    return (
        <group ref={mesh}>
            <Trail width={1.5} length={5} color="#00ffcc" attenuation={(t) => t * t}>
                <mesh position={[0, 0.5, 0]} castShadow>
                    <boxGeometry args={[0.8, 0.8, 1.5]} />
                    <NeonMaterial color="#00ffcc" />
                </mesh>
            </Trail>
            {/* Wheels or Hover pads */}
            <mesh position={[-0.4, 0.2, 0.5]}>
                <cylinderGeometry args={[0.2, 0.2, 0.2]} rotation={[0, 0, Math.PI / 2]} />
                <NeonMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.4, 0.2, 0.5]}>
                <cylinderGeometry args={[0.2, 0.2, 0.2]} rotation={[0, 0, Math.PI / 2]} />
                <NeonMaterial color="#ffffff" />
            </mesh>
        </group>
    )
}

const ObstacleManager = () => {
    const group = useRef()
    const obstaclePool = useMemo(() => {
        return new Array(25).fill(null).map((_, i) => ({
            id: i,
            ref: React.createRef(),
            x: 0,
            z: SPAWN_DISTANCE - (i * 15),
            type: Math.random() > 0.7 ? 'coin' : 'obstacle',
            active: true,
            hit: false,
            visible: true,
            passed: false
        }))
    }, [])

    const { currentGameState, addScore } = useGameStore()
    const speed = useRef(PLAYER_SPEED)
    const playing = currentGameState === 'playing'

    useFrame((state, delta) => {
        if (!playing) return

        speed.current += delta * 0.1

        obstaclePool.forEach(obs => {
            obs.z += speed.current * delta

            if (obs.z > 2 && !obs.passed && obs.type === 'obstacle') {
                obs.passed = true
                addScore(10) // Score for avoiding obstacle
            }

            if (obs.z > 20) {
                obs.z = SPAWN_DISTANCE - Math.random() * 20
                obs.x = (Math.floor(Math.random() * 3) - 1) * LANE_WIDTH
                obs.type = Math.random() > 0.8 ? 'coin' : 'obstacle'
                obs.hit = false
                obs.passed = false
                obs.visible = true
            }

            if (obs.ref.current) {
                obs.ref.current.position.set(obs.x, 0.5, obs.z)
                obs.ref.current.visible = obs.visible
            }
        })

        window.gameObstacles = obstaclePool
    })

    return (
        <group ref={group}>
            {obstaclePool.map(obs => (
                <group key={obs.id} ref={obs.ref}>
                    {obs.type === 'obstacle' ? (
                        <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
                            <boxGeometry args={[1.5, 1.5, 1.5]} />
                            <NeonMaterial color="#ff0055" />
                        </mesh>
                    ) : (
                        <Float speed={5} rotationIntensity={2} floatIntensity={2}>
                            <mesh castShadow receiveShadow position={[0, 1, 0]} rotation={[0, Math.PI / 4, 0]}>
                                <torusGeometry args={[0.4, 0.1, 16, 32]} />
                                <NeonMaterial color="#ffd700" />
                            </mesh>
                            <Sparkles count={5} scale={2} size={4} speed={0.4} opacity={1} color="yellow" />
                        </Float>
                    )}
                </group>
            ))}
        </group>
    )
}

const EnvironmentScene = () => {
    const gridRef = useRef()
    useFrame((state, delta) => {
        if (gridRef.current) {
            gridRef.current.position.z = (state.clock.elapsedTime * 20) % 20
        }
    })

    return (
        <>
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <fog attach="fog" args={['#0f172a', 20, 90]} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#00ffcc" />
            <pointLight position={[-10, 10, -10]} intensity={1} color="#ff0055" />

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -50]} receiveShadow>
                <planeGeometry args={[100, 300]} />
                <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} />
            </mesh>
            <group ref={gridRef}>
                <gridHelper args={[100, 100, 0x00ffcc, 0x222222]} position={[0, 0, -50]} />
            </group>

            {[-30, 30].map((x, i) => (
                <group key={i} position={[x, 0, -50]}>
                    {new Array(10).fill(0).map((_, j) => (
                        <mesh key={j} position={[0, 10 + Math.random() * 10, -j * 30]}>
                            <boxGeometry args={[10, 40 + Math.random() * 20, 10]} />
                            <meshStandardMaterial color="#1e293b" emissive="#334155" emissiveIntensity={0.2} />
                        </mesh>
                    ))}
                </group>
            ))}
        </>
    )
}

const NeonRush = () => {
    const { score, currentGameState, startGame, reset, highScore } = useGameStore()
    const navigate = useNavigate()

    useEffect(() => {
        reset()
        startGame()
        return () => { delete window.gameObstacles }
    }, [])

    const isGameOver = currentGameState === 'gameover'

    return (
        <div style={{ width: '100%', height: '100vh', background: '#000', position: 'relative' }}>
            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 5, 8], fov: 60 }}>
                <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={60} rotation={[-0.2, 0, 0]} />
                <EnvironmentScene />
                <Player />
                <ObstacleManager />
            </Canvas>

            <div className="ui-overlay" style={{ pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute', top: '20px', left: '20px',
                    fontSize: '32px', fontWeight: 'bold',
                    color: '#00ffcc', textShadow: '0 0 10px #00ffcc'
                }}>
                    SCORE: {Math.floor(score / 10)}
                </div>

                {isGameOver && (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        background: 'rgba(15, 23, 42, 0.95)', padding: '60px', borderRadius: '24px', textAlign: 'center', pointerEvents: 'auto',
                        border: '2px solid #ff0055', boxShadow: '0 0 50px rgba(255, 0, 85, 0.3)',
                        backdropFilter: 'blur(10px)', minWidth: '400px'
                    }}>
                        <h1 style={{
                            fontSize: '64px', margin: '0 0 20px 0',
                            background: 'linear-gradient(to right, #ff0055, #ffcc00)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            textTransform: 'uppercase', fontStyle: 'italic'
                        }}>
                            CRASHED!
                        </h1>

                        <div style={{ fontSize: '24px', color: '#94a3b8', marginBottom: '10px' }}>OBSTACLES AVOIDED</div>
                        <div style={{ fontSize: '72px', color: '#fff', fontWeight: 'bold', marginBottom: '40px', lineHeight: 1 }}>
                            {Math.floor(score / 10)}
                        </div>

                        <div style={{ fontSize: '18px', color: '#64748b', marginBottom: '40px' }}>
                            HIGH SCORE: {Math.floor(highScore / 10)}
                        </div>

                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                            <button onClick={() => window.location.reload()} style={{
                                background: '#00ffcc', border: 'none', padding: '16px 40px',
                                color: '#0f172a', borderRadius: '12px', fontSize: '20px', fontWeight: 'bold',
                                cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 0 20px rgba(0, 255, 204, 0.4)'
                            }}>
                                PLAY AGAIN
                            </button>
                            <button onClick={() => navigate('/')} style={{
                                background: 'transparent', border: '2px solid #334155', padding: '16px 40px',
                                color: '#fff', borderRadius: '12px', fontSize: '20px', fontWeight: 'bold',
                                cursor: 'pointer', transition: 'background 0.2s'
                            }}>
                                MENU
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default NeonRush
