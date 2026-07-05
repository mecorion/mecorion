import type {FastifyInstance} from "fastify";
import {query} from "../database.js";

interface ArtistRow {
  id: string;
  name: string;
  slug: string;
  verified: boolean;
  albumCount: number;
  trackCount: number;
}

interface AlbumRow {
  id: string;
  title: string;
  slug: string;
  artistId: string;
  artistName: string;
  releaseDate: string | null;
  coverUrl: string | null;
  trackCount: number;
}

export async function registerCatalogRoutes(app: FastifyInstance) {
  app.get("/api/v1/artists", async () => {
    const result = await query<ArtistRow>(`
      SELECT
        ar.id,
        ar.name,
        ar.slug,
        ar.verified,
        COUNT(DISTINCT al.id)::int AS "albumCount",
        COUNT(DISTINCT t.id)::int AS "trackCount"
      FROM music.artists ar
      LEFT JOIN music.albums al ON al.artist_id = ar.id
      LEFT JOIN music.tracks t ON t.artist_id = ar.id
      GROUP BY ar.id
      ORDER BY ar.name
    `);
    return {items: result.rows};
  });

  app.get("/api/v1/albums", async () => {
    const result = await query<AlbumRow>(`
      SELECT
        al.id,
        al.title,
        al.slug,
        al.artist_id AS "artistId",
        ar.name AS "artistName",
        al.release_date AS "releaseDate",
        al.cover_url AS "coverUrl",
        COUNT(t.id)::int AS "trackCount"
      FROM music.albums al
      JOIN music.artists ar ON ar.id = al.artist_id
      LEFT JOIN music.tracks t ON t.album_id = al.id
      GROUP BY al.id, ar.name
      ORDER BY al.release_date DESC NULLS LAST, al.title
    `);
    return {items: result.rows};
  });
}

