# Game Check-in Tool

Opening each community app every day to tap the check-in button gets old. Fill in your credentials here once, and your automation runs will handle check-ins along the way.

Four communities are supported: **Skland**, **miyoushe**, **Kuro Community**, and **Tajiduo**. You don't have to tell it which characters you have — it reads the game characters bound to your account, checks in for each one, and lists every character's status in the results.

::: warning Read This Before You Start

- Check-in requests are made locally by AUTO-MAS. Tokens are only used to reach the official API of the matching community, and are not sent to third-party services unrelated to check-in.
- A token is a login credential. Don't send it to anyone, and don't put it in public logs, screenshots, or config repositories.
- Automatic check-in carries risks: account risk control, API changes, and failed check-ins. Evaluate that yourself and accept the consequences of using it.

:::

## Basic Usage

::: info Version and demonstration scope
This page follows **dev after v5.8.0-beta.3 (3c9448bdf)**. The Chinese screenshots use an account named “教程演示账号” (tutorial demo account), with all community credentials blank. They demonstrate account configuration only, without login, check-in, or notifications.
:::

1. Select **Community sign-in** in the left navigation, then open the **Check-ins** tab at the top of the page. In **Community settings**, turn on the switch at the right of the **Enable community tools** row, marked ①.

[![Step 1: enable community tools](/docs/img/tutorial-context-20261105-3c9448bdf/community-enable.png)](/docs/img/tutorial-context-20261105-3c9448bdf/community-enable.png)

2. Scroll down to **Accounts** and click **Add an account** on the right of its heading, marked ②. For an existing account, use **Edit** on its row.

[![Step 2: add a community account](/docs/img/tutorial-context-20261105-3c9448bdf/community-add.png)](/docs/img/tutorial-context-20261105-3c9448bdf/community-add.png)

3. In the account editor that opens in the center of the page, enter the account name and the credentials for the communities you use, marked ③. This example enters only the demo name, leaving credentials blank. Real check-in requires valid credentials for the relevant community.
4. Click **Save** in the lower-right corner of the editor, marked ④.

[![Steps 3 and 4: account fields and the save button](/docs/img/tutorial-context-20261105-3c9448bdf/community-account-edit.png)](/docs/img/tutorial-context-20261105-3c9448bdf/community-account-edit.png)

5. After the editor closes, check the account name in **Accounts** on the same page; reload to check it again. Mark ⑤ is a **viewing item** showing the demo name, not proof of valid credentials or successful check-in.

[![Step 5: check the demo account name](/docs/img/tutorial-context-20261105-3c9448bdf/community-account-saved.png)](/docs/img/tutorial-context-20261105-3c9448bdf/community-account-saved.png)

6. Turn on **Result notifications** and **Check in on startup** if needed.
7. After configuring valid credentials, click **Check in all** to run a check-in immediately by hand.

Community accounts are managed separately from the game accounts in managed scripts. One community account can hold credentials for several communities. Tags in the account list show configured communities and the latest result; hover over a tag for character, game, status, and reward details.

### Three Ways It Triggers

| When it runs | How often per day | How the notification is sent |
| --- | --- | --- |
| **Along with an automation task** | One attempt per account per day; once done, no repeat requests | Folded into the task completion notification |
| **When the app starts** | Shares the once-per-day automatic attempt limit with automation tasks | A separate notification when there are new results |
| **When you click Check in all** | Any time, not limited by "already checked in today" | Sent as its own notification |

::: tip You clicked Check in all and it told you to retry later
An automatic check-in is running right now. Wait for it to finish, then click again.
:::

Automatic check-in records each account’s daily attempt even if it fails. Restarting the app does not retry it; click **Check in all** to retry manually. The day is calculated in Beijing time (UTC+8).

Communities without credentials do not appear in the notification.

## Entering credentials

Obtain your community credentials yourself, then enter and save them in the account editor on the check-in page. Add a community account first if you don't have one.

