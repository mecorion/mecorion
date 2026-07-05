CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS music;

CREATE TABLE music.artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(160) NOT NULL,
  slug varchar(180) NOT NULL UNIQUE,
  bio text,
  avatar_url text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE music.albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES music.artists(id) ON DELETE RESTRICT,
  title varchar(200) NOT NULL,
  slug varchar(220) NOT NULL,
  album_type varchar(20) NOT NULL DEFAULT 'album'
    CHECK (album_type IN ('album', 'single', 'ep', 'compilation')),
  release_date date,
  cover_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (artist_id, slug)
);

CREATE TABLE music.tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES music.artists(id) ON DELETE RESTRICT,
  album_id uuid REFERENCES music.albums(id) ON DELETE SET NULL,
  title varchar(200) NOT NULL,
  release_year smallint CHECK (release_year BETWEEN 1800 AND 2200),
  duration_ms integer NOT NULL CHECK (duration_ms > 0),
  track_number smallint CHECK (track_number > 0),
  disc_number smallint NOT NULL DEFAULT 1 CHECK (disc_number > 0),
  audio_format varchar(12) NOT NULL DEFAULT 'mp3'
    CHECK (audio_format IN ('mp3', 'aac', 'opus', 'flac', 'wav')),
  bitrate_kbps integer CHECK (bitrate_kbps > 0),
  source_url text NOT NULL,
  is_explicit boolean NOT NULL DEFAULT false,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE music.genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL UNIQUE,
  slug varchar(100) NOT NULL UNIQUE
);

CREATE TABLE music.track_genres (
  track_id uuid NOT NULL REFERENCES music.tracks(id) ON DELETE CASCADE,
  genre_id uuid NOT NULL REFERENCES music.genres(id) ON DELETE CASCADE,
  PRIMARY KEY (track_id, genre_id)
);

CREATE TABLE music.playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  title varchar(160) NOT NULL,
  description text,
  cover_url text,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE music.playlist_tracks (
  playlist_id uuid NOT NULL REFERENCES music.playlists(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES music.tracks(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position >= 0),
  added_by uuid,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (playlist_id, track_id),
  UNIQUE (playlist_id, position)
);

CREATE TABLE music.liked_tracks (
  user_id uuid NOT NULL,
  track_id uuid NOT NULL REFERENCES music.tracks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, track_id)
);

CREATE TABLE music.playback_history (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL,
  track_id uuid NOT NULL REFERENCES music.tracks(id) ON DELETE CASCADE,
  progress_ms integer NOT NULL DEFAULT 0 CHECK (progress_ms >= 0),
  completed boolean NOT NULL DEFAULT false,
  listened_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE music.lyrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES music.tracks(id) ON DELETE CASCADE,
  language varchar(16) NOT NULL,
  lyrics_type varchar(16) NOT NULL CHECK (lyrics_type IN ('plain', 'synced')),
  content jsonb NOT NULL,
  source varchar(120),
  moderation_status varchar(16) NOT NULL DEFAULT 'draft'
    CHECK (moderation_status IN ('draft', 'review', 'published', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (track_id, language)
);

CREATE INDEX tracks_artist_id_idx ON music.tracks (artist_id);
CREATE INDEX tracks_album_id_idx ON music.tracks (album_id);
CREATE INDEX tracks_release_year_idx ON music.tracks (release_year);
CREATE INDEX tracks_available_idx ON music.tracks (is_available) WHERE is_available = true;
CREATE INDEX albums_artist_id_idx ON music.albums (artist_id);
CREATE INDEX playlists_owner_id_idx ON music.playlists (owner_id);
CREATE INDEX playback_history_user_date_idx ON music.playback_history (user_id, listened_at DESC);
CREATE INDEX lyrics_track_id_idx ON music.lyrics (track_id);

