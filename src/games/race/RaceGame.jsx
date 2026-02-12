import React, { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Environment, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../../store'
import { useNavigate } from 'react-router-dom'

const LANE_WIDTH_RACE = 3
const MAX_SPEED = 50
const ACCELERATION = 20
const BRAKING = 30

const Car = () => {
    const mesh = useRef()
    const [speed, setSpeed] = useState(0)
    const xPos = useRef(0)
    const zPos = useRef(0) // Virtual position on track
    const lane = useRef(1) // 0, 1, 2 smoothly

    const { gameOver, addScore, endGame } = useGameStore()

    // Controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameOver) return
            if (e.key === 'ArrowLeft') lane.current = Math.max(-1, lane.current - 1)
            if (e.key === 'ArrowRight') lane.current = Math.min(1, lane.current + 1)
            if (e.key === 'ArrowUp') setSpeed(s => Math.min(MAX_SPEED, s + 5))
            if (e.key === 'ArrowDown') setSpeed(s => Math.max(0, s - 5))
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [gameOver])

    useFrame((state, delta) => {
        if (gameOver) return

        // Smooth lane change
        xPos.current = THREE.MathUtils.lerp(xPos.current, lane.current * LANE_WIDTH_RACE, delta * 5)

        // Simple momentum friction
        // setSpeed(s => Math.max(0, s - delta * 2)) // Friction

        // Pass speed to global for track movement effect
        window.gameSpeed = speed // Hacky but fast

        // Check collisions
        if (window.traffic) {
            for (let car of window.traffic) {
                // car.z is relative to player. Player is at 0.
                // If car.z is near 0 and x is near player x
                if (Math.abs(car.z) < 2 && Math.abs(car.x - xPos.current) < 1.5) {
                    endGame()
                }
            }
        }

        if (mesh.current) {
            mesh.current.position.x = xPos.current
            // Tilt car when turning
            mesh.current.rotation.z = (xPos.current - lane.current * LANE_WIDTH_RACE) * -0.2
            mesh.current.rotation.y = (xPos.current - lane.current * LANE_WIDTH_RACE) * -0.1
        }

        // Score based on speed
        if (speed > 0) addScore(speed * delta * 0.1)
    })

    return (
        <group ref={mesh}>
            {/* Car Body */}
            <mesh position={[0, 0.5, 0]} castShadow>
                <boxGeometry args={[1.2, 0.8, 2.5]} />
                <meshStandardMaterial color="#ef4444" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Wheels */}
            <mesh position={[-0.6, 0.2, 0.8]}>
                <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} rotation={[0, 0, Math.PI / 2]} />
                <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={[0.6, 0.2, 0.8]}>
                <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} rotation={[0, 0, Math.PI / 2]} />
                <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={[-0.6, 0.2, -0.8]}>
                <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} rotation={[0, 0, Math.PI / 2]} />
                <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={[0.6, 0.2, -0.8]}>
                <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} rotation={[0, 0, Math.PI / 2]} />
                <meshStandardMaterial color="black" />
            </mesh>
        </group>
    )
}

