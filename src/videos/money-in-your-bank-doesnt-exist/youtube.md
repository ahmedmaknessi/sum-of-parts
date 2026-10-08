# YouTube publishing kit: Video 02

Files to upload (all in `out/`):

| What | File |
|---|---|
| Video | `money-in-your-bank-doesnt-exist.mp4` (1920x1080, 30fps, 5:51) |
| Thumbnails | `thumbnails/money-in-your-bank-doesnt-exist-thumbnail-a.png`, `-b.png`, `-c.png` (1280x720, upload all three with Test & compare) |
| Captions | `money-in-your-bank-doesnt-exist.srt` (English) |
| Chapters | in the description below (from `money-in-your-bank-doesnt-exist-chapters.txt`) |

Before publishing: on Envato Elements, register this video's project for "Pizzicato Polka" (Download > License, with your YouTube channel), so the music is cleared for Content ID.

---

## Title

**Main:** The Money in Your Bank Account Doesn't Exist

**Alternatives for "Test & compare":**

1. Your Bank Never Lent Anyone Your Money
2. 9 Out of 10 Dollars Were Never Printed

---

## Thumbnails (Test & compare)

| | Look | Hook |
|---|---|---|
| **A** (main) | Plum paper: the $4,280 card with its number cut out and a coral strip, next to a huge "$0" | Your balance is "nothing" |
| **B** | Sky paper: one real banknote and nine empty cut-outs, "9 in 10 DOLLARS / NEVER PRINTED" | The surprising number |
| **C** | Rose paper: "BANKS TYPE MONEY", a typewriter typing a banknote, "+$20,000" | The mechanism, as a shock |

Rendered from the `Video02-Thumbnails` folder in Studio (`Thumbnail02A/B/C`); every number comes from `data.ts`.

---

## Description (paste as is)

```
Your bank balance isn't cash sitting in a vault. When a bank makes a loan, it creates brand new money, and when you repay it, that money disappears. Here's how money is really created, step by step, with sources from the Bank of England and the Federal Reserve.

We cover the textbook story vs. what actually happens, how much of the money supply is real cash, why the US reserve requirement is 0%, what stops banks from creating infinite money, and what happened when Silicon Valley Bank's customers tried to withdraw $42 billion in one day.

Chapters
0:00 Where is your money?
0:23 The textbook story
0:43 What the Bank of England says
1:05 How a loan creates money
1:39 Two layers of money
2:14 Repaying destroys money
2:40 How much is cash?
3:00 Your balance is an IOU
3:21 Why not infinite money?
3:57 When trust breaks
4:40 Deposit insurance
5:04 So, does it exist?

Sources
Bank of England, "Money creation in the modern economy", Quarterly Bulletin 2014 Q1: bankofengland.co.uk/quarterly-bulletin/2014/q1/money-creation-in-the-modern-economy
Bank of England, "Money in the modern economy: an introduction", Quarterly Bulletin 2014 Q1
Federal Reserve H.6 Money Stock Measures (July 2026), via FRED: fred.stlouisfed.org/series/M2SL and fred.stlouisfed.org/series/CURRCIR
Federal Register, Regulation D: Reserve Requirements of Depository Institutions (March 2020)
Federal Reserve Office of Inspector General, Material Loss Review of Silicon Valley Bank (September 2023): oig.federalreserve.gov
FDIC, Deposit Insurance FAQs: fdic.gov/resources/deposit-insurance/faq
FDIC, A Brief History of Deposit Insurance in the United States: fdic.gov/resources/publications/brief-history-of-deposit-insurance
Joint statement by Treasury, the Federal Reserve and the FDIC, 12 March 2023: federalreserve.gov/newsevents/pressreleases/monetary20230312b.htm

Sarah's car loan and the $4,280 balance are illustrative examples.
Music: "Pizzicato Polka" (Strauss), licensed via Envato Elements.

Previous video: What $100 a Month Becomes in 40 Years.
Next video: why can't countries just print as much money as they want? (coming soon)

This video is for education only and is not financial advice.

#money #banking #economics
```

---

## Tags (355 of 500 characters)

```
how banks create money, money creation, where does money come from, fractional reserve banking, money multiplier, bank of england money creation, is my money in the bank, bank deposits explained, reserve requirement zero, silicon valley bank collapse, bank run explained, fdic insurance, how money works, economics explained, money explained, sum of parts
```

