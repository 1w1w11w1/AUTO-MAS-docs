# MAA Configuration Guide

## What is MAA?

MAA is a third-party Arknights tool that can handle repetitive tasks such as daily automation and Integrated Strategies credit farming.

**For more information, see:**

<Box :items="[
{ name: 'MAA Website', link: 'https://maa.plus/', image: 'https://maa.plus/favicon.ico', },
{ name: 'MAA GitHub', link: 'https://github.com/MaaAssistantArknights/MaaAssistantArknights', image: { light: '/icons/github.svg', dark: '/icons/github-dark.svg', }, },]"/>

## Install MAA

1. Download the archive from <Pill name="MAA Website" image="https://maa.plus/favicon.ico" link="https://maa.plus"/>, <Pill name="MAA Repository" :image="{ light: '/icons/github.svg', dark: '/icons/github-dark.svg', }" link="https://github.com/MaaAssistantArknights/MaaAssistantArknights/releases/latest"/>, or <Pill name="MirrorChyan" image="https://mirrorchyan.com/favicon.ico" link="https://mirrorchyan.com/zh/projects?rid=MAA&scouce=AUTO-MAS-Web"/>.
2. Extract the MAA archive to any folder.

## Configure the Managed Script

::: tip Interface names
Historical screenshots may show “Script Management”, “New Script”, or “User”. These are now “Managed scripts”, “New managed script”, and “Account”; the steps below use the current names.
:::

1. Go to **Managed scripts**, click **New managed script**, and select **MAA** to add a managed-script configuration page.
![AUTO-MAS configuration 1](/docs/img/script-guide/maa/AUTO-MAA-1.png)

2. In the opened managed-script settings, click **Select folder** for **MAA path**, then open the directory where MAA is located.
![AUTO-MAS configuration 2](/docs/img/script-guide/maa/AUTO-MAA-2.png)

3. In **Emulator Management**, select the emulator and emulator instance.

> If no emulator appears here, complete **Emulator Management** configuration first.

4. Click **Configure MAA** and configure it in MAA.
![AUTO-MAS configuration 5](/docs/img/script-guide/maa/AUTO-MAA-5.png)

5. Manually uncheck **Start MAA on boot**, complete ADB connection settings, and configure other options according to your preferences.

6. After configuration, close **MAA** and click **Save Configuration** in AUTO-MAS.
![AUTO-MAS configuration 6](/docs/img/script-guide/maa/AUTO-MAA-6.png)

## Configure Accounts

1. In the managed-script list under **Managed scripts**, click **Add an account** to add an account.
![AUTO-MAS configuration 7](/docs/img/script-guide/maa/AUTO-MAA-7.png)

2. Fill in account information according to the hints on the settings card.
![AUTO-MAS configuration 8](/docs/img/script-guide/maa/AUTO-MAA-8.png)

::: info Note
In **Independent** configuration mode, do not forget to **set specific configuration**.
:::

::: tip Account ID Tips

Because MAA's **Bilibili server account switching** uses OCR with limited accuracy, we recommend the following input strategy to improve recognition and switching success.

#### General Advice

- MAA account switching only needs to **recognize one unique fragment** to complete switching.
- Enter only a fragment unique to that account and avoid fragments shared with other accounts.
- Test in MAA whether the fragment can switch accounts correctly before entering it into AUTO-MAS.
- If there is only one account under the same server, `Account ID` can be left empty.

#### Official Server

- The official server account ID is a phone number. Usually, entering only the **last four digits** is enough. You do not need to enter the full phone number.
- Example:
  - Account 1: `133XXXX1234`
  - Account 2: `133XXXX5678`
  - To switch to Account 1, you can enter `2`, `4`, `12`, `34`, `123`, `234`, `1234`, or any other fragment unique to Account 1.

#### Bilibili Server

- Bilibili server accounts use Bilibili nicknames, which may include Chinese, English, numbers, special symbols, Japanese, and other complex characters. OCR accuracy may be low. Therefore, **do not enter the full nickname**. Enter a **unique fragment that is unlikely to be misrecognized**, and avoid:
  - Rare characters, such as `黍`, which may be recognized as something else
  - Underscores `_`, which are often misrecognized or missed
- Example:
  - Account 1: `DLmaster_361` -> enter `master` or `361`
  - Account 2: `黍的XX_1234` -> enter `1234`, `的`, or `XX`; do **not** enter `黍` or `_`

With these changes, account switching should become more stable.
:::

