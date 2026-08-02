import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendWelcomeEmail(user: { email: string; name: string }) {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Welcome to MathBuddy!',
        template: 'welcome',
        context: {
          name: user.name,
        },
      });
      this.logger.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${user.email}`, error);
    }
  }

  async sendClassScheduledEmail(
    recipientEmail: string,
    context: {
      studentName: string;
      teacherName: string;
      date: string;
      time: string;
      link: string;
    },
  ) {
    try {
      await this.mailerService.sendMail({
        to: recipientEmail,
        subject: 'New Class Scheduled - MathBuddy',
        template: 'class-scheduled',
        context,
      });
      this.logger.log(`Class scheduled email sent to ${recipientEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send class scheduled email to ${recipientEmail}`,
        error,
      );
    }
  }

  async sendPaymentVerifiedEmail(
    guardianEmail: string,
    context: {
      guardianName: string;
      studentName: string;
      amount: string;
      hoursAdded: number;
    },
  ) {
    try {
      await this.mailerService.sendMail({
        to: guardianEmail,
        subject: 'Payment Verified - MathBuddy',
        template: 'payment-verified',
        context,
      });
      this.logger.log(`Payment verified email sent to ${guardianEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send payment verified email to ${guardianEmail}`,
        error,
      );
    }
  }
}