const TrafficManager = () => {
    const trafficPool = useMemo(() => {
        return new Array(10).fill(null).map((_, i) => ({
            id: i,
            ref: React.createRef(),
            x: (Math.floor(Math.random() * 3) - 1) * LANE_WIDTH_RACE,
            z: -100 - (i * 30), // Start far ahead
            speed: 10 + Math.random() * 20, // Different speeds
            color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5)
        }))
    }, [])

    useFrame((state, delta) => {
        // Move traffic towards player relative to player speed
        const playerSpeed = window.gameSpeed || 0

        window.traffic = trafficPool // Expose for collision

        trafficPool.forEach(car => {
            // Rel speed = carSpeed - playerSpeed
            // If player is faster, car moves towards player (positive Z)
            // If car is faster, car moves away (negative Z)
            // Wait, we want cars to come towards us if we are faster.
            // Actually usually traffic moves same direction.
            // Relative Z change = (PlayerSpeed - CarSpeed) * delta
            // So if Player > Car, Z increases (car gets closer from front or goes behind)

            // Let's assume cars are moving forward (negative Z). 
            // Player is moving forward (negative Z) but faster.
            // So relative to player, slower cars move POSITIVE Z (towards camera).

            const relSpeed = (playerSpeed - car.speed)
            car.z += relSpeed * delta

            if (car.z > 20) { // Behind camera
                // Respawn far ahead
                car.z = -200 - Math.random() * 100
                car.x = (Math.floor(Math.random() * 3) - 1) * LANE_WIDTH_RACE
                car.speed = 10 + Math.random() * 20
            }

            if (car.ref.current) {
                car.ref.current.position.set(car.x, 0.5, car.z)
                car.ref.current.material.color = car.color
            }
        })
    })

    return (
        <group>
            {trafficPool.map(car => (
                <mesh key={car.id} ref={car.ref} castShadow>
                    <boxGeometry args={[1.2, 0.8, 2.5]} />
                    <meshStandardMaterial />
                </mesh>
            ))}
        </group>
    )
}

const Road = () => {
    const ref = useRef()
    useFrame((state, delta) => {
        const speed = window.gameSpeed || 0
        if (ref.current) {
            // Scroll texture or move stripes
            // texture.offset.y -= speed * delta * 0.01
        }
    })

    // Procedural road stripes
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -100]} receiveShadow>
                <planeGeometry args={[20, 400]} />
                <meshStandardMaterial color="#334155" roughness={0.5} />
            </mesh>
            {/* Stripes */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -100]}>
                <planeGeometry args={[0.5, 400]} />
                <meshStandardMaterial color="white" />
            </mesh>
        </group>
    )
}

const RaceGame = () => {
    const { score, gameOver, reset, startGame } = useGameStore()
    const navigate = useNavigate()

    useEffect(() => {
        reset()
        startGame()
        window.gameSpeed = 0
    }, [])

    return (
        <div style={{ width: '100%', height: '100vh', background: '#000' }}>
            <Canvas shadows dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[0, 5, 8]} fov={60} rotation={[-0.3, 0, 0]} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} castShadow />
                <fog attach="fog" args={['#0f172a', 10, 100]} />
                <Environment preset="night" />

                <Car />
                <TrafficManager />
                <Road />
            </Canvas>

            <div className="ui-overlay" style={{ pointerEvents: 'none' }}>
                <div style={{ padding: '20px', fontSize: '24px', fontWeight: 'bold' }}>SCORE: {Math.floor(score)}</div>
                <div style={{ position: 'absolute', bottom: '20px', right: '20px', fontSize: '40px', fontWeight: 'bold', color: '#ec4899' }}>
                    {/* Speedometer would be cool here */}
                </div>
                {gameOver && (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        background: 'rgba(15, 23, 42, 0.9)', padding: '40px', borderRadius: '16px', textAlign: 'center', pointerEvents: 'auto',
                        border: '1px solid #334155', boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                    }}>
                        <h2 style={{ fontSize: '48px', margin: '0 0 20px 0', color: '#ff3366' }}>CRASHED!</h2>
                        <div style={{ fontSize: '24px', marginBottom: '30px' }}>Score: {Math.floor(score)}</div>
                        <button onClick={() => window.location.reload()} style={{
                            background: '#3b82f6', border: 'none', padding: '12px 30px', color: 'white', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', marginRight: '10px'
                        }}>RACE AGAIN</button>
                        <button onClick={() => navigate('/')} style={{
                            background: 'transparent', border: '1px solid #cbd5e1', padding: '12px 30px', color: 'white', borderRadius: '8px', fontSize: '18px', cursor: 'pointer'
                        }}>MENU</button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default RaceGame
