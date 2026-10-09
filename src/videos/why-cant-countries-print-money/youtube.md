# YouTube publishing kit: Video 03

Files to upload (all in `out/`):

| What | File |
|---|---|
| Video | `why-cant-countries-print-money.mp4` (1920x1080, 30fps, 5:24) |
| Thumbnails | `thumbnails/why-cant-countries-print-money-thumbnail-a.png`, `-b.png`, `-c.png` (1280x720, upload all three with Test & compare) |
| Captions | `why-cant-countries-print-money.srt` (English) |
| Chapters | in the description below (from `why-cant-countries-print-money-chapters.txt`) |

Music: the same "Pizzicato Polka" (Envato Elements) as video 02, already covered by the channel registration.

---

## Title

**Main:** Why Can't Countries Just Print More Money?

**Alternatives for "Test & compare":**

1. This $100 Trillion Note Was Worth $30
2. What Happens When a Country Prints Too Much Money

---

## Thumbnails (Test & compare)

| | Look | Hook |
|---|---|---|
| **A** (main, the script's design) | Navy paper: a generic cream note with "100,000,000,000,000", an amber "= $30" tag, a loaf with a "?" | The absurd number |
| **B** | Rose paper: "$100 TRILLION" over a green note, big "= $30" tag | The price, as a shock |
| **C** | Sky paper: "PRINT MORE?", a press spitting notes toward a loaf with a "?" | The question itself |

Rendered from the `Video03-Thumbnails` folder in Studio (`Thumbnail03A/B/C`). None of them reproduces the real banknote design; every number comes from `data.ts`.

---

## Description (paste as is)

```
Why can't a government just print money to make everyone rich? We break it down with a tiny island economy, Zimbabwe's 100 trillion dollar note, and the US money supply growing about 40% in two years, and explain why the US avoided hyperinflation.

Zimbabwe's prices doubled roughly every 25 hours at the peak (79.6 billion percent a month in November 2008). The US printed trillions too, and inflation hit 9.1%, the highest in 40 years, but not hyperinflation. Here are the four reasons, the "brake" central banks use, and why most of them aim for 2% inflation.

Chapters
0:00 The $100 trillion note
0:30 An island with ten loaves
1:17 Money isn't wealth
1:30 What happened in Zimbabwe
2:11 The US printed too
2:44 Four reasons the US was different
3:37 The brake and the 2% target
4:04 Who controls the printing press
4:34 You can't print bread

Sources
Hanke and Kwok, "On the Measurement of Zimbabwe's Hyperinflation", Cato Journal, 2009: cato.org/sites/cato.org/files/serials/files/cato-journal/2009/5/cj29n2-8.pdf
BBC News, "Zimbabwe rolls out Z$100tr note", 16 January 2009
BBC News, "Zimbabwe dollar 'not back soon'", 12 April 2009
Federal Reserve H.6 Money Stock Measures (M2), via FRED: fred.stlouisfed.org/series/M2SL
US Bureau of Labor Statistics, "Consumer prices up 9.1 percent over the year ended June 2022": bls.gov/opub/ted/2022/consumer-prices-up-9-1-percent-over-the-year-ended-june-2022-largest-increase-in-40-years.htm
IMF, Currency Composition of Official Foreign Exchange Reserves (COFER), 2026 Q1: data.imf.org
Federal Reserve, Statement on Longer-Run Goals and Monetary Policy Strategy

The island economy is a simplified example. The 40% is the growth of the money supply (M2), not of prices.
Music: "Pizzicato Polka" (Strauss), licensed via Envato Elements.

Previous video: The Money in Your Bank Account Doesn't Exist.
Next: a new series, "How They Take Your Money", starting with sportsbooks.

This video is for education only and is not financial advice.

#money #inflation #economics
```

---

## Tags (about 420 of 500 characters)

```
why cant countries print money, printing money, what happens if a country prints too much money, zimbabwe hyperinflation, 100 trillion dollar note, hyperinflation explained, inflation explained, money supply, m2 money supply, quantitative easing, why 2 percent inflation, central bank independence, federal reserve, us dollar reserve currency, economics explained, how money works, sum of parts
```

---

## Pinned comment

```
Quick check of the numbers: US M2 went from $15.5 trillion (Feb 2020) to $21.8 trillion (Mar 2022), up 40.6%. That's the money supply, not prices: prices peaked at 9.1% a year in June 2022. Zimbabwe peaked at 79.6 billion percent a MONTH.

Next we start "How They Take Your Money". Episode 1: sportsbooks. What should episode 2 be? 👇
```

---

## Upload settings

| Setting | Choose |
|---|---|
| Audience | No, it's not made for kids |
| Category | Education |
| Video language | English |
| Captions | Upload the `.srt` as English |
| Altered or synthetic content | No (ElevenLabs library voice, not a clone of a real person; visuals are paper animation; the one real photo, the banknote, is unaltered apart from colour filters) |
| Paid promotion | No |
| License | Standard YouTube License |

## End screen (5:04 to 5:24, the last 20 seconds)

The end card draws two navy paper frames (positions in `END_CARD_LAYOUT`). In YouTube Studio > End screen:

- **Subscribe** element on the paper logo, top left.
- **Left frame ("Watch next"):** video 02, "The Money in Your Bank Account Doesn't Exist".
- **Right frame ("More from Sum of Parts"):** a playlist.
- Every element from 5:04 to the end.

## Before you hit Publish

- [ ] Title, description and tags pasted
- [ ] Thumbnails A, B and C uploaded with Test & compare
- [ ] English captions uploaded from the `.srt`
- [ ] End screen: Subscribe on the logo, video 02 left, playlist right
- [ ] Pinned comment posted and pinned
- [ ] Video 02's end screen and description updated: replace "coming soon" with this video

---

# Shorts (`npm run render:video03-shorts`, files in `out/shorts/`)

Upload each as its own video and set **Related video** to the main video. Post the main video first, then one Short every 2 to 3 days. The captions are burned in: don't upload a caption file. Same settings as the main video.

Titles, descriptions and settings for each Short (YouTube, Instagram and Facebook) are in `socials.md`.
