import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/book-session", async (req, res) => {
    const { therapist, slot, demographics, evcNumber, userEmail } = req.body;

    try {
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
      res.json({ success: true, message: "Booking confirmed and email sent" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ success: false, error: "Failed to send confirmation email" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
