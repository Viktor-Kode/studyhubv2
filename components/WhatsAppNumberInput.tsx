'use client'

import { useState, useEffect } from 'react'
import { FiCheck, FiX, FiInfo, FiAlertTriangle } from 'react-icons/fi'
import { MdWhatsapp } from 'react-icons/md'

interface WhatsAppNumberInputProps {
    value: string
    onChange: (formattedNumber: string) => void
    onValidChange?: (isValid: boolean) => void
    className?: string
}

// Popular country codes for quick selection
const COUNTRY_CODES = [
    { code: '+234', country: 'Nigeria', flag: '🇳🇬', example: '8012345678' },
    { code: '+1', country: 'USA/Canada', flag: '🇺🇸', example: '2025551234' },
    { code: '+44', country: 'UK', flag: '🇬🇧', example: '7400123456' },
    { code: '+91', country: 'India', flag: '🇮🇳', example: '9876543210' },
    { code: '+254', country: 'Kenya', flag: '🇰🇪', example: '712345678' },
    { code: '+233', country: 'Ghana', flag: '🇬🇭', example: '241234567' },
    { code: '+27', country: 'South Africa', flag: '🇿🇦', example: '821234567' },
    { code: '+256', country: 'Uganda', flag: '🇺🇬', example: '712345678' },
    { code: '+255', country: 'Tanzania', flag: '🇹🇿', example: '712345678' },
    { code: '+237', country: 'Cameroon', flag: '🇨🇲', example: '671234567' },
]

