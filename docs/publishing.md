# Publishing automation

Claude prepares the posts, you approve them by merging one pull request, GitHub posts them on time. Free (GitHub Actions on a public repo), and your PC can be off.

```
video finished ──> Claude: npm run publish:propose -- <slug>
                     uploads the files to a hidden "media-<slug>" release
                     opens the pull request "Posts for <slug>"  ──> notification on your phone
you merge it   ──> GitHub Actions approves exactly what you merged and schedules it
                     YouTube main video + Shorts: uploaded with their publish time, thumbnail, captions
                     Facebook clips + teaser: scheduled with Facebook's own scheduler
                     Instagram Reels: posted by the runner every 15 minutes when due
                     then a comment on the pull request: what was scheduled, links, what to do by hand
every 15 min   ──> the runner posts due Instagram Reels and the Facebook link comments, marks posts done,
                     and deletes the media release once everything is live
every day      ──> if the pull request has waited 2+ days, it pings you again
```

- **Approving = merging.** Only a `posts/<slug>` pull request merged by you counts. Merging approves the posts exactly as they are in the pull request; Claude can never approve.
- **Changing something:** comment on the pull request ("move Short 3 to Friday", "shorter caption") or tell Claude; it updates the pull request, and merging approves the new version.
- **Links between posts:** `{{youtube:yt-main}}` in a caption or first comment becomes the main video's link once it is uploaded (YouTube always goes first).
- **Statuses:** draft (written, not sent) > proposed (in the pull request) > approved > scheduled / queued > posted, or failed with the reason. They live in `src/videos/<slug>/posts.json`; the bot commits them back after each run.
- **What stays manual** (no API for it), listed on each post and in the pull request comment: Related video on Shorts, end screens, the pinned comment, Test & compare thumbnails, Instagram alt text.

## Limits to know

- **YouTube audit:** until Google audits your API project, YouTube locks API uploads to private and ignores the publish time. Everything else is set; the pull request comment tells you which videos to open in YouTube Studio and set Visibility > Schedule (same time). Request the audit with Google's "YouTube API Services: Audit and Quota Extension" form (free, days to weeks).
- **Instagram timing:** GitHub can start scheduled runs late when it is busy, so a Reel can go out up to about 15 minutes after its time. YouTube and Facebook are exact (their own schedulers).
- **Facebook:** clips over 90 seconds post as Page videos, not Reels (the Reels API stops at 90 s). Scheduling is limited to 28 days ahead here.
- **Quota:** YouTube allows about 10,000 units a day by default and an upload uses a large share, so one video's YouTube posts (main + 4 Shorts) per day is the safe maximum.
- **Idle repos:** GitHub pauses scheduled workflows in a repo with no activity for 60 days. Posting a video every few weeks keeps it active; if it ever pauses, Actions shows a button to turn it back on.

## One-time setup (about 30 minutes)

### 1. YouTube (Google Cloud)

1. console.cloud.google.com > create a project (e.g. "Sum of Parts publishing").
2. APIs & Services > Library > enable **YouTube Data API v3**.
3. OAuth consent screen: External; add yourself as a test user; then **Publish app** ("In production"). In testing mode Google expires the sign-in after 7 days. The "unverified app" warning when you sign in is expected for your own app: Advanced > continue.
4. Clients > Create client > **Desktop app**. In the dialog that follows, **Download JSON** (the secret is shown only once) and save it as `.secrets/google-client.json` (git-ignored). The scripts read the client ID and secret from it. (Or put `GOOGLE_CLIENT_ID=` and `GOOGLE_CLIENT_SECRET=` in `.env`.)
5. `npm run publish:auth -- youtube`, open the link, sign in with the channel's account, allow.

### 2. Facebook Page and Instagram (Meta)

1. Instagram must be a **professional** account (Business or Creator) **linked to the Facebook Page**.
2. developers.facebook.com > My Apps > Create app > type **Business**. App settings > Basic: add to `.env`:
   ```
   META_APP_ID=...
   META_APP_SECRET=...
   ```
   The app can stay in development mode: you are its admin and post to your own Page.
3. developers.facebook.com/tools/explorer > pick the app > User token > permissions: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `pages_manage_engagement`, `publish_video`, `business_management`, `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments`. Generate (allow the Page and the Instagram account) and copy the token.
4. `npm run publish:auth -- meta <the token>`. It swaps it for a Page token that doesn't expire and finds the Instagram account (set `META_PAGE_ID=` in `.env` first if you manage several Pages).

### 3. Check and hand the keys to GitHub

```
npm run publish:check      # prints the channel, Page and Instagram account; posts nothing
npm run publish:secrets    # copies the keys into the repo's encrypted Actions secrets
```

Then on GitHub: repo > Actions > "Publish: approve and schedule" > Run workflow > slug: for any video whose pull request you merged before the setup was done.

## Commands (Claude runs these; you can too)

```
npm run publish:review   -- <slug> [--full]   # the posts and their checks
npm run publish:propose  -- <slug>            # upload the files, open / update the pull request
npm run publish:schedule -- <slug> --dry-run  # what would be scheduled
npm run publish:check                          # which accounts the keys post to
npm run publish:secrets                        # local keys -> GitHub Actions secrets
```

## Secrets

`.env` and `.secrets/` are git-ignored; on GitHub the keys live only in the repo's encrypted Actions secrets (Settings > Secrets and variables > Actions). Never paste them in chat. To revoke: Google account > Security > Third-party access; Facebook settings > Business integrations; and delete the GitHub secrets.
