# Missing Hackathon Features

This document identifies requirements from the hackathon problem statement that were genuinely absent or substantially ignored.

## REQ-036 — Usage Prediction

### Requirement
"Predict which labs or equipment may be highly demanded."

### Current Implementation
Data analytics and metrics currently rely entirely on historical data and deterministic rules. The planning document (`final-plan.md`) explicitly states: "Do not make unverified competitor, performance or Top 5 predictions."

### Missing
There is no predictive algorithm, heuristic model, or UI component that forecasts future high-demand labs or equipment before bookings actually occur.

### Impact
The "Intelligent Features" core category of the hackathon is missing one of its major components. Staff cannot proactively prepare for high demand.

### Required Work
Implement a heuristic or ML-based service that analyzes past booking trends, course schedules, or seasonal patterns to display a "High Demand Forecast" section on the Coordinator/Admin dashboard.

---

## REQ-037 — Maintenance Recommendation

### Requirement
"Identify equipment frequently reported as faulty." (Maintenance Recommendation)

### Current Implementation
The system allows staff to mark equipment as damaged during return and sets a maintenance flag in the database.

### Missing
There is no proactive recommendation system that flags equipment as *likely* to need maintenance based on usage frequency or frequent fault reports. The system only reacts to explicit manual "damaged" flags.

### Impact
Another missed intelligent feature. The system fails to provide proactive insights for equipment maintenance.

### Required Work
Add an algorithm that tracks the ratio of "Damaged" return reports to successful uses over time for each equipment type, and displays "Recommended for Inspection" alerts for items with high fault rates.

---

## REQ-038 — Priority Recommendation

### Requirement
"Help staff review urgent academic or research requests." (Priority Recommendation)

### Current Implementation
The database automatically sets priority to `1` if the user is a Faculty member, and `0` otherwise.

### Missing
There is no intelligent text analysis or algorithmic recommendation to flag *student* requests as urgent or high-priority based on their "purpose" text (e.g., "final year project deadline").

### Impact
Staff still have to manually read every student request to determine if it is urgent, defeating the purpose of an intelligent priority recommendation feature.

### Required Work
Implement a keyword-based or NLP heuristic on the `purpose` field during booking creation to auto-flag requests containing words like "urgent," "deadline," "final project," or "exam" with a "Suggested Priority" badge for reviewers.

---

## REQ-052 — Optional Innovation Features (Judging Edge)

### Requirement
"To demonstrate technical depth during hackathon judging, teams can implement: QR-based checkout, Waitlist system, Live lab occupancy, Damage image upload, Push notifications, Calendar integration, etc."

### Current Implementation
The internal `final-plan.md` and `docs/TODO.md` explicitly mark these as "Out of scope" or "Deferred."

### Missing
None of the listed optional innovation features (except for alternative lab suggestions) were implemented.

### Impact
The team will lose out on bonus points during judging for technical depth and innovation.

### Required Work
Select at least 1-2 high-impact innovation features (e.g., QR-based checkout and Waitlist system) and implement them to satisfy the judging criteria for technical depth.
