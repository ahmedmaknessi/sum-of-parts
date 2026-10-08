# Video 02: The Money in Your Bank Account Doesn't Exist

Slug: `money-in-your-bank-doesnt-exist`
Target length: about 6 to 7 minutes (879 words of voiceover, 4,964 characters)
Pillar: How the economy works
Visual style: **Paper cut motion design**
Follows video 01, which ends by promising this topic.

## Title

Main: **The Money in Your Bank Account Doesn't Exist**

Backups for A/B testing in YouTube Studio:
- Your Bank Never Lent Anyone Your Money
- 9 Out of 10 Dollars Were Never Printed

## Thumbnail (paper cut)

Deep navy paper background with visible fibre texture. Left: a cream paper bank card with "$4,280" cut out of it, slightly tilted, casting a soft shadow. A torn amber paper strip lies diagonally across the number. Right: a huge "$0" cut from thick cream card, stacked on two layers (offset by a few pixels) so it looks physically raised. Nothing else.

---

## Paper cut style guide (applies to this whole video)

This style overrides two rules in CLAUDE.md for this video only: it **uses soft shadows and paper texture**, and it **allows simple faceless paper figures**. Everything else in the brand stays the same: palette, Outfit font, one amber highlight per scene, calm pacing.

### The look
- **Everything is cut paper.** Every shape is a flat piece of paper or card sitting on a surface, never a glowing or vector-perfect shape.
- **Palette as paper colors:**
  - Background surface: navy paper #10162B
  - Main paper: cream #F3EBDD
  - Highlight paper: amber #F2A93B (still the ONE key thing per scene)
  - Secondary papers, only when needed: teal #3FB8A0, coral #E9684B, blue #6C8CFF
  - Deep layer paper for depth: #1B2440 and #26314F
- **Texture:** a subtle paper grain on every piece (procedural noise, very low contrast, never busy). The navy background gets a slightly stronger grain.
- **Edges:** most shapes have clean scissor-cut edges. Torn edges are used only for special moments (strike-throughs, ripping, destruction of money). Cut edges have a very thin lighter rim (1px, 15% white) to suggest paper thickness.
- **Shadows:** every piece casts one soft drop shadow down and to the right (offset 6 to 14px depending on its layer, blur 12 to 24px, black at 25 to 35% opacity). Higher layers cast bigger, softer shadows. Light comes from the top-left in every scene, never changes.
- **Depth:** each scene is built from 3 to 5 stacked layers (background, back props, main subject, foreground details, labels). Layers move with gentle parallax during slow camera drifts.
- **Text:** words are cut from cream or amber paper (Outfit 700 for headings, numbers and labels), with the same thickness rim and shadow. Small source lines (lower thirds) stay flat and unshadowed so they stay readable.
- **Figures:** simple faceless paper people made of a few rounded shapes (head circle, body, arms). No facial features, no hair detail, no brand clothing. Sarah is the only recurring figure, in a cream body with a small amber scarf so she's always recognizable.
- **Icons:** banks, vaults, coins, cars and phones are built from 3 to 6 flat paper pieces each, layered, like a children's pop-up book. Never use stock icons or real bank logos.

### The motion
- **Animate on twos.** Positions, rotations and scales update every 2 frames (15 updates per second at 30fps) to give the handmade stop-motion feel. Camera drifts and parallax stay smooth at full 30fps so the video never feels choppy.
- **Pieces enter like they were placed by hand:** slide or drop in from off-frame, overshoot very slightly, settle with a tiny rotation wobble (1 to 3 degrees). Their shadow grows as they lift and shrinks as they land.
- **Idle life:** pieces that hold on screen have a very subtle rotation jitter (under 0.5 degrees, seeded per piece) so the frame never looks frozen.
- **Transitions between scenes:** paper-native only. Choose from: a large navy paper sheet sliding across the frame, the current layers lifting and flying out in sequence, or a page-turn wipe. No cross-dissolves, no glow, no zoom blur.
- **Numbers:** counters work like flip cards or stacked paper digits that flip over, not smooth digital counting.
- **Charts:** bars are paper strips that grow by unrolling or sliding up from behind a paper "ground" layer. Grids are made of torn-off squares of paper.
- **Seeded randomness:** every wobble, jitter and texture offset is generated from a fixed seed per piece, so every render looks identical.

