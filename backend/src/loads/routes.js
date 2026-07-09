import { z } from "zod";
import { query, queryOne, uuid } from "../common/database.js";
import { getPagination, paginatedResponse } from "../common/pagination.js";

// Cidades brasileiras com coordenadas (mesma lista do Geocoding frontend)
const KNOWN_CITIES = {
  "são paulo": { lat: -23.5505, lng: -46.6333, state: "SP" },
  "porto alegre": { lat: -30.0346, lng: -51.2177, state: "RS" },
  "rio de janeiro": { lat: -22.9068, lng: -43.1729, state: "RJ" },
  "belo horizonte": { lat: -19.9167, lng: -43.9345, state: "MG" },
  "curitiba": { lat: -25.429, lng: -49.2671, state: "PR" },
  "florianópolis": { lat: -27.5945, lng: -48.5477, state: "SC" },
  "campinas": { lat: -22.9099, lng: -47.0626, state: "SP" },
  "salvador": { lat: -12.9714, lng: -38.5014, state: "BA" },
  "fortaleza": { lat: -3.7319, lng: -38.5267, state: "CE" },
  "recife": { lat: -8.0476, lng: -34.877, state: "PE" },
  "brasília": { lat: -15.7975, lng: -47.8919, state: "DF" },
  "manaus": { lat: -3.119, lng: -60.0217, state: "AM" },
  "goiânia": { lat: -16.6864, lng: -49.2643, state: "GO" },
  "vitória": { lat: -20.2976, lng: -40.2958, state: "ES" },
  "são luís": { lat: -2.5387, lng: -44.2822, state: "MA" },
  "natal": { lat: -5.7793, lng: -35.2009, state: "RN" },
  "cuiabá": { lat: -15.601, lng: -56.0974, state: "MT" },
  "campo grande": { lat: -20.4697, lng: -54.6201, state: "MS" },
  "belém": { lat: -1.4558, lng: -48.5036, state: "PA" },
  "aracaju": { lat: -10.9095, lng: -37.0678, state: "SE" },
  "maceió": { lat: -9.6498, lng: -35.7089, state: "AL" },
  "joão pessoa": { lat: -7.115, lng: -34.8641, state: "PB" },
  "teresina": { lat: -5.0892, lng: -42.8019, state: "PI" },
  "rio branco": { lat: -9.974, lng: -67.8076, state: "AC" },
  "macapá": { lat: 0.0356, lng: -51.0705, state: "AP" },
  "boa vista": { lat: 2.8196, lng: -60.6733, state: "RR" },
  "palmas": { lat: -10.1689, lng: -48.3317, state: "TO" },
  "porto velho": { lat: -8.7619, lng: -63.9019, state: "RO" },
};

/**
 * Calcula distância aproximada em km entre duas coordenadas (Haversine)
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Busca coordenadas de uma cidade pelo nome
 */
function getCityCoords(city, state) {
  const key = `${city.toLowerCase().trim()}`;
  const known = KNOWN_CITIES[key];
  if (known && (!state || known.state === state.toUpperCase())) {
    return { lat: known.lat, lng: known.lng };
  }
  return null;
}

const createLoadSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  originCity: z.string().min(2),
  originState: z.string().length(2),
  destinationCity: z.string().min(2),
  destinationState: z.string().length(2),
  weightKg: z.number().positive(),
  volumeM3: z.number().positive().optional(),
  type: z.string().optional(),
  status: z.enum(["pending", "available", "matched", "in_transit", "delivered", "cancelled"]).optional(),
  pickupDate: z.string(),
  deliveryDate: z.string(),
});

