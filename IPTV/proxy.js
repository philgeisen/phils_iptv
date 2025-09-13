// proxy.js
// Simple proxy for Codesandbox -> forwards to arbitrary target (target required).
// WARNING: this is a very small dev proxy for personal use only.

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const { URL } = require("url");

const app = express();
app.use(cors());
app.use(express.json());

// Helper: build final target URL.
// Two supported usages:
// 1) /proxy?target=http%3A%2F%2Fcf.its-cdn.me&path=player_api.php%3Fusername=..
// 2) /proxy/player_api.php?target=http%3A%2F%2Fcf.its-cdn.me&username=..&password=..
app.all("/proxy/*", async (req, res) => {
  try {
    const target = req.query.target;
    if (!target) return res.status(400).send("Missing target query param");

    // capture the wildcard path after /proxy/
    const forwardPath = req.params[0] || "";
    // reconstruct query string excluding `target`
    const params = { ...req.query };
    delete params.target;

    // merge forwardPath with params into final URL
    let url = target;
    // ensure no double slash
    if (forwardPath) {
      // if forwardPath already contains querystring, it will remain
      if (!url.endsWith("/") && !forwardPath.startsWith("/")) url += "/";
      url += forwardPath;
    }

    const extraQs = new URLSearchParams(params).toString();
    if (extraQs) {
      url += (url.includes("?") ? "&" : "?") + extraQs;
    }

    // proxy the request method, headers, body as appropriate
    const fetchOptions = {
      method: req.method,
      headers: {},
    };

    // Copy some headers (user-agent, accept)
    if (req.headers["user-agent"])
      fetchOptions.headers["user-agent"] = req.headers["user-agent"];
    if (req.headers["accept"])
      fetchOptions.headers["accept"] = req.headers["accept"];

    if (req.body && Object.keys(req.body).length) {
      fetchOptions.body = JSON.stringify(req.body);
      fetchOptions.headers["content-type"] = "application/json";
    }

    const upstream = await fetch(url, fetchOptions);

    // Forward status and headers (content-type at least)
    res.status(upstream.status);
    upstream.headers.forEach((v, k) => {
      // don't forward hop-by-hop headers
      if (["connection", "keep-alive", "transfer-encoding"].includes(k)) return;
      res.setHeader(k, v);
    });

    // stream the response
    const buffer = await upstream.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("proxy error:", err && err.stack ? err.stack : err);
    return res.status(500).send(String(err));
  }
});

// Also allow simple /proxy?target=...&path=...
app.all("/proxy", async (req, res) => {
  try {
    const target = req.query.target;
    const path = req.query.path || "";
    if (!target) return res.status(400).send("Missing target query param");

    let url = target;
    if (path) {
      if (!url.endsWith("/") && !String(path).startsWith("/")) url += "/";
      url += path;
    }

    // forward remaining query params except target/path
    const params = { ...req.query };
    delete params.target;
    delete params.path;
    const extraQs = new URLSearchParams(params).toString();
    if (extraQs) url += (url.includes("?") ? "&" : "?") + extraQs;

    const upstream = await fetch(url, { method: req.method });
    res.status(upstream.status);
    upstream.headers.forEach((v, k) => {
      if (["connection", "keep-alive", "transfer-encoding"].includes(k)) return;
      res.setHeader(k, v);
    });
    const buffer = await upstream.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("proxy error:", err && err.stack ? err.stack : err);
    return res.status(500).send(String(err));
  }
});

// Start the server using the environment port from Codesandbox
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Proxy running on port ${port}`);
});