### Sound (only if files are provided)
Soft paper sounds on key placements: a light paper slide, a card tap when something lands, a rip for torn moments. Very quiet, under the voice. Never on every single movement.

---

## Verified facts (every claim in the voiceover)

| Claim | Exact source wording or figure | Source |
|---|---|---|
| Lending creates deposits | "rather than banks lending out deposits that are placed with them, the act of lending creates deposits" | Bank of England, "Money creation in the modern economy", Quarterly Bulletin 2014 Q1 (McLeay, Radia, Thomas), 14 March 2014 |
| A loan creates a matching deposit | "Whenever a bank makes a loan, it simultaneously creates a matching deposit in the borrower's bank account, thereby creating new money." | Same |
| Repayment destroys money | "Just as taking out a new loan creates money, the repayment of bank loans destroys money." | Same |
| Three limits on money creation | Market forces (lend profitably), regulatory policy, and "The ultimate constraint on money creation is monetary policy." | Same |
| 97% in the UK | "97% of the money held by the public is in the form of deposits with banks, rather than currency" (as of December 2013) | Bank of England, "Money in the modern economy: an introduction", Quarterly Bulletin 2014 Q1 |
| Deposits are IOUs | "bank deposits, an IOU from commercial banks to consumers" | Same |
| US M2 about $23 trillion | M2 $23,218.0 billion, July 2026 | Federal Reserve H.6 Money Stock Measures, via FRED |
| US cash about $2.5 trillion | Currency in circulation $2,472.3 billion, July 2026 | Same |
| Roughly 9 in 10 dollars not cash | 2,472.3 / 23,218.0 = 10.6% is cash, so about 89% is not | Calculated from the two figures above |
| US reserve requirement is 0% | "the Board has determined to reduce the reserve requirement ratios to zero percent effective March 26, 2020" | Federal Register, Regulation D, 24 March 2020 |
| SVB: $42B requested in one day | About $42 billion requested on March 9, 2023, nearly 25% of about $166B in deposits | Federal Reserve OIG, Material Loss Review of Silicon Valley Bank, 25 Sept 2023 |
| SVB: $100B pending next day | "The withdrawal requests pending for the following day amounted to $100 billion" | Same |
| SVB: over 94% uninsured | "As of year-end 2022, over 94 percent of SVB's total deposits were uninsured" | Same |
| SVB closed March 10, 2023 | Closed by the California DFPI, FDIC appointed receiver | Same |
| FDIC covers $250,000 per depositor, per bank | Standard coverage limit | FDIC, Deposit Insurance FAQs |
| FDIC created in 1933 | "On June 16, 1933, President Franklin Roosevelt signed the Banking Act of 1933, a part of which established the FDIC." | FDIC, A Brief History of Deposit Insurance in the United States |
| Thousands of US banks failed in the Great Depression | "Only nine banks failed in 1934, compared to more than 9,000 in the preceding four years." (1930 to 1933) | Same |
| SVB's money was tied up in bonds that had lost value | Unrealized losses grew to about $15.2 billion (held-to-maturity) and $2.5 billion (available-for-sale) at year-end 2022. On March 8, 2023, SVB announced it sold substantially all of its AFS securities "at a loss of $1.8 billion". | Federal Reserve OIG, Material Loss Review of Silicon Valley Bank, Sept 2023, p. 15 |
| Regulators covered everyone | "Depositors will have access to all of their money starting Monday, March 13." | Joint statement by the Department of the Treasury, the Federal Reserve Board and the FDIC, 12 March 2023 |

Accuracy notes:
- Sarah and the $20,000 car loan are a hypothetical example. Show a small paper tag "Example" whenever she is on screen.
- The $4,280 balance is an example, not data.
- Never show a precise US cash percentage like "89.4%". Use "about 9 in 10" or the 100-square grid.

---

## Scenes

Each scene starts at the phrase shown (exact wording from voiceover.txt). Cues inside a scene are written as **On "phrase":**.

### Scene 01: Hook
Starts at: "Open your banking app"
Ends after: "exists only like that."

