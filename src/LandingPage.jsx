import {
  useEffect,
  useMemo,
  useRef,
  useState,
  createContext,
  useContext,
} from "react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";

import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import TouchAppRoundedIcon from "@mui/icons-material/TouchAppRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";

/*
 * Gregg Dictionary Landing Page
 *
 * Required files inside /public:
 *
 * /icon.png
 * /onboarding-search.png
 * /onboarding-learn.png
 * /onboarding-browse.png
 * /onboarding-saved.png
 * /app-preview.mp4
 *
 * Example:
 *
 * public/
 * ├── icon.png
 * ├── onboarding-search.png
 * ├── onboarding-learn.png
 * ├── onboarding-browse.png
 * ├── onboarding-saved.png
 * └── app-preview.mp4
 */

const APP_ICON = "/icon.png";
const APP_VIDEO = "/app-preview.mp4";

// The .apk lives in /public as "Gregg Dictionary.apk" — spaces are
// URL-encoded in the href, but the visitor's downloaded file keeps
// the readable name via the `download` attribute.
//
// IMPORTANT (Vercel): a real APK is tens of MB. If your deployed download is
// only ~134 bytes, the file in Git is a Git LFS *pointer* (or was never
// committed), not the real APK. Either enable Git LFS on Vercel, or host the
// APK somewhere else (Supabase Storage public bucket, Cloudflare R2, ...) and
// set VITE_APK_URL to its public URL — no code change needed.
const APP_DOWNLOAD_URL =
  import.meta.env?.VITE_APK_URL || "/Gregg%20Dictionary.apk";
const APP_DOWNLOAD_FILENAME = "Gregg Dictionary.apk";

// Anything smaller than this is certainly not the real APK (Git LFS pointer
// files are ~130 bytes, an SPA fallback page is a few KB).
const MIN_APK_BYTES = 1024 * 1024; // 1 MB

// Free, no-signup hit counter (https://countapi.mileshilliard.com) used
// to track and display real download counts across all visitors without
// needing a backend of your own. The key just needs to be unique to this
// app — swap this whole block out if you already have your own backend
// and would rather record downloads there instead.
const DOWNLOAD_COUNTER_API = "https://countapi.mileshilliard.com/api/v1";
// Bumping the key (v1 -> v2) starts the public counter again from zero.
const DOWNLOAD_COUNTER_KEY = "gregg-shorthand-dictionary-apk-downloads-v3";

/* ---- Where do learners come from? (OpenStreetMap + Supabase) ----
 * 100% free, no credit card needed:
 *   - school search:  Photon geocoder (photon.komoot.io, OpenStreetMap data)
 *   - map:            Leaflet + OpenStreetMap tiles
 *   - storage:        Supabase free plan
 *
 * Add these two to Vercel (Project -> Settings -> Environment Variables)
 * and to a local .env file, then redeploy:
 *
 *   VITE_SUPABASE_URL          https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY     the project's public "anon" key
 */
const ENV = import.meta.env ?? {};
const SUPABASE_URL = (ENV.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = ENV.VITE_SUPABASE_ANON_KEY ?? "";

const PHOTON_API = "https://photon.komoot.io/api/";
const LEAFLET_CDN = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4";

const LOCATIONS_TABLE = "download_locations";
const LOCATIONS_SUMMARY_VIEW = "school_download_summary";

// Rough bounding box of the Philippines.
const PH_BOUNDS = { north: 21.5, south: 4.4, west: 116.0, east: 127.0 };

// Get a free access key at https://web3forms.com and paste it here.
const WEB3FORMS_ACCESS_KEY = "1f7b9bb3-d70d-49ed-908a-b1326d344706";

/* ---- Donations (PayMongo, QR Ph) ----
 * The donor picks an amount here; /api/donate (a Vercel serverless function,
 * see api/donate.js) creates a PayMongo Checkout Session with your SECRET key
 * and we redirect the donor to PayMongo's hosted checkout page, where they
 * scan a QR Ph code with any bank or e-wallet app.
 *
 * Optional fallback: set VITE_PAYMONGO_LINK to a PayMongo Payment Link
 * (dashboard -> Payment Links). It is used when /api/donate isn't available
 * (for example on plain `npm run dev`).
 */
const DONATE_API = ENV.VITE_DONATE_API || "/api/donate";
const PAYMONGO_LINK = ENV.VITE_PAYMONGO_LINK || "";
const DONATE_AMOUNTS = [50, 100, 250, 500];
const DONATE_MIN = 20; // PHP
const DONATE_MAX = 50000; // PHP

const BRAND = "#3869E8";
const BRAND_DARK = "#244FC4";
const BRAND_DEEP = "#173B9E";
const BRAND_LIGHT = "#EAF0FF";

const TEXT = "#1E3157";
const MUTED = "#7587A8";
const BORDER = "#DCE5F6";
const PAGE_BG = "#F5F8FF";

const FEATURES = [
  {
    icon: SearchRoundedIcon,
    title: "Search",
    description: "Find any word and see its Gregg shorthand stroke instantly.",
    image: "/onboarding-search.png",
    label: "Find words instantly",
  },
  {
    icon: SchoolRoundedIcon,
    title: "Learn",
    description:
      "Study Gregg shorthand step by step using lessons based on the original manual.",
    image: "/onboarding-learn.png",
    label: "Learn step by step",
  },
  {
    icon: LibraryBooksRoundedIcon,
    title: "Browse",
    description:
      "Explore the complete dictionary letter by letter across the available series.",
    image: "/onboarding-browse.png",
    label: "Explore the dictionary",
  },
  {
    icon: BookmarkRoundedIcon,
    title: "Saved",
    description:
      "Save useful words and build your own personal shorthand study list.",
    image: "/onboarding-saved.png",
    label: "Keep your favorites",
  },
];

const FAQS = [
  {
    question: "Is Gregg Dictionary free to use?",
    answer:
      "Yes. The dictionary and learning content can be browsed directly in the app.",
  },
  {
    question:
      "What's the difference between Simplified and Anniversary?",
    answer:
      "They are different editions of the Gregg shorthand system. The app keeps their word and stroke information organized separately.",
  },
  {
    question: "Can I save words to study later?",
    answer:
      "Yes. Bookmark a word and it will appear in your Saved section so you can return to it later.",
  },
  {
    question: "Does the app show the original printed pages?",
    answer:
      "Dictionary entries can be connected to the original scanned source pages used by the app.",
  },
];

/* =========================================================
   APP DOWNLOAD (context + progress bar + live counter)

   Shared across the Nav buttons and the download-section
   button so a single click drives one real download, one
   progress bar, and one shared, realtime-ish download count.
   ========================================================= */

/* =========================================================
   MAP + SUPABASE HELPERS
   ========================================================= */

const isInPhilippines = (lat, lng) =>
  lat >= PH_BOUNDS.south &&
  lat <= PH_BOUNDS.north &&
  lng >= PH_BOUNDS.west &&
  lng <= PH_BOUNDS.east;

// Loads Leaflet (free, open-source maps) from a CDN once.
let leafletPromise = null;

function loadLeaflet() {
  if (window.L?.map) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;

  const stylesheet = new Promise((resolve, reject) => {
    if (document.getElementById("leaflet-css")) {
      resolve();
      return;
    }

    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = `${LEAFLET_CDN}/leaflet.min.css`;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error("leaflet-css-failed"));
    document.head.appendChild(link);
  });

  const script = new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = `${LEAFLET_CDN}/leaflet.min.js`;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("leaflet-js-failed"));
    document.head.appendChild(el);
  });

  leafletPromise = Promise.all([stylesheet, script])
    .then(() => window.L)
    .catch((error) => {
      leafletPromise = null;
      throw error;
    });

  return leafletPromise;
}

// Only places OpenStreetMap tags as a school, college or university.
const SCHOOL_OSM_TAGS = [
  "amenity:university",
  "amenity:college",
  "amenity:school",
];
const SCHOOL_OSM_VALUES = ["university", "college", "school"];

// Photon (free, OpenStreetMap-based, built for search-as-you-type).
async function searchSchools(query, signal) {
  const params = new URLSearchParams({
    q: query,
    limit: "10",
    lang: "en",
    bbox: [
      PH_BOUNDS.west,
      PH_BOUNDS.south,
      PH_BOUNDS.east,
      PH_BOUNDS.north,
    ].join(","),
  });

  SCHOOL_OSM_TAGS.forEach((tag) => params.append("osm_tag", tag));

  const response = await fetch(`${PHOTON_API}?${params}`, { signal });

  if (!response.ok) throw new Error("search-failed");

  const data = await response.json();
  const seen = new Set();
  const results = [];

  (data.features ?? []).forEach((feature) => {
    const props = feature.properties ?? {};
    const [lng, lat] = feature.geometry?.coordinates ?? [];

    if (
      !props.name ||
      !props.osm_id ||
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      !isInPhilippines(lat, lng) ||
      !SCHOOL_OSM_VALUES.includes(props.osm_value)
    ) {
      return;
    }

    const placeId = `${props.osm_type}${props.osm_id}`;

    if (seen.has(placeId)) return;
    seen.add(placeId);

    const address = [
      ...new Set(
        [props.street, props.district, props.city || props.county, props.state]
          .filter(Boolean)
      ),
    ].join(", ");

    // Same name and same address twice = the same school listed twice.
    const lookAlikeKey = `${props.name}|${address}`.toLowerCase();

    if (seen.has(lookAlikeKey)) return;
    seen.add(lookAlikeKey);

    results.push({
      placeId,
      label: props.name,
      secondary: address || "Philippines",
      lat,
      lng,
    });
  });

  return results;
}

let warnedMissingSupabase = false;

const supabaseConfigured = () => {
  const ok = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

  if (!ok && !warnedMissingSupabase) {
    warnedMissingSupabase = true;
    console.warn(
      "[Gregg] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing, so " +
        "download locations are NOT being saved or shown on the map. " +
        "Add them to .env (restart `npm run dev`) and to Vercel, then redeploy."
    );
  }

  return ok;
};

const supabaseHeaders = () => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
});

// One row per school: { place_id, school_name, address, lat, lng, downloads }
async function fetchSchoolSummary() {
  if (!supabaseConfigured()) return [];

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${LOCATIONS_SUMMARY_VIEW}` +
      "?select=place_id,school_name,address,lat,lng,downloads" +
      "&order=downloads.desc&limit=1000",
    { headers: supabaseHeaders() }
  );

  if (!response.ok) {
    console.warn(
      "[Gregg] Couldn't load school_download_summary:",
      response.status,
      await response.text().catch(() => "")
    );
    throw new Error("summary-fetch-failed");
  }

  const rows = await response.json();

  return rows.filter(
    (row) =>
      row &&
      typeof row.lat === "number" &&
      typeof row.lng === "number" &&
      isInPhilippines(row.lat, row.lng)
  );
}

async function saveDownloadLocation(place) {
  if (!supabaseConfigured()) return false;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${LOCATIONS_TABLE}`,
    {
      method: "POST",
      headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
      body: JSON.stringify({
        place_id: place.placeId,
        school_name: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
      }),
    }
  );

  if (!response.ok) {
    console.warn(
      "[Gregg] Couldn't save the download location:",
      response.status,
      await response.text().catch(() => "")
    );
  }

  return response.ok;
}

/* =========================================================
   SCHOOL PICKER DIALOG
   Required before every download. The visitor must pick a
   real school from the suggestions (OpenStreetMap data) —
   free text alone is never accepted — and it must be located
   in the Philippines.
   ========================================================= */

/* =========================================================
   MANUAL PIN MAP (fallback when a school isn't in the search)
   Tap/click the map to drop a pin on the school; drag to adjust.
   ========================================================= */

const PH_VIEW = [
  [PH_BOUNDS.south + 0.2, PH_BOUNDS.west + 0.5],
  [PH_BOUNDS.north - 0.3, PH_BOUNDS.east - 0.2],
];

