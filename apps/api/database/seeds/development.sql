BEGIN;

INSERT INTO identity.users (
  id, email, display_name, password_hash, password_salt, role
) VALUES
  (
    '00000000-0000-4000-8000-000000000001',
    'admin@mecorion.local',
    'Администратор Mecorion',
    'BEoy_56wRjrKsO-Q4JHWgFWo3igr939FKRx3HQ6Dad6awBU5vzUI4PsXzleHdA587qA0dkfjmOt57KJNyEt4DA',
    'mecorion-dev-seed',
    'admin'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO music.artists (id, name, slug, verified) VALUES
  ('10000000-0000-4000-8000-000000000001', 'Исполнитель 1', 'artist-1', true),
  ('10000000-0000-4000-8000-000000000002', 'Исполнитель 2', 'artist-2', true),
  ('10000000-0000-4000-8000-000000000003', 'Исполнитель 3', 'artist-3', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO music.albums (id, artist_id, title, slug, album_type, release_date) VALUES
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Альбом 1', 'album-1', 'album', '1997-01-01'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Альбом 2', 'album-2', 'album', '2016-08-05'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 'Альбом 3', 'album-3', 'album', '2000-06-13')
ON CONFLICT (id) DO NOTHING;

INSERT INTO music.tracks (
  id, artist_id, album_id, title, release_year, duration_ms, track_number,
  audio_format, bitrate_kbps, source_url
) VALUES
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Трек 1', 1997, 191000, 3, 'mp3', 320, 'https://cdn.example.test/music/track-01.mp3'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'Трек 2', 2016, 205000, 13, 'mp3', 320, 'https://cdn.example.test/music/track-02.mp3'),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', 'Трек 3', 2000, 224000, 1, 'mp3', 320, 'https://cdn.example.test/music/track-03.mp3')
ON CONFLICT (id) DO NOTHING;

INSERT INTO music.genres (id, name, slug) VALUES
  ('40000000-0000-4000-8000-000000000001', 'Рок', 'rock'),
  ('40000000-0000-4000-8000-000000000002', 'Поп', 'pop'),
  ('40000000-0000-4000-8000-000000000003', 'Электроника', 'electronic')
ON CONFLICT (id) DO NOTHING;

INSERT INTO music.track_genres (track_id, genre_id) VALUES
  ('30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001'),
  ('30000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002'),
  ('30000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000003'),
  ('30000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000001')
ON CONFLICT DO NOTHING;

COMMIT;
