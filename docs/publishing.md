# Publishing automation

Claude prepares the posts, you approve them, the scheduler posts only what you approved.

```
Claude writes drafts ──> you review ──> you approve ──> schedule ──> live
 src/videos/<slug>/      publish:review   publish:approve  publish:schedule   YouTube + Facebook: their own schedulers
 posts.json                                                                    Instagram: publish:due on this PC
```

- **One queue per video:** `src/videos/<slug>/posts.json`, one entry per post (platform, file, time, title, text, thumbnail, cover, first comment, what is left to do by hand).
- **Approval is tied to the content.** Changing anything that would be published (text, time, file, title...) after approval turns the post back into a draft; nothing schedules it until you approve it again.
- **Links between posts:** `{{youtube:yt-main}}` in a caption or first comment becomes the main video's YouTube link once it is uploaded. YouTube posts are always uploaded first.
- **Platforms:**
  - **YouTube** main video and Shorts are uploaded private with a publish time; YouTube makes them public at that time. The thumbnail and English captions are added too.
  - **Facebook** clips and the teaser are uploaded and scheduled with Facebook's own scheduler. Clips over 90 seconds post as Page videos, not Reels (the Reels API stops at 90 s).
  - **Instagram's** API cannot schedule, so the post waits on this PC. `npm run publish:due` (every 10 minutes through Task Scheduler) uploads and publishes it at its time. **The PC must be on and online then**; if it was off, the Reel goes out at the next run and the log says how late.
  - First comments (Facebook) are posted by the same runner once the post is live.
- **What stays manual** is listed on each post (`(by hand)` in the review): YouTube's Related video for Shorts, end screens, pinned comments, Test & compare thumbnails, Instagram alt text. None of those are in the APIs.

## Day to day

```
npm run publish:review -- <slug>            # read the posts (add --full for whole captions)
npm run publish:approve -- <slug> yt-main fb-teaser   # or: all
npm run publish:schedule -- <slug> --dry-run
npm run publish:schedule -- <slug>
npm run publish:review -- <slug>            # links, statuses, anything that failed
```

Or just tell Claude "approve yt-main and the Day 1 posts" / "move Short 3 to Friday" in chat: it edits the queue and runs the same commands.

## One-time setup

### 1. YouTube (Google Cloud)

1. console.cloud.google.com > create a project (e.g. "Sum of Parts publishing").
2. APIs & Services > Library > enable **YouTube Data API v3**.
3. OAuth consent screen: External; add yourself as a test user; then **Publish app** ("In production"). In testing mode Google expires the sign-in after 7 days. The "unverified app" warning you'll see when signing in is expected for your own app: Advanced > continue.
4. Credentials > Create credentials > OAuth client ID > **Desktop app**. Put the two values in `.env` at the repo root:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
5. `npm run publish:auth -- youtube`, open the link, sign in with the channel's account, allow.
6. **The audit.** Videos uploaded by an API project that YouTube hasn't audited are locked private: they upload with everything set, but YouTube ignores the publish time. Until the audit passes, the scheduler tells you, and you open each video in YouTube Studio and set Visibility > Schedule to the same time (one click per video). Request the audit with Google's "YouTube API Services: Audit and Quota Extension" form (free, takes days to weeks).
7. Quota: 10,000 units a day by default. One upload costs a large part of it, so the scheduler uploads a whole video's YouTube posts (main + 4 Shorts) in one run but don't schedule two videos on the same day.

### 2. Facebook Page and Instagram (Meta)

1. Instagram must be a **professional** account (Business or Creator) **linked to the Facebook Page** (Instagram app > Settings > Account type and tools; Page settings > Linked accounts).
2. developers.facebook.com > My Apps > Create app > type **Business**. In App settings > Basic, copy the App ID and App secret into `.env`:
   ```
   META_APP_ID=...
   META_APP_SECRET=...
   ```
   The app can stay in development mode: you are its admin and post to your own Page.
3. developers.facebook.com/tools/explorer > pick the app > User token > add these permissions: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `pages_manage_engagement`, `publish_video`, `business_management`, `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments`. Generate the token (allow the Page and the Instagram account) and copy it.
4. `npm run publish:auth -- meta <the token>`. It swaps it for a Page token that doesn't expire and finds the Instagram account. If you manage several Pages, set `META_PAGE_ID=` in `.env` first.

### 3. Check

`npm run publish:check` prints the YouTube channel, the Facebook Page and the Instagram account the tokens post to. Nothing is posted.

### 4. The Instagram runner (Task Scheduler)

Once, in PowerShell:

```
schtasks /Create /SC MINUTE /MO 10 /TN "Sum of Parts publish" /TR "\"E:\Sum of Parts\scripts\publish\run-due.cmd\""
```

It runs every 10 minutes, does nothing when nothing is due, and logs to `out/publish-due.log`. Remove it with `schtasks /Delete /TN "Sum of Parts publish" /F`.

### 5. Instagram covers

The Instagram API only takes covers as public links. When a Reel goes out, the runner uploads its cover PNG to a "publish-assets" release on the GitHub repo (public) with the `gh` CLI and passes that link; if Instagram refuses it, the Reel posts with a video frame as cover and the log says so.

## Secrets

`.env` and `.secrets/` (tokens) are git-ignored. Never commit them, never paste them in chat. To revoke: Google account > Security > Third-party access; Meta: remove the app in Facebook settings > Business integrations.
