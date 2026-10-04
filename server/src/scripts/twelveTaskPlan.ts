export const twelveTaskPlan = [
  "Do math homework on October 5 from 5 PM to 7 PM.",
  "Go to the gym on October 6 from 8 AM to 10 AM.",
  "Study physics on October 7 from 2 PM to 4 PM.",
  "Finish my statistics assignment on October 8 from 6 PM to 8 PM.",
  "Review computer science notes on October 9 from 3 PM to 5 PM.",
  "Clean my room on October 10 from 10 AM to 11 AM.",
  "Go grocery shopping on October 11 from 1 PM to 2 PM.",
  "Prepare for my math exam on October 12 from 7 PM to 9 PM.",
  "Work on my coding project on October 13 from 4 PM to 7 PM.",
  "Read my textbook on October 14 from 11 AM to 12 PM.",
  "Do laundry on October 15 from 6 PM to 7 PM.",
  "Study for my statistics quiz on October 16 from 2 PM to 5 PM.",
].join("\n");

export const twelveTaskDates = Array.from({ length: 12 }, (_, index) => `2026-10-${String(index + 5).padStart(2, "0")}`);
