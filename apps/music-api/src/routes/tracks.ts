import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {query} from "../database.js";

interface TrackRow {
  id: string;
  title: string;
  artistId: string;
  artist: string;
  albumId: string | null;
  album: string | null;
  year: number | null;
  durationMs: number;
  trackNumber: number | null;
  audioFormat: string;
  sourceUrl: string;
  explicit: boolean;
  available: boolean;
  genres: string[];
}

const TrackQuerySchema = z.object({
  artistId: z.uuid().optional(),
  albumId: z.uuid().optional(),
  year: z.coerce.number().int().min(1800).max(2200).optional(),
  available: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const TrackParamsSchema = z.object({id: z.uuid()});

const CreateTrackSchema = z.object({
  title: z.string().trim().min(1).max(200),
  artistId: z.uuid(),
  albumId: z.uuid().nullable().optional(),
  year: z.number().int().min(1800).max(2200).nullable().optional(),
  durationMs: z.number().int().positive(),
  trackNumber: z.number().int().positive().nullable().optional(),
  audioFormat: z.enum(["mp3", "aac", "opus", "flac", "wav"]).default("mp3"),
  sourceUrl: z.url(),
  explicit: z.boolean().default(false),
});

const trackSelect = `
  SELECT
    t.id,
    t.title,
    t.artist_id AS "artistId",
    ar.name AS artist,
    t.album_id AS "albumId",
    al.title AS album,
    t.release_year AS year,
    t.duration_ms AS "durationMs",
    t.track_number AS "trackNumber",
    t.audio_format AS "audioFormat",
    t.source_url AS "sourceUrl",
    t.is_explicit AS explicit,
    t.is_available AS available,
    COALESCE(ARRAY_AGG(DISTINCT g.name) FILTER (WHERE g.id IS NOT NULL), '{}') AS genres
  FROM music.tracks t
  JOIN music.artists ar ON ar.id = t.artist_id
  LEFT JOIN music.albums al ON al.id = t.album_id
  LEFT JOIN music.track_genres tg ON tg.track_id = t.id
  LEFT JOIN music.genres g ON g.id = tg.genre_id
`;

export async function registerTrackRoutes(app: FastifyInstance) {
  app.get("/api/v1/tracks", async (request) => {
    const filters = TrackQuerySchema.parse(request.query);
    const conditions: string[] = [];
    const values: unknown[] = [];

    // Номер placeholder вычисляется после добавления значения, поэтому SQL
    // всегда остаётся параметризованным даже при произвольном наборе фильтров.
    function addCondition(column: string, value: unknown) {
      values.push(value);
      conditions.push(`${column} = $${values.length}`);
    }

    if (filters.artistId) addCondition("t.artist_id", filters.artistId);
    if (filters.albumId) addCondition("t.album_id", filters.albumId);
    if (filters.year) addCondition("t.release_year", filters.year);
    if (filters.available !== undefined) addCondition("t.is_available", filters.available);

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    values.push(filters.limit, filters.offset);
    const limitParameter = `$${values.length - 1}`;
    const offsetParameter = `$${values.length}`;

    const result = await query<TrackRow>(`
      ${trackSelect}
      ${where}
      GROUP BY t.id, ar.name, al.title
      ORDER BY t.created_at DESC, t.title
      LIMIT ${limitParameter} OFFSET ${offsetParameter}
    `, values);

    return {items: result.rows, pagination: {limit: filters.limit, offset: filters.offset}};
  });

  app.get("/api/v1/tracks/:id", async (request, reply) => {
    const {id} = TrackParamsSchema.parse(request.params);
    const result = await query<TrackRow>(`
      ${trackSelect}
      WHERE t.id = $1
      GROUP BY t.id, ar.name, al.title
    `, [id]);

    if (!result.rows[0]) {
      return reply.status(404).send({error: "TRACK_NOT_FOUND", message: "Трек не найден"});
    }
    return result.rows[0];
  });

  app.post("/api/v1/tracks", async (request, reply) => {
    const track = CreateTrackSchema.parse(request.body);
    const result = await query<{id: string}>(`
      INSERT INTO music.tracks (
        title, artist_id, album_id, release_year, duration_ms, track_number,
        audio_format, source_url, is_explicit
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      track.title,
      track.artistId,
      track.albumId ?? null,
      track.year ?? null,
      track.durationMs,
      track.trackNumber ?? null,
      track.audioFormat,
      track.sourceUrl,
      track.explicit,
    ]);

    return reply.status(201).send({id: result.rows[0]?.id});
  });
}