export async function loadRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  app.post("/", async (request, reply) => {
    const body = createLoadSchema.parse(request.body);
    const user = request.user;

    const company = await queryOne(`SELECT id FROM companies WHERE user_id = ?`, [user.id]);

    if (!company) {
      throw { statusCode: 400, message: "Usuário não possui empresa cadastrada" };
    }

    const id = uuid();
    await query(
      `INSERT INTO loads (id, company_id, title, description, origin_city, origin_state, destination_city, destination_state, weight_kg, volume_m3, type, pickup_date, delivery_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [id, company.id, body.title, body.description || null, body.originCity, body.originState, body.destinationCity, body.destinationState, body.weightKg, body.volumeM3 || null, body.type || null, body.pickupDate, body.deliveryDate]
    );

    const load = await queryOne(`SELECT * FROM loads WHERE id = ?`, [id]);
    return reply.status(201).send(load);
  });

  app.get("/", async (request) => {
    const { page, limit, offset } = getPagination(request.query);

    const [rows, [{ total }]] = await Promise.all([
      query(`SELECT l.*, c.name AS company_name FROM loads l LEFT JOIN companies c ON l.company_id = c.id ORDER BY l.created_at DESC LIMIT ? OFFSET ?`, [limit, offset]),
      query(`SELECT COUNT(*) as total FROM loads`),
    ]);

    return paginatedResponse(rows, total, page, limit);
  });

  app.get("/available", async (request) => {
    const { page, limit, offset } = getPagination(request.query);

    const [rows, [{ total }]] = await Promise.all([
      query(`SELECT l.*, c.name AS company_name FROM loads l LEFT JOIN companies c ON l.company_id = c.id WHERE l.status = 'available' ORDER BY l.pickup_date ASC LIMIT ? OFFSET ?`, [limit, offset]),
      query(`SELECT COUNT(*) as total FROM loads WHERE status = 'available'`),
    ]);

    return paginatedResponse(rows, total, page, limit);
  });

  app.get("/:id", async (request) => {
    const { id } = request.params;
    const load = await queryOne(`SELECT * FROM loads WHERE id = ?`, [id]);

    if (!load) {
      throw { statusCode: 404, message: "Carga não encontrada" };
    }
    return load;
  });

  app.patch("/:id", async (request) => {
    const { id } = request.params;
    const body = createLoadSchema.partial().parse(request.body);

    const sets = [];
    const params = [];

    if (body.title) { sets.push("title = ?"); params.push(body.title); }
    if (body.description !== undefined) { sets.push("description = ?"); params.push(body.description); }
    if (body.originCity) { sets.push("origin_city = ?"); params.push(body.originCity); }
    if (body.originState) { sets.push("origin_state = ?"); params.push(body.originState); }
    if (body.destinationCity) { sets.push("destination_city = ?"); params.push(body.destinationCity); }
    if (body.destinationState) { sets.push("destination_state = ?"); params.push(body.destinationState); }
    if (body.weightKg) { sets.push("weight_kg = ?"); params.push(body.weightKg); }
    if (body.volumeM3 !== undefined) { sets.push("volume_m3 = ?"); params.push(body.volumeM3); }
    if (body.type !== undefined) { sets.push("type = ?"); params.push(body.type); }
    if (body.status) { sets.push("status = ?"); params.push(body.status); }
    if (body.pickupDate) { sets.push("pickup_date = ?"); params.push(body.pickupDate); }
    if (body.deliveryDate) { sets.push("delivery_date = ?"); params.push(body.deliveryDate); }

    if (sets.length === 0) {
      throw { statusCode: 400, message: "Nenhum campo para atualizar" };
    }

    sets.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);

    await query(`UPDATE loads SET ${sets.join(", ")} WHERE id = ?`, params);

    return await queryOne(`SELECT * FROM loads WHERE id = ?`, [id]);
  });

  /**
   * GET /nearby — Cargas próximas a uma cidade ou coordenadas GPS
   * Query params: city + state (manual) OU lat + lng (GPS), radius (km, default 150)
   */
  app.get("/nearby", async (request) => {
    const { city, state, lat, lng, radius = "150" } = request.query;
    const maxRadius = parseFloat(radius) || 150;

    let centerLat, centerLng;

    if (lat && lng) {
      centerLat = parseFloat(lat);
      centerLng = parseFloat(lng);
    } else if (city) {
      const coords = getCityCoords(city, state);
      if (!coords) {
        // Fallback: busca por estado
        const stateFilter = state ? `AND l.origin_state = ?` : "";
        const stateParams = state ? [state.toUpperCase()] : [];
        const [rows] = await Promise.all([
          query(`SELECT l.*, c.name AS company_name FROM loads l LEFT JOIN companies c ON l.company_id = c.id WHERE l.status = 'available' ${stateFilter} ORDER BY l.pickup_date ASC`, stateParams),
        ]);
        return { results: rows, city: city, state: state, note: "Coordenadas não encontradas para esta cidade. Exibindo resultados por estado." };
      }
      centerLat = coords.lat;
      centerLng = coords.lng;
    } else {
      // Sem parâmetros — retorna todas as cargas disponíveis
      const [rows] = await Promise.all([
        query(`SELECT l.*, c.name AS company_name FROM loads l LEFT JOIN companies c ON l.company_id = c.id WHERE l.status = 'available' ORDER BY l.pickup_date ASC`),
      ]);
      return { results: rows };
    }

    // Busca todas as cargas disponíveis com JOIN nas empresas para ter city/state
    const [loads] = await Promise.all([
      query(`
        SELECT l.*, c.name AS company_name, c.city AS company_city, c.state AS company_state
        FROM loads l
        LEFT JOIN companies c ON l.company_id = c.id
        WHERE l.status = 'available'
        ORDER BY l.pickup_date ASC
      `),
    ]);

    // Para cada carga, tenta obter coordenadas da cidade de origem e calcula distância
    const resultsWithDistance = loads
      .map((load) => {
        const loadCoords = getCityCoords(load.origin_city, load.origin_state);
        if (!loadCoords) return null;
        const distance = haversineKm(centerLat, centerLng, loadCoords.lat, loadCoords.lng);
        return { ...load, distance_km: Math.round(distance * 10) / 10 };
      })
      .filter(Boolean)
      .filter((load) => load.distance_km <= maxRadius)
      .sort((a, b) => a.distance_km - b.distance_km);

    return {
      results: resultsWithDistance,
      center: { lat: centerLat, lng: centerLng },
      radius_km: maxRadius,
    };
  });

  /**
   * Excluir carga
   */
  app.delete("/:id", async (request, reply) => {
    const { id } = request.params;

    const load = await queryOne(`SELECT id FROM loads WHERE id = ?`, [id]);
    if (!load) {
      return reply.status(404).send({ error: "Carga não encontrada" });
    }

    await query(`DELETE FROM loads WHERE id = ?`, [id]);
    return reply.status(204).send();
  });
}
