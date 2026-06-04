import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

@Injectable()
export class EmailService {
  private getTransporter(): Transporter {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    if (!user || !pass) {
      throw new Error('SMTP credentials not configured. Set SMTP_USER and SMTP_PASS in .env');
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }

  private getMailFrom(): string {
    return process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@example.com';
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    const from = this.getMailFrom();
    const to = Array.isArray(options.to) ? options.to : [options.to];
    const transport = this.getTransporter();

    await transport.sendMail({
      from,
      to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc
    });
  }

  async verifyConnection(): Promise<boolean> {
    try {
      const transport = this.getTransporter();
      await transport.verify();
      return true;
    } catch {
      return false;
    }
  }
}
