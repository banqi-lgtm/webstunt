import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Correo electrónico es requerido' }, { status: 400 });
    }

    // 1. Generate the Password Reset Link using Firebase Admin
    const actionCodeSettings = {
      url: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/#login` : 'http://localhost:9002/#login',
    };
    
    const link = await getAdminAuth().generatePasswordResetLink(email, actionCodeSettings);

    // 2. Configure Nodemailer with Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 3. Create the HTML Template (Dark-Gritty Neon)
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña - Copa Stunt 2026</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #050505;
            color: #E8E8E8;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #0A0A0A;
            border: 1px solid #1A2540;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 0 30px rgba(57, 255, 20, 0.1);
          }
          .header {
            background-color: #000000;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 2px solid #39FF14;
          }
          .logo-text {
            color: #ffffff;
            font-size: 24px;
            font-weight: 900;
            letter-spacing: 4px;
            margin: 0;
            text-transform: uppercase;
          }
          .logo-text span {
            color: #39FF14;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          .title {
            color: #39FF14;
            font-size: 22px;
            font-weight: 800;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .message {
            color: #A0A0A0;
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 40px;
          }
          .btn-container {
            margin: 30px 0;
          }
          .btn {
            background-color: #39FF14;
            color: #000000;
            text-decoration: none;
            padding: 16px 32px;
            font-weight: 900;
            font-size: 16px;
            border-radius: 8px;
            text-transform: uppercase;
            letter-spacing: 2px;
            display: inline-block;
            box-shadow: 0 0 20px rgba(57, 255, 20, 0.4);
          }
          .footer {
            background-color: #000000;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #1A2540;
            font-size: 12px;
            color: #555555;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #050505; padding: 40px 10px;">
          <tr>
            <td align="center">
              <div class="container">
                <div class="header">
                  <h1 class="logo-text">COPA STUNT <span>2026</span></h1>
                </div>
                <div class="content">
                  <h2 class="title">Recuperación de Acceso</h2>
                  <p class="message">
                    Hola Piloto,<br><br>
                    Hemos recibido una solicitud para restablecer la contraseña asociada a tu cuenta <strong>${email}</strong>.<br>
                    Haz clic en el siguiente botón para crear una nueva contraseña segura y volver a acceder a tu panel de inscripción.
                  </p>
                  
                  <div class="btn-container">
                    <a href="${link}" class="btn">Restablecer Contraseña</a>
                  </div>
                  
                  <p class="message" style="font-size: 13px; margin-top: 40px; margin-bottom: 0;">
                    Si no fuiste tú quien solicitó este cambio, puedes ignorar este correo de forma segura. Tu cuenta seguirá protegida.
                  </p>
                </div>
                <div class="footer">
                  <p>Este es un correo automático generado por el sistema de Copa Stunt Colombia.</p>
                  <p>&copy; 2026 Paskines Stunt. Todos los derechos reservados.</p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // 4. Send Email
    const mailOptions = {
      from: `"Copa Stunt 2026" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'RECUPERACIÓN DE CONTRASEÑA - Copa Stunt 2026',
      html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Correo enviado correctamente' });

  } catch (error: any) {
    console.error('Error en API de reset-password:', error);
    
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ error: 'auth/user-not-found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Error al enviar el correo de recuperación' }, { status: 500 });
  }
}