function ManualPinMap({ pin, onPin, onError }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const leafletRef = useRef(null);
  const lastGoodRef = useRef(null);
  const onPinRef = useRef(onPin);
  const onErrorRef = useRef(onError);

  const [state, setState] = useState("loading"); // loading | ready | error

  onPinRef.current = onPin;
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    let timer;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !elRef.current) return;

        const map = L.map(elRef.current, {
          minZoom: 5,
          maxZoom: 18,
          maxBounds: [
            [0, 108],
            [27, 134],
          ],
          maxBoundsViscosity: 0.8,
        });

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
        }).addTo(map);

        map.fitBounds(PH_VIEW);

        map.on("click", (event) => {
          const { lat, lng } = event.latlng;

          if (!isInPhilippines(lat, lng)) {
            onErrorRef.current("Please place the pin inside the Philippines.");
            return;
          }

          onErrorRef.current("");
          onPinRef.current({ lat, lng });
        });

        leafletRef.current = L;
        mapRef.current = map;
        setState("ready");

        // The dialog is still animating open — re-measure once it settles.
        timer = setTimeout(() => {
          map.invalidateSize();
          map.fitBounds(PH_VIEW);
        }, 350);
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      markerRef.current = null;
    };
  }, []);

  // Keep the draggable pin in sync with the chosen spot.
  useEffect(() => {
    if (state !== "ready") return;

    const L = leafletRef.current;
    const map = mapRef.current;

    if (!pin) {
      markerRef.current?.remove();
      markerRef.current = null;
      lastGoodRef.current = null;
      return;
    }

    lastGoodRef.current = pin;

    if (markerRef.current) {
      markerRef.current.setLatLng([pin.lat, pin.lng]);
      return;
    }

    const marker = L.marker([pin.lat, pin.lng], {
      draggable: true,
      icon: buildMarkerIcon(L, 1).icon,
    }).addTo(map);

    marker.on("dragend", () => {
      const { lat, lng } = marker.getLatLng();

      if (!isInPhilippines(lat, lng)) {
        onErrorRef.current("Please place the pin inside the Philippines.");

        const back = lastGoodRef.current;
        if (back) marker.setLatLng([back.lat, back.lng]);
        return;
      }

      onErrorRef.current("");
      onPinRef.current({ lat, lng });
    });

    markerRef.current = marker;
  }, [pin, state]);

  return (
    <Box
      sx={{
        position: "relative",
        height: 250,
        borderRadius: "16px",
        overflow: "hidden",
        border: `1px solid ${BORDER}`,
        bgcolor: BRAND_LIGHT,
        isolation: "isolate",
      }}
    >
      <Box ref={elRef} sx={{ position: "absolute", inset: 0 }} />

      {state === "loading" && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1000,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
          }}
        >
          <CircularProgress size={26} sx={{ color: BRAND }} />
        </Box>
      )}

      {state === "error" && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1000,
            display: "grid",
            placeItems: "center",
            p: 2,
            textAlign: "center",
          }}
        >
          <Typography sx={{ color: MUTED, fontSize: 13.5 }}>
            The map couldn&apos;t be loaded. Please try again later.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function SchoolPickerDialog({ open, onClose, onConfirm }) {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searching, setSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [error, setError] = useState("");

  // Fallback when the school isn't in the search results.
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState("");
  const [pin, setPin] = useState(null);

  const requestIdRef = useRef(0);

  // Fresh form every time the dialog opens.
  useEffect(() => {
    if (!open) return;

    setInputValue("");
    setOptions([]);
    setSelected(null);
    setNoResults(false);
    setError("");
    setManualMode(false);
    setManualName("");
    setPin(null);
  }, [open]);

  // Debounced suggestions. The delay keeps us well inside Photon's
  // fair-use limit (about one request per second).
  useEffect(() => {
    if (!open || selected) return undefined;

    const query = inputValue.trim();

    if (query.length < 3) {
      requestIdRef.current += 1;
      setOptions([]);
      setNoResults(false);
      setSearching(false);
      return undefined;
    }

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        const list = await searchSchools(query, controller.signal);

        if (requestId !== requestIdRef.current) return;

        setOptions(list);
        setNoResults(list.length === 0);
        setError("");
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (requestId !== requestIdRef.current) return;

        setOptions([]);
        setError(
          "Couldn't search for schools right now. Check your connection and try again."
        );
      } finally {
        if (requestId === requestIdRef.current) setSearching(false);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [inputValue, open, selected]);

  const handleSelect = (option) => {
    if (!option) {
      setSelected(null);
      return;
    }

    setSelected({
      placeId: option.placeId,
      name: option.label,
      address: option.secondary,
      lat: option.lat,
      lng: option.lng,
    });
    setInputValue(option.label);
    setOptions([]);
    setError("");
  };

  const handleInputChange = (_event, value, reason) => {
    // MUI echoes our own value changes back as "reset" — ignore them.
    if (reason === "reset") return;

    setInputValue(value);
    setError("");

    if (selected && value !== selected.name) setSelected(null);
  };

  const noOptionsText =
    inputValue.trim().length < 3
      ? "Type at least 3 letters of your school's name"
      : searching
        ? "Searching…"
        : noResults
          ? "No matching school found in the Philippines"
          : "Type your school's name";

  const trimmedManualName = manualName.trim();

  // A manually pinned school is grouped by its (normalised) name, so
  // several students pinning the same school land on one map marker.
  const manualPlace =
    manualMode && trimmedManualName.length >= 3 && pin
      ? {
          placeId: `manual:${trimmedManualName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 80)}`,
          name: trimmedManualName,
          address: "Pinned manually on the map",
          lat: pin.lat,
          lng: pin.lng,
        }
      : null;

  const canContinue = manualMode ? Boolean(manualPlace) : Boolean(selected);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            borderRadius: "24px",
            p: { xs: 0.5, sm: 1 },
          },
        },
      }}
    >
      <DialogContent sx={{ pb: 1 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "16px",
            bgcolor: BRAND_LIGHT,
            color: BRAND,
            display: "grid",
            placeItems: "center",
            mb: 1.75,
          }}
        >
          <SchoolRoundedIcon />
        </Box>

        <Typography
          component="h2"
          sx={{
            fontWeight: 900,
            fontSize: 22,
            letterSpacing: "-0.02em",
            color: TEXT,
            mb: 0.75,
          }}
        >
          Where do you study?
        </Typography>

        <Typography
          sx={{
            color: MUTED,
            fontSize: 14,
            lineHeight: 1.65,
            mb: 2.25,
          }}
        >
          Tell us your school or university before you download. We only
          save the school&apos;s name and location to see where learners
          come from — never your name or any personal details.
        </Typography>

        {!manualMode && (
          <>
        <Autocomplete
          options={options}
          value={
            selected
              ? {
                  placeId: selected.placeId,
                  label: selected.name,
                  secondary: selected.address,
                }
              : null
          }
          inputValue={inputValue}
          onInputChange={handleInputChange}
          onChange={(_event, option) => handleSelect(option)}
          filterOptions={(items) => items}
          getOptionLabel={(option) => option.label ?? ""}
          getOptionKey={(option) => option.placeId}
          isOptionEqualToValue={(option, value) =>
            option.placeId === value.placeId
          }
          loading={searching}
          noOptionsText={noOptionsText}
          loadingText="Searching…"
          renderOption={(props, option) => {
            // MUI's own key is the school name, and two OpenStreetMap
            // places can share a name — key on the unique place id instead.
            const { key: _unusedKey, ...rest } = props;

            return (
              <Box component="li" key={option.placeId} {...rest}>
                <PlaceRoundedIcon
                  sx={{ color: BRAND, mr: 1.25, fontSize: 20 }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{ fontWeight: 700, fontSize: 14, color: TEXT }}
                  >
                    {option.label}
                  </Typography>
                  {option.secondary && (
                    <Typography sx={{ fontSize: 12.5, color: MUTED }}>
                      {option.secondary}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          }}
          renderInput={(params) => {
            // Newer MUI versions pass the input props under slotProps.input,
            // older ones under InputProps — support both.
            const usesSlots = Boolean(params.slotProps?.input);
            const inputProps = usesSlots
              ? params.slotProps.input
              : params.InputProps ?? {};

            const endAdornment = (
              <>
                {searching && <CircularProgress color="inherit" size={18} />}
                {inputProps.endAdornment}
              </>
            );

            const adornmentProps = usesSlots
              ? {
                  slotProps: {
                    ...params.slotProps,
                    input: { ...params.slotProps.input, endAdornment },
                  },
                }
              : { InputProps: { ...params.InputProps, endAdornment } };

            return (
              <TextField
                {...params}
                autoFocus
                label="School or university"
                placeholder="e.g. University of the Philippines Diliman"
                error={Boolean(error)}
                helperText={
                  error ||
                  "Pick your school from the suggestions to continue."
                }
                {...adornmentProps}
              />
            );
          }}
        />

        {selected && (
          <Box
            sx={{
              mt: 1.75,
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
              p: 1.4,
              borderRadius: "14px",
              bgcolor: "#ECFDF3",
              border: "1px solid #BBF7D0",
            }}
          >
            <CheckCircleRoundedIcon
              sx={{ color: "#16A34A", fontSize: 20, mt: "1px" }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{ fontWeight: 800, fontSize: 13.5, color: "#166534" }}
              >
                Verified location
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: "#166534" }}>
                {selected.address}
              </Typography>
            </Box>
          </Box>
        )}
          </>
        )}

        {manualMode ? (
          <Box>
            <TextField
              fullWidth
              autoFocus
              label="School or university name"
              placeholder="e.g. Sampaguita Community College"
              value={manualName}
              onChange={(event) => setManualName(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 150 } }}
              helperText="Type the full name of your school."
            />

            <Typography
              sx={{
                mt: 2,
                mb: 1,
                fontSize: 13.5,
                fontWeight: 700,
                color: TEXT,
              }}
            >
              Tap the map where your school is
            </Typography>

            <ManualPinMap pin={pin} onPin={setPin} onError={setError} />

            {error && (
              <Typography sx={{ mt: 1, fontSize: 12.5, color: "#D32F2F" }}>
                {error}
              </Typography>
            )}

            {pin && (
              <Box
                sx={{
                  mt: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1.2,
                  borderRadius: "14px",
                  bgcolor: "#ECFDF3",
                  border: "1px solid #BBF7D0",
                }}
              >
                <CheckCircleRoundedIcon
                  sx={{ color: "#16A34A", fontSize: 20 }}
                />
                <Typography
                  sx={{ fontSize: 12.5, fontWeight: 700, color: "#166534" }}
                >
                  Pin placed — drag it to adjust.
                </Typography>
              </Box>
            )}

            <Button
              onClick={() => {
                setManualMode(false);
                setError("");
              }}
              sx={{
                mt: 1,
                px: 0,
                textTransform: "none",
                fontWeight: 700,
                color: BRAND,
              }}
            >
              ← Back to search
            </Button>
          </Box>
        ) : (
          <Button
            onClick={() => {
              setManualMode(true);
              setSelected(null);
              setError("");
            }}
            startIcon={<PlaceRoundedIcon />}
            sx={{
              mt: 1,
              px: 0,
              textTransform: "none",
              fontWeight: 700,
              color: BRAND,
            }}
          >
            Can&apos;t find your school? Pin it on the map
          </Button>
        )}

        <Typography
          sx={{ mt: 1.75, fontSize: 11, color: MUTED, textAlign: "right" }}
        >
          Search by Photon · Data © OpenStreetMap contributors
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{ color: MUTED, fontWeight: 700, textTransform: "none" }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          disableElevation
          disabled={!canContinue}
          onClick={() => onConfirm(manualMode ? manualPlace : selected)}
          startIcon={<DownloadRoundedIcon />}
          sx={{
            bgcolor: BRAND,
            fontWeight: 800,
            textTransform: "none",
            borderRadius: "12px",
            px: 2.5,
            "&:hover": { bgcolor: BRAND_DARK },
          }}
        >
          Continue to download
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const DownloadContext = createContext(null);

function useDownload() {
  return useContext(DownloadContext);
}

