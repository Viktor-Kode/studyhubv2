let alarmInterval: NodeJS.Timeout | null = null
let audioContext: AudioContext | null = null

// Create beep sound using Web Audio API (works without audio files)
const createBeep = (frequency = 800, duration = 600, volume = 0.8) => {
    try {
        if (typeof window !== 'undefined' && !audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        }

        if (!audioContext) return

        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = frequency
        oscillator.type = 'sine'

        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01)
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration / 1000)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + duration / 1000)
    } catch (error) {
        console.error('Audio error:', error)
    }
}

// Play alarm pattern: 3 beeps
const playAlarmPattern = () => {
    createBeep(880, 300, 0.9)
    setTimeout(() => createBeep(880, 300, 0.9), 400)
    setTimeout(() => createBeep(1100, 500, 1.0), 800)
}

// Start repeating alarm that continues until stopped
export const startAlarm = () => {
    if (typeof window === 'undefined') return

    stopAlarm() // clear any existing alarm first

    // Play immediately
    playAlarmPattern()

    // Repeat every 5 seconds until stopped
    alarmInterval = setInterval(() => {
        playAlarmPattern()
    }, 5000)

    // Store alarm state in localStorage so we know alarm is active
    localStorage.setItem('alarmActive', 'true')
    localStorage.setItem('alarmStartedAt', Date.now().toString())
}

export const stopAlarm = () => {
    if (typeof window === 'undefined') return

    if (alarmInterval) {
        clearInterval(alarmInterval)
        alarmInterval = null
    }
    localStorage.removeItem('alarmActive')
    localStorage.removeItem('alarmStartedAt')
}

export const isAlarmActive = (): boolean => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('alarmActive') === 'true'
}

// Show browser notification when user is away from page
export const showTimerNotification = async (title: string, body: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body,
            icon: '/favicon.ico',
            requireInteraction: true, // stays until user interacts
            tag: 'study-timer'        // replaces previous notification
        })

        notification.onclick = () => {
            window.focus()
            notification.close()
        }
    } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
            showTimerNotification(title, body)
        }
    }
}

export const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission()
    }
}
