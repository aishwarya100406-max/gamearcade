import React, { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Environment } from '@react-three/drei'
import { useGameStore } from '../../store'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'

// CONFIG
const BOX_HEIGHT = 1
const INITIAL_SIZE = 3
const LIMIT = 4 // Swing limit

const StaticBlock = ({ position, size, color }) => (
    <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={[size[0], BOX_HEIGHT, size[1]]} />
        <meshStandardMaterial color={color} />
        <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(size[0], BOX_HEIGHT, size[1])]} />
            <lineBasicMaterial color="black" opacity={0.2} transparent />
        </lineSegments>
    </mesh>
)

const Debris = ({ position, size, color }) => {
    const mesh = useRef()
    const [vel] = useState({
        y: 0,
        x: (Math.random() - 0.5) * 0.1,
        z: (Math.random() - 0.5) * 0.1,
        rx: Math.random() * 0.2,
        rz: Math.random() * 0.2
    })

    useFrame((state, delta) => {
        if (!mesh.current) return
        mesh.current.position.y += vel.y - 9.8 * delta * delta // gravity
        vel.y -= 9.8 * delta * 0.02

        mesh.current.position.x += vel.x
        mesh.current.position.z += vel.z
        mesh.current.rotation.x += vel.rx
        mesh.current.rotation.z += vel.rz

        if (mesh.current.position.y < -10) {
            mesh.current.visible = false
        }
    })

    return (
        <mesh ref={mesh} position={position}>
            <boxGeometry args={[size[0], BOX_HEIGHT, size[1]]} />
            <meshStandardMaterial color={color} />
        </mesh>
    )
}

const GameScene = () => {
    const { addScore, endGame, currentGameState, score } = useGameStore()

    // Game State
    const [stack, setStack] = useState([
        { position: [0, 0, 0], size: [INITIAL_SIZE, INITIAL_SIZE], color: 'hsl(200, 80%, 50%)' }
    ])
    const [debris, setDebris] = useState([])

    // Active Block Refs (to avoid re-renders)
    const activeRef = useRef()
    const speed = useRef(3)
    const direction = useRef('x') // 'x' or 'z'
    const timeOffset = useRef(0)

    // Camera
    useFrame((state) => {
        if (currentGameState === 'playing' && activeRef.current) {
            const time = state.clock.elapsedTime
            const pos = Math.sin(time * speed.current + timeOffset.current) * LIMIT

            if (direction.current === 'x') {
                activeRef.current.position.x = pos
                activeRef.current.position.z = stack[stack.length - 1].position[2]
            } else {
                activeRef.current.position.z = pos
                activeRef.current.position.x = stack[stack.length - 1].position[0]
            }
            activeRef.current.position.y = (stack.length) * BOX_HEIGHT

            // Camera follow
            state.camera.position.lerp(new THREE.Vector3(LIMIT * 2, stack.length * BOX_HEIGHT + 5, LIMIT * 2), 0.05)
            state.camera.lookAt(0, stack.length * BOX_HEIGHT - 2, 0)
        }
    })

    const handlePlace = () => {
        if (currentGameState !== 'playing' || !activeRef.current) return

        const activePos = activeRef.current.position
        const prevBlock = stack[stack.length - 1]

        // Calculate Overlap
        let overlap, size = [...prevBlock.size], pos = [...prevBlock.position]
        let debrisConfig = null

        if (direction.current === 'x') {
            const delta = activePos.x - prevBlock.position[0]
            const unused = Math.abs(delta)
            overlap = prevBlock.size[0] - unused

            if (overlap <= 0) return endGame()

            size[0] = overlap
            pos[0] = prevBlock.position[0] + delta / 2
            pos[2] = prevBlock.position[2] // align Z

            // Debris
            debrisConfig = {
                position: [
                    prevBlock.position[0] + (delta > 0 ? (prevBlock.size[0] / 2 + unused / 2) : -(prevBlock.size[0] / 2 + unused / 2)),
                    activePos.y,
                    pos[2]
                ],
                size: [unused, size[1]],
                color: prevBlock.color // simplified color inheritance
            }
        } else {
            const delta = activePos.z - prevBlock.position[2]
            const unused = Math.abs(delta)
            overlap = prevBlock.size[1] - unused

            if (overlap <= 0) return endGame()

            size[1] = overlap
            pos[2] = prevBlock.position[2] + delta / 2
            pos[0] = prevBlock.position[0] // align X

            // Debris
            debrisConfig = {
                position: [
                    pos[0],
                    activePos.y,
                    prevBlock.position[2] + (delta > 0 ? (prevBlock.size[1] / 2 + unused / 2) : -(prevBlock.size[1] / 2 + unused / 2))
                ],
                size: [size[0], unused],
                color: prevBlock.color
            }
        }

        // Success
        addScore(1)
        confetti({
            particleCount: 20,
            spread: 40,
            origin: { y: 0.5 }
        })

        // Colors
        const hue = (stack.length * 15) % 360
        const newColor = `hsl(${hue}, 80%, 50%)`

        // Update Stack
        setStack(prev => [...prev, { position: pos, size: size, color: newColor }])

        if (debrisConfig) {
            setDebris(prev => [...prev, { ...debrisConfig, id: Date.now(), color: newColor }])
        }

        // Prepare next
        direction.current = direction.current === 'x' ? 'z' : 'x'
        // Increase speed slightly
        speed.current += 0.1
    }

    // Input
    useEffect(() => {
        const handleInput = (e) => {
            if (e.code === 'Space' || e.type === 'mousedown' || e.type === 'touchstart') {
                handlePlace()
            }
        }
        window.addEventListener('keydown', handleInput)
        window.addEventListener('mousedown', handleInput)
        window.addEventListener('touchstart', handleInput)
        return () => {
            window.removeEventListener('keydown', handleInput)
            window.removeEventListener('mousedown', handleInput)
            window.removeEventListener('touchstart', handleInput)
        }
    }, [stack, currentGameState]) // Re-bind when stack changes to capture latest state closure? 
    // Actually, handlePlace closes over stack. Better to use ref for stack or careful dependency.
    // Since stack is in dependency, listener is re-added every move. That's fine.

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 20, 10]} intensity={1} castShadow />
            <pointLight position={[-10, 10, -10]} intensity={0.5} color="blue" />

            {stack.map((b, i) => (
                <StaticBlock key={i} {...b} />
            ))}

            {debris.map(d => (<Debris key={d.id} {...d} />))}

            {currentGameState === 'playing' && (
                <mesh ref={activeRef} castShadow>
                    <boxGeometry args={[
                        stack[stack.length - 1].size[0], // Use current top size
                        BOX_HEIGHT,
                        stack[stack.length - 1].size[1]
                    ]} />
                    <meshStandardMaterial color={`hsl(${((stack.length + 1) * 15) % 360}, 100%, 50%)`} emissiveIntensity={0.5} />
                </mesh>
            )}

            <Environment preset="city" />
            <gridHelper position={[0, -0.5, 0]} args={[50, 50, 0x444444, 0x222222]} />
        </>
    )
}

