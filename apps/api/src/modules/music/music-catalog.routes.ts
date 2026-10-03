import type {FastifyInstance} from "fastify";
import {query} from "../../core/database.js";

export async function registerCatalogRoutes(app: FastifyInstance) {
  app.get("/api/v1/music/artists", async () => {
    const result = await query(`
      SELECT
        contributor."publicId"::TEXT AS "id",
        contributor."primaryName" AS "name",
        contributor."normalizedName",
        COUNT(DISTINCT contentContributor."contentId")::INT AS "trackCount"
      FROM music."tArtist" musicArtist
      JOIN content."tContributor" contributor ON contributor."id" = musicArtist."contributorId"
      JOIN content."tContributorRole" role ON role."code" IN ('PRIMARY_ARTIST', 'FEATURED_ARTIST')
      LEFT JOIN content."tContentContributor" contentContributor
        ON contentContributor."contributorId" = contributor."id"
       AND contentContributor."contributorRoleId" = role."id"
      WHERE contributor."retireDtm" IS NULL AND musicArtist."artistStatus" = 'ACTIVE'
      GROUP BY contributor."publicId", contributor."primaryName", contributor."normalizedName"
      ORDER BY contributor."primaryName"
    `);
    return {items: result.rows};
  });

  app.get("/api/v1/music/albums", async () => {
    const result = await query(`
      SELECT
        contentItem."publicId"::TEXT AS "id",
        contentItem."originalTitle" AS "title",
        contentItem."releaseDt" AS "releaseDate",
        albumType."code" AS "albumType",
        COUNT(albumTrack."trackContentId")::INT AS "trackCount"
      FROM music."tAlbum" album
      JOIN content."tContent" contentItem ON contentItem."id" = album."contentId"
      JOIN content."tContentStatus" contentStatus ON contentStatus."id" = contentItem."contentStatusId"
      JOIN music."tAlbumType" albumType ON albumType."id" = album."albumTypeId"
      LEFT JOIN music."tAlbumTrack" albumTrack ON albumTrack."albumContentId" = album."contentId"
      WHERE contentItem."retireDtm" IS NULL AND contentStatus."code" = 'ACTIVE'
      GROUP BY contentItem."publicId", contentItem."originalTitle", contentItem."releaseDt", albumType."code"
      ORDER BY contentItem."releaseDt" DESC NULLS LAST, contentItem."originalTitle"
    `);
    return {items: result.rows};
  });
}
