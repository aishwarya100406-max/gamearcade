import { create } from 'zustand'

export const useGameStore = create((set) => ({
    score: 0,
    highScore: 0,
    gameOver: false,
    gameStarted: false,
    currentGameState: 'idle', // idle, playing, gameover

    startGame: () => set({
        gameStarted: true,
        gameOver: false,
        score: 0,
        currentGameState: 'playing'
    }),

    endGame: () => set((state) => ({
        gameOver: true,
        gameStarted: false,
        currentGameState: 'gameover',
        highScore: Math.max(state.score, state.highScore)
    })),

    addScore: (points) => set((state) => ({ score: state.score + points })),

    reset: () => set({
        score: 0,
        gameOver: false,
        gameStarted: false,
        currentGameState: 'idle'
    })
}))
