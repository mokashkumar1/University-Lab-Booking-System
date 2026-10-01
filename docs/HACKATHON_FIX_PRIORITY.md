# Hackathon Fix Priority

This document prioritizes the gaps identified between the hackathon problem statement and the current implementation.

## P0 — Critical Requirement Gaps

Requirements that are central to the hackathon problem and currently missing/broken.

1. **Intelligent Feature: Usage Prediction (REQ-036)**
   * **Why:** The problem statement explicitly asks for "Usage Prediction" as one of the intelligent features. Skipping it leaves a major gap in the core requirements.
   * **Action:** Implement a heuristic that analyzes past booking frequency and tags highly-utilized labs/equipment with a "High Demand Expected" flag on the browse/dashboard screens.

2. **Intelligent Feature: Maintenance & Priority Recommendations (REQ-037, REQ-038)**
   * **Why:** These are explicitly listed under "Additional Intelligent Features" which are meant to separate this project from a standard CRUD app.
   * **Action:** Implement algorithms to flag items needing inspection based on usage frequency/damage history, and flag student requests as high-priority based on keyword analysis of their booking purpose.

3. **Display Match Score Percentage (REQ-033)**
   * **Why:** The problem statement explicitly demonstrates the Match Score feature with percentage values (e.g., "95%"). The current implementation computes a score but hides it from the user.
   * **Action:** Expose the calculated alternative score as a percentage in the UI when suggesting alternatives.

## P1 — Major Requirement Gaps

Important functionality required by the problem statement.

1. **Coordinator Priority Control UI (REQ-022)**
   * **Why:** Coordinators are explicitly required to "Set priority levels" for requests. The database supports this (`set_booking_priority`), but the UI has no way to invoke it.
   * **Action:** Add a "Set Priority" action button/dropdown on the `/approvals` review screen for Coordinator and Admin roles.

2. **External Notifications (REQ-049)**
   * **Why:** The problem requires "Automated notifications are sent when...". An internal database table that users must log in to see is generally insufficient for a complete "Notification" requirement in a hackathon context.
   * **Action:** Integrate a basic email-sending service (e.g., Resend, which is already in the tech stack recommendations) to fire when booking status changes occur.

## P2 — Secondary Gaps

Supporting requirements and innovation edges.

1. **QR-Based Equipment Checkout (REQ-052.1)**
   * **Why:** Recommended as a "Judging Edge" feature. It significantly enhances the physical issue/return workflow, a core problem being solved.
   * **Action:** Implement a simple QR code generator for equipment, and a scanner component (using the device camera) on the staff `/issue-return` page.

2. **Waitlist System (REQ-052.4)**
   * **Why:** Highly relevant to the "Conflict Prevention" core domain.
   * **Action:** Allow users to opt-in to a waitlist when a lab is full, and notify them if a spot opens up due to cancellation.

## P3 — Polish

1. **Live Lab Occupancy Display (REQ-052.3)**
   * **Action:** Create a public facing, read-only dashboard screen displaying current lab availability and occupancy in real-time.
2. **Dashboard Visual Polish**
   * **Action:** Ensure the UI "wows" the judges with modern aesthetics, addressing any rough edges in the charts or tables.
