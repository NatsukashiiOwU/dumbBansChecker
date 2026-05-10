# Discord bans ui which doesnt suck that hard
Supports batch search and fuzzy search
You will need a json file with bans from discord api e.g. https://discord.com/api/v9/guilds/{$id}/bans?limit=1000, since there's no way app could get it for youu unless you share access token for which you will need to open devtools anyway.
Just open preview of request, hit copy object, paste in json file, and drop into app.
