# Entry requirements: how to write them so the website can check a student's results

Students save their exam results once in **My portfolio > My results** (or in the application form, step 5).
The website then compares those results with each programme's entry requirements in the school sheet and shows:

| What the student sees | When |
|---|---|
| ✓ You meet the entry requirements (SPM) | every rule for that exam is met |
| ✓ Your SPM grades meet the requirements. Also check: … | the grades are met, but there are other conditions (a written line) |
| Needs Mathematics at credit (C) or better | a rule is not met (the website lists what is missing) |
| SPM is not accepted directly | the column says "Not accepted …" |
| (nothing) | the programme has no rules for the student's exams |

On the search results a student can tick **Only programmes my results qualify for**, and **Best match** lists those
programmes first.

## The columns

| Column | Used for |
|---|---|
| Entry requirement: SPM (`entry_spm`) | SPM |
| Entry requirement: UEC (`entry_uec`) | UEC |
| Entry requirement: O-Level / IGCSE (`entry_olevel`) | O-Level and IGCSE (add the heading lines "O-Level:" and "IGCSE:" if they differ) |
| Entry requirement: STPM (`entry_stpm`) | STPM |
| Entry requirement: others (`entry_other`) | A-Level, Foundation, Matriculation, Diploma, degrees. Start each exam with a heading line. |

## One rule per line

Press Alt+Enter (Mac: Option+Enter) for a new line inside a cell. A "• " at the start of a line is optional.

| Line | Meaning |
|---|---|
| `• 5 credits` | at least 5 subjects at credit or better (SPM, O-Level, IGCSE: C; UEC: B6) |
| `• 3 subjects: B` | at least 3 subjects at B or better (UEC: "B" means B6 or better) |
| `• 2 principals` | STPM: at least 2 subjects at C or better |
| `• 2 passes` | at least 2 subjects at a pass (SPM, O-Level, A-Level: E; IGCSE: G; UEC: C8) |
| `• Mathematics: credit` | this subject at credit or better |
| `• English: pass` | this subject at a pass or better |
| `• Physics or Chemistry: C` | either subject at C or better |
| `• Mathematics and Physics: C` | both subjects at C or better |
| `• SPM English: credit` | a subject from another exam (for example an STPM programme that also needs SPM English) |
| `• CGPA 2.50` | Foundation, Matriculation or Diploma CGPA (out of 4.00) |
| `Not accepted directly …` | this exam cannot be used to enter the programme |
| `Physical Science track:` | a heading: the lines below are one route. A student who meets any one route meets the requirements. |
| `A-Level:` / `Foundation / Matriculation:` / `Diploma:` | in the "others" column, the lines below are for that exam |
| `Also required:` | the lines below are added to every route in that column |
| `• Or other equivalent qualifications`, `• For other …`, `• NOTE …`, `• * …` | shown to students, not a condition |
| anything else | shown to students as written, and listed as "Also check" |

Grades: SPM A+ A A- B+ B C+ C D E G · UEC A1 A2 B3 B4 B5 B6 C7 C8 F9 · IGCSE A* A B C D E F G U ·
O-Level A* A B C D E U · STPM A A- B+ B B- C+ C C- D+ D F · A-Level A* A B C D E U.

Subject names are matched without brackets and ignoring capitals ("Mathematics (T)" counts as Mathematics;
"English Language" counts as English; "Malay" counts as Bahasa Melayu).

## Example

```
Entry requirement: SPM
• 5 credits
• Mathematics: credit
• English: pass

Entry requirement: others
A-Level:
• 2 subjects: D
Foundation / Matriculation:
• CGPA 2.00
Diploma:
• CGPA 2.50
• A pass in a Diploma in Computing fields
Also required:
• MUET Band 2 or its equivalent
```

## What was changed on 13 October 2026

- All school sheets: the hint row and the Instructions tab describe this format; "Entry requirement: O-Level" is now
  "O-Level / IGCSE".
- XMUM: the brochure sentences were rewritten one rule per line. Conditions that cannot be checked automatically
  (for example "1 science subject", diploma fields, MUET bands) are kept word for word as their own lines.
  The text before the change is in the tab **_Programmes backup 2026-10-13** (the website reads only the Institutions, Programmes and Campus Scholarships tabs).
- The 5 demo schools use the format throughout.
