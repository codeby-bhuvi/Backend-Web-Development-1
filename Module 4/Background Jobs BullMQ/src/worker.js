'use strict';

// ─── YOUR FILE, implement this ───────────────────────────────────────────────
// Create a BullMQ Worker that processes jobs from the 'email' queue.
//
// Requirements:
//  1. Handle job.name === 'otp': send an email with the OTP using transporter.
//  2. Configure retries: attempts: 3, backoff: { type: 'exponential', delay: 1000 }
//  3. Log worker.on('completed') and worker.on('failed') events.
//  4. Throwing inside the worker function → job fails → BullMQ retries.
//     Returning without throwing → job completed.

// TODO: implement
const { Worker } = require('bullmq');
const { connection } = require('./queue');
const transporter = require('./email'); // adjust if email.js exports { transporter }


const worker = new Worker(
  'email',
  async (job) => {
    if (job.name === 'otp') {
      const { email, otp } = job.data; // match the field names in app.js
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Your verification code',
        text: `Your OTP is ${otp}. It expires in 10 minutes.`,
      });
      return { sent: true };
    }
  },
  { connection }
);


worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) =>
  console.log(`Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`)
);


module.exports = worker;