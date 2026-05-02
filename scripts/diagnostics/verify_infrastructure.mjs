import crypto from 'crypto';

const API_BASE = 'http://localhost:3000/api';
const WEBHOOK_SECRET = 'test_secret_for_verification'; // Asegúrate de que coincida con .env en la prueba

async function testSecurity() {
  console.log('--- Iniciando Batería de Pruebas de Seguridad ---\n');

  // 1. Verificar Headers de Seguridad (Helmet)
  console.log('[1] Probando Cabeceras de Seguridad (Helmet)...');
  const resHealth = await fetch(`${API_BASE}/health`);
  console.log('    X-Powered-By:', resHealth.headers.get('x-powered-by') || 'Removido (Ok)');
  console.log('    Content-Security-Policy:', resHealth.headers.get('content-security-policy') ? 'Presente (Ok)' : 'Faltante (Error)');
  
  // 2. Probar Rate Limiting en Auth
  console.log('\n[2] Probando Rate Limiting en /api/auth (10 req max)...');
  for (let i = 0; i < 12; i++) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'test@mandy.com', password: 'wrong' })
    });
    if (res.status === 429) {
      console.log(`    Bloqueado en el intento ${i + 1} (Status 429): Éxito.`);
      break;
    }
    if (i === 11) console.log('    Error: Rate limit no se activó después de 12 intentos.');
  }

  // 3. Probar Webhooks (Firma Inválida)
  console.log('\n[3] Probando Webhook con firma inválida...');
  const resBadSig = await fetch(`${API_BASE}/webhooks/generic`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-mandy-signature': 'bad_signature'
    },
    body: JSON.stringify({ event_id: 'evt_1', provider: 'test' })
  });
  console.log(`    Status: ${resBadSig.status} (Esperado 401): ${resBadSig.status === 401 ? 'Éxito' : 'Fallo'}`);

  // 4. Probar Idempotencia (Mismo event_id)
  console.log('\n[4] Probando Idempotencia en Webhooks...');
  const event_id = `test_evt_${Date.now()}`;
  const rawObj = { event_id, provider: 'test', payload: {} };
  const payloadStr = JSON.stringify(rawObj); // Serialización estándar
  
  // Generar firma válida para el test
  const hmac = crypto.createHmac('sha256', 'mandys_bar_webhook_secret_2026');
  const signature = hmac.update(payloadStr).digest('hex');

  const sendWebhook = () => fetch(`${API_BASE}/webhooks/generic`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-mandy-signature': signature
    },
    body: payloadStr
  });

  const res1 = await sendWebhook();
  console.log(`    Intento 1: ${res1.status} (Esperado 200)`);
  
  const res2 = await sendWebhook();
  const data2 = await res2.json();
  console.log(`    Intento 2: ${res2.status} - Mensaje: ${data2.message}`);
  if (data2.message && data2.message.includes('Idempotencia')) {
    console.log('    Idempotencia verificada: Éxito.');
  } else {
    console.log('    Fallo: El segundo intento no fue detectado como duplicado.');
  }
}

testSecurity().catch(console.error);