function DownloadProvider({ children }) {
  const [downloadCount, setDownloadCount] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [locations, setLocations] = useState([]);

  // Per-school download totals for the Philippines map. Polled so a new
  // download from any visitor shows up on the map without a refresh.
  useEffect(() => {
    let cancelled = false;

    const loadLocations = async () => {
      try {
        const rows = await fetchSchoolSummary();
        if (!cancelled) setLocations(rows);
      } catch {
        // The map is a nice-to-have — keep whatever we already have.
      }
    };

    loadLocations();
    const interval = setInterval(loadLocations, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Adds a just-recorded download to the map immediately, instead of
  // waiting for the next poll.
  const addLocalLocation = (place) => {
    setLocations((current) => {
      const existing = current.find((row) => row.place_id === place.placeId);

      if (existing) {
        return current.map((row) =>
          row.place_id === place.placeId
            ? { ...row, downloads: row.downloads + 1 }
            : row
        );
      }

      return [
        ...current,
        {
          place_id: place.placeId,
          school_name: place.name,
          address: place.address,
          lat: place.lat,
          lng: place.lng,
          downloads: 1,
        },
      ];
    });
  };

  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const response = await fetch(
          `${DOWNLOAD_COUNTER_API}/get/${DOWNLOAD_COUNTER_KEY}`
        );

        // A brand-new counter key answers 404 until the first download.
        if (response.status === 404) {
          if (!cancelled) setDownloadCount((current) => current ?? 0);
          return;
        }

        const data = await response.json();

        if (!cancelled) {
          if (typeof data.value === "number") {
            setDownloadCount(data.value);
          } else {
            // A brand-new counter key has no hits yet — that's zero.
            setDownloadCount((current) => current ?? 0);
          }
        }
      } catch (error) {
        // The counter is a nice-to-have — fail silently.
      }
    };

    fetchCount();

    // Poll every 15s so downloads from other visitors show up
    // without needing a page refresh.
    const interval = setInterval(fetchCount, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Plain browser download — used when the file lives on another domain that
  // doesn't allow fetch() (CORS). No progress bar, but it always works.
  const directDownload = () => {
    const link = document.createElement("a");
    link.href = APP_DOWNLOAD_URL;
    link.download = APP_DOWNLOAD_FILENAME;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startDownload = async (place) => {
    if (isDownloading) return;

    setIsDownloading(true);
    setProgress(0);

    try {
      let usedDirectLink = false;
      let response;

      try {
        response = await fetch(APP_DOWNLOAD_URL, { cache: "no-store" });
      } catch (networkError) {
        // Almost always CORS on a cross-origin host. Fall back to a normal
        // link download (the browser follows redirects & CORS-free).
        response = null;
      }

      if (response) {
        if (!response.ok || !response.body) {
          throw new Error("Download request failed");
        }

        // A hosting rewrite can answer with index.html instead of the file.
        const contentType = (
          response.headers.get("Content-Type") || ""
        ).toLowerCase();

        if (contentType.includes("text/html")) {
          throw new Error("Download URL returned a web page, not the APK");
        }

        const contentLength = response.headers.get("Content-Length");
        const total = contentLength ? parseInt(contentLength, 10) : 0;

        // Fail early on a Git LFS pointer / tiny placeholder file.
        if (total && total < MIN_APK_BYTES) {
          throw new Error(
            `APK is only ${total} bytes — the real file was not deployed`
          );
        }

        const reader = response.body.getReader();
        const chunks = [];
        let received = 0;

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          chunks.push(value);
          received += value.length;

          if (total) {
            setProgress(
              Math.min(99, Math.round((received / total) * 100))
            );
          } else {
            // No Content-Length header to measure against — creep
            // the bar forward so it still reads as "in progress".
            setProgress((prev) => (prev < 90 ? prev + 3 : prev));
          }
        }

        // Double-check what actually arrived (covers servers that send no
        // Content-Length, e.g. compressed or chunked responses).
        if (received < MIN_APK_BYTES) {
          throw new Error(
            `APK is only ${received} bytes — the real file was not deployed`
          );
        }

        const blob = new Blob(chunks, {
          type: "application/vnd.android.package-archive",
        });
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = APP_DOWNLOAD_FILENAME;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
      } else {
        usedDirectLink = true;
        directDownload();
      }

      setProgress(100);

      // Record which school this download came from (best effort —
      // only counted once the download actually succeeded).
      if (place) {
        saveDownloadLocation(place)
          .then((saved) => {
            if (saved) addLocalLocation(place);
          })
          .catch((error) => {
            console.warn("[Gregg] Saving the download location failed:", error);
          });
      }

      // Best-effort count increment — doesn't block success feedback.
      fetch(`${DOWNLOAD_COUNTER_API}/hit/${DOWNLOAD_COUNTER_KEY}`)
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.value === "number") {
            setDownloadCount(data.value);
          }
        })
        .catch(() => {});

      Swal.fire({
        background: "#142653",
        color: "#fff",
        confirmButtonColor: BRAND,
        icon: "success",
        title: usedDirectLink ? "Download started!" : "Download complete!",
        html: usedDirectLink
          ? '<span style="color:#22C55E; font-weight:800;">Gregg Dictionary</span> is downloading — check your browser\'s downloads'
          : '<span style="color:#22C55E; font-weight:800;">Gregg Dictionary</span> was downloaded successfully',
        confirmButtonText: "Great",
      });
    } catch (error) {
      console.error("[Gregg] APK download failed:", error);

      Swal.fire({
        background: "#142653",
        color: "#fff",
        confirmButtonColor: BRAND,
        icon: "error",
        title: "Download failed",
        text: "Something went wrong while downloading the app. Please try again.",
        confirmButtonText: "Okay",
      });
    } finally {
      setIsDownloading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  // Every download button calls this: ask for the school first.
  const triggerDownload = () => {
    if (isDownloading) return;
    setPickerOpen(true);
  };

  const handleSchoolConfirmed = (place) => {
    setPickerOpen(false);
    startDownload(place);
  };

  return (
    <DownloadContext.Provider
      value={{
        downloadCount,
        isDownloading,
        progress,
        triggerDownload,
        locations,
      }}
    >
      {children}

      <SchoolPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={handleSchoolConfirmed}
      />
    </DownloadContext.Provider>
  );
}

function DownloadProgressBar() {
  const { isDownloading, progress } = useDownload();

  if (!isDownloading) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,

        height: 3,

        zIndex: 2000,

        bgcolor: "rgba(56,105,232,.15)",
      }}
    >
      <Box
        sx={{
          height: "100%",
          width: `${progress}%`,

          bgcolor: BRAND,

          transition: "width .25s ease",

          boxShadow: "0 0 10px rgba(56,105,232,.65)",
        }}
      />
    </Box>
  );
}

function DownloadCounter() {
  const { downloadCount } = useDownload();

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1.1,

        pl: 0.6,
        pr: 1.75,
        py: 0.6,

        borderRadius: "999px",

        bgcolor: "rgba(255,255,255,.07)",

        border: "1px solid rgba(255,255,255,.14)",

        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",

        boxShadow: "0 10px 26px rgba(0,0,0,.28)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          width: 32,
          height: 32,
          flexShrink: 0,

          borderRadius: "50%",

          background:
            "linear-gradient(135deg, rgba(94,138,255,.5), rgba(56,105,232,.25))",
        }}
      >
        <PhoneIphoneRoundedIcon
          sx={{ fontSize: 16, color: "#CFDCFF" }}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          gap: 0.5,

          whiteSpace: "nowrap",
        }}
      >
        <Typography
          sx={{
            color: "#fff",
            fontWeight: 850,
            fontSize: 14.5,
            letterSpacing: "-0.01em",
          }}
        >
          {downloadCount === null
            ? "—"
            : downloadCount.toLocaleString()}
        </Typography>

        <Typography
          sx={{
            color: "rgba(255,255,255,.55)",
            fontSize: 11.5,
            fontWeight: 650,
            letterSpacing: "0.01em",
          }}
        >
          downloads and counting
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.6,

          ml: 0.5,
          pl: 1.35,

          borderLeft: "1px solid rgba(255,255,255,.14)",
        }}
      >
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",

            bgcolor: "#22C55E",

            animation: "greggDownloadPulse 1.8s infinite",

            "@keyframes greggDownloadPulse": {
              "0%": {
                boxShadow: "0 0 0 0 rgba(34,197,94,.6)",
              },
              "70%": {
                boxShadow: "0 0 0 8px rgba(34,197,94,0)",
              },
              "100%": {
                boxShadow: "0 0 0 0 rgba(34,197,94,0)",
              },
            },
          }}
        />

        <Typography
          sx={{
            color: "#8FE3A6",
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: "0.06em",
          }}
        >
          LIVE
        </Typography>
      </Box>
    </Box>
  );
}

export default function LandingPage() {
  return (
    <DownloadProvider>
      <DownloadProgressBar />

      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: PAGE_BG,
          color: TEXT,
          overflowX: "hidden",
        }}
      >
        <Nav />

        <main>
          <Hero />
          <Mission />
          <Features />
          <LearnSection />
          <Faq />
          <LearnersMapSection />
          <DownloadSection />
          <DonateSection />
        </main>

        <Footer />
      </Box>
    </DownloadProvider>
  );
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { triggerDownload, isDownloading } = useDownload();

  const navItems = [
    {
      label: "Home",
      id: "home",
      icon: <HomeRoundedIcon sx={{ fontSize: 19 }} />,
    },
    {
      label: "Features",
      id: "features",
      icon: <AutoStoriesRoundedIcon sx={{ fontSize: 19 }} />,
    },
    {
      label: "Learn",
      id: "learn",
      icon: <SchoolRoundedIcon sx={{ fontSize: 19 }} />,
    },
    {
      label: "FAQ",
      id: "faq",
      icon: <HelpOutlineRoundedIcon sx={{ fontSize: 19 }} />,
    },
    {
      label: "Donate",
      id: "donate",
      icon: <FavoriteRoundedIcon sx={{ fontSize: 19 }} />,
    },
  ];

  const scrollTo = (id) => {
    const target = document.getElementById(id);

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    setMobileOpen(false);
  };

  return (
    <Box
      component="header"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1200,

        px: {
          xs: 1.25,
          sm: 2,
          md: 3,
        },

        pt: {
          xs: 1,
          sm: 1.25,
          md: 1.5,
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1180,
          mx: "auto",

          minHeight: {
            xs: 62,
            md: 70,
          },

          px: {
            xs: 1.25,
            sm: 1.75,
            md: 2,
            lg: 2.5,
          },

          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",

          bgcolor: "rgba(255,255,255,0.94)",

          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",

          border:
            "1px solid rgba(255,255,255,0.95)",

          borderRadius: {
            xs: "18px",
            md: "21px",
          },

          boxShadow:
            "0 12px 38px rgba(36,70,135,0.13)",
        }}
      >
        {/* LOGO */}

        <Box
          onClick={() => scrollTo("home")}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: {
              xs: 0.8,
              sm: 1,
            },

            cursor: "pointer",
            minWidth: 0,
          }}
        >
          <Box
            component="img"
            src={APP_ICON}
            alt="Gregg Dictionary"
            sx={{
              width: {
                xs: 39,
                sm: 43,
                md: 47,
              },

              height: {
                xs: 39,
                sm: 43,
                md: 47,
              },

              objectFit: "contain",
              flexShrink: 0,
            }}
          />

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 850,

                fontSize: {
                  xs: 14,
                  sm: 16,
                  md: 18,
                },

                letterSpacing: "-0.025em",

                lineHeight: 1.1,

                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Gregg Dictionary
            </Typography>

            <Typography
              sx={{
                display: {
                  xs: "none",
                  sm: "block",
                },

                color: MUTED,

                fontSize: {
                  sm: 9,
                  md: 10,
                },

                fontWeight: 700,

                letterSpacing: "0.03em",
              }}
            >
              AN OFFICE ADMINISTRATION DICTIONARY
            </Typography>
          </Box>
        </Box>

        {/* DESKTOP NAVIGATION
            Hidden below lg.
            Visible on laptop, desktop and wide screens.
        */}

        <Box
          sx={{
            display: {
              xs: "none",
              lg: "flex",
            },

            alignItems: "center",
            gap: 0.25,
          }}
        >
          {navItems.map((item) => (
            <Button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              startIcon={item.icon}
              sx={{
                color: MUTED,

                textTransform: "none",

                fontWeight: 750,

                fontSize: 13.5,

                borderRadius: "12px",

                px: 1.4,
                py: 1.1,

                minWidth: "auto",

                "& .MuiButton-startIcon": {
                  color: BRAND,
                  marginRight: 0.55,
                },

                "&:hover": {
                  bgcolor: BRAND_LIGHT,
                  color: BRAND,
                },
              }}
            >
              {item.label}
            </Button>
          ))}

          <Button
            onClick={triggerDownload}
            disabled={isDownloading}
            variant="contained"
            disableElevation
            startIcon={
              <DownloadRoundedIcon
                sx={{ fontSize: 18 }}
              />
            }
            sx={{
              ml: 1,

              bgcolor: BRAND,

              color: "#fff",

              textTransform: "none",

              fontWeight: 800,

              fontSize: 13.5,

              borderRadius: "13px",

              px: 2,

              py: 1.15,

              boxShadow:
                "0 8px 20px rgba(56,105,232,.22)",

              "&:hover": {
                bgcolor: BRAND_DARK,
                boxShadow:
                  "0 10px 24px rgba(56,105,232,.28)",
              },

              "&.Mui-disabled": {
                bgcolor: "rgba(56,105,232,.55)",
                color: "rgba(255,255,255,.85)",
              },
            }}
          >
            {isDownloading ? "Downloading…" : "Get the app"}
          </Button>
        </Box>

        {/* MOBILE / SMALL TABLET MENU */}

        <IconButton
          aria-label={
            mobileOpen
              ? "Close navigation"
              : "Open navigation"
          }
          onClick={() => setMobileOpen((v) => !v)}
          sx={{
            display: {
              xs: "flex",
              lg: "none",
            },

            width: 43,
            height: 43,

            borderRadius: "13px",

            color: BRAND,

            bgcolor: BRAND_LIGHT,

            "&:hover": {
              bgcolor: "#DCE7FF",
            },
          }}
        >
          {mobileOpen ? (
            <CloseRoundedIcon />
          ) : (
            <MenuRoundedIcon />
          )}
        </IconButton>
      </Box>

      {/* MOBILE MENU */}

      {mobileOpen && (
        <Box
          sx={{
            display: {
              xs: "block",
              lg: "none",
            },

            width: "100%",
            maxWidth: 1180,

            mx: "auto",

            mt: 1,

            p: 1,

            bgcolor: "rgba(255,255,255,.98)",

            backdropFilter: "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",

            border:
              "1px solid rgba(255,255,255,.95)",

            borderRadius: "18px",

            boxShadow:
              "0 18px 45px rgba(36,70,135,.16)",
          }}
        >
          {navItems.map((item) => (
            <Button
              key={item.id}
              fullWidth
              startIcon={item.icon}
              onClick={() => scrollTo(item.id)}
              sx={{
                justifyContent: "flex-start",

                textTransform: "none",

                color: TEXT,

                fontWeight: 750,

                borderRadius: "12px",

                py: 1.35,

                px: 1.5,

                "& .MuiButton-startIcon": {
                  color: BRAND,
                },

                "&:hover": {
                  bgcolor: BRAND_LIGHT,
                  color: BRAND,
                },
              }}
            >
              {item.label}
            </Button>
          ))}

          <Button
            fullWidth
            disabled={isDownloading}
            variant="contained"
            disableElevation
            startIcon={<DownloadRoundedIcon />}
            onClick={() => {
              triggerDownload();
              setMobileOpen(false);
            }}
            sx={{
              mt: 0.5,

              bgcolor: BRAND,

              textTransform: "none",

              fontWeight: 800,

              borderRadius: "12px",

              py: 1.35,

              "&:hover": {
                bgcolor: BRAND_DARK,
              },

              "&.Mui-disabled": {
                bgcolor: "rgba(56,105,232,.55)",
                color: "rgba(255,255,255,.85)",
              },
            }}
          >
            {isDownloading ? "Downloading…" : "Get the app"}
          </Button>
        </Box>
      )}
    </Box>
  );
}

