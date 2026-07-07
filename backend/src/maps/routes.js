import { z } from "zod";

const geocodeSchema = z.object({
  city: z.string(),
  state: z.string(),
});

export async function mapRoutes(app) {
  /**
   * Geocoding via Nominatim (OpenStreetMap)
   */
  app.get("/geocode", async (request, reply) => {
    const { city, state } = geocodeSchema.parse(request.query);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${city}, ${state}, Brasil`)}&limit=1`,
        {
          headers: {
            "User-Agent": "OpenCargo/0.1.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Nominatim retornou status ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      throw {
        statusCode: 502,
        message: "Erro ao consultar serviço de geolocalização",
      };
    }
  });

  /**
   * Rota entre duas cidades
   */
  app.get("/route", async (request, reply) => {
    const { origin, destination } = request.query;

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin};${destination}?overview=full&geometries=geojson`
      );

      if (!response.ok) {
        throw new Error(`OSRM retornou status ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      throw {
        statusCode: 502,
        message: "Erro ao consultar serviço de rotas",
      };
    }
  });
}
