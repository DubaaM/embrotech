const DATABASE = 'embrotech-sandbox'
const STORE = 'session'
const KEY = 'current'

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    let blocked = false
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => {
      if (blocked) request.result.close()
      else resolve(request.result)
    }
    request.onerror = () => reject(request.error)
    request.onblocked = () => {
      blocked = true
      reject(new Error('Sandbox storage is blocked by another tab.'))
    }
  })
}

async function transaction(mode, action) {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    let tx
    let request
    try {
      tx = database.transaction(STORE, mode)
      request = action(tx.objectStore(STORE))
    } catch (error) {
      database.close()
      reject(error)
      return
    }
    tx.oncomplete = () => {
      database.close()
      resolve(request.result)
    }
    tx.onabort = () => {
      database.close()
      reject(tx.error || new Error('Sandbox storage transaction was aborted.'))
    }
    tx.onerror = () => {
      database.close()
      reject(tx.error || new Error('Sandbox storage transaction failed.'))
    }
  })
}

export function readSandboxSession() {
  return transaction('readonly', (store) => store.get(KEY))
}

export function saveSandboxSession(session) {
  return transaction('readwrite', (store) => store.put(session, KEY))
}

export function clearSandboxSession() {
  return transaction('readwrite', (store) => store.delete(KEY))
}
