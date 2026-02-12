import React, { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Environment, Text, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../../store' // Adjust path if needed
import { useNavigate } from 'react-router-dom'

// --- Constants ---
const LANE_WIDTH = 2
const PLAYER_SPEED = 15 // Units per second
const JUMP_FORCE = 8
const GRAVITY = 20
const SPAWN_DISTANCE = -100
const DESPAWN_DISTANCE = 10

// --- Player Component ---
const Player = () => {
    const mesh = useRef()
    const [lane, setLane] = useState(0) // -1, 0, 1
    const [jumping, setJumping] = useState(false)
    const yVelocity = useRef(0)
    const xPos = useRef(0)

    const { gameOver, endGame, addScore } = useGameStore()

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameOver) return
            if (e.key === 'ArrowLeft') setLane(l => Math.max(-1, l - 1))
            if (e.key === 'ArrowRight') setLane(l => Math.min(1, l + 1))
            if (e.key === 'ArrowUp' && !jumping) {
                setJumping(true)
                yVelocity.current = JUMP_FORCE
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [jumping, gameOver])

    useFrame((state, delta) => {
        if (!mesh.current || gameOver) return

        // Lateral Movement (Lerp)
        const targetX = lane * LANE_WIDTH
        xPos.current = THREE.MathUtils.lerp(xPos.current, targetX, delta * 15)
        mesh.current.position.x = xPos.current

        // Jumping (Physics)
        if (jumping || mesh.current.position.y > 0.5) {
            mesh.current.position.y += yVelocity.current * delta
            yVelocity.current -= GRAVITY * delta

            if (mesh.current.position.y <= 0.5) {
                mesh.current.position.y = 0.5
                setJumping(false)
                yVelocity.current = 0
            }
        }

        // Check collisions with global obstacles (exposed via window or context for simplicity in this file)
        // For a cleaner React app, we'd use a Context, but window is fast for game loop access
        if (window.gameObstacles) {
            for (let obs of window.gameObstacles) {
                // Simple AABB collision
                const dx = Math.abs(mesh.current.position.x - obs.x)
                const dz = Math.abs(mesh.current.position.z - obs.z) // Player z is 0
                const dy = Math.abs(mesh.current.position.y - 0.5) // Obstacle y is 0.5

                if (dz < 1 && dx < 0.8 && dy < 1) {
                    if (obs.type === 'obstacle') {
                        endGame()
                    } else if (obs.type === 'coin' && !obs.hit) {
                        obs.hit = true
                        obs.visible = false // Hide visually
                        addScore(10)
                    }
                }
            }
        }
    })

    return (
        <mesh ref={mesh} position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[0.8, 1, 0.8]} />
            <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={0.5} />
        </mesh>
    )
}

// --- Obstacle Manager ---
const ObstacleManager = () => {
    const group = useRef()
    const obstaclePool = useMemo(() => {
        return new Array(20).fill(null).map((_, i) => ({
            id: i,
            ref: React.createRef(),
            x: 0,
            z: SPAWN_DISTANCE - (i * 10), // Initial spacing
            type: Math.random() > 0.5 ? 'obstacle' : 'coin',
            active: true,
            hit: false,
            visible: true
        }))
    }, [])

    const { gameOver, addScore } = useGameStore()
    const speed = useRef(PLAYER_SPEED)

    useFrame((state, delta) => {
        if (gameOver) return

        // Expose to player for collision
        window.gameObstacles = obstaclePool.map(o => ({
            x: o.x,
            z: o.z,
            type: o.type,
            hit: o.hit,
            visible: o.visible
        }))

        // Move obstacles
        speed.current += delta * 0.1 // Acccelerate

        obstaclePool.forEach(obs => {
            obs.z += speed.current * delta

            if (obs.z > DESPAWN_DISTANCE) {
                // Respawn
                obs.z = SPAWN_DISTANCE
                obs.x = (Math.floor(Math.random() * 3) - 1) * LANE_WIDTH
                obs.type = Math.random() > 0.7 ? 'coin' : 'obstacle'
                obs.hit = false
                obs.visible = true
            }

            // Update Mesh
            if (obs.ref.current) {
                obs.ref.current.position.set(obs.x, 0.5, obs.z)
                obs.ref.current.visible = obs.visible

                // Color update based on type
                obs.ref.current.material.color.set(obs.type === 'coin' ? 'gold' : '#ff3366')
            }
        })

        // Score over time
        if (Math.frameCount % 60 === 0) addScore(1)
    })

    return (
        <group ref={group}>
            {obstaclePool.map(obs => (
                <mesh key={obs.id} ref={obs.ref} castShadow>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial />
                </mesh>
            ))}
        </group>
    )
}

const Floor = () => {
    const texture = useRef()
    useFrame((state, delta) => {
        // Scroll texture logic if we had one
    })
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -50]} receiveShadow>
            <planeGeometry args={[20, 200]} />
            <meshStandardMaterial color="#1e293b" roughnes={0.8} />
            <gridHelper args={[20, 200, 0xffffff, 0x555555]} rotation={[-Math.PI / 2, 0, 0]} />
        </mesh>
    )
}


const SubwayGame = () => {
    const { score, gameOver, reset, startGame } = useGameStore()
    const navigate = useNavigate()

    useEffect(() => {
        reset()
        startGame()
        // Cleanup window.gameObstacles
        return () => { delete window.gameObstacles }
    }, [])

    return (
        <div style={{ width: '100%', height: '100vh', background: '#000' }}>
            <Canvas shadows dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[0, 4, 6]} fov={60} rotation={[-0.4, 0, 0]} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 20, 5]} intensity={1} castShadow />
                <fog attach="fog" args={['#0f172a', 10, 50]} />

                <Player />
                <ObstacleManager />
                <Floor />

                <gridHelper args={[20, 200]} position={[0, 0.01, -50]} />
            </Canvas>

            <div className="ui-overlay" style={{ pointerEvents: 'none' }}>
                <div style={{ padding: '20px', fontSize: '24px', fontWeight: 'bold' }}>SCORE: {Math.floor(score)}</div>
                {gameOver && (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        background: 'rgba(15, 23, 42, 0.9)', padding: '40px', borderRadius: '16px', textAlign: 'center', pointerEvents: 'auto',
                        border: '1px solid #334155', boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                    }}>
                        <h2 style={{ fontSize: '48px', margin: '0 0 20px 0', color: '#ff3366' }}>GAME OVER</h2>
                        <div style={{ fontSize: '24px', marginBottom: '30px' }}>Score: {Math.floor(score)}</div>
                        <button onClick={() => window.location.reload()} style={{
                            background: '#3b82f6', border: 'none', padding: '12px 30px', color: 'white', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', marginRight: '10px'
                        }}>RETRY</button>
                        <button onClick={() => navigate('/')} style={{
                            background: 'transparent', border: '1px solid #cbd5e1', padding: '12px 30px', color: 'white', borderRadius: '8px', fontSize: '18px', cursor: 'pointer'
                        }}>MENU</button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SubwayGame
