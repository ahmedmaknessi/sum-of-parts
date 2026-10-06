/**
 * Input for scripts/build-timeline.ts: scene anchors and cue phrases for video 01,
 * taken from BUILD_VIDEO_01.md. Phrases are written as they appear in
 * voiceover.txt. A cue is the START of its phrase unless marked `at: "end"`.
 */
export type CueSpec = string | { readonly phrase: string; readonly at: "start" | "end" };

export type SceneSpec = {
  readonly id: string;
  /** First words of the scene. Searched forward from the previous scene. */
  readonly anchor: string;
  readonly cues: Readonly<Record<string, CueSpec>>;
};

export type TimelineSpec = {
  readonly fps: number;
  /** Scene visuals start this many frames before their anchor word. */
  readonly sceneLeadFrames: number;
  readonly logo: {
    readonly id: string;
    /** Logo goes after the scene that ends with this phrase. */
    readonly afterPhrase: string;
    /** Pause between the last word and the logo. */
    readonly breathingRoomSec: number;
    readonly durationSec: number;
    /** Voice resumes this long after the logo ends. */
    readonly resumeLeadSec: number;
  };
  readonly endCard: {
    readonly id: string;
    readonly afterPhrase: string;
    readonly gapSec: number;
    readonly durationSec: number;
  };
  readonly scenes: readonly SceneSpec[];
};

export const TIMELINE_SPEC: TimelineSpec = {
  fps: 30,
  sceneLeadFrames: 6,
  logo: {
    id: "s02-logo",
    afterPhrase: "one of the most important ideas in all of money",
    breathingRoomSec: 0.4,
    durationSec: 3.0,
    resumeLeadSec: 0.3,
  },
  endCard: {
    id: "end-card",
    afterPhrase: "See you there",
    gapSec: 0.6,
    durationSec: 20,
  },
  scenes: [
    {
      id: "s01-hook",
      anchor: "If you put away",
      cues: {
        hundredAppears: "If you put away",
        // Added at checkpoint 1: "$100" lands when the number is spoken (after a 2.5s pause in the recording).
        hundredSpoken: "one hundred dollars a month",
        everyMonth: "every month",
        howMuch: "how much would you",
        guessFifty: "Most people guess",
        realAnswer: "The real answer",
        fiveTimes: "five times that",
      },
    },
    {
      id: "s03-rules",
      anchor: "Let's set the rules",
      cues: {
        card1: "One hundred dollars a month",
        perDay: "about three dollars a day",
        card2: "You start at twenty-five",
        noRaises: "No raises",
        noBonuses: "No bonuses",
        noLuckyPicks: "No lucky stock picks",
        card3: "four hundred and eighty times",
      },
    },
    {
      id: "s04-mattress",
      anchor: "First, the boring version",
      cues: {
        barAppears: "You hide the money",
        fortyEight: "forty-eight thousand dollars",
        keepInMind: "Keep that number in mind",
      },
    },
    {
      id: "s05-compounding",
      anchor: "Now let's do something different",
      cues: {
        sevenLabel: "Imagine your money grows",
        yearOne: "In year one",
        aboutForty: "About forty dollars",
        yearTwo: "In year two",
        lastYearsGrowth: "You also earn on last year's growth",
        growthEarnsGrowth: "Your growth starts earning its own growth",
        slowAtFirst: "It feels slow at first",
        thenItDoesnt: "Then it doesn't",
      },
    },
    {
      id: "s06-why-7",
      anchor: "Why seven percent",
      cues: {
        lastHundredYears: "Over the last hundred years",
        tenPercent: "about ten percent a year",
        afterInflation: "after inflation",
        todaysDollars: "every number you see in this video is in today's dollars",
        marketDropped: "Some years, the market dropped",
      },
    },
    {
      id: "s07-curve",
      anchor: "So here's what happens",
      cues: {
        mattressLine: "On the bottom, the mattress",
        fourPercent: "A savings account at four percent",
        sevenPercent: "And at seven percent",
        tenYears: "After ten years",
        // Added in group 2: "+$5K" bracket at year 10, so the year-10 hold has motion.
        onlyFiveMore: "Only five thousand more than the mattress",
        quitHere: "Most people quit right here",
        bend: "Then the line starts to bend",
        twentyYears: "Twenty years",
        thirtyYears: "Thirty years",
        fortyYears: "And at forty years",
        finalNumberEnd: { phrase: "eighty-one dollars", at: "end" },
      },
    },
    {
      id: "s08-decades",
      anchor: "Look at it decade by decade",
      cues: {
        bar1: "In your first ten years",
        bar2: "In the second decade",
        bar3: "In the third",
        bar4: "And in the final decade",
        stack: "That last decade alone",
        onlyTime: "The only thing that changed was time",
      },
    },
    {
      id: "s09-tipping-point",
      anchor: "There's a moment in this story",
      cues: {
        yearEleven: "In year eleven",
        // Added in group 3: breaks up the 11.5s freeze.
        moreThan: "That's more than the twelve hundred dollars",
        fromThatPoint: "From that point on",
        gapWider: "the gap gets wider",
      },
    },
    {
      id: "s10-cost-of-waiting",
      anchor: "Now let's change one thing",
      cues: {
        // Added in group 3: the 7s opening and 13s catch-up hold get narration-driven beats.
        sameHundred: "Same one hundred dollars",
        sameSeven: "Same seven percent",
        startAt35: "you start at thirty-five",
        threeQuarters: "You'd think you'd end up with about three quarters",
        youDont: "You don't",
        endUpWith122: "You end up with one hundred and twenty-two thousand",
        lessThanHalf: "Less than half",
        catchUp: "To catch up",
        twoFifteen: "two hundred and fifteen dollars a month",
        moreThanDouble: "More than double",
        bestDecade: "It costs you the best decade",
      },
    },
    {
      id: "s11-where-it-came-from",
      anchor: "Back to our two hundred",
      cues: {
        fullCircle: "Back to our two hundred",
        // Added in group 4 (here and below): beats inside long holds.
        howMuchPutIn: "How much of it did you actually put in",
        fortyEight: "Forty-eight thousand",
        otherTwoFourteen: "The other two hundred and fourteen thousand",
        eightyTwo: "about eighty-two percent",
        lessThanFifth: "Your own deposits are less than one fifth",
        sumOfParts: "That's the sum of parts",
      },
    },
    {
      id: "s12-fine-print",
      anchor: "A few honest caveats",
      cues: {
        smoothLine: "A few honest caveats",
        longTermAverage: "Seven percent is a long-term average",
        notSmooth: "Real markets don't climb in a smooth line",
        theyCrash: "They crash, sometimes hard",
        keptInvesting: "kept investing through the crashes",
        fees: "Fees matter too",
        cutResult: "would cut your result",
        tensOfThousands: "by tens of thousands of dollars",
        notAdvice: "this is education, not financial advice",
      },
    },
    {
      id: "s13-takeaway",
      anchor: "So, what does one hundred dollars",
      cues: {
        line1: "So, what does one hundred dollars",
        line2: "forty years",
        line3: "At the historical average",
        quarterMillion: "more than a quarter of a million dollars",
        notBecause: "Not because of a big salary",
        perfectInvestment: "or a perfect investment",
        becauseOfTime: "Because of time",
        amount: "The amount matters less than you think",
        startDate: "The start date matters more",
        ifYouWant: "If you want to see where the money",
        nextVideo: "that's the next video",
      },
    },
  ],
};
