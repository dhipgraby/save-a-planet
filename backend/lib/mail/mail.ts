import { EmailActionType, EmailActions } from "apps/auth/src/users/dto/reset-password.dto";
import { Resend } from "resend";
import * as dotenv from 'dotenv';
import { HttpException, HttpStatus } from "@nestjs/common";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const domain = process.env.USER_PORTAL;

const emailFooter = `
  <small>
      Save a Planet.</small>`;

const emailLogo = `<img alt="KenLogo" src="https://keneth.dev/_next/image?url=%2FKenlogo.png&w=256&q=75" width="150px" />`;

export const sendVerificationEmail = async (
  email: string,
  token: string,
  action: EmailActionType
) => {
  try {
    let subject;
    let htmlContent;
    if (action === EmailActions.EMAIL_VERIFICATION) {
      const confirmLink = `${domain}/auth/new-verification?token=${token}`;
      subject = "Save a Planet - Confirm your email";
      htmlContent = `
        ${emailLogo}
        <br/>
        <p>Click <a href="${confirmLink}">here</a> to confirm your email.</p>
        <br/>
        ${emailFooter}
      `;
    } else if (action === EmailActions.PASSWORD_RESET) {
      const confirmLink = `${domain}/auth/new-password?token=${token}`;
      subject = "Save a Planet - Confirm password reset Token";
      htmlContent = `
        ${emailLogo}
        <br/>
        <p>Click <a href="${confirmLink}">here</a> to confirm your email.</p>
        <br/>
        ${emailFooter}
      `;
    } else {
      throw new HttpException("Email action not allowed", HttpStatus.BAD_REQUEST);
    }

    const sending = await resend.emails.send({
      from: `Save a Planet <contact@Ken.cc>`,
      to: email,
      subject: subject,
      html: htmlContent
    });

    console.log('Verification email sent to: ', email);
    if (sending.error !== null) throw new HttpException(`Error sending email to: ${email}`, HttpStatus.BAD_REQUEST)
  } catch (error) {
    throw new HttpException(`Error sending email to: ${email}`, HttpStatus.BAD_REQUEST)
  }
};