# Local Mecorion Data

Эта директория эмулирует файловое хранилище сервера.

```text
data/
├── music/
├── video/
├── books/
├── cloud/
└── temp/
```

Сами медиафайлы не коммитятся в Git. В PostgreSQL нужно хранить относительный
ключ файла, например `music/processed/{trackId}/audio-320.mp3`, а не абсолютный
путь на диске.
