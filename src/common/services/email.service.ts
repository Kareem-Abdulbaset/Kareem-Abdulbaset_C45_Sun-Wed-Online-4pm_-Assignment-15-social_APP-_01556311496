import { Injectable } from "@nestjs/common";
import nodemailer from "nodemailer";
import { env } from "../../config/env";

@Injectable()
export class EmailService {
  async sendEmail(to: string, subject: string, html: string) {
    if (!env.email.user || !env.email.pass) {
      console.log("Email to:", to);
      console.log("Subject:", subject);
      console.log("Body:", html);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.secure,
      auth: {
        user: env.email.user,
        pass: env.email.pass
      }
    });

    await transporter.sendMail({
      from: env.email.from,
      to,
      subject,
      html
    });
  }
}
