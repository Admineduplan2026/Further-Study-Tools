# Demo schools (fictional data for testing)

Five fictional institutions were added on 2026-10-12 so the website can be tested with realistic data
(fees, deadlines, intakes, scholarships at every level). The real schools (TARUMT, UCSI, UTAR, XMUM) were not changed.

| Folder / ID | Name | Type | Location | Programmes | Fee range (whole programme) |
|---|---|---|---|---|---|
| DEMOLRU | Lumen Ridge University College (Demo) | Private University College | Shah Alam, Selangor | 2 foundation, 1 diploma, 3 degrees, 1 MBA | RM 21,500 – 86,000 |
| DEMONCT | Northgate College of Technology (Demo) | Private College | Bayan Lepas, Pulau Pinang | 1 foundation, 2 diplomas, 3 degrees | RM 19,800 – 98,500 |
| DEMOTBC | Teratai Bay College (Demo) | Private College | Johor Bahru, Johor | 1 foundation, 3 diplomas, 2 degrees | RM 20,500 – 68,500 |
| DEMOMHU | Meridian Heights University (Demo) | Private University | Kuala Lumpur | 2 foundations, 5 degrees, 1 master's | RM 24,800 – 104,500 |
| DEMOOVI | Orchid Valley Institute (Demo) | Private College | Ipoh, Perak | 1 foundation, 3 diplomas, 2 degrees, 1 MBA | RM 19,800 – 64,800 |

Fees follow common ranges for Malaysian private institutions: foundation about RM 20,000–26,000, diploma about
RM 29,000–40,000, bachelor's degree about RM 62,000–105,000, master's about RM 36,000–52,000. Hostels RM 300–900 a month.
Each school also has campus scholarships at Foundation and Undergraduate level and most have one in Others
(need-based or sports grants), with application deadlines between November 2026 and March 2027.

What is deliberately left empty, so nothing looks like a real institution's details: official website, admissions
email and phone, WhatsApp, programme links and MQA reference numbers. Every name ends in "(Demo)" and every
programme's notes say "DEMO DATA FOR TESTING ONLY".

The data generator is kept out of the repository; the sheets in Drive are the source.

## Hide them before the website goes public

Either of these hides a demo school from the website and the daily preview sync:

- rename its folder **and** its sheet in Eduplan School Data to start with an underscore, e.g. `_DEMOLRU`; or
- set **Published** to `No` on its rows (Institutions, Programmes and Campus Scholarships).

Applications sent to a demo school are saved in its `application` folder like a real school's; delete those test
applications together with the demo folders.
