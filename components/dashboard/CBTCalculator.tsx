'use client'

import { useState } from 'react'
import { FiX, FiDelete } from 'react-icons/fi'

interface CalculatorProps {
    onClose: () => void
}

export default function Calculator({ onClose }: CalculatorProps) {
    const [display, setDisplay] = useState('0')
    const [equation, setEquation] = useState('')
    const [isDone, setIsDone] = useState(false)

    const handleNumber = (num: string) => {
        if (display === '0' || isDone) {
            setDisplay(num)
            setIsDone(false)
        } else {
            setDisplay(display + num)
        }
    }

    const handleOperator = (op: string) => {
        setEquation(display + ' ' + op + ' ')
        setDisplay('0')
        setIsDone(false)
    }

    const handleEqual = () => {
        try {
            const fullEq = equation + display
            // eslint-disable-next-line no-eval
            const result = eval(fullEq.replace('×', '*').replace('÷', '/'))
            setEquation(fullEq + ' =')
            setDisplay(String(result))
            setIsDone(true)
        } catch (e) {
            setDisplay('Error')
        }
    }

    const handleClear = () => {
        setDisplay('0')
        setEquation('')
        setIsDone(false)
    }

    const handleDelete = () => {
        if (display.length > 1) {
            setDisplay(display.slice(0, -1))
        } else {
            setDisplay('0')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-[320px] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Exam Calculator</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition">
                        <FiX className="text-gray-500" />
                    </button>
                </div>

                {/* Display */}
                <div className="p-6 bg-gray-100 dark:bg-gray-900 text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400 h-4 mb-1 font-mono">{equation}</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white truncate font-mono">{display}</div>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-4 gap-px bg-gray-200 dark:bg-gray-700">
                    <button onClick={handleClear} className="col-span-2 p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold text-red-500 transition">AC</button>
                    <button onClick={handleDelete} className="p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center"><FiDelete /></button>
                    <button onClick={() => handleOperator('÷')} className="p-4 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 font-bold text-blue-600 transition">÷</button>

                    {[7, 8, 9].map(n => <button key={n} onClick={() => handleNumber(String(n))} className="p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition text-gray-800 dark:text-white">{n}</button>)}
                    <button onClick={() => handleOperator('×')} className="p-4 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 font-bold text-blue-600 transition">×</button>

                    {[4, 5, 6].map(n => <button key={n} onClick={() => handleNumber(String(n))} className="p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition text-gray-800 dark:text-white">{n}</button>)}
                    <button onClick={() => handleOperator('-')} className="p-4 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 font-bold text-blue-600 transition">-</button>

                    {[1, 2, 3].map(n => <button key={n} onClick={() => handleNumber(String(n))} className="p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition text-gray-800 dark:text-white">{n}</button>)}
                    <button onClick={() => handleOperator('+')} className="p-4 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 font-bold text-blue-600 transition">+</button>

                    <button onClick={() => handleNumber('0')} className="col-span-2 p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition text-gray-800 dark:text-white">0</button>
                    <button onClick={() => handleNumber('.')} className="p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition text-gray-800 dark:text-white">.</button>
                    <button onClick={handleEqual} className="p-4 bg-blue-600 hover:bg-blue-700 font-bold text-white transition">=</button>
                </div>
            </div>
        </div>
    )
}
