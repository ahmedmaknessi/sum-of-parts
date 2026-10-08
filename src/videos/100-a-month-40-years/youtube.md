# YouTube publishing kit: Video 01

Files to upload (all in `out/`):

| What | File |
|---|---|
| Video | `100-a-month-40-years.mp4` (1920x1080, 30fps, 6:59) |
| Thumbnails | `thumbnails/100-a-month-40-years-thumbnail-a.png`, `-b.png`, `-c.png` (1280x720, see below) |
| Captions | `100-a-month-40-years.srt` (English) |
| Chapters | already in the description below (from `100-a-month-40-years-chapters.txt`) |

---

## Title

**Main (recommended):**

What $100 a Month Becomes in 40 Years (Visualized)

**Alternatives for YouTube's "Test & compare" (title A/B test):**

1. Why $100 a Month Turns Into $262,481
2. $100 a Month for 40 Years: The Math, Visualized

---

## Thumbnails (`npm run render:video01-thumbnails`)

Upload all three with **Test & compare** (in the upload screen, under Thumbnail). YouTube shows each one to a share of viewers and keeps the one with the most watch time.

| | Hook | Idea |
|---|---|---|
| **A** (upload as the main one) | "$262,481 / NOT A TYPO", with $100/mo shooting up the curve | Disbelief at the size of the result |
| **B** | "WHO PAID THE OTHER $214,481?", a tall bar where your $48K is a sliver | Curiosity: the answer is the video |
| **C** | "WAITING 10 YEARS COSTS $140,484", start at 25 vs 35 | Fear of missing out |

Every number on them comes from `data.ts`, so they match the video exactly. The bottom-right corner is left empty for YouTube's duration badge.

---

## Description (paste as is)

```
What happens if you invest $100 a month, every month, for 40 years? Most people guess around $50,000. The real answer is $262,481, and the reason why is one of the most important ideas in money.

In this video we run the real numbers, step by step: how compounding actually works, why we use 7%, how the curve bends, what each decade adds, the year your money starts out-earning you, and what starting 10 years late really costs.

Key numbers:
• You deposit $48,000 in total ($100 x 480 months)
• At 7% a year it grows to $262,481
• About 82% of that ($214,481) is growth, not your own money
• In year 11, your investments earn more than you put in that year
• The last 10 years add more than the first 30 combined
• Start at 35 instead of 25 and you end with $121,997: less than half

Chapters
0:00 The question
0:25 The rules
0:48 The mattress
1:12 How compounding works
1:52 Why 7%
2:26 The curve
3:20 Decade by decade
3:50 The tipping point
4:13 The cost of waiting
5:00 Where the money comes from
5:29 The fine print
6:07 The takeaway

Assumptions
$100 deposited at the end of every month, monthly compounding, 7% a year. 7% is roughly the long-run average return of the S&P 500 after inflation, so every figure is in today's dollars. It's an average, not a promise: real markets crash and recover along the way. Fees and taxes are not included.

Sources
S&P 500 returns 1926 to 2026, nominal and inflation-adjusted: officialdata.org

Next video: how the money in your bank account is created in the first place (coming soon).

Sum of Parts: one money question, answered with clean animated data.

This video is for education only and is not financial advice. Past returns do not guarantee future results.

#compoundinterest #investing #personalfinance
```

The first three hashtags show above the title, so keep them at the end like this.

---

## Tags (paste into the Tags field, 394 of 500 characters)

```
compound interest, compound interest explained, investing 100 a month, 100 dollars a month, how compounding works, power of compound interest, investing for beginners, personal finance, index fund investing, S&P 500 returns, stock market average return, cost of waiting to invest, start investing early, retirement savings, how to build wealth, money explained, finance visualized, sum of parts
```

---

## Pinned comment

```
Quick math check: $100 a month is about $3.29 a day. Over 40 years you put in $48,000 and end up with $262,481 at 7% a year (in today's dollars).

At what age did you start investing, or are you about to? 👇
```

