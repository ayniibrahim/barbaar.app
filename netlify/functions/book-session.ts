import { Handler } from "@netlify/functions";
import nodemailer from "nodemailer";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { therapist, slot, demographics, evcNumber, userEmail } = JSON.parse(event.body || "{}");

    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || 'barbaaryp@gmail.com',
        pass: process.env.SMTP_PASS || 'ixbkexjpucftjblj',
      },
    });

    const mailOptions = {
      from: `"Barbaar Therapy" <${process.env.SMTP_USER || 'barbaaryp@gmail.com'}>`,
      to: "barbaaryp@gmail.com",
      subject: `New Therapy Session Booked: ${therapist.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #334C44;">New Session Booking</h2>
          <p>A new therapy session has been booked through the Barbaar app.</p>
          
          <div style="background: #F8F9F8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #76B06E;">Session Details</h3>
            <p><strong>Therapist:</strong> ${therapist.name}</p>
            <p><strong>Specialty:</strong> ${therapist.specialty}</p>
            <p><strong>Time:</strong> ${slot}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <div style="background: #F8F9F8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #76B06E;">Client Information</h3>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Age:</strong> ${demographics.age}</p>
            <p><strong>Gender:</strong> ${demographics.gender}</p>
            <p><strong>Location:</strong> ${demographics.location}</p>
            <p><strong>Primary Goal:</strong> ${demographics.goal}</p>
          </div>

          <div style="background: #F8F9F8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #76B06E;">Payment Information</h3>
            <p><strong>EVC Number:</strong> ${evcNumber}</p>
            <p><strong>Amount:</strong> ${therapist.rate}</p>
            <p><strong>Status:</strong> Pending Confirmation (EVC Payment)</p>
          </div>

          <p style="font-size: 12px; color: #888;">This is an automated notification from Barbaar App.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Booking confirmed and email sent" }),
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: "Failed to send confirmation email" }),
    };
  }
};
