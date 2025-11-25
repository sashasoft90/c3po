"""Seed script to populate database with test data."""

import asyncio
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.appointment import Appointment, AppointmentStatus
from app.models.user import User, UserRole
from app.utils.security import get_password_hash


async def create_user_if_not_exists(
	db: AsyncSession, email: str, password: str, first_name: str, last_name: str, role: UserRole, phone: str | None = None
) -> User:
	"""Create user if doesn't exist, otherwise return existing."""
	result = await db.execute(select(User).where(User.email == email))
	user = result.scalar_one_or_none()

	if user:
		print(f"✓ User {email} already exists (id={user.id})")
		return user

	user = User(
		email=email,
		password_hash=get_password_hash(password),
		first_name=first_name,
		last_name=last_name,
		phone=phone,
		role=role,
		is_active=True,
		is_verified=True,  # Auto-verify test users
	)
	db.add(user)
	await db.commit()
	await db.refresh(user)
	print(f"✓ Created user {email} (id={user.id}, role={role.value})")
	return user


async def create_appointments_for_user(db: AsyncSession, user: User, count: int = 5):
	"""Create sample appointments for a user."""
	now = datetime.now(timezone.utc)
	statuses = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]

	appointments_created = 0
	for i in range(count):
		# Distribute appointments across past, present, and future
		days_offset = i - 2  # -2, -1, 0, 1, 2
		start_time = now + timedelta(days=days_offset, hours=9 + i * 2)
		end_time = start_time + timedelta(hours=1)

		# Choose status based on time
		if days_offset < 0:
			status = AppointmentStatus.COMPLETED  # Past appointments
		elif days_offset == 0:
			status = AppointmentStatus.CONFIRMED  # Today
		else:
			status = statuses[i % len(statuses)]  # Mix for future

		appointment = Appointment(
			user_id=user.id,
			title=f"Appointment {i + 1} - {user.first_name}",
			description=f"Test appointment #{i + 1} for {user.full_name}",
			start_time=start_time,
			end_time=end_time,
			status=status,
			notes=f"Internal notes for appointment {i + 1}" if i % 2 == 0 else None,
		)
		db.add(appointment)
		appointments_created += 1

	await db.commit()
	print(f"  → Created {appointments_created} appointments for {user.email}")


async def seed_database():
	"""Seed the database with test data."""
	print("\n🌱 Starting database seeding...\n")

	async with AsyncSessionLocal() as db:
		try:
			# Create Admin
			admin = await create_user_if_not_exists(
				db=db,
				email="admin@test.com",
				password="admin123",
				first_name="Admin",
				last_name="User",
				role=UserRole.ADMIN,
				phone="+1234567890",
			)

			# Create Staff (Masters)
			staff1 = await create_user_if_not_exists(
				db=db,
				email="master1@test.com",
				password="master123",
				first_name="John",
				last_name="Master",
				role=UserRole.STAFF,
				phone="+1234567891",
			)

			staff2 = await create_user_if_not_exists(
				db=db,
				email="master2@test.com",
				password="master123",
				first_name="Jane",
				last_name="Specialist",
				role=UserRole.STAFF,
				phone="+1234567892",
			)

			# Create Regular Users (Clients)
			client1 = await create_user_if_not_exists(
				db=db,
				email="client1@test.com",
				password="client123",
				first_name="Alice",
				last_name="Client",
				role=UserRole.USER,
				phone="+1234567893",
			)

			client2 = await create_user_if_not_exists(
				db=db,
				email="client2@test.com",
				password="client123",
				first_name="Bob",
				last_name="Customer",
				role=UserRole.USER,
				phone="+1234567894",
			)

			client3 = await create_user_if_not_exists(
				db=db,
				email="client3@test.com",
				password="client123",
				first_name="Charlie",
				last_name="User",
				role=UserRole.USER,
			)

			print("\n📅 Creating appointments...\n")

			# Create appointments for clients
			await create_appointments_for_user(db, client1, count=7)
			await create_appointments_for_user(db, client2, count=5)
			await create_appointments_for_user(db, client3, count=3)

			print("\n✅ Database seeding completed!\n")
			print("=" * 60)
			print("Test Accounts Created:")
			print("=" * 60)
			print("\n👑 ADMIN:")
			print(f"   Email: {admin.email}")
			print("   Password: admin123")
			print("\n🔧 STAFF (Masters):")
			print(f"   Email: {staff1.email} | Password: master123")
			print(f"   Email: {staff2.email} | Password: master123")
			print("\n👤 CLIENTS:")
			print(f"   Email: {client1.email} | Password: client123")
			print(f"   Email: {client2.email} | Password: client123")
			print(f"   Email: {client3.email} | Password: client123")
			print("\n" + "=" * 60)
			print("\n💡 Login URL: http://localhost:5173/login")
			print("📚 API Docs: http://localhost:8000/docs\n")

		except Exception as e:
			print(f"\n❌ Error during seeding: {e}")
			await db.rollback()
			raise


def main():
	"""Run the seed script."""
	try:
		asyncio.run(seed_database())
	except KeyboardInterrupt:
		print("\n\n⚠️  Seeding cancelled by user")
		sys.exit(1)
	except Exception as e:
		print(f"\n❌ Seeding failed: {e}")
		sys.exit(1)


if __name__ == "__main__":
	main()
