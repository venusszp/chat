# VDrop

Общий анонимный чат на Firebase Realtime Database.

Для отдельной базы VDrop опубликуйте правила командой
`firebase deploy --only database --project disk-c98ee`.
Если база общая для нескольких приложений, объедините раздел `chat_snippets`
из [database.rules.json](database.rules.json) с действующими правилами в Firebase Console.

Vercel публикует сайт. Доступ к данным задаётся отдельно в Firebase.
Внутри `chat_snippets` любой посетитель может читать, отправлять и удалять
сообщения. `CHAT_SECRET` ограничивает только выдачу конфигурации сайта.
