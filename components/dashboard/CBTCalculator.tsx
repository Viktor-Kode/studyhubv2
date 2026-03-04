'use client'

import { useState, useCallback } from 'react'

interface CalculatorProps {
  onClose: () => void
}

const toRad = (deg: number) => (deg * Math.PI) / 180

const CBTCalculator = ({ onClose }: CalculatorProps) => {
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [isRad, setIsRad] = useState(true) // radians/degrees
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  const [history, setHistory] = useState<string[]>([])

  const calculate = useCallback((expr: string) => {
    try {
      // Safer evaluation than eval (still limited to this component)
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + expr + ')')()
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
    setExpression(display + ' ' + op + ' ')
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
      case 'asin': result = isRad ? Math.asin(val) : (Math.asin(val) * 180) / Math.PI; break
      case 'acos': result = isRad ? Math.acos(val) : (Math.acos(val) * 180) / Math.PI; break
      case 'atan': result = isRad ? Math.atan(val) : (Math.atan(val) * 180) / Math.PI; break
      case 'log': result = Math.log10(val); break
      case 'ln': result = Math.log(val); break
      case 'sqrt': result = Math.sqrt(val); break
      case 'cbrt': result = Math.cbrt(val); break
      case 'sq': result = val * val; break
      case 'cube': result = val * val * val; break
      case 'inv': result = 1 / val; break
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
    const fullExpr = expression + display
    const result = calculate(fullExpr.replace('×', '*').replace('÷', '/'))
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
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0')
  }

  const handleDecimal = () => {
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
      { label: '(', action: () => setExpression(expression + display + ' * ('), class: 'op' }
    ],
    [
      { label: '7', action: () => handleNumber('7'), class: 'num' },
      { label: '8', action: () => handleNumber('8'), class: 'num' },
      { label: '9', action: () => handleNumber('9'), class: 'num' },
      { label: '×', action: () => handleOperator('*'), class: 'operator' },
      { label: ')', action: () => setDisplay(display + ')'), class: 'op' }
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
      { label: 'EXP', action: () => handleOperator('e'), class: 'op' }
    ]
  ]

  return (
    <div className="calc-overlay">
      <div className="calc-modal">
        {/* Header */}
        <div className="calc-header">
          <span>🔬 Scientific Calculator</span>
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
          {scientificButtons.map((row, ri) => (
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
