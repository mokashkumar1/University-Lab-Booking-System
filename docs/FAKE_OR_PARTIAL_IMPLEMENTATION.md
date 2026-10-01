# Fake or Partial Implementations

This document explicitly identifies features that LOOK implemented or are partially implemented but are not actually fully functional according to the problem statement.

### 1. Smart Resource Recommendation (Match Score)
* **What looks implemented:** The system provides alternatives when a booking conflicts, utilizing a deterministic scoring algorithm behind the scenes (`lib/alternatives.ts`).
* **What is actually missing:** The hackathon problem statement explicitly requires showing a "Match Score" percentage to the user (e.g., **95%** Match). The UI only presents the top suggestions without displaying the actual calculated match percentage to the user.

### 2. Notifications
* **What looks implemented:** There is a `notifications` table in the database and a UI screen to view notifications (`/notifications`). The backend transactional workflows do write to this table.
* **What is actually missing:** The problem statement implies "Automated notifications are sent when...". The current implementation only writes a database row and displays it inside the app when the user logs in. There is no external push notification (Web Push / Firebase FCM) or email notification delivery implemented.

### 3. Priority Levels (Coordinator Control)
* **What looks implemented:** The schema defines a `priority` field on bookings and provides a `set_booking_priority` PostgreSQL function for Coordinators/Admins to adjust it. The frontend UI also sorts the approval queue based on this priority.
* **What is actually missing:** There is absolutely no UI or frontend API route for a Coordinator to actually *trigger* a change to the priority level. The function `set_booking_priority` is never called by the application code.

### 4. Additional Innovation Features (Judging Edge)
* **What looks implemented:** The repository includes a `components` directory and lists features like QR scanning or Heatmaps in its planning documents (`docs/TODO.md`, `final-plan.md`).
* **What is actually missing:** These features were consciously marked as "Deferred" or "Out of scope" by the developers due to time constraints, meaning they are completely missing from the final product despite being suggested as technical depth multipliers in the hackathon problem statement.
