// Bootstrap file to match Render's expected entrypoint: src/server.js
// Delegates to the backend server (ESM) using dynamic import
;(async () => {
  try {
    await import('../studyhelpBackend/index.js')
  } catch (err) {
    console.error('Failed to start backend server:', err)
    process.exit(1)
  }
})()