Layers: navy paper desk surface, a cream paper phone (body, screen, button as 3 pieces), a cream balance card inside the screen.
- Scene opens: the phone slides up from the bottom of frame and lands with a small wobble.
- **On "four thousand, two hundred and eighty dollars":** paper flip-digits on the card flip through to "$4,280".
- **On "where is that money?":** the balance card peels out of the phone (lifts, shadow grows) and floats above it.
- **On "Not in a vault":** a paper vault door (circle, handle, bolts as separate pieces) slides in on the right. Then a torn amber strip slaps across it diagonally.
- **On "It's a promise":** the "$4,280" pieces fly off the card one digit at a time, leaving a cut-out hole in the shape of the number. The word "Promise" cut from amber paper drops into place under the hole.
- **On "most of the money in the world":** the camera pulls back fast through the layers: the card becomes one of hundreds of small cream paper cards laid out across a huge navy table, each with a number-shaped hole.

### Scene 02: Logo intro
3 seconds, no voiceover. Paper version of the logo: four cream and amber paper quarter slices slide in from four directions, land with soft taps, the amber slice lifts slightly (bigger shadow) and shifts outward. "Sum of Parts" in cut cream paper slides under it.

### Scene 03: The textbook story
Starts at: "Here's the story most of us were taught"
Ends after: "Textbooks call it the money multiplier."

Look: an old school textbook. The background becomes a cream paper page with faint ruled lines and a small paper tab at the top: "The textbook version".
- **On "You deposit one thousand dollars":** a small faceless paper figure walks in (body bobs on twos) holding a stack of 5 paper banknotes labeled "$1,000". A paper bank (roof triangle, three columns, base) stands center.
- **On "keeps a little in the vault":** one banknote slides into a small paper vault box beside the bank.
- **On "lends the rest":** the other four slide out of the bank to a second paper figure.
- **On "another bank":** the chain repeats across the page to the right: bank, figure, bank, figure, each step with fewer banknotes, like a row of paper cutouts on a classroom wall.
- **On "the money multiplier":** a cream paper label with that name is pinned at the top with a small paper pin.
- No amber in this scene. It's the old idea.

### Scene 04: The twist
Starts at: "It makes sense."
Ends after: "when a bank makes a loan, it creates new money."

- **On "it's not how it works":** the textbook page gets ripped in half down the middle (torn edge, paper rip sound if available). The two halves fall away, revealing navy paper underneath.
- **On "In twenty fourteen":** a cream paper document with a simple folded corner slides in, labeled "Bank of England, 2014".
- **On "rather than banks lending out deposits":** the quote appears line by line as cut paper text on the document. The words "the act of lending creates deposits" are cut from amber paper and lifted on a higher layer (bigger shadow).
- Lower third (flat): "Bank of England, Quarterly Bulletin 2014 Q1".
- **On "it creates new money":** the document folds itself into a paper plane and flies out of frame, leaving the clean navy surface for the next scene.

### Scene 05: Watch it happen (the key scene)
Starts at: "Let's watch it happen."
Ends after: "The bank typed it."

Layers: navy surface, a large cream paper ledger book open in the center (two pages), a paper typewriter piece at the bottom edge. Paper tag "Example" pinned top-right for the whole scene.
- **On "Sarah walks into a bank":** Sarah (cream body, amber scarf) walks in from the left on twos and stops beside the ledger.
- **On "twenty thousand dollar car loan":** a small paper car (body, two wheels, window) slides in next to her with a paper price tag "$20,000".
- **On "The bank approves it":** a paper stamp drops onto a small form: "APPROVED" in amber.
- **On "does not take twenty thousand dollars from anyone's account":** three small paper piggy banks labeled "Other customers" sit at the back. A paper hand reaches toward them, then pulls back. They stay untouched.
- **On "It makes two entries":** the ledger pages label themselves with cut paper headings: left page "Bank owns", right page "Bank owes".
- **On "Sarah owes the bank":** typewriter keys clack (paper keys pressing on twos) and a strip of paper types out "Loan to Sarah: $20,000", then lays itself on the left page.
- **On "Sarah's account now shows":** a second strip types out in amber paper "Sarah's deposit: $20,000" and lays itself on the right page.
- **On "that money didn't exist":** a small paper banner unrolls at the bottom: "New money: +$20,000" in amber.
- **On "The bank typed it":** a single key on the typewriter presses one last time, then the scene holds with idle wobble.

### Scene 06: Two layers
Starts at: "Sarah buys the car."
Ends after: "the numbers in your account."

