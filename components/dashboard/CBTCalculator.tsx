'use client'

import { useState, useCallback } from 'react'

interface CalculatorProps {
  onClose: () => void
}

const toRad = (deg: number) => (deg * Math.PI) / 180
const toDeg = (rad: number) => (rad * 180) / Math.PI

const CBTCalculator = ({ onClose }: CalculatorProps) => {
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [mode, setMode] = useState<'basic' | 'scientific'>('basic')
  const [isRad, setIsRad] = useState(true) // radians/degrees
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  const [history, setHistory] = useState<string[]>([])

  const calculate = useCallback((rawExpr: string) => {
    try {
      const normalized = rawExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/\s+/g, '')
        // Support simple percent usage like 25% => 0.25
        .replace(/(\d+(\.\d+)?)%/g, '($1/100)')

      if (!/^[0-9+\-*/().%]*$/.test(normalized)) return 'Error'

      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + normalized + ')')()
      return Number.isFinite(result) ? parseFloat(Number(result).toPrecision(10)) : 'Error'
    } catch {
      return 'Error'
    }
  }, [])

  const handleNumber = (num: string) => {
    if (waitingForOperand || display === '0') {
      setDisplay(String(num))
      setWaitingForOperand(false)
    } else {
      setDisplay(display + num)
    }
  }

  const handleOperator = (op: string) => {
    if (display === 'Error') return
    if (waitingForOperand) {
      setExpression((prev) => prev.replace(/[+\-*/]\s*$/, `${op} `))
      return
    }
    setExpression((prev) => `${prev}${display} ${op} `)
    setWaitingForOperand(true)
  }

  const handleScientific = (fn: string) => {
    const val = parseFloat(display)
    if (Number.isNaN(val)) return

    let result: number
    const angle = isRad ? val : toRad(val)

    switch (fn) {
      case 'sin': result = Math.sin(angle); break
      case 'cos': result = Math.cos(angle); break
      case 'tan': result = Math.tan(angle); break
      case 'asin':
        if (val < -1 || val > 1) return setDisplay('Error')
        result = isRad ? Math.asin(val) : toDeg(Math.asin(val))
        break
      case 'acos':
        if (val < -1 || val > 1) return setDisplay('Error')
        result = isRad ? Math.acos(val) : toDeg(Math.acos(val))
        break
      case 'atan':
        result = isRad ? Math.atan(val) : toDeg(Math.atan(val))
        break
      case 'log':
        if (val <= 0) return setDisplay('Error')
        result = Math.log10(val)
        break
      case 'ln':
        if (val <= 0) return setDisplay('Error')
        result = Math.log(val)
        break
      case 'sqrt':
        if (val < 0) return setDisplay('Error')
        result = Math.sqrt(val)
        break
      case 'cbrt': result = Math.cbrt(val); break
      case 'sq': result = val * val; break
      case 'cube': result = val * val * val; break
      case 'inv':
        if (val === 0) return setDisplay('Error')
        result = 1 / val
        break
      case 'exp': result = Math.exp(val); break
      case 'abs': result = Math.abs(val); break
      case 'fact': {
        const n = Math.floor(val)
        if (n < 0 || n > 170) {
          setDisplay('Error')
          return
        }
        let f = 1
        for (let i = 1; i <= n; i++) f *= i
        result = f
        break
      }
      case 'pi': result = Math.PI; break
      case 'e': result = Math.E; break
      case 'pow10': result = Math.pow(10, val); break
      default: return
    }

    const rounded = parseFloat(result.toPrecision(10))
    setDisplay(String(rounded))
    setExpression(`${fn}(${val}) =`)
    setWaitingForOperand(true)
  }

  const handleEquals = () => {
    if (display === 'Error') return
    const fullExpr = expression + display
    const result = calculate(fullExpr)
    setHistory(prev => [`${fullExpr} = ${result}`, ...prev.slice(0, 4)])
    setDisplay(String(result))
    setExpression('')
    setWaitingForOperand(true)
  }

  const handleClear = () => {
    setDisplay('0')
    setExpression('')
    setWaitingForOperand(false)
  }

  const handleBackspace = () => {
    if (waitingForOperand) return
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0')
  }

  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
      return
    }
    if (!display.includes('.')) setDisplay(display + '.')
  }

  const handleSign = () => {
    const val = parseFloat(display)
    if (Number.isNaN(val)) return
    setDisplay(String(val * -1))
  }

  const scientificButtons: { label: string; action: () => void; class: string }[][] = [
    [
      { label: isRad ? 'RAD' : 'DEG', action: () => setIsRad(!isRad), class: 'mode' },
      { label: 'x²', action: () => handleScientific('sq'), class: 'sci' },
      { label: 'x³', action: () => handleScientific('cube'), class: 'sci' },
      { label: 'xʸ', action: () => handleOperator('**'), class: 'sci' },
      { label: '√x', action: () => handleScientific('sqrt'), class: 'sci' }
    ],
    [
      { label: 'sin', action: () => handleScientific('sin'), class: 'sci' },
      { label: 'cos', action: () => handleScientific('cos'), class: 'sci' },
      { label: 'tan', action: () => handleScientific('tan'), class: 'sci' },
      { label: 'log', action: () => handleScientific('log'), class: 'sci' },
      { label: 'ln', action: () => handleScientific('ln'), class: 'sci' }
    ],
    [
      { label: 'sin⁻¹', action: () => handleScientific('asin'), class: 'sci' },
      { label: 'cos⁻¹', action: () => handleScientific('acos'), class: 'sci' },
      { label: 'tan⁻¹', action: () => handleScientific('atan'), class: 'sci' },
      { label: 'π', action: () => handleScientific('pi'), class: 'sci const' },
      { label: 'e', action: () => handleScientific('e'), class: 'sci const' }
    ],
    [
      { label: '1/x', action: () => handleScientific('inv'), class: 'sci' },
      { label: '|x|', action: () => handleScientific('abs'), class: 'sci' },
      { label: 'n!', action: () => handleScientific('fact'), class: 'sci' },
      { label: 'eˣ', action: () => handleScientific('exp'), class: 'sci' },
      { label: '∛x', action: () => handleScientific('cbrt'), class: 'sci' }
    ],
    [
      { label: 'AC', action: handleClear, class: 'clear' },
      { label: '+/-', action: handleSign, class: 'op' },
      { label: '⌫', action: handleBackspace, class: 'op' },
      { label: '÷', action: () => handleOperator('/'), class: 'operator' },
      { label: '(', action: () => { setExpression((prev) => `${prev}(`); setWaitingForOperand(true) }, class: 'op' }
    ],
    [
      { label: '7', action: () => handleNumber('7'), class: 'num' },
      { label: '8', action: () => handleNumber('8'), class: 'num' },
      { label: '9', action: () => handleNumber('9'), class: 'num' },
      { label: '×', action: () => handleOperator('*'), class: 'operator' },
      { label: ')', action: () => { setExpression((prev) => `${prev}${display})`); setDisplay('0'); setWaitingForOperand(true) }, class: 'op' }
    ],
    [
      { label: '4', action: () => handleNumber('4'), class: 'num' },
      { label: '5', action: () => handleNumber('5'), class: 'num' },
      { label: '6', action: () => handleNumber('6'), class: 'num' },
      { label: '−', action: () => handleOperator('-'), class: 'operator' },
      { label: '%', action: () => setDisplay(String(parseFloat(display) / 100)), class: 'op' }
    ],
    [
      { label: '1', action: () => handleNumber('1'), class: 'num' },
      { label: '2', action: () => handleNumber('2'), class: 'num' },
      { label: '3', action: () => handleNumber('3'), class: 'num' },
      { label: '+', action: () => handleOperator('+'), class: 'operator' },
      { label: '=', action: handleEquals, class: 'equals' }
    ],
    [
      { label: '0', action: () => handleNumber('0'), class: 'num wide' },
      { label: '.', action: handleDecimal, class: 'num' },
      { label: '%', action: () => setDisplay(String(parseFloat(display) / 100)), class: 'op' }
    ]
  ]

  const basicButtons: { label: string; action: () => void; class: string }[][] = [
    [
      { label: 'AC', action: handleClear, class: 'clear' },
      { label: '+/-', action: handleSign, class: 'op' },
      { label: '⌫', action: handleBackspace, class: 'op' },
      { label: '÷', action: () => handleOperator('/'), class: 'operator' },
    ],
    [
      { label: '7', action: () => handleNumber('7'), class: 'num' },
      { label: '8', action: () => handleNumber('8'), class: 'num' },
      { label: '9', action: () => handleNumber('9'), class: 'num' },
      { label: '×', action: () => handleOperator('*'), class: 'operator' },
    ],
    [
      { label: '4', action: () => handleNumber('4'), class: 'num' },
      { label: '5', action: () => handleNumber('5'), class: 'num' },
      { label: '6', action: () => handleNumber('6'), class: 'num' },
      { label: '−', action: () => handleOperator('-'), class: 'operator' },
    ],
    [
      { label: '1', action: () => handleNumber('1'), class: 'num' },
      { label: '2', action: () => handleNumber('2'), class: 'num' },
      { label: '3', action: () => handleNumber('3'), class: 'num' },
      { label: '+', action: () => handleOperator('+'), class: 'operator' },
    ],
    [
      { label: '0', action: () => handleNumber('0'), class: 'num wide' },
      { label: '.', action: handleDecimal, class: 'num' },
      { label: '%', action: () => setDisplay(String(parseFloat(display) / 100)), class: 'op' },
      { label: '=', action: handleEquals, class: 'equals' },
    ]
  ]

  return (
    <div className="calc-overlay">
      <div className="calc-modal">
        {/* Header */}
        <div className="calc-header">
          <span>{mode === 'scientific' ? '🔬 Scientific Calculator' : '🧮 Basic Calculator'}</span>
          <button className="calc-btn mode" onClick={() => setMode((m) => (m === 'basic' ? 'scientific' : 'basic'))}>
            {mode === 'basic' ? 'Scientific' : 'Basic'}
          </button>
          <button className="calc-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Expression display */}
        <div className="calc-expression">{expression || '\u00A0'}</div>

        {/* Main display */}
        <div className="calc-display">{display}</div>

        {/* History */}
        {history.length > 0 && (
          <div className="calc-history">
            {history.map((h, i) => (
              <div key={i} className="calc-history-item">
                {h}
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="calc-buttons">
          {(mode === 'scientific' ? scientificButtons : basicButtons).map((row, ri) => (
            <div key={ri} className="calc-row">
              {row.map((btn, bi) => (
                <button
                  key={bi}
                  className={`calc-btn ${btn.class} ${btn.label === '0' ? 'wide' : ''}`}
                  onClick={btn.action}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CBTCalculator