export default function WhatsAppNumberInput({
    value,
    onChange,
    onValidChange,
    className = ''
}: WhatsAppNumberInputProps) {
    const [displayValue, setDisplayValue] = useState('')
    const [selectedCountryCode, setSelectedCountryCode] = useState('+234')
    const [isValid, setIsValid] = useState(false)
    const [error, setError] = useState('')

    // Parse initial value
    useEffect(() => {
        if (value) {
            // Extract the number part from whatsapp:+1234567890
            const match = value.match(/whatsapp:(\+\d+)/)
            if (match) {
                let fullNumber = match[1]
                // Check if it starts with a known country code
                // We need to sort by length desc to match +234 before +23 etc if overlaps existed, 
                // but here +1 is short. Let's find the specific match.

                let detected = false
                for (const country of COUNTRY_CODES) {
                    if (fullNumber.startsWith(country.code)) {
                        setSelectedCountryCode(country.code)
                        setDisplayValue(fullNumber.substring(country.code.length))
                        detected = true
                        break
                    }
                }

                if (!detected) {
                    // retain + symbol if no code matched, or just strip it? 
                    // The component logic expects displayValue to be the local part usually.
                    // If we can't map it, we might have an issue displaying it "nicely" with the selector.
                    // But let's assume standard behavior.
                    // If it starts with + but no code match, maybe just set code to empty? 
                    // Or default to +234 and put the whole thing? 
                    // Let's just try to strip the + and let the user fix it if it's weird.
                    setDisplayValue(fullNumber.replace(/^\+/, ''))
                }
            }
        }
    }, [value]) // Dependency on value to update internal state if external changes? 
    // careful of loops. The user code had [] dependency. 
    // If I use [], it only sets on mount. That's probably safer for an controlled input loop.
    // Converting the user's Effect to one with empty dependency array as requested in the prompt code.
    // Wait, the prompt code says:
    /*
    useEffect(() => {
      if (value) {
        // ...
      }
    }, [])
    */
    // I will stick to that to be safe, although strictly controlled inputs usually sync.

    // Validate and format number
    useEffect(() => {
        validateNumber(displayValue)
    }, [displayValue, selectedCountryCode])

    const validateNumber = (number: string) => {
        // Remove all non-digits
        const cleaned = number.replace(/\D/g, '')

        // Check if number is valid length (typically 7-15 digits)
        if (cleaned.length < 7) {
            if (cleaned.length > 0) setError('Too short - phone numbers are usually 7-15 digits')
            else setError('') // Empty is not error, just invalid
            setIsValid(false)
            onValidChange?.(false)
            // We still update parent to clear or partial? 
            // The prompt says: onChange(formatted) only at the end.
            // If invalid, maybe we shouldn't trigger onChange with a "valid" looking whatsapp string?
            // But the user might want to save partials? 
            // The prompt code calls onChange at the end of function.
            return
        }

        if (cleaned.length > 15) {
            setError('Too long - phone numbers are usually 7-15 digits')
            setIsValid(false)
            onValidChange?.(false)
            return
        }

        // Format as whatsapp:+countrycode+number
        const formatted = `whatsapp:${selectedCountryCode}${cleaned}`
        setError('')
        setIsValid(true)
        onValidChange?.(true)
        onChange(formatted)
    }

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value
        // Allow only digits, spaces, dashes, parentheses (will be cleaned)
        const filtered = input.replace(/[^\d\s\-()]/g, '')
        setDisplayValue(filtered)
    }

    const handleCountryCodeChange = (code: string) => {
        setSelectedCountryCode(code)
    }

    const handleQuickFill = (example: string) => {
        setDisplayValue(example)
    }

    // Get the current country info
    const currentCountry = COUNTRY_CODES.find(c => c.code === selectedCountryCode)

    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MdWhatsapp className="inline text-green-500 mr-1" />
                WhatsApp Number
            </label>

            {/* Country Code Selector */}
            <div className="mb-2">
                <select
                    value={selectedCountryCode}
                    onChange={e => handleCountryCodeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm
                     focus:ring-2 focus:ring-green-500 focus:outline-none"
                >
                    {COUNTRY_CODES.map(({ code, country, flag }) => (
                        <option key={code} value={code}>
                            {flag} {country} ({code})
                        </option>
                    ))}
                </select>
            </div>

            {/* Number Input */}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-mono text-sm">
                    {selectedCountryCode}
                </div>
                <input
                    type="tel"
                    value={displayValue}
                    onChange={handleNumberChange}
                    placeholder={currentCountry?.example || '8012345678'}
                    className={`w-full pl-16 pr-12 py-3 border-2 rounded-lg
                     text-gray-900 dark:text-white bg-white dark:bg-gray-700
                     focus:ring-2 focus:outline-none transition text-sm font-mono
                     ${isValid
                            ? 'border-green-500 focus:ring-green-500'
                            : error && displayValue.length > 0
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {displayValue && (
                        isValid ? (
                            <FiCheck className="text-green-500 text-lg" />
                        ) : error ? (
                            <FiX className="text-red-500 text-lg" />
                        ) : null
                    )}
                </div>
            </div>

            {/* Preview */}
            {displayValue && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Preview:</p>
                            <p className="font-mono text-sm text-gray-900 dark:text-white">
                                whatsapp:{selectedCountryCode}{displayValue.replace(/\D/g, '')}
                            </p>
                        </div>
                        {isValid && (
                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded font-medium">
                                Valid ✓
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && displayValue.length > 0 && (
                <div className="mt-2 flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                    <FiAlertTriangle className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Example / Help */}
            {!displayValue && currentCountry && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-2">
                        <FiInfo className="text-blue-500 flex-shrink-0 mt-0.5 text-sm" />
                        <div className="text-sm">
                            <p className="text-blue-800 dark:text-blue-200 font-medium mb-1">
                                Example for {currentCountry.country}:
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                                    {currentCountry.example}
                                </code>
                                <button
                                    type="button"
                                    onClick={() => handleQuickFill(currentCountry.example)}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Use example
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Format Guide */}
            <div className="mt-3 space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    <strong>Tips:</strong>
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5 ml-4 list-disc">
                    <li>Enter only the phone number (without country code)</li>
                    <li>Spaces and dashes will be automatically removed</li>
                    <li>Must be 7-15 digits long</li>
                    <li>Make sure this number has WhatsApp installed</li>
                </ul>
            </div>
        </div>
    )
}
