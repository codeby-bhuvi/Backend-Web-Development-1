'use strict';

// ─── YOUR FILE — implement this ───────────────────────────────────────────────
// Export handleWebhook(req, res), used by POST /webhooks in app.js.
// Also export _processedIds (your Set or Map) for test inspection/reset.
//
// Steps (in order):
//  1. Verify HMAC-SHA256 signature
//     - Signature header: req.headers['x-webhook-signature'] → 'sha256=<hex>'
//     - Compute: crypto.createHmac('sha256', WEBHOOK_SECRET).update(req.body).digest('hex')
//     - Compare: crypto.timingSafeEqual(Buffer.from(expected,'hex'), Buffer.from(received,'hex'))
//     - Mismatch or missing → res.status(401).json({ error: 'Invalid signature' })
//
//  2. Parse body: const event = JSON.parse(req.body)
//
//  3. Idempotency: if _processedIds.has(event.id) → res.status(200).json({ status: 'already_processed' })
//
//  4. Mark: _processedIds.add(event.id)
//
//  5. Acknowledge: res.status(200).json({ status: 'received' })
//     Then call handleEvent(event) inside setImmediate(() => { ... })

const crypto = require('node:crypto');
const { handleEvent } = require('./eventHandlers');

const _processedIds = new Set();

async function handleWebhook(req, res) {
  // 1. Verify HMAC signature
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;

  if (!signature || !secret || !Buffer.isBuffer(req.body)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest('hex');

  const received = signature.startsWith('sha256=')
    ? signature.slice(7)
    : '';

  if (!/^[a-fA-F0-9]{64}$/.test(received)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const valid = crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(received, 'hex')
  );

  if (!valid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 2. Parse the body
  const event = JSON.parse(req.body.toString('utf8'));

  // 3. Check for duplicate events
  if (_processedIds.has(event.id)) {
    return res.status(200).json({
      status: 'already_processed'
    });
  }

  // 4. Mark event as processed
  _processedIds.add(event.id);

  // 5. Acknowledge immediately
  res.status(200).json({ status: 'received' });

  // 6. Process after responding
  setImmediate(() => {
    handleEvent(event);
  });
}

module.exports = { handleWebhook, _processedIds };