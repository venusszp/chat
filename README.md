# VDrop

Общий чат для обмена текстом и кодом. В браузере отображается анонимное имя.
Данные читает и записывает сервер Vercel через Firebase Realtime Database.

В настройках **Vercel → Environment Variables → Production** задайте:

- `FIREBASE_SERVICE_ACCOUNT_JSON` — JSON сервисного аккаунта Google с доступом
  к Realtime Database проекта `disk-c98ee`. Храните его как серверную переменную.
- `CHAT_SECRET` — длинный случайный ключ доступа к чату. Передайте его участникам.
- `FIREBASE_DATABASE_URL` — адрес базы, если он отличается от
  `https://disk-c98ee-default-rtdb.firebaseio.com`.

После установки переменных сделайте Redeploy. Сервер обслуживает только
`chat_snippets`. Участники с ключом могут читать, отправлять и удалять сообщения.
Открытая вкладка обновляет ленту каждые пять секунд.
