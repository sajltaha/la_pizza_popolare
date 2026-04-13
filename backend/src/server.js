const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const promClient = require("prom-client");

const app = express();
const port = Number(process.env.PORT || 8080);

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || "pizza_user",
        password: process.env.DB_PASSWORD || "pizza_pass",
        database: process.env.DB_NAME || "pizza_db",
      }
);

const register = new promClient.Registry();
promClient.collectDefaultMetrics({
  register,
  prefix: "pizza_backend_",
});

const httpRequestsTotal = new promClient.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
});

const httpRequestDurationSeconds = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.05, 0.1, 0.2, 0.3, 0.35, 0.5, 1, 2, 5],
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDurationSeconds);

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

async function query(text, params) {
  return pool.query(text, params);
}

async function waitForDatabase() {
  for (let i = 0; i < 30; i += 1) {
    try {
      await query("SELECT 1");
      return;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error("Database is not ready after multiple retries");
}

function getSeedPath() {
  if (process.env.PIZZA_SEED_FILE) {
    return path.resolve(process.cwd(), process.env.PIZZA_SEED_FILE);
  }

  return path.resolve(__dirname, "../../src/libs/api.json");
}

async function seedPizzasFromFile() {
  const countResult = await query("SELECT COUNT(*)::int AS count FROM pizzas");
  if (countResult.rows[0].count > 0) {
    return;
  }

  const seedPath = getSeedPath();
  const raw = fs.readFileSync(seedPath, "utf-8");
  const pizzas = JSON.parse(raw);

  if (!Array.isArray(pizzas)) {
    throw new Error("Seed file must contain array");
  }

  for (const pizza of pizzas) {
    await query(
      `
      INSERT INTO pizzas (id, name, toppings, price, description, img)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
      `,
      [
        Number(pizza.id),
        String(pizza.name),
        Array.isArray(pizza.toppings) ? pizza.toppings.map(String) : [],
        Number(pizza.price),
        String(pizza.description),
        String(pizza.img),
      ]
    );
  }
}

function normalizeOrderItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      pizzaId: Number(item.pizzaId ?? item.id),
      quantity: Number(item.quantity ?? item.count),
    }))
    .filter(
      (item) =>
        Number.isInteger(item.pizzaId) &&
        item.pizzaId > 0 &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    );
}

function metricsMiddleware(req, res, next) {
  const end = httpRequestDurationSeconds.startTimer();

  res.on("finish", () => {
    const route =
      req.route && req.route.path ? `${req.baseUrl}${req.route.path}` : req.path;
    const status = String(res.statusCode);

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status,
    });

    end({
      method: req.method,
      route,
      status,
    });
  });

  next();
}

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "1mb" }));
app.use(metricsMiddleware);

app.get("/metrics", async (req, res) => {
  const metrics = await register.metrics();
  res.setHeader("Content-Type", register.contentType);
  res.send(metrics);
});

app.get("/health", async (req, res) => {
  try {
    await query("SELECT 1");

    res.status(200).json({
      status: "ok",
      db: "up",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "degraded",
      db: "down",
      error: error.message,
    });
  }
});

app.get("/api/pizzas", async (req, res) => {
  try {
    const result = await query(
      "SELECT id, name, toppings, price, description, img FROM pizzas ORDER BY id ASC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch pizzas",
      error: error.message,
    });
  }
});

app.post("/api/orders", async (req, res) => {
  const items = normalizeOrderItems(req.body.items);
  if (items.length === 0) {
    return res.status(400).json({
      message: "Order must contain at least one valid item",
    });
  }

  const customerName = String(req.body.customerName || "Guest User").slice(
    0,
    100
  );
  const customerEmail = String(req.body.customerEmail || "guest@pizza.local").slice(
    0,
    120
  );
  const promoCode = String(req.body.promoCode || "").trim().slice(0, 30);

  try {
    const uniquePizzaIds = [...new Set(items.map((item) => item.pizzaId))];
    const pizzasResult = await query(
      "SELECT id, name, price FROM pizzas WHERE id = ANY($1::int[])",
      [uniquePizzaIds]
    );

    if (pizzasResult.rows.length !== uniquePizzaIds.length) {
      return res.status(400).json({
        message: "One or more pizzas in the order do not exist",
      });
    }

    const pizzasById = new Map(
      pizzasResult.rows.map((pizza) => [pizza.id, pizza])
    );

    let subtotal = 0;

    const orderItems = items.map((item) => {
      const pizza = pizzasById.get(item.pizzaId);
      const unitPrice = Number(pizza.price);
      const lineTotal = roundMoney(unitPrice * item.quantity);
      subtotal += lineTotal;

      return {
        pizzaId: item.pizzaId,
        pizzaName: pizza.name,
        quantity: item.quantity,
        unitPrice: roundMoney(unitPrice),
        lineTotal,
      };
    });

    subtotal = roundMoney(subtotal);
    const discount = promoCode ? roundMoney(subtotal * 0.1) : 0;
    const total = roundMoney(Math.max(subtotal - discount, 0));

    const client = await pool.connect();
    let createdOrder;

    try {
      await client.query("BEGIN");

      const orderResult = await client.query(
        `
        INSERT INTO orders (
          customer_name,
          customer_email,
          promo_code,
          subtotal,
          total,
          status
        )
        VALUES ($1, $2, $3, $4, $5, 'confirmed')
        RETURNING id, customer_name, customer_email, promo_code, subtotal, total, status, created_at
        `,
        [customerName, customerEmail, promoCode || null, subtotal, total]
      );

      createdOrder = orderResult.rows[0];

      for (const item of orderItems) {
        await client.query(
          `
          INSERT INTO order_items (
            order_id,
            pizza_id,
            pizza_name,
            quantity,
            unit_price,
            line_total
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            createdOrder.id,
            item.pizzaId,
            item.pizzaName,
            item.quantity,
            item.unitPrice,
            item.lineTotal,
          ]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return res.status(201).json({
      message: "Order placed successfully",
      order: {
        ...createdOrder,
        items: orderItems,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to place order",
      error: error.message,
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

async function start() {
  try {
    await waitForDatabase();
    await seedPizzasFromFile();

    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Pizza backend is running on port ${port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start backend:", error);
    await pool.end();
    process.exit(1);
  }
}

start();
