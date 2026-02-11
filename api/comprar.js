import crypto from 'crypto';

export default async function handler(request, response) {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_TOKEN;

  if (!pixelId || !token) {
    return response.status(500).json({ error: 'Faltam chaves na Vercel' });
  }

  // Tenta pegar o email se você tiver enviado, senão segue sem email
  const body = request.body || {};
  const email = body.email; 
  const hashedEmail = email 
    ? crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex') 
    : null;

  // Monta os dados para o Facebook
  const eventData = {
    data: [
      {
        event_name: 'InitiateCheckout', // Mudamos para Iniciar Checkout (clique no botão)
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: request.headers.referer, // Pega a URL do seu site
        user_data: {
          em: hashedEmail ? [hashedEmail] : undefined, // Envia email só se tiver
          client_ip_address: request.headers['x-forwarded-for'] || request.socket.remoteAddress,
          client_user_agent: request.headers['user-agent'],
        }
      },
    ],
  };

  try {
    const fbResponse = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      }
    );
    const data = await fbResponse.json();
    return response.status(200).json(data);
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