To sign in to a community, you can use the third-party community tool [Better-MAS-Tools (BMT)](https://github.com/Lance0174/Better-MAS-Tools). BMT supports QR login for miyoushe and Skland, phone number and SMS verification for Kuro Community, and one-time account and password login for Tajiduo. See its project instructions for details. BMT manages community accounts and check-ins separately and does not automatically enter credentials into AUTO-MAS. You can copy tokens, cookies, and other credentials obtained from BMT into the corresponding community fields in the AUTO-MAS account editor and save them for use.

::: warning Third-party tool notice
BMT is maintained independently by a community developer and is not an official AUTO-MAS project. Before using it, verify its source and review its features and credential handling. Using third-party tools involves account and credential security risks; evaluate them yourself.
:::

## Skland

Skland check-in automatically looks up the **Arknights** and **Arknights: Endfield** characters under your Hypergryph account. Each character's check-in status is recorded separately.

For QR login, use [BMT](https://github.com/Lance0174/Better-MAS-Tools).

### Get a Token From the Web

1. Log in to [Skland on the web](https://www.skland.com/).
2. In the same browser session, open the [Hypergryph account credential endpoint](https://web-api.skland.com/account/info/hg).
3. Find `data.content` in the JSON that comes back and copy **only that field's value**:

   ```json
   {
     "code": 0,
     "data": {
       "content": "<Token>"
     }
   }
   ```

4. Paste the token into the **Skland** field in the account edit window and save.

Don't copy the outer JSON, the quotation marks around `content`, or any other field. To switch accounts, clear your browser cookies and log in again — logging out on the web page directly can invalidate the original credential.

## miyoushe

miyoushe automatically reads the characters bound to your account across **Genshin Impact, Honkai: Star Rail, Zenless Zone Zero, Houkai Gakuen 2, Honkai Impact 3rd, and Tears of Themis**, then checks the check-in status for each one. With a valid miyoushe cookie, AUTO-MAS also attempts to query remaining Cloud Genshin play time; no separate Cloud Genshin credential is needed.

For QR login, use [BMT](https://github.com/Lance0174/Better-MAS-Tools).

### Filling In a Cookie by Hand

Run `document.cookie` in the developer tools of a logged-in miyoushe web session and paste the cookie string containing the authentication fields into the input. Don't paste page HTML, a full API response, or unrelated cookies. Without authentication fields such as `cookie_token` and `stoken`, the character lookup and check-in that follow may fail.

## Kuro Community

Reads the **Punishing: Gray Raven** and **Wuthering Waves** characters you have bound, and checks in for each one.

For phone number and SMS login, use [BMT](https://github.com/Lance0174/Better-MAS-Tools).

### Get a Token

The token has to be dug out of the client's local login data, and where it lives changes with the client version and your system, so there is no single set of steps to give you here.

1. Log in to the account you want to check in with, using the Kuro Community client.
2. Find the token in the local login data.
3. Paste it into the **Kuro Community** field in the account edit window and save.

For step 2, the open-source project [Kuro_login](https://github.com/mxyooR/Kuro_login) shows one approach.

::: warning That's a Third-Party Project, Not an Official AUTO-MAS One
Read its code and satisfy yourself that the source is trustworthy before using it. Handing login credentials to any third-party tool carries risk that you take on yourself. AUTO-MAS neither asks for nor receives that project's account credentials.
:::

If the account has no characters bound that can be checked in, no Kuro Community entry appears in the results. An expired token shows the reason for the failure in the results.

## Tajiduo

Looks up the game characters on your account and checks in.

One thing worth knowing: if you also want to see your remaining Cloud NTE time, that credential **goes in together with the Tajiduo credential**. It isn't a separate login, so don't go looking for its own entry point.

For account and password login, use [BMT](https://github.com/Lance0174/Better-MAS-Tools).

### Filling In Credentials by Hand

The input accepts either of these:

- Just a `refreshToken`.
- A credential JSON, which may contain `accessToken`, `refreshToken`, `uid`, `deviceId`, `roleName`, and similar fields.

If you're configuring Cloud NTE as well, add `cloudToken`, `cloudUserId`, and optionally `cloudDeviceId` to the JSON. When credentials refresh, AUTO-MAS updates the saved token during the check-in run, so you don't have to log in again every day.

## Reading the Results

| Status | What it means | What to do |
| --- | --- | --- |
| Success | This request completed the check-in | Nothing |
| Already checked in | Already done earlier today; nothing claimed twice | Nothing, this is normal |
| Failed | The request failed, the credential expired, or character info couldn't be read | Get a new token |
| Risk control | The community wants extra verification, or is refusing requests for now | Try again later; don't retry repeatedly |

Results are shown as community + game + character name. Communities without a token don't take up space, so you won't see empty `0/0` entries.

## Common Questions

### The token expired, or check-in keeps failing

First confirm the account can still log in normally in the official client or on the web. If even the official login fails, the problem isn't AUTO-MAS. If it works, get a fresh token:

Obtain fresh credentials for the community, then enter and save them in the account editor.

### One of my games isn't in the results

The tool only handles the **bound characters** the community API reports. Confirm that game really is bound to this community account, then click **Check in all** again.

::: warning Don't Post Your Credentials With a Report
Redact any account, password, cookie, or token from the error message before sharing it.
:::