(The emoji is fine in a comment; the brand rule is about what's on screen in the video.)

---

## Upload settings

| Setting | Choose |
|---|---|
| Audience | No, it's not made for kids |
| Age restriction | None |
| Category | Education |
| Video language | English |
| Caption certification | None (this content has never aired on US TV) |
| Captions | Upload the `.srt` as English (don't rely on auto-captions; ours match the script exactly) |
| Paid promotion | No |
| Altered or synthetic content | No. The visuals are animated charts, not realistic footage. Only answer "Yes" if the voice is an AI clone of a real, identifiable person |
| License | Standard YouTube License |
| Allow embedding | On |
| Comments | On, "Hold potentially inappropriate comments for review" |
| Shorts remixing | Allow (lets the Shorts link back to this video) |
| Recording date / location | Leave empty |

---

## End screen (6:39 to 6:59, the last 20 seconds)

The end card is drawn into the video, with the logo at the top left and two empty video slots below it. In YouTube Studio > End screen, place the elements over the drawn shapes (positions in `END_CARD_LAYOUT`, `src/components/EndCard.tsx`):

- **Subscribe** element on the logo, top left.
- **Left slot:** "Best for viewer" once you have a second video. For now, use a Playlist or leave it empty.
- **Right slot:** your next video once it's live (the bank-money video promised in the voiceover). Until then, leave it empty.
- Make every element run from 6:39 to the end.

When video 02 is published, come back and put it in the right slot.

---

## Cards (optional, add once video 02 exists)

- At 6:07 ("The takeaway"), a card for video 02.

---

## Before you hit Publish

- [ ] Title, description and tags pasted
- [ ] Thumbnails A, B and C uploaded with Test & compare
- [ ] English captions uploaded from the `.srt`
- [ ] Chapters show up on the progress bar (YouTube needs the first one at 0:00, which it is)
- [ ] End screen set: Subscribe on the logo
- [ ] Pinned comment posted and pinned
- [ ] Added to a "The math of money" playlist (create it now; future videos in this pillar go there)

---

# Shorts (rendered with `npm run render:video01-shorts`, files in `out/shorts/`)

Upload each one as its own video. The vertical 1080x1920 format and a length under 3 minutes are what make YouTube treat it as a Short. In the upload screen, set **Related video** to the main video. That puts a tappable link to the full video under every Short, which is the main reason to post them.

Post the main video first. Then post one Short every 2 to 3 days instead of all at once, so each one gets its own push.

## Short 1: the hook (`100-a-month-40-years-short-01-hook.mp4`, 0:23)

Title:
```
$100 a Month for 40 Years = ? #shorts
```
Description:
```
Most people guess around $50,000. The real answer is $262,481.
$100 a month, invested at 7% a year (the long-run S&P 500 average after inflation), for 40 years.

Full breakdown: the related video linked above.
Education only, not financial advice.

#compoundinterest #investing #personalfinance
```

## Short 2: year 11 (`100-a-month-40-years-short-02-year-eleven.mp4`, 0:23)

Title:
```
The Year Your Money Out-Earns You #shorts
```
Description:
```
Invest $100 a month at 7% a year. In year 11, your investments earn $1,290 on their own: more than the $1,200 you put in that year. From then on, the gap only grows.

Full breakdown: the related video linked above.
Education only, not financial advice.

#compoundinterest #investing #money
```

## Short 3: the last decade (`100-a-month-40-years-short-03-last-decade.mp4`, 0:30)

Title:
```
Why the Last 10 Years Matter Most #shorts
```
Description:
```
$100 a month at 7% for 40 years. Decade by decade the account grows by $17K, $35K, $70K, then $140K. The last 10 years alone add more than the first 30 combined. Same $100 a month the whole time: the only thing that changed was time.

Full breakdown: the related video linked above.
Education only, not financial advice.

#compoundinterest #investing #personalfinance
```

## Settings for every Short

Same as the main video: not made for kids, Education, English. The captions are burned into each Short, so don't upload a caption file. Set **Related video** to the main video.