- **On "Sarah buys the car":** Sarah hops into the paper car, which drives off (wheels rotating on twos). An amber paper token "$20,000" slides from her to a paper car dealer figure.
- **On "It doesn't vanish":** the "New money: +$20,000" banner stays in place, a small paper check mark pops beside it.
- **On "a different bank":** a second paper bank slides in on the right, in a slightly different shape (rounded roof). The amber token has to cross a gap between the two banks.
- **On "money held at the central bank, called reserves":** the camera tilts down, revealing a lower paper layer under the table: a large paper building labeled "Central bank". Between the two commercial banks, a small teal paper token labeled "Reserves" travels down, along the lower layer, and back up.
- **On "You and I never touch it":** a faceless paper figure's hand reaches toward the teal token and is stopped by a paper barrier.
- **On "two layers":** the frame splits into two stacked paper sheets, like a cake. Top sheet, large: "Bank money (your balance)", filled with many small amber tokens. Bottom sheet, thinner: "Cash and reserves", with a few teal tokens and paper banknotes.

### Scene 07: Money is destroyed
Starts at: "And here's the other half."
Ends after: "Every repayment takes some away."

- **On "When Sarah pays the loan back":** back to the ledger. Monthly payment slips (small paper strips labeled "Payment") feed into a paper shredder at the side of the ledger.
- Each time a slip enters, both "Loan" and "Deposit" strips get a piece torn off their ends. The "New money" banner's digits flip down until "+$0".
- **On "repaying loans destroys money":** the last pieces go through the shredder and come out as falling confetti strips. Lower third (flat): "Bank of England, 2014".
- **On "It's created every time someone borrows":** a wide shot of a paper town (small houses, cars, shops on different layers). Little amber paper squares pop up above buildings (new loans), while cream paper squares above others fold up and disappear (repayments). This keeps going, calm and continuous, until scene end.

### Scene 08: How much is cash
Starts at: "How much of the money around us is actually cash?"
Ends after: "ninety-seven percent."

- **On "broad money supply":** a 10 x 10 grid of small cream paper squares assembles from the corners, each square dropping into place on twos. Label above: "US money (M2): $23.2T".
- **On "two and a half trillion":** about 11 squares turn into small paper banknotes (flip over to reveal a banknote side). Label: "Cash: $2.5T".
- **On "nine out of every ten dollars":** the remaining squares flip to amber. Big cut paper text: "9 in 10" with "never printed" underneath.
- **On "In the UK":** a smaller grid slides in on the right, labeled "UK", 97 amber squares and 3 banknotes. Text: "97%".
- Lower third (flat): "Sources: Federal Reserve H.6, July 2026. Bank of England, 2014."

### Scene 09: Your balance is an IOU
Starts at: "So what is your balance, really?"
Ends after: "the reserve requirement has been zero percent."

- **On "So what is your balance":** the $4,280 card from Scene 01 drops back into frame.
- **On "It's an IOU":** the card flips over like a playing card. Its back reads, in handwritten-style cut letters: "IOU: The bank owes you $4,280".
- **On "On the bank's books":** the ledger from Scene 05 slides back in. The IOU card slides onto the "Bank owes" page.
- **On "how much does a US bank legally have to keep aside":** a small empty paper box labeled "Required reserves" opens its lid.
- **On "zero percent":** the box is shown empty. A big amber "0%" cut from thick card lands next to it with a firm tap. Small label: "Since March 2020". Lower third (flat): "Federal Register, Regulation D, 2020".

### Scene 10: Why not infinite money
Starts at: "So if banks can create money by typing"
Ends after: "to fight inflation."

- **On "why don't they create infinite amounts":** a paper "money machine" builds itself: a box body, a hopper on top, an output slot, three dials on the front. Amber paper squares start popping out of the slot.
- **On "Three things stop them":** the three dials get paper labels one at a time:
  - **On "real borrowers":** dial 1 "Borrowers who can repay"
  - **On "hold capital":** dial 2 "Capital rules"
  - **On "sets interest rates":** dial 3 "Interest rates"
- **On "When rates go up":** dial 3 rotates (on twos). The machine's output slows: fewer squares, longer gaps.
- **On "fight inflation":** a small paper label slides under the machine: "Higher rates = less new money".

### Scene 11: When trust breaks
Starts at: "So most of the time, the promise holds."
Ends after: "if not everyone asks at once."