/* =========================================================
   HERO
   ========================================================= */

function Hero() {
  return (
    <Box
      id="home"
      sx={{
        position: "relative",

        bgcolor: "#0B1130",

        pt: {
          xs: 13,
          sm: 14,
          md: 15,
        },

        pb: {
          xs: 6,
          sm: 8,
          md: 10,
        },

        overflow: "hidden",

        scrollMarginTop: 100,
      }}
    >
      {/* BACKGROUND GLOW ORBS */}

      <Box
        sx={{
          position: "absolute",

          width: {
            xs: 340,
            md: 620,
          },

          height: {
            xs: 340,
            md: 620,
          },

          borderRadius: "50%",

          background:
            "radial-gradient(circle at 35% 30%, rgba(94,138,255,0.55) 0%, rgba(36,79,196,0.18) 55%, transparent 75%)",

          top: {
            xs: -120,
            md: -160,
          },

          right: {
            xs: -160,
            md: -180,
          },

          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",

          width: {
            xs: 240,
            md: 420,
          },

          height: {
            xs: 240,
            md: 420,
          },

          borderRadius: "50%",

          border: "1px solid rgba(150,180,255,0.18)",

          top: {
            xs: 20,
            md: 40,
          },

          right: {
            xs: -60,
            md: -40,
          },

          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",

          width: {
            xs: 160,
            md: 260,
          },

          height: {
            xs: 160,
            md: 260,
          },

          borderRadius: "50%",

          bgcolor: "rgba(20,30,70,0.5)",

          filter: "blur(40px)",

          bottom: {
            xs: -60,
            md: -80,
          },

          left: {
            xs: -60,
            md: -40,
          },

          pointerEvents: "none",
        }}
      />

      <Box
        component="svg"
        viewBox="0 0 400 200"
        sx={{
          position: "absolute",

          width: { xs: 260, md: 380 },
          height: "auto",

          bottom: { xs: -30, md: -20 },
          left: { xs: -40, md: -20 },

          opacity: 0.25,

          pointerEvents: "none",
        }}
      >
        <path
          d="M0 150 C 80 120, 160 180, 400 90"
          fill="none"
          stroke="rgba(120,150,255,0.5)"
          strokeWidth="1"
        />
        <path
          d="M0 175 C 90 150, 170 200, 400 115"
          fill="none"
          stroke="rgba(120,150,255,0.35)"
          strokeWidth="1"
        />
      </Box>

      <Box
        sx={{
          width: "100%",
          maxWidth: 1180,
          mx: "auto",

          px: {
            xs: 2,
            sm: 3,
            md: 4,
          },

          position: "relative",
          zIndex: 1,

          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            md: "1fr 1fr",
          },

          alignItems: "center",

          gap: {
            xs: 5,
            md: 7,
          },
        }}
      >
        {/* HERO COPY */}

        <Box>
          <Chip
            icon={
              <MenuBookOutlinedIcon
                sx={{ fontSize: 17 }}
              />
            }
            label="Gregg Shorthand Dictionary"
            sx={{
              bgcolor: BRAND_LIGHT,
              color: BRAND_DARK,

              fontWeight: 800,

              borderRadius: "10px",

              mb: 2.25,

              "& .MuiChip-icon": {
                color: BRAND,
              },
            }}
          />

          <Typography
            component="h1"
            sx={{
              fontWeight: 900,

              letterSpacing: "-0.045em",

              fontSize: {
                xs: 39,
                sm: 48,
                md: 56,
                lg: 64,
              },

              lineHeight: {
                xs: 1.08,
                md: 1.04,
              },

              color: "#fff",

              maxWidth: 650,

              mb: 2.5,
            }}
          >
            Learn Gregg shorthand,
            <Box
              component="span"
              sx={{
                display: "block",
                color: BRAND,
              }}
            >
              one word at a time.
            </Box>
          </Typography>

          <Typography
            sx={{
              color: MUTED,

              fontSize: {
                xs: 16,
                md: 18,
              },

              lineHeight: 1.7,

              maxWidth: 540,

              mb: 3.25,
            }}
          >
            Search, browse, learn, and save Gregg
            shorthand across Simplified and Anniversary
            editions — all in one modern dictionary app.
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="contained"
              disableElevation
              size="large"
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              endIcon={
                <ArrowForwardRoundedIcon />
              }
              sx={{
                bgcolor: BRAND,

                textTransform: "none",

                fontWeight: 850,

                borderRadius: "14px",

                px: 2.7,
                py: 1.5,

                boxShadow:
                  "0 10px 24px rgba(56,105,232,.24)",

                "&:hover": {
                  bgcolor: BRAND_DARK,

                  transform: "translateY(-2px)",

                  boxShadow:
                    "0 14px 28px rgba(56,105,232,.3)",
                },

                transition:
                  "all .25s ease",
              }}
            >
              Explore the app
            </Button>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 1,

                borderRadius: "12px",

                bgcolor: "#fff",

                border:
                  `1px solid ${BORDER}`,
              }}
            >
              <CheckCircleRoundedIcon
                sx={{
                  color: BRAND,
                  fontSize: 19,
                }}
              />

              <Typography
                sx={{
                  fontWeight: 750,
                  color: MUTED,
                  fontSize: 13,
                }}
              >
                Simplified + Anniversary
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 3 }}>
            <DownloadCounter />
          </Box>
        </Box>

        {/* HERO VIDEO */}

        <HeroVideo />
      </Box>
    </Box>
  );
}

