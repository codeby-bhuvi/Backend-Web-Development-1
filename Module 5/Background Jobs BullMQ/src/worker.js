
'use strict';

const { Worker } = require('bullmq');
const { connection } = require('./queue');
const transporter = require('./email');

const worker = new Worker(
  'email',
  async (job) => {
    if (job.name === 'otp') {
      const { email, otp } = job.data;

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Your verification code',
        text: `Your OTP is ${otp}. It expires in 10 minutes.`,
      });

      return { sent: true };
    }

    throw new Error(`Unknown job type: ${job.name}`);
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.log(
    `Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`
  );
});

module.exports = worker;