const StackGame = () => {
    const { score, currentGameState, startGame, reset, highScore } = useGameStore()
    const navigate = useNavigate()

    useEffect(() => {
        reset()
        startGame()
    }, [])

    return (
        <div style={{ width: '100%', height: '100vh', background: '#111' }}>
            <Canvas shadows camera={{ position: [5, 5, 5], fov: 45 }}>
                <color attach="background" args={['#111']} />
                <GameScene />
            </Canvas>

            <div className="ui-overlay" style={{ pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute', top: '20px', left: '20px',
                    fontSize: '64px', fontWeight: 'bold',
                    color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.5)'
                }}>
                    {score}
                </div>

                {currentGameState === 'gameover' && (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        background: 'rgba(20, 20, 20, 0.95)', padding: '50px', borderRadius: '30px', textAlign: 'center', pointerEvents: 'auto',
                        border: '2px solid #fff', boxShadow: '0 0 80px rgba(255,255,255,0.2)'
                    }}>
                        <h1 style={{ fontSize: '50px', margin: '0 0 10px 0', color: '#fff' }}>TOPPLED!</h1>
                        <div style={{ fontSize: '24px', color: '#888', marginBottom: '30px' }}>HEIGHT REACHED</div>
                        <div style={{ fontSize: '80px', fontWeight: 'bold', color: '#fff', lineHeight: 1, marginBottom: '20px' }}>{score}</div>
                        <div style={{ fontSize: '18px', color: '#666', marginBottom: '40px' }}>BEST: {highScore}</div>

                        <div style={{ display: 'grid', gap: '15px' }}>
                            <button onClick={() => window.location.reload()} style={{
                                background: '#fff', border: 'none', padding: '15px 40px',
                                color: '#000', borderRadius: '15px', fontSize: '20px', fontWeight: 'bold',
                                cursor: 'pointer', transition: 'transform 0.1s'
                            }}>
                                RETRY
                            </button>
                            <button onClick={() => navigate('/')} style={{
                                background: 'transparent', border: '2px solid #333', padding: '15px 40px',
                                color: '#fff', borderRadius: '15px', fontSize: '20px',
                                cursor: 'pointer'
                            }}>
                                MENU
                            </button>
                        </div>
                    </div>
                )}

                {!currentGameState === 'gameover' && score === 0 && (
                    <div style={{
                        position: 'absolute', bottom: '100px', width: '100%', textAlign: 'center', pointerEvents: 'none',
                        animation: 'fadeIn 0.5s ease-out'
                    }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', textShadow: '0 0 10px #000', marginBottom: '10px' }}>
                            STACK THE BLOCKS!
                        </div>
                        <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.5)', display: 'inline-block', padding: '10px 20px', borderRadius: '20px' }}>
                            Tap Space or Click to Drop
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default StackGame