function HeroVideo() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const playVideo = () => {
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Browser blocked autoplay; muted autoplay will be retried on load/canplay.
        });
      }
    };

    video.addEventListener("loadedmetadata", playVideo);
    video.addEventListener("canplay", playVideo);
    playVideo();

    return () => {
      video.removeEventListener("loadedmetadata", playVideo);
      video.removeEventListener("canplay", playVideo);
    };
  }, []);

  return (
    <Box
      sx={{
        position: "relative",

        width: "100%",

        maxWidth: {
          xs: 430,
          md: 560,
        },

        mx: {
          xs: "auto",
          md: 0,
        },

        justifySelf: {
          xs: "center",
          md: "end",
        },
      }}
    >
      {/* Decorative glow */}

      <Box
        sx={{
          position: "absolute",

          inset: {
            xs: 15,
            md: 25,
          },

          bgcolor: BRAND,

          borderRadius: "38px",

          filter: "blur(45px)",

          opacity: 0.22,

          transform: "translateY(15px)",

          zIndex: 0,
        }}
      />

      {/* APP PREVIEW LABEL */}

      <Box
        sx={{
          position: "absolute",

          zIndex: 2,

          top: {
            xs: 8,
            sm: 12,
            md: 18,
          },

          left: "50%",
          top: "-5%",
          transform: "translateX(-50%)",

          display: "flex",
          alignItems: "center",
          gap: 0.75,

          px: 1.2,
          py: 0.75,

          borderRadius: "10px",

          bgcolor: "rgba(8,25,72,.72)",

          backdropFilter: "blur(10px)",

          color: "#fff",
        }}
      >
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: "#61E294",
          }}
        />

        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: ".03em",
          }}
        >
          APP PREVIEW
        </Typography>
      </Box>

      {/* SLIDESHOW FRAME */}

      <Box
        sx={{
          position: "relative",

          zIndex: 1,

          width: "fit-content",

          mx: "auto",

          p: {
            xs: 1.1,
            sm: 1.1,
            md: 1.1,
          },

          borderRadius: {
            xs: "29px",
            md: "36px",
          },

          background:
            "linear-gradient(145deg, #4C7BF0 0%, #244FC4 100%)",

          boxShadow:
            "0 28px 65px rgba(32,67,145,.25)",
        }}
      >
        <Box
          sx={{
            position: "relative",

            bgcolor: "#071B52",

            borderRadius: {
              xs: "23px",
              md: "29px",
            },

            overflow: "hidden",

            height: {
              xs: 400,
              sm: 440,
              md: 500,
            },

            aspectRatio: "9 / 20",

            p: {
              xs: 1.75,
              sm: 2.1,
              md: 2.5,
            },
          }}
        >
          <Box
            component="video"
            ref={videoRef}
            src={APP_VIDEO}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-label="Gregg Dictionary app preview"
            sx={{
              position: "absolute",
              inset: 0,

              width: "100%",
              height: "100%",

              objectFit: "contain",
              objectPosition: "top center",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

/* =========================================================
   MISSION
   ========================================================= */

function Mission() {
  return (
    <Box
      sx={{
        position: "relative",

        py: {
          xs: 7,
          md: 10,
        },

        textAlign: "center",

        scrollMarginTop: 100,
      }}
    >
      <Chip
        icon={
          <TouchAppRoundedIcon
            sx={{ fontSize: 17 }}
          />
        }
        label="Simple by design"
        sx={{
          bgcolor: "#fff",

          color: BRAND,

          fontWeight: 800,

          border:
            `1px solid ${BORDER}`,

          mb: 2,
        }}
      />

      <Typography
        component="h2"
        sx={{
          fontWeight: 900,

          letterSpacing: "-0.035em",

          fontSize: {
            xs: 30,
            sm: 36,
            md: 44,
          },

          lineHeight: 1.15,

          color: TEXT,

          mb: 1.7,
        }}
      >
        Everything you need to
        <Box
          component="span"
          sx={{
            color: BRAND,
            ml: { sm: 1 },
          }}
        >
          learn shorthand.
        </Box>
      </Typography>

      <Typography
        sx={{
          color: MUTED,

          maxWidth: 630,

          mx: "auto",

          fontSize: {
            xs: 15,
            md: 17,
          },

          lineHeight: 1.75,
        }}
      >
        Real strokes, useful definitions, original
        learning material, and a focused study
        experience — without the clutter of a printed
        manual.
      </Typography>
    </Box>
  );
}

/* =========================================================
   FEATURES / ONBOARDING IMAGES
   ========================================================= */

function Features() {
  return (
    <Box
      id="features"
      sx={{
        scrollMarginTop: 100,

        pb: {
          xs: 8,
          md: 11,
        },
      }}
    >
      <Box
        sx={{
          textAlign: "center",
          mb: 4.5,
        }}
      >
        <Typography
          sx={{
            color: BRAND,

            fontSize: 12,

            fontWeight: 900,

            letterSpacing: ".12em",

            textTransform: "uppercase",

            mb: 1,
          }}
        >
          SEE WHAT MAKES IT USEFUL
        </Typography>

        <Typography
          component="h2"
          sx={{
            color: TEXT,

            fontWeight: 900,

            letterSpacing: "-0.035em",

            fontSize: {
              xs: 29,
              sm: 36,
              md: 42,
            },
          }}
        >
          Four tools. One complete
          <Box
            component="span"
            sx={{ color: BRAND, ml: 1 }}
          >
            study experience.
          </Box>
        </Typography>
      </Box>

      <Box
        sx={{
          width: "100%",
          maxWidth: 1180,

          mx: "auto",

          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
          },

          gap: {
            xs: 3,
            md: 4,
          },
        }}
      >
        {FEATURES.map((feature, index) => (
          <FeatureCard
            key={feature.title}
            feature={feature}
            index={index}
          />
        ))}
      </Box>
    </Box>
  );
}

function FeatureCard({ feature, index }) {
  const Icon = feature.icon;

  const isBlue = index === 1;

  return (
    <Box
      sx={{
        position: "relative",

        overflow: "hidden",

        borderRadius: {
          xs: "26px",
          md: "30px",
        },

        border:
          `1px solid ${isBlue ? "transparent" : BORDER}`,

        bgcolor: isBlue ? BRAND : "#fff",

        boxShadow:
          isBlue
            ? "0 20px 45px rgba(56,105,232,.2)"
            : "0 14px 35px rgba(42,71,130,.07)",

        transition:
          "transform .3s ease, box-shadow .3s ease",

        "&:hover": {
          transform: "translateY(-7px)",

          boxShadow:
            isBlue
              ? "0 28px 55px rgba(56,105,232,.26)"
              : "0 22px 45px rgba(42,71,130,.13)",
        },
      }}
    >
      {/* CARD TEXT */}

      <Box
        sx={{
          position: "relative",
          zIndex: 2,

          p: {
            xs: 2.5,
            sm: 3,
            md: 3.25,
          },

          pb: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 45,
              height: 45,

              flexShrink: 0,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              borderRadius: "14px",

              bgcolor: isBlue
                ? "rgba(255,255,255,.16)"
                : BRAND_LIGHT,

              color: isBlue
                ? "#fff"
                : BRAND,
            }}
          >
            <Icon sx={{ fontSize: 24 }} />
          </Box>

          <Box>
            <Typography
              sx={{
                color: isBlue
                  ? "#fff"
                  : TEXT,

                fontSize: 12,

                fontWeight: 850,

                letterSpacing: ".07em",

                textTransform: "uppercase",

                opacity: isBlue ? 0.75 : 0.6,

                mb: 0.2,
              }}
            >
              {feature.label}
            </Typography>

            <Typography
              component="h3"
              sx={{
                color: isBlue
                  ? "#fff"
                  : TEXT,

                fontWeight: 900,

                fontSize: 24,

                lineHeight: 1.15,
              }}
            >
              {feature.title}
            </Typography>
          </Box>
        </Box>

        <Typography
          sx={{
            color: isBlue
              ? "rgba(255,255,255,.78)"
              : MUTED,

            fontSize: 14,

            lineHeight: 1.65,

            mt: 1.5,

            maxWidth: 450,
          }}
        >
          {feature.description}
        </Typography>
      </Box>

      {/* SCREENSHOT AREA */}

      <Box
        sx={{
          position: "relative",

          mx: {
            xs: 1.5,
            sm: 2,
            md: 2.5,
          },

          mt: 1,

          px: {
            xs: 1.5,
            sm: 2,
            md: 2.5,
          },

          pt: {
            xs: 2,
            md: 2.5,
          },

          pb: 0,

          display: "flex",

          justifyContent: "center",

          alignItems: "flex-end",

          borderRadius:
            "24px 24px 0 0",

          bgcolor: isBlue
            ? "rgba(255,255,255,.11)"
            : "#F0F4FC",

          border:
            isBlue
              ? "1px solid rgba(255,255,255,.12)"
              : `1px solid ${BORDER}`,

          borderBottom: 0,

          overflow: "hidden",

          /*
           * NO FIXED HEIGHT.
           *
           * The image itself determines the height.
           * This prevents portrait screenshots from
           * being stretched or cropped.
           */
        }}
      >
        <Box
          component="img"
          src={feature.image}
          alt={`${feature.title} screen in Gregg Dictionary`}
          loading="lazy"
          sx={{
            display: "block",

            /*
             * KEEP ORIGINAL IMAGE RATIO.
             */
            width: "100%",
            height: "auto",

            maxWidth: {
              xs: "100%",
              sm: "92%",
              md: "88%",
            },

            objectFit: "contain",

            objectPosition: "bottom center",

            borderRadius:
              "18px 18px 0 0",

            bgcolor: "#EEF3FC",

            boxShadow:
              "0 14px 35px rgba(31,55,105,.16)",

            /*
             * No transform scaling that can distort
             * the actual screenshot.
             */
          }}
        />
      </Box>
    </Box>
  );
}

/* =========================================================
   LEARN SECTION
   ========================================================= */

function LearnSection() {
  return (
    <Box
      id="learn"
      sx={{
        scrollMarginTop: 100,

        pb: {
          xs: 8,
          md: 11,
        },
      }}
    >
      <Box
        sx={{
          width: "100%",

          borderRadius: {
            xs: "26px",
            md: "34px",
          },

          overflow: "hidden",

          background:
            "linear-gradient(135deg, #EEF3FF 0%, #E3ECFF 100%)",

          border:
            `1px solid ${BORDER}`,

          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            md: "1fr 1fr",
          },

          alignItems: "center",

          gap: {
            xs: 4,
            md: 6,
          },

          p: {
            xs: 3,
            sm: 4,
            md: 6,
          },
        }}
      >
        <Box>
          <Chip
            icon={
              <SchoolRoundedIcon
                sx={{ fontSize: 17 }}
              />
            }
            label="Learn Gregg"
            sx={{
              bgcolor: "#fff",

              color: BRAND,

              fontWeight: 850,

              mb: 2,
            }}
          />

          <Typography
            component="h2"
            sx={{
              color: TEXT,

              fontWeight: 900,

              letterSpacing: "-0.035em",

              fontSize: {
                xs: 30,
                md: 42,
              },

              lineHeight: 1.12,

              mb: 1.75,
            }}
          >
            Start with the basics.
            <Box
              component="span"
              sx={{
                display: "block",
                color: BRAND,
              }}
            >
              Build from there.
            </Box>
          </Typography>

          <Typography
            sx={{
              color: MUTED,

              lineHeight: 1.75,

              fontSize: 15,

              maxWidth: 500,

              mb: 2.5,
            }}
          >
            Follow a structured learning path through
            the history, alphabet, and lessons of Gregg
            shorthand.
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.1,
            }}
          >
            {[
              "History and introduction",
              "The Gregg alphabet",
              "Step-by-step lessons",
              "Original learning material",
              "Simplified and Anniversary version dictionary",
            ].map((item) => (
              <Box
                key={item}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,

                  color: TEXT,

                  fontWeight: 700,

                  fontSize: 13.5,
                }}
              >
                <CheckCircleRoundedIcon
                  sx={{
                    color: BRAND,
                    fontSize: 19,
                  }}
                />

                {item}
              </Box>
            ))}
          </Box>
        </Box>

        {/* LEARNING VISUAL */}

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 420,

              p: {
                xs: 2,
                md: 2.5,
              },

              borderRadius: "28px",

              bgcolor: "#fff",

              boxShadow:
                "0 20px 45px rgba(39,68,135,.12)",
            }}
          >
            <Box
              sx={{
                borderRadius: "21px",

                bgcolor: "#F4F7FD",

                border:
                  `1px solid ${BORDER}`,

                p: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,

                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    borderRadius: "13px",

                    bgcolor: BRAND_LIGHT,

                    color: BRAND,
                  }}
                >
                  <SchoolRoundedIcon />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontWeight: 850,
                      fontSize: 15,
                    }}
                  >
                    Learn Gregg
                  </Typography>

                  <Typography
                    sx={{
                      color: MUTED,
                      fontSize: 11,
                    }}
                  >
                    Structured lessons
                  </Typography>
                </Box>
              </Box>

              {[
                "About Gregg Shorthand",
                "A Talk with the Beginner",
                "The Alphabet",
                "First Lesson",
                "Second Lesson",
                "And many more...",
              ].map((lesson, index) => (
                <Box
                  key={lesson}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,

                    py: 1.25,

                    borderTop:
                      index === 0
                        ? "none"
                        : `1px solid ${BORDER}`,
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,

                      borderRadius: "9px",

                      bgcolor:
                        index === 0
                          ? BRAND
                          : BRAND_LIGHT,

                      color:
                        index === 0
                          ? "#fff"
                          : BRAND,

                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",

                      fontSize: 11,

                      fontWeight: 850,
                    }}
                  >
                    {index + 1}
                  </Box>

                  <Typography
                    sx={{
                      fontSize: 12.5,

                      fontWeight:
                        index === 0
                          ? 800
                          : 650,

                      color: TEXT,
                    }}
                  >
                    {lesson}
                  </Typography>

                  <ArrowForwardRoundedIcon
                    sx={{
                      ml: "auto",
                      color: MUTED,
                      fontSize: 17,
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* =========================================================
   FAQ
   ========================================================= */

function Faq() {
  return (
    <Box
      id="faq"
      sx={{
        pb: {
          xs: 8,
          md: 10,
        },

        scrollMarginTop: 100,
      }}
    >
      <Box
        sx={{
          textAlign: "center",
          mb: 4,
        }}
      >
        <Chip
          icon={
            <HelpOutlineRoundedIcon
              sx={{ fontSize: 17 }}
            />
          }
          label="FAQs"
          sx={{
            bgcolor: "#fff",

            color: BRAND,

            fontWeight: 850,

            border:
              `1px solid ${BORDER}`,

            mb: 1.75,
          }}
        />

        <Typography
          component="h2"
          sx={{
            fontWeight: 900,

            color: TEXT,

            letterSpacing: "-0.035em",

            fontSize: {
              xs: 30,
              md: 40,
            },
          }}
        >
          Frequently asked questions
        </Typography>
      </Box>

      <Box
        sx={{
          width: "100%",
          maxWidth: 800,
          mx: "auto",
        }}
      >
        {FAQS.map(
          ({ question, answer }) => (
            <Accordion
              key={question}
              disableGutters
              elevation={0}
              sx={{
                bgcolor: "#fff",

                border:
                  `1px solid ${BORDER}`,

                borderRadius:
                  "16px !important",

                mb: 1.2,

                overflow: "hidden",

                "&:before": {
                  display: "none",
                },

                "&.Mui-expanded": {
                  marginBottom: 1.2,
                },
              }}
            >
              <AccordionSummary
                expandIcon={
                  <ExpandMoreRoundedIcon
                    sx={{ color: BRAND }}
                  />
                }
                sx={{
                  minHeight: 62,

                  px: {
                    xs: 2,
                    sm: 2.5,
                  },

                  "&.Mui-expanded": {
                    minHeight: 62,
                  },

                  "& .MuiAccordionSummary-content":
                    {
                      my: 1.5,
                    },

                  "& .MuiAccordionSummary-content.Mui-expanded":
                    {
                      my: 1.5,
                    },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 800,

                    color: TEXT,

                    fontSize: 14,
                  }}
                >
                  {question}
                </Typography>
              </AccordionSummary>

              <AccordionDetails
                sx={{
                  px: {
                    xs: 2,
                    sm: 2.5,
                  },

                  pt: 0,

                  pb: 2.25,
                }}
              >
                <Typography
                  sx={{
                    color: MUTED,

                    lineHeight: 1.7,

                    fontSize: 14,
                  }}
                >
                  {answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          )
        )}
      </Box>
    </Box>
  );
}

/* =========================================================
   DOWNLOAD CTA
   ========================================================= */

/* =========================================================
   WHERE LEARNERS COME FROM — Philippines map (Leaflet + OSM)
   One pin per school; pins appear automatically as new
   downloads are recorded.
   ========================================================= */

function buildMarkerContent(count) {
  // Small, unobtrusive dots: ~18px for one download, growing gently to 26px.
  const size = Math.round(Math.min(26, 15 + Math.sqrt(count) * 2.5));
  const el = document.createElement("div");

  Object.assign(el.style, {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    background: BRAND,
    border: "2px solid #fff",
    boxShadow: "0 2px 8px rgba(36,79,196,.4)",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontSize: "10px",
    lineHeight: "1",
    fontWeight: "800",
    cursor: "pointer",
    boxSizing: "border-box",
  });

  el.textContent = count > 1 ? String(count) : "";

  return { el, size };
}

function buildMarkerIcon(L, count) {
  const { el, size } = buildMarkerContent(count);

  return {
    el,
    icon: L.divIcon({
      html: el,
      className: "gregg-school-pin",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    }),
  };
}

function buildInfoContent(loc) {
  const wrap = document.createElement("div");
  wrap.style.maxWidth = "220px";
  wrap.style.color = TEXT;

  // textContent (not innerHTML) — school names are user-submitted data.
  const name = document.createElement("div");
  name.style.fontWeight = "800";
  name.textContent = loc.school_name;

  const address = document.createElement("div");
  address.style.fontSize = "12px";
  address.style.color = MUTED;
  address.textContent = loc.address || "";

  const count = document.createElement("div");
  count.style.marginTop = "4px";
  count.style.fontSize = "12.5px";
  count.style.fontWeight = "700";
  count.style.color = BRAND;
  count.textContent = `${loc.downloads} download${
    loc.downloads === 1 ? "" : "s"
  }`;

  wrap.append(name, address, count);

  return wrap;
}

/* ---- Island group (estimated from a pin's coordinates) ---- */

const ISLAND_GROUPS = [
  { key: "Luzon", color: BRAND_DEEP },
  { key: "Visayas", color: BRAND },
  { key: "Mindanao", color: "#8FAEFF" },
];

function getIslandGroup(lat, lng) {
  // Palawan, Mindoro, Romblon and everything north of Bicol -> Luzon group.
  if (lat >= 12.6 || lng < 119 || (lat >= 12 && lng < 122.4)) return "Luzon";

  // Southern Philippines -> Mindanao group (incl. Camiguin, Surigao, Dinagat).
  if (
    lat < 9 ||
    (lat < 9.3 && lng >= 124) ||
    (lat < 10.3 && lng >= 124.9)
  ) {
    return "Mindanao";
  }

  return "Visayas";
}

function shortPlace(address) {
  return (address || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(-2)
    .join(", ");
}

// Smoothly counts a number up/down when the data changes.
function useCountUp(value, duration = 700) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;

    if (from === value) return undefined;

    let frame;
    const startedAt = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = t === 1 ? value : Math.round(from + (value - from) * eased);

      fromRef.current = next;
      setDisplay(next);

      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return display;
}

function PanelTitle({ children, caption }) {
  return (
    <Box sx={{ mb: 1.1 }}>
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: MUTED,
        }}
      >
        {children}
      </Typography>

      {caption && (
        <Typography sx={{ fontSize: 11.5, color: MUTED, opacity: 0.8 }}>
          {caption}
        </Typography>
      )}
    </Box>
  );
}

function CommunityInsights({ locations, totalDownloads, onFocus }) {
  const schools = locations.length;
  const animatedSchools = useCountUp(schools);
  const animatedDownloads = useCountUp(totalDownloads);
  const average = schools ? totalDownloads / schools : 0;

  const topSchools = useMemo(
    () =>
      [...locations].sort((a, b) => b.downloads - a.downloads).slice(0, 5),
    [locations]
  );

  const groups = useMemo(() => {
    const totals = { Luzon: 0, Visayas: 0, Mindanao: 0 };

    locations.forEach((loc) => {
      totals[getIslandGroup(loc.lat, loc.lng)] += loc.downloads;
    });

    return ISLAND_GROUPS.map((group) => ({
      ...group,
      value: totals[group.key],
    }));
  }, [locations]);

  const topDownloads = topSchools[0]?.downloads || 1;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        borderRadius: { xs: "22px", md: "28px" },
        bgcolor: "#fff",
        border: `1px solid ${BORDER}`,
        boxShadow: "0 18px 45px rgba(36,79,196,.08)",
        overflow: "hidden",
        height: { md: 520 },
        minHeight: 0,
      }}
    >
      {/* ---------- Header: live totals ---------- */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          color: "#fff",
          px: 2.25,
          pt: 2.1,
          pb: 2.25,
          background: `linear-gradient(135deg, ${BRAND_DEEP} 0%, ${BRAND} 100%)`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 180,
            height: 180,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,.07)",
            top: -90,
            right: -60,
          }}
        />

        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,.82)",
            }}
          >
            Community snapshot
          </Typography>

          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.7,
              px: 1,
              py: 0.3,
              borderRadius: "999px",
              bgcolor: "rgba(255,255,255,.14)",
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: "#4ADE80",
                animation: "greggLivePulse 1.8s infinite",
                "@keyframes greggLivePulse": {
                  "0%": { boxShadow: "0 0 0 0 rgba(74,222,128,.6)" },
                  "70%": { boxShadow: "0 0 0 7px rgba(74,222,128,0)" },
                  "100%": { boxShadow: "0 0 0 0 rgba(74,222,128,0)" },
                },
              }}
            />

            <Typography
              sx={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.07em" }}
            >
              LIVE
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1,
          }}
        >
          {[
            {
              icon: <SchoolRoundedIcon sx={{ fontSize: 17 }} />,
              value: animatedSchools,
              label: "schools",
            },
            {
              icon: <DownloadRoundedIcon sx={{ fontSize: 17 }} />,
              value: animatedDownloads,
              label: "downloads",
            },
          ].map((stat) => (
            <Box
              key={stat.label}
              sx={{
                borderRadius: "16px",
                bgcolor: "rgba(255,255,255,.13)",
                border: "1px solid rgba(255,255,255,.16)",
                px: 1.5,
                py: 1.25,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.6,
                  color: "rgba(255,255,255,.8)",
                }}
              >
                {stat.icon}

                <Typography sx={{ fontSize: 12, fontWeight: 650 }}>
                  {stat.label}
                </Typography>
              </Box>

              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: 30,
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {stat.value.toLocaleString()}
              </Typography>
            </Box>
          ))}
        </Box>

        {schools > 0 && (
          <Typography
            sx={{
              position: "relative",
              mt: 1.25,
              fontSize: 12,
              color: "rgba(255,255,255,.78)",
            }}
          >
            About{" "}
            <Box component="strong" sx={{ color: "#fff" }}>
              {average.toFixed(1)}
            </Box>{" "}
            downloads per school
          </Typography>
        )}
      </Box>

      {/* ---------- Body ---------- */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: 2.25,
          py: 2.1,
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: BORDER,
            borderRadius: 3,
          },
        }}
      >
        {schools === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              border: `1.5px dashed ${BORDER}`,
              borderRadius: "18px",
              px: 2,
              py: 3.5,
            }}
          >
            <PlaceRoundedIcon sx={{ color: BRAND, fontSize: 30, mb: 0.5 }} />

            <Typography sx={{ fontWeight: 800, color: TEXT, fontSize: 14.5 }}>
              No schools yet
            </Typography>

            <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.5 }}>
              Insights appear here after the first downloads.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Island groups */}
            <Box>
              <PanelTitle caption="Estimated from each pin's location">
                By island group
              </PanelTitle>

              <Box
                sx={{
                  display: "flex",
                  height: 10,
                  borderRadius: "999px",
                  overflow: "hidden",
                  bgcolor: BRAND_LIGHT,
                }}
              >
                {groups.map(
                  (group) =>
                    group.value > 0 && (
                      <Box
                        key={group.key}
                        sx={{
                          width: `${(group.value / totalDownloads) * 100}%`,
                          bgcolor: group.color,
                          transition: "width .6s ease",
                        }}
                      />
                    )
                )}
              </Box>

              <Box
                sx={{
                  mt: 1.25,
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 1,
                }}
              >
                {groups.map((group) => (
                  <Box key={group.key}>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.7 }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: group.color,
                        }}
                      />

                      <Typography
                        sx={{ fontSize: 12, fontWeight: 700, color: MUTED }}
                      >
                        {group.key}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        mt: 0.2,
                        fontSize: 15,
                        fontWeight: 850,
                        color: TEXT,
                        lineHeight: 1.25,
                      }}
                    >
                      {group.value.toLocaleString()}
                      <Box
                        component="span"
                        sx={{
                          ml: 0.6,
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: MUTED,
                        }}
                      >
                        {Math.round((group.value / totalDownloads) * 100)}%
                      </Box>
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Leaderboard */}
            <Box>
              <PanelTitle caption="Tap a school to find it on the map">
                Top schools
              </PanelTitle>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {topSchools.map((loc, index) => {
                  const share = Math.round(
                    (loc.downloads / totalDownloads) * 100
                  );

                  return (
                    <Box
                      key={loc.place_id}
                      component="button"
                      type="button"
                      onClick={() => onFocus(loc)}
                      aria-label={`Show ${loc.school_name} on the map`}
                      sx={{
                        all: "unset",
                        boxSizing: "border-box",
                        width: "100%",
                        cursor: "pointer",
                        borderRadius: "14px",
                        px: 1,
                        py: 1,
                        display: "grid",
                        gridTemplateColumns: "24px minmax(0, 1fr) auto",
                        columnGap: 1.1,
                        alignItems: "center",
                        transition: "background-color .15s ease",
                        "&:hover, &:focus-visible": {
                          bgcolor: BRAND_LIGHT,
                        },
                        "&:focus-visible": {
                          outline: `2px solid ${BRAND}`,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 12,
                          fontWeight: 850,
                          bgcolor: index === 0 ? BRAND : BRAND_LIGHT,
                          color: index === 0 ? "#fff" : BRAND,
                        }}
                      >
                        {index === 0 ? (
                          <EmojiEventsRoundedIcon sx={{ fontSize: 14 }} />
                        ) : (
                          index + 1
                        )}
                      </Box>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: 13.5,
                            fontWeight: 750,
                            color: TEXT,
                            lineHeight: 1.3,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {loc.school_name}
                        </Typography>

                        {shortPlace(loc.address) && (
                          <Typography
                            sx={{
                              fontSize: 11.5,
                              color: MUTED,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {shortPlace(loc.address)}
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ textAlign: "right" }}>
                        <Typography
                          sx={{
                            fontSize: 14,
                            fontWeight: 850,
                            color: TEXT,
                            lineHeight: 1.2,
                          }}
                        >
                          {loc.downloads.toLocaleString()}
                        </Typography>

                        <Typography sx={{ fontSize: 11, color: MUTED }}>
                          {share}%
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          gridColumn: "2 / 4",
                          mt: 0.8,
                          height: 4,
                          borderRadius: "999px",
                          bgcolor: BRAND_LIGHT,
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            height: "100%",
                            width: `${Math.max(
                              6,
                              (loc.downloads / topDownloads) * 100
                            )}%`,
                            borderRadius: "999px",
                            background: `linear-gradient(90deg, ${BRAND}, #8FAEFF)`,
                            transition: "width .6s ease",
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}

function LearnersMapSection() {
  const { locations } = useDownload();

  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef(new Map());
  const firstSyncDoneRef = useRef(false);

  const [mapState, setMapState] = useState("loading"); // loading | ready | error
  const [mapHint, setMapHint] = useState(null);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let cleanupGestures = () => {};

    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapElRef.current) return;

        const isTouch = Boolean(L.Browser.mobile);

        const map = L.map(mapElRef.current, {
          minZoom: 5,
          maxZoom: 17,
          maxBounds: [
            [0, 108],
            [27, 134],
          ],
          maxBoundsViscosity: 0.8,

          // Smooth, fractional zoom so pinching feels natural.
          zoomSnap: 0.25,
          zoomDelta: 0.5,
          bounceAtZoomLimits: false,

          // Pinch-to-zoom on touch screens (two fingers also pan the map).
          touchZoom: true,

          // Plain mouse-wheel scrolling keeps scrolling the PAGE; zooming
          // uses Ctrl/Cmd + wheel (or a trackpad pinch) — see onWheel below.
          scrollWheelZoom: false,

          // On phones one finger scrolls the page; two fingers drive the map.
          dragging: !isTouch,

          attributionControl: true,
        });

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        }).addTo(map);

        map.fitBounds([
          [PH_BOUNDS.south + 0.2, PH_BOUNDS.west + 0.5],
          [PH_BOUNDS.north - 0.3, PH_BOUNDS.east - 0.2],
        ]);

        /* ---- gestures: trackpad pinch / Ctrl+wheel + touch hints ---- */
        const container = map.getContainer();
        let hintTimer = null;

        const hideHint = () => {
          clearTimeout(hintTimer);
          hintTimer = null;
          setMapHint(null);
        };

        const showHint = (text, ms) => {
          clearTimeout(hintTimer);
          setMapHint(text);
          hintTimer = setTimeout(() => {
            hintTimer = null;
            setMapHint(null);
          }, ms);
        };

        // A trackpad pinch (and Ctrl/Cmd + mouse wheel) arrives as a wheel
        // event with ctrlKey set. Zoom the map around the cursor instead of
        // letting the browser zoom the whole page.
        const onWheel = (event) => {
          if (!event.ctrlKey && !event.metaKey) return;

          event.preventDefault();

          const step = Math.max(-0.75, Math.min(0.75, -event.deltaY * 0.02));

          map.setZoomAround(
            map.mouseEventToContainerPoint(event),
            map.getZoom() + step,
            { animate: false }
          );

          hideHint();
        };

        // One finger dragging on a phone scrolls the page — tell people how
        // to move the map instead.
        const onTouchMove = (event) => {
          if (isTouch && event.touches.length === 1 && !hintTimer) {
            showHint("Use two fingers to move and zoom the map", 1600);
          }
        };

        container.addEventListener("wheel", onWheel, { passive: false });
        container.addEventListener("touchmove", onTouchMove, { passive: true });
        map.on("zoomstart", hideHint);

        showHint(
          isTouch
            ? "Pinch with two fingers to zoom"
            : "Ctrl + scroll or pinch to zoom",
          7000
        );

        cleanupGestures = () => {
          clearTimeout(hintTimer);
          container.removeEventListener("wheel", onWheel);
          container.removeEventListener("touchmove", onTouchMove);
        };

        leafletRef.current = L;
        mapRef.current = map;
        setMapState("ready");

        // The container may still be settling its size.
        setTimeout(() => map.invalidateSize(), 150);
      })
      .catch(() => {
        if (!cancelled) setMapState("error");
      });

    return () => {
      cancelled = true;
      cleanupGestures();

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      markersRef.current.clear();
    };
  }, []);

  // Fly to a school (used by the leaderboard) and open its popup.
  const focusSchool = (loc) => {
    const map = mapRef.current;

    if (!map) return;

    // On phones the panel sits below the map — bring the map into view.
    if (window.innerWidth < 900 && mapElRef.current) {
      mapElRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const entry = markersRef.current.get(loc.place_id);

    if (entry) {
      map.once("moveend", () => entry.marker.openPopup());
    }

    map.flyTo([loc.lat, loc.lng], Math.max(map.getZoom(), 12), {
      duration: 1.1,
    });
  };

  // Keep the pins in sync with the data.
  useEffect(() => {
    if (mapState !== "ready") return;

    const L = leafletRef.current;
    const map = mapRef.current;
    const pins = markersRef.current;
    const seen = new Set();

    locations.forEach((loc) => {
      seen.add(loc.place_id);

      const existing = pins.get(loc.place_id);

      if (existing) {
        existing.marker.setPopupContent(buildInfoContent(loc));

        if (existing.count !== loc.downloads) {
          existing.count = loc.downloads;
          existing.marker.setIcon(buildMarkerIcon(L, loc.downloads).icon);
        }

        return;
      }

      const { el, icon } = buildMarkerIcon(L, loc.downloads);

      const marker = L.marker([loc.lat, loc.lng], {
        icon,
        title: loc.school_name,
      })
        .addTo(map)
        .bindPopup(buildInfoContent(loc));

      // Pop in new pins (but not the whole first batch on page load).
      if (firstSyncDoneRef.current && el.animate) {
        el.animate(
          [
            { transform: "scale(0)" },
            { transform: "scale(1.3)" },
            { transform: "scale(1)" },
          ],
          { duration: 600, easing: "ease-out" }
        );
      }

      pins.set(loc.place_id, { marker, count: loc.downloads });
    });

    pins.forEach((entry, placeId) => {
      if (!seen.has(placeId)) {
        entry.marker.remove();
        pins.delete(placeId);
      }
    });

    firstSyncDoneRef.current = true;
  }, [locations, mapState]);

  const totalDownloads = locations.reduce(
    (sum, loc) => sum + loc.downloads,
    0
  );

  return (
    <Box
      id="learners-map"
      sx={{
        scrollMarginTop: 100,
        pb: { xs: 8, md: 10 },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1180, mx: "auto" }}>
        <Box sx={{ textAlign: "center", mb: { xs: 3.5, md: 5 } }}>
          <Chip
            icon={<PlaceRoundedIcon sx={{ fontSize: 17 }} />}
            label="Our community"
            sx={{
              bgcolor: "#fff",
              color: BRAND,
              fontWeight: 800,
              border: `1px solid ${BORDER}`,
              mb: 2,
            }}
          />

          <Typography
            component="h2"
            sx={{
              fontWeight: 900,
              letterSpacing: "-0.035em",
              fontSize: { xs: 28, sm: 34, md: 40 },
              lineHeight: 1.15,
              color: TEXT,
              mb: 1.5,
            }}
          >
            Learners across
            <Box component="span" sx={{ color: BRAND, ml: 1 }}>
              the Philippines.
            </Box>
          </Typography>

          <Typography
            sx={{
              color: MUTED,
              maxWidth: 560,
              mx: "auto",
              fontSize: { xs: 15, md: 16.5 },
              lineHeight: 1.7,
            }}
          >
            Every pin is a school or university where someone downloaded
            Gregg Dictionary.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 300px" },
            gap: 2,
          }}
        >
          <Box
            sx={{
              position: "relative",
              height: { xs: 380, md: 520 },
              borderRadius: { xs: "22px", md: "28px" },
              overflow: "hidden",
              border: `1px solid ${BORDER}`,
              bgcolor: BRAND_LIGHT,
              boxShadow: "0 18px 45px rgba(36,79,196,.10)",
              isolation: "isolate",
            }}
          >
            <Box ref={mapElRef} sx={{ position: "absolute", inset: 0 }} />

            {mapState === "ready" && mapHint && (
              <Box
                sx={{
                  position: "absolute",
                  top: 12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 1000,
                  px: 1.75,
                  py: 0.75,
                  borderRadius: "999px",
                  bgcolor: "rgba(20,38,83,.88)",
                  color: "#fff",
                  fontSize: 12.5,
                  fontWeight: 650,
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                  maxWidth: "calc(100% - 24px)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  backdropFilter: "blur(6px)",
                }}
              >
                {mapHint}
              </Box>
            )}

            {mapState === "loading" && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 1000,
                  display: "grid",
                  placeItems: "center",
                  pointerEvents: "none",
                }}
              >
                <CircularProgress size={28} sx={{ color: BRAND }} />
              </Box>
            )}

            {mapState === "error" && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 1000,
                  display: "grid",
                  placeItems: "center",
                  p: 3,
                  textAlign: "center",
                }}
              >
                <Typography sx={{ color: MUTED, fontSize: 14 }}>
                  The map couldn&apos;t be loaded right now.
                </Typography>
              </Box>
            )}

            {mapState === "ready" && locations.length === 0 && (
              <Box
                sx={{
                  position: "absolute",
                  left: "50%",
                  bottom: 34,
                  transform: "translateX(-50%)",
                  zIndex: 1000,
                  px: 2,
                  py: 1,
                  borderRadius: "999px",
                  bgcolor: "rgba(255,255,255,.95)",
                  border: `1px solid ${BORDER}`,
                  boxShadow: "0 6px 18px rgba(30,49,87,.12)",
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                }}
              >
                <Typography
                  sx={{ fontSize: 12.5, fontWeight: 700, color: TEXT }}
                >
                  No schools pinned yet — be the first!
                </Typography>
              </Box>
            )}
          </Box>

          <CommunityInsights
            locations={locations}
            totalDownloads={totalDownloads}
            onFocus={focusSchool}
          />
        </Box>
      </Box>
    </Box>
  );
}