### Which MAA Settings Does AUTO-MAS Override?

During an auto-proxy run, AUTO-MAS takes over some MAA settings, so whatever you set in MAA is overwritten. Knowing which ones saves you a lot of "but I definitely set that" confusion:

- **Options shown on the account configuration page always win.**
- **Annihilation task**: only **Start wakeup** and **Use sanity** are enabled, only annihilation stages are farmed, and the details are generated automatically from your account settings.
- **Daily task**: runs whatever you ticked in **Task configuration**. **The order is fixed and cannot be changed.**
- **Scheduled execution** is force-disabled, because scheduling belongs to the AUTO-MAS queue. Behavior after task completion, behavior after MAA startup, minimization, and update settings are also adjusted automatically.

Anything not taken over follows your configuration mode: **Shared** mode uses the managed script's shared MAA configuration; **Independent** mode uses the account's own configuration.

::: tip Only the First Task of Each Type Is Used
If you queued two tasks of the same type in MAA, for example two **Use sanity** tasks, AUTO-MAS uses only the first one. If there are none, defaults apply.
:::

## Weekly Plans: Farm Different Stages Each Day

::: info Example version and scope
This section uses **AUTO-MAS v5.8.0-beta.3** and a demonstration account. The screenshots show the Chinese interface; older versions may use different labels and layouts.
:::

A plan stores stages, sanity medicine limits, and series counts. Create the plan first, then select it in each MAA account that should use it. Creating a plan does not start a task.

### 1. Create an MAA plan

Open **Plans** (计划管理), then choose **New plan > New MAA plan** (新建计划 > 新建 MAA 计划表).

[![Create an MAA plan in the Chinese interface](/docs/img/tutorial-20261104/plan-create.png)](/docs/img/tutorial-20261104/plan-create.png)

Click the pencil beside the plan title, enter a name, and press Enter. The example uses **方舟每周计划**.

### 2. Set stages for each weekday

Select **Weekly mode** (周计划模式). Set the values in the Monday-to-Sunday columns. The example uses `R8-11` on Tuesday and `1-7` on the other days; choose stages for your own needs.

[![Configure weekday stages in weekly mode](/docs/img/tutorial-20261104/plan-weekly.png)](/docs/img/tutorial-20261104/plan-weekly.png)

- Global mode uses the **Every day** (每天) column; weekly mode uses the weekday columns. Grayed-out columns cannot be edited in the current mode.
- The simplified view is another way to edit the same plan.
- Changes save immediately. Reopen the page to confirm the name, mode, and stages remain correct.

### 3. Select the plan in an account

Open the MAA account under Managed scripts (托管管理), enable **Override standard configuration** (覆写常规配置), and expand **Sanity tasks** (理智任务). Select your plan in **Stage configuration mode** (关卡配置模式).

[![Select the plan in the MAA account's sanity task](/docs/img/tutorial-20261104/plan-bind.png)](/docs/img/tutorial-20261104/plan-bind.png)

The fields below show today's values with **From plan** (来自计划表) labels. Use **Go to plan** (跳转到计划表) to make changes.

::: tip Scope of a plan
Enable the sanity task itself. A plan supplies its parameters; event balancing, operator cultivation, and inventory maintenance earlier in the account's task order still follow their own switches.
:::

## Skland Automatic Check-In

::: warning Note
AUTO-MAS processes check-in requests locally and does not upload tokens to third-party servers.

Automatic check-in has risks. AUTO-MAS is not responsible for any results caused by automatic check-in. Using this feature means you agree to bear the related risks yourself.
:::

### Get Hypergryph Account Login Credentials

1. Log in to the [Skland web page](https://www.skland.com/).

2. Visit this [URL](https://web-api.skland.com/account/info/hg).

   It returns information similar to:

   ```json
   {
     "code": 0,
     "data": {
       "content": "<Token>"
     },
     "msg": "The API returns the login credential of your Hypergryph account. This credential can be used by the Hypergryph account system to verify login validity. Leaking login credentials is extremely dangerous. For account security, do not disclose this credential to anyone in any form."
   }
   ```

3. Enter `<Token>` into the corresponding option tab in the app.

4. If you need to obtain **Hypergryph account login credentials** for multiple accounts in a row, clear browser cookies to remove login state. Logging out directly from the web page will make the token expire.

::: tip Reminder
Do not enter the quotation marks around `content`, and do not enter the entire returned page content into the option tab.
:::
