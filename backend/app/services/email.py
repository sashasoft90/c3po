"""Email service for sending notifications."""

from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from loguru import logger
from pydantic import EmailStr

from app.config import settings


class EmailService:
    """Service for sending emails using FastAPI Mail."""

    def __init__(self):
        """Initialize email service with configuration."""
        self.conf = ConnectionConfig(
            MAIL_USERNAME=settings.MAIL_USERNAME,
            MAIL_PASSWORD=settings.MAIL_PASSWORD,
            MAIL_FROM=settings.MAIL_FROM,
            MAIL_PORT=settings.MAIL_PORT,
            MAIL_SERVER=settings.MAIL_SERVER,
            MAIL_STARTTLS=settings.MAIL_STARTTLS,
            MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
            USE_CREDENTIALS=settings.MAIL_USE_CREDENTIALS,
            VALIDATE_CERTS=settings.MAIL_VALIDATE_CERTS,
            # TEMPLATE_FOLDER=Path(__file__).parent.parent / "templates" / "email",
        )
        self.fastmail = FastMail(self.conf)

    async def send_email(
        self,
        subject: str,
        recipients: list[EmailStr],
        body: str,
        subtype: MessageType = MessageType.plain,
    ) -> bool:
        """
        Send a simple email.

        Args:
            subject: Email subject
            recipients: List of recipient email addresses
            body: Email body content
            subtype: Message type (plain or html)

        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            message = MessageSchema(
                subject=subject,
                recipients=recipients,
                body=body,
                subtype=subtype,
            )
            await self.fastmail.send_message(message)
            logger.info(f"Email sent successfully to {recipients}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {recipients}: {str(e)}")
            return False

    async def send_welcome_email(self, email: EmailStr, first_name: str) -> bool:
        """
        Send welcome email to new user.

        Args:
            email: User email address
            first_name: User first name

        Returns:
            True if email sent successfully
        """
        subject = f"Welcome to {settings.APP_NAME}!"
        body = f"""
Hello {first_name},

Welcome to {settings.APP_NAME}! We're excited to have you on board.

Your account has been successfully created and you can now start scheduling appointments.

Best regards,
The {settings.APP_NAME} Team
"""
        return await self.send_email(subject, [email], body)

    async def send_verification_email(self, email: EmailStr, verification_token: str) -> bool:
        """
        Send email verification link.

        Args:
            email: User email address
            verification_token: Verification token

        Returns:
            True if email sent successfully
        """
        # Build verification URL (adjust based on your frontend URL)
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"

        subject = f"Verify your {settings.APP_NAME} account"
        body = f"""
Please verify your email address by clicking the link below:

{verification_url}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

Best regards,
The {settings.APP_NAME} Team
"""
        return await self.send_email(subject, [email], body)

    async def send_password_reset_email(self, email: EmailStr, reset_token: str) -> bool:
        """
        Send password reset link.

        Args:
            email: User email address
            reset_token: Password reset token

        Returns:
            True if email sent successfully
        """
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

        subject = "Reset your password"
        body = f"""
You requested to reset your password. Click the link below to set a new password:

{reset_url}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email.

Best regards,
The {settings.APP_NAME} Team
"""
        return await self.send_email(subject, [email], body)

    async def send_appointment_confirmation(
        self,
        email: EmailStr,
        first_name: str,
        appointment_details: dict[str, Any],
    ) -> bool:
        """
        Send appointment confirmation email.

        Args:
            email: User email address
            first_name: User first name
            appointment_details: Dictionary with appointment information

        Returns:
            True if email sent successfully
        """
        title = appointment_details.get("title", "Appointment")
        start_time = appointment_details.get("start_time")
        end_time = appointment_details.get("end_time")

        # Format datetime for display
        if isinstance(start_time, datetime):
            start_str = start_time.strftime("%B %d, %Y at %I:%M %p")
        else:
            start_str = str(start_time)

        if isinstance(end_time, datetime):
            end_str = end_time.strftime("%I:%M %p")
        else:
            end_str = str(end_time)

        subject = f"Appointment Confirmed: {title}"
        body = f"""
Hello {first_name},

Your appointment has been confirmed!

Title: {title}
Date & Time: {start_str} - {end_str}
{f'Description: {appointment_details.get("description")}' if appointment_details.get("description") else ""}

We look forward to seeing you!

Best regards,
The {settings.APP_NAME} Team
"""
        return await self.send_email(subject, [email], body)

    async def send_appointment_reminder(
        self,
        email: EmailStr,
        first_name: str,
        appointment_details: dict[str, Any],
        hours_before: int = 24,
    ) -> bool:
        """
        Send appointment reminder email.

        Args:
            email: User email address
            first_name: User first name
            appointment_details: Dictionary with appointment information
            hours_before: Hours before appointment (for message)

        Returns:
            True if email sent successfully
        """
        title = appointment_details.get("title", "Appointment")
        start_time = appointment_details.get("start_time")

        if isinstance(start_time, datetime):
            start_str = start_time.strftime("%B %d, %Y at %I:%M %p")
        else:
            start_str = str(start_time)

        subject = f"Reminder: Upcoming appointment in {hours_before} hours"
        body = f"""
Hello {first_name},

This is a reminder that you have an upcoming appointment:

Title: {title}
Date & Time: {start_str}

Please arrive a few minutes early.

Best regards,
The {settings.APP_NAME} Team
"""
        return await self.send_email(subject, [email], body)

    async def send_appointment_cancelled(
        self,
        email: EmailStr,
        first_name: str,
        appointment_details: dict[str, Any],
    ) -> bool:
        """
        Send appointment cancellation email.

        Args:
            email: User email address
            first_name: User first name
            appointment_details: Dictionary with appointment information

        Returns:
            True if email sent successfully
        """
        title = appointment_details.get("title", "Appointment")

        subject = f"Appointment Cancelled: {title}"
        body = f"""
Hello {first_name},

Your appointment "{title}" has been cancelled.

If you would like to reschedule, please log in to your account.

Best regards,
The {settings.APP_NAME} Team
"""
        return await self.send_email(subject, [email], body)


# Global email service instance
email_service = EmailService()