- **On "things fall apart fast":** the paper money machine's pieces loosen and fall away.
- **On "During the Great Depression":** a sepia-toned version of the paper style (cream and dark brown papers only) for a short flashback: a row of paper bank buildings with long lines of small paper figures outside. One by one, the banks get a torn paper "CLOSED" sign. Label: "1930s".
- **On "March ninth, twenty twenty-three":** the flashback page turns, back to navy. A single paper bank labeled "SVB".
- **On "forty-two billion dollars":** a tall paper strip beside the bank labeled "Deposits: $166B" has its top quarter torn off and carried away by many tiny paper figures. Flip counter: "$42B in one day".
- **On "one hundred billion":** a long line of paper figures queues out of frame, with a paper sign "$100B pending".
- **On "shut down that same day":** the bank's doors slam (two paper panels), a torn "CLOSED: March 10, 2023" sign gets stuck on.
- **On "tied up in bonds":** a small stack of paper bonds next to the bank shrinks, each sheet tearing a little smaller.
- Lower third (flat): "Federal Reserve OIG, 2023".

### Scene 12: Deposit insurance
Starts at: "That's why deposit insurance exists."
Ends after: "covered everyone."

- **On "deposit insurance":** a paper shield (3 layered pieces) drops in center.
- **On "two hundred and fifty thousand dollars":** cut text on the shield: "$250,000 per depositor, per bank".
- **On "nineteen thirty-three":** a small paper date tag hangs from the shield: "Since 1933".
- **On "ninety-four percent":** SVB's deposit strip from Scene 11 returns, standing next to the shield. Only a thin cream sliver at the bottom fits behind the shield ("Insured"). The rest, a huge amber section, sticks out above it ("94% uninsured").
- **On "covered everyone":** a large second paper shield slides up behind the strip and covers it fully.

### Scene 13: Takeaway and end card
Starts at: "So, does the money in your bank account exist?"
Ends after: "See you there."

- **On "does the money in your bank account exist":** the $4,280 card returns, centered, alone on the navy surface.
- **On "Not as cash":** a paper banknote slides in and gets crossed by a torn strip. **On "Not as a pile in a vault":** a paper vault slides in, same strip.
- **On "It exists as a promise":** the "Promise" amber paper word from Scene 01 drops onto the card.
- **On "backed by rules, by insurance, and by the trust":** three paper pillars rise under the card one at a time, labeled "Rules", "Insurance", "Trust". The card now rests on them, like a little paper temple.
- **On "not a reason to panic":** gentle idle wobble, nothing new.
- **On "education, not financial advice":** a small flat paper tag in the corner.
- **On "why can't countries just print":** a paper printing press slides in from the right with a stack of paper banknotes coming out, and a cut paper question mark lands on top. Text: "Next: Why can't countries just print money?"
- **On "See you there":** a navy paper sheet slides across the whole frame, transitioning into the end card.

### End card
20 seconds, paper version: navy surface, two empty cream paper frames for the YouTube end screen videos, a cut paper "Subscribe" tab, and the small paper logo in the corner.

---

## Description draft

Your bank balance isn't cash sitting in a vault. When a bank makes a loan, it creates brand new money, and when you repay it, that money disappears. Here's how money is really created, step by step, with sources from the Bank of England and the Federal Reserve.

We cover the textbook story vs. what actually happens, how much of the money supply is real cash, why the US reserve requirement is 0%, what stops banks from creating infinite money, and what happened when Silicon Valley Bank's customers tried to withdraw $42 billion in one day.

Sources:
Bank of England, "Money creation in the modern economy", Quarterly Bulletin 2014 Q1: bankofengland.co.uk/quarterly-bulletin/2014/q1/money-creation-in-the-modern-economy
Bank of England, "Money in the modern economy: an introduction", Quarterly Bulletin 2014 Q1
Federal Reserve H.6 Money Stock Measures (July 2026), via FRED: fred.stlouisfed.org/series/M2SL
Federal Register, Regulation D: Reserve Requirements of Depository Institutions (March 2020)
Federal Reserve Office of Inspector General, Material Loss Review of Silicon Valley Bank (September 2023): oig.federalreserve.gov
FDIC, Deposit Insurance FAQs: fdic.gov/resources/deposit-insurance/faq
FDIC, A Brief History of Deposit Insurance in the United States: fdic.gov/resources/publications/brief-history-of-deposit-insurance
Joint statement by Treasury, the Federal Reserve and the FDIC, 12 March 2023: federalreserve.gov/newsevents/pressreleases/monetary20230312b.htm

Sarah's car loan and the $4,280 balance are illustrative examples.
This video is for education only and is not financial advice.
