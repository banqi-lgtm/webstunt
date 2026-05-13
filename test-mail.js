const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'copastuntfrnitrox@gmail.com',
    pass: 'ldws zuaa adkj wljm',
  },
});

async function main() {
  try {
    const info = await transporter.sendMail({
      from: '"Test" <copastuntfrnitrox@gmail.com>',
      to: 'copastuntfrnitrox@gmail.com',
      subject: 'Test Reset',
      text: 'Test',
    });
    console.log('Success:', info.messageId);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