function DownloadSection() {
  const { triggerDownload, isDownloading } = useDownload();

  return (
    <Box
      id="download"
      sx={{
        scrollMarginTop: 100,

        pb: {
          xs: 8,
          md: 10,
        },
      }}
    >
      <Box
        sx={{
          position: "relative",

          overflow: "hidden",

          borderRadius: {
            xs: "27px",
            md: "34px",
          },

          bgcolor: BRAND,

          color: "#fff",

          px: {
            xs: 3,
            sm: 5,
            md: 7,
          },

          py: {
            xs: 4,
            md: 5.5,
          },

          textAlign: "center",

          boxShadow:
            "0 22px 55px rgba(56,105,232,.22)",
        }}
      >
        {/* Decorative circles */}

        <Box
          sx={{
            position: "absolute",

            width: 250,
            height: 250,

            borderRadius: "50%",

            bgcolor:
              "rgba(255,255,255,.08)",

            top: -130,
            left: -80,
          }}
        />

        <Box
          sx={{
            position: "absolute",

            width: 300,
            height: 300,

            borderRadius: "50%",

            bgcolor:
              "rgba(255,255,255,.06)",

            bottom: -190,
            right: -80,
          }}
        />

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box
            component="img"
            src={APP_ICON}
            alt="Gregg Dictionary"
            sx={{
              width: 62,
              height: 62,

              objectFit: "contain",

              mb: 1.5,
            }}
          />

          <Typography
            component="h2"
            sx={{
              fontWeight: 900,

              letterSpacing: "-0.035em",

              fontSize: {
                xs: 29,
                md: 40,
              },

              mb: 1,
            }}
          >
            Ready to explore Gregg shorthand?
          </Typography>

          <Typography
            sx={{
              color:
                "rgba(255,255,255,.76)",

              maxWidth: 570,

              mx: "auto",

              lineHeight: 1.7,

              fontSize: 14.5,

              mb: 2.75,
            }}
          >
            Keep the dictionary, lessons, and saved
            words within reach wherever you study.
          </Typography>

          <Box>
            <Button
              onClick={triggerDownload}
              disabled={isDownloading}
              variant="contained"
              disableElevation
              startIcon={
                <DownloadRoundedIcon />
              }
              sx={{
                bgcolor: "#fff",

                color: BRAND,

                textTransform: "none",

                fontWeight: 850,

                borderRadius: "13px",

                px: 2.8,
                py: 1.45,

                "&:hover": {
                  bgcolor: "#F2F5FF",

                  transform:
                    "translateY(-2px)",
                },

                transition:
                  "all .2s ease",

                "&.Mui-disabled": {
                  bgcolor: "rgba(255,255,255,.6)",
                  color: "rgba(56,105,232,.6)",
                },
              }}
            >
              {isDownloading
                ? "Downloading…"
                : "Get Gregg Dictionary"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* =========================================================
   DONATE (PayMongo hosted checkout)
   ========================================================= */

const swalDark = {
  background: "#142653",
  color: "#fff",
  confirmButtonColor: BRAND,
};

function DonateSection() {
  const [selected, setSelected] = useState(100); // a preset amount or "custom"
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);

  const amount =
    selected === "custom" ? Math.floor(Number(custom)) || 0 : selected;
  const valid = amount >= DONATE_MIN && amount <= DONATE_MAX;

  // PayMongo sends the donor back with ?donation=success|cancelled.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("donation");

    if (!status) return;

    params.delete("donation");
    const query = params.toString();

    window.history.replaceState(
      {},
      "",
      window.location.pathname +
        (query ? `?${query}` : "") +
        window.location.hash
    );

    if (status === "success") {
      Swal.fire({
        ...swalDark,
        icon: "success",
        title: "Thank you for your support!",
        text: "Your donation helps keep Gregg Dictionary free for every learner.",
        confirmButtonText: "You're welcome",
      });
    } else if (status === "cancelled") {
      Swal.fire({
        ...swalDark,
        icon: "info",
        title: "Donation cancelled",
        text: "No worries — you weren't charged.",
        confirmButtonText: "Okay",
      });
    }
  }, []);

  const startDonation = async () => {
    if (busy) return;

    if (!valid) {
      Swal.fire({
        ...swalDark,
        icon: "warning",
        title: "Check the amount",
        text: `Please enter an amount from ₱${DONATE_MIN} to ₱${DONATE_MAX.toLocaleString()}.`,
        confirmButtonText: "Okay",
      });
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(DONATE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.checkout_url) {
        // Off to PayMongo — the donor scans the QR Ph code there.
        window.location.assign(data.checkout_url);
        return;
      }

      throw new Error(data.error || "Couldn't start the checkout");
    } catch (error) {
      console.error("[Gregg] Donation checkout failed:", error);

      // Fallback: a static PayMongo Payment Link (donor enters the amount there).
      if (PAYMONGO_LINK) {
        window.location.assign(PAYMONGO_LINK);
        return;
      }

      Swal.fire({
        ...swalDark,
        icon: "error",
        title: "Donations aren't available right now",
        text: "We couldn't open the payment page. Please try again in a moment.",
        confirmButtonText: "Okay",
      });
    }

    setBusy(false);
  };

  return (
    <Box
      id="donate"
      sx={{
        scrollMarginTop: 100,
        pb: { xs: 8, md: 10 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1180,
          mx: "auto",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 420px" },
          gap: { xs: 3, md: 6 },
          alignItems: "center",
          bgcolor: "#fff",
          border: `1px solid ${BORDER}`,
          borderRadius: { xs: "24px", md: "32px" },
          boxShadow: "0 18px 45px rgba(36,79,196,.08)",
          px: { xs: 2.5, sm: 4, md: 6 },
          py: { xs: 3.5, md: 5 },
        }}
      >
        {/* ---------- Pitch ---------- */}
        <Box>
          <Chip
            icon={<FavoriteRoundedIcon sx={{ fontSize: 17 }} />}
            label="Support the project"
            sx={{
              bgcolor: BRAND_LIGHT,
              color: BRAND,
              fontWeight: 800,
              "& .MuiChip-icon": { color: "#E5484D" },
              mb: 2,
            }}
          />

          <Typography
            component="h2"
            sx={{
              fontWeight: 900,
              letterSpacing: "-0.035em",
              fontSize: { xs: 28, sm: 34, md: 40 },
              lineHeight: 1.15,
              color: TEXT,
              mb: 1.5,
            }}
          >
            Support
            <Box component="span" sx={{ color: BRAND, ml: 1 }}>
              the developers.
            </Box>
          </Typography>

          <Typography
            sx={{
              color: MUTED,
              maxWidth: 520,
              fontSize: { xs: 15, md: 16.5 },
              lineHeight: 1.7,
              mb: 2.5,
            }}
          >
            Help us continue improving Gregg Dictionary. Your support helps the developers maintain the app, add new features, fix issues, and keep the dictionary updated for learners and shorthand enthusiasts. Every contribution, big or small, is greatly appreciated.
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {["Secure PayMongo checkout", "Donate with QR Ph"].map(
              (item) => (
                <Box
                  key={item}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.6,
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: TEXT,
                    bgcolor: PAGE_BG,
                    border: `1px solid ${BORDER}`,
                    borderRadius: "999px",
                    px: 1.4,
                    py: 0.55,
                  }}
                >
                  <CheckCircleRoundedIcon sx={{ fontSize: 15, color: BRAND }} />
                  {item}
                </Box>
              )
            )}
          </Box>
        </Box>

        {/* ---------- Amount picker ---------- */}
        <Box
          sx={{
            borderRadius: "24px",
            bgcolor: PAGE_BG,
            border: `1px solid ${BORDER}`,
            p: { xs: 2, sm: 2.5 },
          }}
        >
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: MUTED,
              mb: 1.25,
            }}
          >
            Choose an amount
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 1,
            }}
          >
            {[...DONATE_AMOUNTS, "custom"].map((option) => {
              const active = selected === option;

              return (
                <Box
                  key={option}
                  component="button"
                  type="button"
                  onClick={() => setSelected(option)}
                  aria-pressed={active}
                  sx={{
                    all: "unset",
                    boxSizing: "border-box",
                    cursor: "pointer",
                    textAlign: "center",
                    gridColumn: option === "custom" ? "1 / 3" : "auto",
                    py: 1.3,
                    borderRadius: "14px",
                    fontSize: 15.5,
                    fontWeight: 850,
                    bgcolor: active ? BRAND_LIGHT : "#fff",
                    color: active ? BRAND : TEXT,
                    border: `2px solid ${active ? BRAND : BORDER}`,
                    transition: "all .15s ease",
                    "&:hover": { borderColor: BRAND },
                    "&:focus-visible": { outline: `2px solid ${BRAND_DEEP}` },
                  }}
                >
                  {option === "custom"
                    ? "Other amount"
                    : `₱${option.toLocaleString()}`}
                </Box>
              );
            })}
          </Box>

          {selected === "custom" && (
            <TextField
              autoFocus
              fullWidth
              type="number"
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              placeholder={`${DONATE_MIN} – ${DONATE_MAX.toLocaleString()}`}
              inputProps={{ min: DONATE_MIN, max: DONATE_MAX, step: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography sx={{ fontWeight: 800, color: TEXT }}>
                      ₱
                    </Typography>
                  </InputAdornment>
                ),
                sx: { borderRadius: "14px", bgcolor: "#fff", fontWeight: 700 },
              }}
              sx={{ mt: 1.25 }}
            />
          )}

          <Button
            fullWidth
            variant="contained"
            disableElevation
            disabled={busy || !valid}
            onClick={startDonation}
            startIcon={
              busy ? (
                <CircularProgress size={18} sx={{ color: "inherit" }} />
              ) : (
                <FavoriteRoundedIcon />
              )
            }
            sx={{
              mt: 1.75,
              py: 1.35,
              borderRadius: "14px",
              bgcolor: BRAND,
              textTransform: "none",
              fontWeight: 800,
              fontSize: 15.5,
              "&:hover": { bgcolor: BRAND_DARK },
              "&.Mui-disabled": {
                bgcolor: "rgba(56,105,232,.45)",
                color: "rgba(255,255,255,.85)",
              },
            }}
          >
            {busy
              ? "Opening PayMongo…"
              : valid
              ? `Donate ₱${amount.toLocaleString()}`
              : "Enter an amount"}
          </Button>

          <Box
            sx={{
              mt: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.6,
              color: MUTED,
              fontSize: 12,
            }}
          >
            <LockRoundedIcon sx={{ fontSize: 14 }} />
            Secure checkout by PayMongo — scan the QR Ph code with any bank or e-wallet app.
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* =========================================================
   FOOTER
   ========================================================= */

