import CryptoJS from 'crypto-js'

// BASE_URL is '/' in dev and '/DebugUserProductivity/' in production,
// so the SOAP call lands under the deployed app (where web.config rewrites it).
const SOAP_URL = `${import.meta.env.BASE_URL}soap`
const ENCRYPTION_KEY = 'jtesw_ws'
const IV = [110, 120, 130, 140, 150, 160, 170, 180]

// DES encrypt (matching the original C# Cryptography.Encrypt)
function desEncrypt(plainText, key) {
  const keyBytes = CryptoJS.enc.Utf8.parse(key.substring(0, 8))
  const ivBytes = CryptoJS.lib.WordArray.create(new Uint8Array(IV))
  const encrypted = CryptoJS.DES.encrypt(plainText, keyBytes, {
    iv: ivBytes,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  return encrypted.toString() // Base64
}

// Call SOAP web service
export async function loginWithSoap(username, password) {
  const encryptedPassword = desEncrypt(password, ENCRYPTION_KEY)

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ValidateUserCredentialsInAD xmlns="http://jpetewebapp/jtesw_ws/">
      <userName>${escapeXml(username)}</userName>
      <password>${escapeXml(encryptedPassword)}</password>
    </ValidateUserCredentialsInAD>
  </soap:Body>
</soap:Envelope>`

  const res = await fetch(SOAP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': '"http://jpetewebapp/jtesw_ws/ValidateUserCredentialsInAD"',
    },
    body: soapEnvelope,
  })

  if (!res.ok) {
    throw new Error('Unable to connect to authentication server.')
  }

  const text = await res.text()
  console.log('SOAP Response:', text.substring(0, 300))

  // Parse response
  const parser = new DOMParser()
  const xml = parser.parseFromString(text, 'text/xml')

  // Check ReturnedValue
  const returnedValue = xml.getElementsByTagName('ReturnedValue')[0]
  if (returnedValue && returnedValue.textContent === 'true') {
    return { success: true, ntLogin: username, name: username }
  }

  // Check GenericMessages for error details
  const messages = xml.getElementsByTagName('Message')
  if (messages.length > 0) {
    return { success: false, message: messages[0].textContent || 'Invalid credentials.' }
  }

  return { success: false, message: 'Invalid user name or password.' }
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
