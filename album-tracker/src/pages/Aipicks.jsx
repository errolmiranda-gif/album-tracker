import { useEffect, useMemo, useState } from "react";
import AlbumCard from "../components/AlbumCard.jsx";
import { useCollection } from "../context/CollectionContext.jsx";
import { searchAlbums } from "../services/itunes.js";

const EXPLORE = ["indie", "jazz", "hip hop", "electronic", "soul", "alternative"];

export default function AiPicks({ openAlbum }) {
  const { albums } = useCollection();
  const ownedIds = useMemo(() => new Set(Object.keys(albums).map(String)), [albums]);
  const artists = useMemo(
    () => [...new Set(Object.values(albums).map((album) => album.artist).filter(Boolean))],
    [albums],
  );
  const suggestions = artists.length ? artists : EXPLORE;
  const [selected, setSelected] = useState(null);
  const query = suggestions.includes(selected) ? selected : suggestions[0];
  const [response, setResponse] = useState({ query: "", results: [], error: "" });

  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    searchAlbums(query)
      .then((items) => {
        if (cancelled) return;
        const unique = new Map();
        for (const album of items) {
          if (album.collectionId && !ownedIds.has(String(album.collectionId))) {
            unique.set(album.collectionId, album);
          }
        }
        setResponse({ query, results: [...unique.values()], error: "" });
      })
      .catch((err) => {
        if (!cancelled) {
          setResponse({ query, results: [], error: err.message || "Could not load recommendations." });
        }
      });
    return () => { cancelled = true; };
  }, [query, ownedIds]);

  return (
    <section className="page">
      <h2 className="page-title">Recommendations</h2>
      <p className="notice">
        {artists.length
          ? "Explore more albums by artists in your collection."
          : "Save an album to get picks based on your collection, or explore a genre."}
      </p>
      <div className="chips" aria-label="Recommendation sources">
        {suggestions.map((item) => (
          <button
            className={`chip ${query === item ? "on" : ""}`}
            key={item}
            onClick={() => setSelected(item)}
          >
            {artists.length ? item : item.replace(/\b\w/g, (letter) => letter.toUpperCase())}
          </button>
        ))}
      </div>
      {response.query !== query && <p className="notice">Finding albums…</p>}
      {response.query === query && response.error && <p className="notice error">{response.error}</p>}
      {response.query === query && !response.error && response.results.length === 0 && (
        <p className="notice">No new albums found. Try another artist or genre.</p>
      )}
      <div className="grid">
        {(response.query === query ? response.results : []).map((album) => (
          <AlbumCard
            key={album.collectionId}
            title={album.collectionName}
            artist={album.artistName}
            art={album.artworkUrl100}
            meta={album.releaseDate?.slice(0, 4)}
            onOpen={() => openAlbum(album.collectionId)}
          />
        ))}
      </div>
    </section>
  );
}