function Footer() {
  const scrollTo = (id) => {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#142653",

        color: "#fff",

        pt: {
          xs: 6,
          md: 8,
        },

        pb: 3,

        px: {
          xs: 2.5,
          sm: 3,
          md: 4,
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1180,
          mx: "auto",
        }}
      >
        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              sm: "1.5fr 1fr",
              md: "2fr 1fr 1fr 2fr",
            },

            gap: {
              xs: 4,
              md: 5,
            },

            pb: 5,

            borderBottom:
              "1px solid rgba(255,255,255,.1)",
          }}
        >
          {/* BRAND */}

          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,

                mb: 1.75,
              }}
            >
              <Box
                component="img"
                src={APP_ICON}
                alt="Gregg Dictionary"
                sx={{
                  width: 48,
                  height: 48,

                  objectFit: "contain",
                }}
              />

              <Box>
                <Typography
                  sx={{
                    fontWeight: 900,

                    fontSize: 18,

                    lineHeight: 1.1,
                  }}
                >
                  Gregg Dictionary
                </Typography>

                <Typography
                  sx={{
                    color:
                      "rgba(255,255,255,.45)",

                    fontSize: 9,

                    fontWeight: 800,

                    letterSpacing: ".08em",

                    mt: 0.3,
                  }}
                >
                  GREGG SHORTHAND
                </Typography>
              </Box>
            </Box>

            <Typography
              sx={{
                maxWidth: 390,

                color:
                  "rgba(255,255,255,.56)",

                fontSize: 13.5,

                lineHeight: 1.75,
              }}
            >
              A modern digital companion for
              learning, exploring, and practicing
              Gregg shorthand.
            </Typography>
          </Box>

          {/* EXPLORE */}

          <FooterColumn title="Explore">
            <FooterLink
              icon={<HomeRoundedIcon />}
              label="Home"
              onClick={() => scrollTo("home")}
            />

            <FooterLink
              icon={<AutoStoriesRoundedIcon />}
              label="Features"
              onClick={() => scrollTo("features")}
            />

            <FooterLink
              icon={<SchoolRoundedIcon />}
              label="Learn Gregg"
              onClick={() => scrollTo("learn")}
            />

            <FooterLink
              icon={<HelpOutlineRoundedIcon />}
              label="FAQ"
              onClick={() => scrollTo("faq")}
            />

            <FooterLink
              icon={<FavoriteRoundedIcon />}
              label="Donate"
              onClick={() => scrollTo("donate")}
            />
          </FooterColumn>

          {/* APP */}

          <FooterColumn title="Gregg Dictionary">
            <FooterLink
              icon={<SearchRoundedIcon />}
              label="Search"
              onClick={() => scrollTo("features")}
            />

            <FooterLink
              icon={<LibraryBooksRoundedIcon />}
              label="Browse"
              onClick={() => scrollTo("features")}
            />

            <FooterLink
              icon={<BookmarkRoundedIcon />}
              label="Saved"
              onClick={() => scrollTo("features")}
            />

            <FooterLink
              icon={<SchoolRoundedIcon />}
              label="Lessons"
              onClick={() => scrollTo("learn")}
            />
          </FooterColumn>

          {/* CONTACT */}

          <FooterColumn title="Contact">
            <Typography
              sx={{
                color:
                  "rgba(255,255,255,.43)",

                fontSize: 13,

                lineHeight: 1.65,

                maxWidth: 250,
              }}
            >
              Have a question, suggestion, or feedback? We'd love to hear from you.
            </Typography>

            <ContactForm />
          </FooterColumn>
        </Box>

        {/* FOOTER BOTTOM */}

        <Box
          sx={{
            display: "flex",

            alignItems: "center",

            justifyContent: "space-between",

            flexWrap: "wrap",

            gap: 2,

            pt: 3,
          }}
        >
          <Typography
            sx={{
              color:
                "rgba(255,255,255,.4)",

              fontSize: 11.5,
            }}
          >
            © 2026 Donme Studio. All rights reserved.
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.8,

              color:
                "rgba(255,255,255,.38)",
            }}
          >
            <MenuBookRoundedIcon
              sx={{ fontSize: 16 }}
            />

            <Typography
              sx={{
                fontSize: 11.5,
              }}
            >
              Learn. Write. Remember.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* =========================================================
   FOOTER HELPERS
   ========================================================= */