---

## Pinned comment

```
Quick check of the numbers: US M2 was about $23.2 trillion in July 2026, and currency in circulation about $2.5 trillion, so roughly 9 in 10 dollars have never been printed.

Did you think your deposit was being lent out to someone else? 👇
```

---

## Upload settings

| Setting | Choose |
|---|---|
| Audience | No, it's not made for kids |
| Category | Education |
| Video language | English |
| Captions | Upload the `.srt` as English |
| Altered or synthetic content | No (ElevenLabs library voice, not a clone of a real person; visuals are paper animation) |
| Paid promotion | No |
| License | Standard YouTube License |

## End screen (5:31 to 5:51, the last 20 seconds)

The end card draws two navy paper frames (positions in `END_CARD_LAYOUT`). In YouTube Studio > End screen:

- **Subscribe** element on the paper logo, top left.
- **Left frame ("Watch next"):** video 01, "What $100 a Month Becomes in 40 Years".
- **Right frame ("More from Sum of Parts"):** a playlist.
- Every element from 5:31 to the end.

## Before you hit Publish

- [ ] Envato project registered for the music
- [ ] Title, description and tags pasted
- [ ] Thumbnails A, B and C uploaded with Test & compare
- [ ] English captions uploaded from the `.srt`
- [ ] End screen: Subscribe on the logo, video 01 left, playlist right
- [ ] Pinned comment posted and pinned
- [ ] Video 01's end screen updated: put this video in its "next" slot

---

# Shorts (`npm run render:video02-shorts`, files in `out/shorts/`)

Upload each as its own video and set **Related video** to the main video, so every Short links to the full explanation. Post the main video first, then one Short every 2 to 3 days. The captions are burned in: don't upload a caption file. Same settings as the main video (not made for kids, Education, English).

## Short 1: the hook (`money-in-your-bank-doesnt-exist-short-01-hook.mp4`, 1:03)

Title:
```
Where Is Your Money, Really? #shorts
```
Description:
```
Your banking app says $4,280. But that money isn't sitting in a vault with your name on it. It's a promise. And the textbook story, that banks lend out your savings, isn't how it works: the Bank of England says lending creates deposits. (Source: Bank of England, 2014.)

Full explanation: the related video linked above.
Education only, not financial advice.

#money #banking #economics
```

## Short 2: the bank typed it (`money-in-your-bank-doesnt-exist-short-02-typed.mp4`, 1:00)

Title:
```
Banks Create Money by Typing #shorts
```
Description:
```
When a bank approves a loan, it doesn't take the money from anyone's account. It makes two entries: you owe the bank, and your account goes up. New money, typed into existence. And when the loan is repaid, that money disappears again. (Source: Bank of England, 2014. Sarah's $20,000 car loan is an example.)

Full explanation: the related video linked above.
Education only, not financial advice.

#money #banking #economics
```

## Short 3: never printed (`money-in-your-bank-doesnt-exist-short-03-never-printed.mp4`, 0:42)

Title:
```
9 in 10 Dollars Were Never Printed #shorts
```
Description:
```
US money (M2) is about $23.2 trillion. Physical cash is about $2.5 trillion of it. Roughly 9 in 10 dollars exist only as numbers in bank accounts. In the UK, the Bank of England put it at 97%. Your balance is an IOU from your bank, and since March 2020 US banks have been required to keep 0% in reserve.
Sources: Federal Reserve H.6 (July 2026), Bank of England (2014), Regulation D (2020).

Full explanation: the related video linked above.
Education only, not financial advice.

#money #banking #economics
```

## Short 4: the bank run (`money-in-your-bank-doesnt-exist-short-04-bank-run.mp4`, 1:07)

Title:
```
The $42 Billion Bank Run #shorts
```
Description:
```
On March 9, 2023, Silicon Valley Bank's customers asked for $42 billion in a single day, a quarter of its deposits. $100 billion more was waiting the next morning. The bank was shut down that same day. Over 94% of its deposits were above the FDIC's $250,000 limit, and in the end regulators covered everyone.
Sources: Federal Reserve OIG, Material Loss Review of SVB (2023); FDIC; Treasury/Fed/FDIC joint statement (12 March 2023).

Full explanation: the related video linked above.
Education only, not financial advice.

#money #banking #svb
```
