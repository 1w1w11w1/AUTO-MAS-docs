# Task Management

## Scheduling Queues

A **scheduling queue** is a to-do list: you put the managed scripts you want to run into it in order, and AUTO-MAS works down the list one managed script at a time. You can also have it start running when the app launches, or at set times.

::: warning Two things to get straight first
**Managed scripts in a queue run one after another.** The next one starts only after the previous one finishes. If you see several managed scripts running at the same time, check your general script settings.

**A queue can have several scheduled times, but those times don't belong to individual managed scripts.** At each scheduled time, the whole queue runs from the top. They are not "run managed script A at this time, managed script B at that time".
:::

::: info Example version and scope
This section uses **AUTO-MAS v5.8.0-beta.3**. The screenshots show the Chinese interface. The example configures a queue without running game tasks.
:::

### 1. Create a queue and choose its startup behavior

Open **Queue** (调度队列) and click **New queue** (新建队列). Use the pencil beside the title to rename it, then press Enter.

**Run at startup** (启动时运行) is a dropdown:

- **Run every time** (每次都运行): run the queue whenever the app starts.
- **Never** (从不): do not trigger it at app startup. Scheduled and manual runs remain available.
- **First startup each day** (每日首次启动时): trigger this queue at app startup at most once per day.

[![Three startup options in the Chinese interface](/docs/img/tutorial-20261104/queue-startup.png)](/docs/img/tutorial-20261104/queue-startup.png)

### 2. Schedule the whole queue

Keep **Queue type** (队列类型) set to **Timed queue** (定时队列), then set **Scheduled run** (定时运行) to **Yes** (是).

[![Queue type, startup behavior, and the scheduled-run setting](/docs/img/tutorial-20261104/queue-config.png)](/docs/img/tutorial-20261104/queue-config.png)

In **Schedule list** (定时列表), click **Add schedule** (添加定时). Choose the weekdays and time, then set the row's **Status** (状态) to **Enabled** (启用). The example uses `06:30`; choose your own time.

[![Schedule status, weekdays, and execution time](/docs/img/tutorial-20261104/queue-timer.png)](/docs/img/tutorial-20261104/queue-timer.png)

::: tip Enable both settings
The queue's scheduled-run setting must be Yes and the individual schedule row must be Enabled. Changes save immediately; reload the page to check them.
:::

::: warning Startup and schedules trigger separately
**Run at startup** and **Scheduled run** can both take effect. **First startup each day** limits startup triggers; it does not limit the queue to one run for the whole day. If startup coincides with a scheduled time, the same queue may be triggered twice. To run only at scheduled times, set **Run at startup** to **Never**.
:::

A cycle queue (循环队列) repeats according to each task's cycle settings. Choose it when you need repeated task cycles rather than scheduled runs of the whole queue.

### 3. Add configured managed scripts

Click **Add task** (添加任务) and select a configured managed script. If there are no managed scripts to select, complete [Managed Script Configuration](/en/docs/script-guide/) first.

::: tip Common setups
- To run after boot, start AUTO-MAS with Windows and select Run every time or First startup each day.
- To run at specific times, keep the app running and enable both scheduled-run settings.
- For MAA infrastructure changes, schedule MAA shortly before the new layout should take effect.
:::

## Run order in auto-proxy mode

In **auto-proxy** mode, tasks are nested like this:

- **One account** = all the tasks that account has selected. For MAA managed scripts, an account's tasks split into **Annihilation** and **Daily**, with Annihilation first; when configuration overrides are off, the Daily task is run.
- **One managed script** = the tasks of all accounts under it, run in the order the accounts appear in the list. The same managed script can't run twice at once. If it's already running, starting it again is skipped.
- **One queue** = the tasks of all managed scripts in the queue, run in queue order. The same queue can be started more than once.
- **One scheduler console** runs one queue at a time. To run several queues in parallel, open more consoles.

## Manual Review

The batch has finished, but you want to see with your own eyes whether each account really got everything done. That's what **manual review** is for: AUTO-MAS logs in to each account in turn, you take a look, and it records the result.

::: info Only MAA is supported for now
Other scripts aren't supported yet.
:::

1. Select **Manual review mode** and click **Start task**.
2. The app starts MAA and logs in to each account in order.
3. **After each PRTS login finishes**, check that account's run yourself and manually confirm anything that didn't get done.
4. When the review ends, the results are recorded in the status information on the **Account Management** page.
