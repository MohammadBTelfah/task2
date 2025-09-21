import React, { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import dayjs from "dayjs";
import { QRCodeCanvas } from "qrcode.react";

const BASE_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const API = `${BASE_URL}/api`;

function App() {
  const [target, setTarget] = useState("");
  const [slug, setSlug] = useState("");
  const [links, setLinks] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const shortUrl = (s) => `${BASE_URL}/${s}`;

  const fetchLinks = async () => {
    setLoadingList(true);
    setErrorMsg("");
    try {
      const res = await axios.get(`${API}/links`);
      setLinks(res.data || []);
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || "Failed to fetch links");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);
    try {
      const payload = { target: target.trim() };
      if (slug.trim()) payload.slug = slug.trim();

      const res = await axios.post(`${API}/links`, payload);
      setSuccessMsg(`Short link created: ${shortUrl(res.data.slug)}`);
      setTarget("");
      setSlug("");
      await fetchLinks();
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async (s) => {
    const url = shortUrl(s);
    try {
      await navigator.clipboard.writeText(url);
      setSuccessMsg(`Copied: ${url}`);
    } catch {
      setErrorMsg("Could not copy link");
    }
  };

  return (
    <div className="container">
      <h1 className="title">Mini URL Shortener</h1>

      {/* Create Form */}
      <form className="card form" onSubmit={handleSubmit}>
        <div className="field">
          <label>Target URL *</label>
          <input
            type="url"
            placeholder="https://example.com/page"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label>Custom Slug (optional)</label>
          <input
            type="text"
            placeholder="e.g. ai-123"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>

        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create"}
        </button>

        {errorMsg && <div className="alert error">{errorMsg}</div>}
        {successMsg && <div className="alert success">{successMsg}</div>}
      </form>

      {/* Links Table */}
      <div className="card">
        <div className="table-header">
          <h2>Links</h2>
          <button className="btn" onClick={fetchLinks} disabled={loadingList}>
            {loadingList ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loadingList ? (
          <p className="muted">Loading...</p>
        ) : links.length === 0 ? (
          <p className="muted">No links yet — create one above.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Slug</th>
                  <th>Target</th>
                  <th>Clicks</th>
                  <th>Created</th>
                  <th>Copy</th>
                  <th>QR</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link._id}>
                    <td>
                      <a href={shortUrl(link.slug)} target="_blank" rel="noreferrer">
                        {link.slug}
                      </a>
                    </td>
                    <td className="truncate">
                      <a href={link.target} target="_blank" rel="noreferrer">
                        {link.target}
                      </a>
                    </td>
                    <td>{link.clicks}</td>
                    <td>{dayjs(link.createdAt).format("YYYY-MM-DD HH:mm")}</td>
                    <td>
                      <button className="btn" onClick={() => handleCopy(link.slug)}>
                        Copy
                      </button>
                    </td>
                    <td>
                      <QRCodeCanvas value={shortUrl(link.slug)} size={56} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <footer className="footer">
        <span className="muted">
          API: <code>{API}</code>
        </span>
      </footer>
    </div>
  );
}

export default App;