function FooterColumn({ title, children }) {
  return (
    <Box>
      <Typography
        sx={{
          fontWeight: 850,

          fontSize: 13,

          mb: 2,
        }}
      >
        {title}
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 1.25,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

function FooterLink({
  icon,
  label,
  onClick,
  href,
}) {
  return (
    <Button
      component={href ? "a" : "button"}
      href={href}
      onClick={onClick}
      startIcon={icon}
      sx={{
        justifyContent: "flex-start",

        minWidth: 0,

        p: 0,

        color:
          "rgba(255,255,255,.58)",

        textTransform: "none",

        fontWeight: 650,

        fontSize: 12.5,

        "& .MuiButton-startIcon": {
          color: "#8FAEFF",

          marginRight: 0.75,
        },

        "&:hover": {
          bgcolor: "transparent",

          color: "#fff",

          "& .MuiButton-startIcon": {
            color: "#fff",
          },
        },
      }}
    >
      {label}
    </Button>
  );
}

/* =========================================================
   CONTACT FORM (react-hook-form + Web3Forms)
   ========================================================= */

function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const swalTheme = {
    background: "#142653",
    color: "#fff",
    confirmButtonColor: BRAND,
    buttonsStyling: true,
    customClass: {
      popup: "gregg-swal-popup",
    },
  };

  const onSubmit = async (data) => {
    try {
      const response = await fetch(
        "https://api.web3forms.com/submit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            access_key: WEB3FORMS_ACCESS_KEY,
            subject:
              "New message from the Gregg Dictionary site",
            ...data,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        reset();

        Swal.fire({
          ...swalTheme,
          icon: "success",
          title: "Message sent!",
          text: "Thanks for reaching out — we'll get back to you soon.",
          confirmButtonText: "Great",
        });
      } else {
        Swal.fire({
          ...swalTheme,
          icon: "error",
          title: "Something went wrong",
          text: "Your message couldn't be sent. Please try again.",
          confirmButtonText: "Okay",
        });
      }
    } catch (error) {
      Swal.fire({
        ...swalTheme,
        icon: "error",
        title: "Something went wrong",
        text: "Your message couldn't be sent. Please try again.",
        confirmButtonText: "Okay",
      });
    }
  };

  const fieldSx = {
    width: "100%",

    boxSizing: "border-box",

    bgcolor: "rgba(255,255,255,.06)",

    border: "1px solid rgba(255,255,255,.14)",

    borderRadius: "10px",

    color: "#fff",

    fontSize: {
      xs: 13.5,
      sm: 12.5,
    },

    fontFamily: "inherit",

    pr: {
      xs: 1.25,
      sm: 1.4,
    },

    pl: {
      xs: 4.25,
      sm: 4.5,
    },

    py: {
      xs: 1.15,
      sm: 1,
    },

    outline: "none",

    "&::placeholder": {
      color: "rgba(255,255,255,.4)",
    },

    "&:focus": {
      borderColor: "rgba(255,255,255,.4)",
    },
  };

  const fieldIconSx = {
    position: "absolute",
    left: {
      xs: 10,
      sm: 12,
    },
    fontSize: 18,
    color: "rgba(255,255,255,.38)",
    pointerEvents: "none",
  };

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,

        mt: 1.5,

        width: "100%",

        maxWidth: {
          xs: "100%",
          sm: 340,
          md: 380,
          lg: 400,
        },
      }}
    >
      <Box sx={{ position: "relative" }}>
        <PersonRoundedIcon
          sx={{
            ...fieldIconSx,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />

        <Box
          component="input"
          placeholder="Your name"
          {...register("name", { required: true })}
          sx={fieldSx}
        />
      </Box>

      {errors.name && (
        <Typography
          sx={{ fontSize: 10.5, color: "#FF9C9C" }}
        >
          Name is required.
        </Typography>
      )}

      <Box sx={{ position: "relative" }}>
        <EmailRoundedIcon
          sx={{
            ...fieldIconSx,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />

        <Box
          component="input"
          type="email"
          placeholder="Your email"
          {...register("email", {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          })}
          sx={fieldSx}
        />
      </Box>

      {errors.email && (
        <Typography
          sx={{ fontSize: 10.5, color: "#FF9C9C" }}
        >
          A valid email is required.
        </Typography>
      )}

      <Box sx={{ position: "relative" }}>
        <ChatBubbleOutlineRoundedIcon
          sx={{
            ...fieldIconSx,
            top: 12,
          }}
        />

        <Box
          component="textarea"
          rows={3}
          placeholder="Your message"
          {...register("message", { required: true })}
          sx={{ ...fieldSx, resize: "none" }}
        />
      </Box>

      {errors.message && (
        <Typography
          sx={{ fontSize: 10.5, color: "#FF9C9C" }}
        >
          A message is required.
        </Typography>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        variant="contained"
        disableElevation
        fullWidth
        sx={{
          bgcolor: BRAND,

          width: "100%",

          textTransform: "none",

          fontWeight: 750,

          fontSize: {
            xs: 13,
            sm: 12.5,
          },

          borderRadius: "10px",

          py: {
            xs: 1.1,
            sm: 0.9,
          },

          mt: 0.25,

          "&:hover": {
            bgcolor: BRAND_DARK,
          },

          "&.Mui-disabled": {
            bgcolor: "rgba(56,105,232,.5)",
            color: "rgba(255,255,255,.7)",
          },
        }}
      >
        {isSubmitting ? "Sending..." : "Send message"}
      </Button>
    </Box>
  );
}