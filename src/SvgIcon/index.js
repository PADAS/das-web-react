import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { API_V2_URL, DAS_HOST } from '../constants';

const GENERIC_ICON_ID = 'generic_rep';
const REP_SUFFIX = '_rep';
export const svgCache = new Map();

// In-flight raw GETs keyed by URL, so N concurrent mounts of the same icon share one request.
const inFlightFetches = new Map();

const isClientError = (status) => typeof status === 'number' && status >= 400 && status < 500;

// A sanitization failure is a permanent defect in the icon, not a transient network
// problem — treat it like a 4xx so the fallback chain runs and the result is pinned.
const isPermanentFailure = (error) => error?.permanent === true || isClientError(error?.response?.status);

const CONTAINER_SELECTOR = 'svg,g,defs,symbol,marker,clipPath,mask,pattern';

const buildSpriteSvgUrl = (iconId, communityValue) => (communityValue
  ? `${API_V2_URL}community/${encodeURIComponent(communityValue)}/static/sprite-src/${encodeURIComponent(iconId)}.svg`
  : `${DAS_HOST}/static/sprite-src/${encodeURIComponent(iconId)}.svg`);

const buildEventCommunityUrl = (iconId, communityValue) =>
  `${API_V2_URL}community/${encodeURIComponent(communityValue)}/activity/events/eventtypes/icons/${encodeURIComponent(iconId)}`;

const buildIconUrl = (iconId, communityValue, type) => (communityValue && type === 'events'
  ? buildEventCommunityUrl(iconId, communityValue)
  : buildSpriteSvgUrl(iconId, communityValue));

// A container's fill="none" is a default only if children can override it — via explicit fills
// or class-driven fills. Removing it unconditionally breaks intentionally stroke-only icons.
const collectContainerDefaultFills = (doc) => {
  const styleSetsFill = [...doc.querySelectorAll('style')]
    .some((styleEl) => /fill\s*:/.test(styleEl.textContent || ''));

  const containersToUnfill = new Set();
  doc.querySelectorAll(CONTAINER_SELECTOR).forEach((container) => {
    if (container.getAttribute('fill') !== 'none') return;
    const hasExplicitFill = !!container.querySelector('[fill]:not([fill="none"])');
    const hasClassBasedFill = styleSetsFill && !!container.querySelector('[class]');
    if (hasExplicitFill || hasClassBasedFill) containersToUnfill.add(container);
  });
  return containersToUnfill;
};

const removeStyleBlocks = (doc) => {
  doc.querySelectorAll('style').forEach((el) => el.remove());
};

const removeClassAttributes = (doc) => {
  doc.querySelectorAll('[class]').forEach((el) => el.removeAttribute('class'));
};

// Strip hardcoded fills so shapes inherit currentColor via CSS.
const stripHardcodedFills = (doc) => {
  doc.querySelectorAll('[fill]:not([fill="none"])').forEach((el) => el.removeAttribute('fill'));
};

// Replace (not remove) hardcoded strokes with currentColor; CSS has no global stroke default.
const rewriteStrokesToCurrentColor = (doc) => {
  doc.querySelectorAll('[stroke]:not([stroke="none"])').forEach((el) => {
    el.setAttribute('stroke', 'currentColor');
  });
};

// Remove fill/stroke via the style API so arbitrary values (e.g. url(data:...;base64,...)) survive.
const stripInlineFillAndStroke = (doc) => {
  doc.querySelectorAll('[style]').forEach((el) => {
    el.style.removeProperty('fill');
    el.style.removeProperty('stroke');
    if (!el.getAttribute('style')?.trim()) el.removeAttribute('style');
  });
};

// The color presentation attribute resolves currentColor, defeating the wrapper's recoloring.
const stripColorAttributes = (doc) => {
  doc.querySelectorAll('[color]').forEach((el) => el.removeAttribute('color'));
};

const removeContainerDefaultFills = (doc, containers) => {
  containers.forEach((container) => container.removeAttribute('fill'));
};

const sanitizeSvg = (text) => {
  const sanitized = DOMPurify.sanitize(text, {
    USE_PROFILES: { svg: true, svgFilters: true },
    // Block clickable links, external image loads (both raster <image> and filter-primitive
    // <feImage>, which svgFilters would otherwise allow), and focusable nodes in crafted icons.
    FORBID_TAGS: ['a', 'image', 'feImage'],
    FORBID_ATTR: ['tabindex'],
  });
  if (!sanitized) return null;

  const doc = new DOMParser().parseFromString(sanitized, 'image/svg+xml');
  if (doc.querySelector('parsererror')) return null;

  // Collect fill="none" defaults before style/class removal changes the evidence.
  const containersToUnfill = collectContainerDefaultFills(doc);

  removeStyleBlocks(doc);
  removeClassAttributes(doc);
  stripHardcodedFills(doc);
  rewriteStrokesToCurrentColor(doc);
  stripInlineFillAndStroke(doc);
  stripColorAttributes(doc);
  removeContainerDefaultFills(doc, containersToUnfill);

  return new XMLSerializer().serializeToString(doc.documentElement) || null;
};

// Inject className onto the root <svg> tag only, never a nested <svg>.
const injectClass = (markup, className) => {
  if (!className) return markup;
  const svgStart = markup.indexOf('<svg');
  if (svgStart === -1) return markup;
  const tagEnd = markup.indexOf('>', svgStart);
  if (tagEnd === -1) return markup;

  const rootTag = markup.slice(svgStart, tagEnd + 1);
  const newRootTag = /\sclass="/.test(rootTag)
    ? rootTag.replace(/(\sclass=")([^"]*)(")/, (match, prefix, existing, suffix) => `${prefix}${`${existing} ${className}`.trim()}${suffix}`)
    : rootTag.replace('<svg', `<svg class="${className}"`);

  return markup.slice(0, svgStart) + newRootTag + markup.slice(tagEnd + 1);
};

// Fetches raw icon markup, deduping concurrent GETs for the same URL so N mounts
// share one request. Uses the app's axios instance so the auth interceptors attach
// the bearer token; skipAuth exempts icon fetches from the 401 logout handling, and
// the fetch adapter is forced because the default XHR adapter is unreliable under jsdom.
// Resolves a cache entry ({ svg } | { imgSrc }); rejects with a permanent failure (a
// 4xx-bearing error, or a { permanent: true } error when the icon fails sanitization)
// and any other error for transient ones.
const fetchRawIcon = (url) => {
  if (inFlightFetches.has(url)) return inFlightFetches.get(url);

  const request = axios.get(url, {
    skipAuth: true,
    adapter: 'fetch',
    responseType: 'text',
    headers: { Accept: 'image/svg+xml,image/*,*/*;q=0.8' },
  }).then((response) => {
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('svg')) {
      const clean = sanitizeSvg(response.data);
      // Flag as permanent so callers degrade like a 4xx (walk the fallback chain, pin the
      // result) instead of refetching this unsanitizable icon on every mount.
      if (!clean) throw Object.assign(new Error('icon SVG failed sanitization'), { permanent: true });
      return { svg: clean };
    }
    return { imgSrc: url };
  }).finally(() => {
    inFlightFetches.delete(url);
  });

  inFlightFetches.set(url, request);
  return request;
};

// Resolves the cache entry to render, applying the registry's fetch policy: try the
// primary URL, then (only on a permanent failure) the _rep retry and the generic fallback.
// Successful entries are cached under their URL; on a permanent failure the resolved fallback
// is pinned under the failing src so later mounts skip the dead URL (until reload). A permanent
// failure is a 4xx or an unsanitizable icon. Transient failures (network error, cancellation —
// anything without a 4xx status) cache nothing, so a later mount retries. Returns null when
// nothing resolves.
const resolveIconEntry = async ({ src, repSrc, fallbackSrc }) => {
  try {
    const entry = await fetchRawIcon(src);
    svgCache.set(src, entry);
    return entry;
  } catch (error) {
    if (!isPermanentFailure(error)) return null;
  }

  const fallbackChain = [repSrc, fallbackSrc].filter((url) => url && url !== src);
  for (const url of fallbackChain) {
    try {
      const entry = svgCache.get(url) ?? await fetchRawIcon(url);
      svgCache.set(url, entry);
      svgCache.set(src, entry);
      return entry;
    } catch (error) {
      if (!isPermanentFailure(error)) return null;
    }
  }

  return null;
};

// Cache entries are either { svg: string } or { imgSrc: string }
export const InlineSvg = ({ src, repSrc, fallbackSrc, className, style, title, ...rest }) => {
  const [cached, setCached] = useState(() => svgCache.get(src) ?? null);
  const [imgFailed, setImgFailed] = useState(false);
  const [renderedSrc, setRenderedSrc] = useState(src);

  // Reset from the cache (or null) when src changes, so a stale icon never keeps rendering.
  if (renderedSrc !== src) {
    setRenderedSrc(src);
    setCached(svgCache.get(src) ?? null);
    setImgFailed(false);
  }

  useEffect(() => {
    let current = true;
    // A concurrent mount's shared fetch may have populated the module-level svgCache after this
    // component's render initialized `cached` from a then-empty cache. Reconciling from that
    // external store is legitimate effect work (not derived state the lint heuristic assumes),
    // and the functional update is a no-op when `cached` is already set.
    if (svgCache.has(src)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- external-store sync, see comment above
      setCached((prev) => prev ?? svgCache.get(src));
      return () => { current = false; };
    }

    resolveIconEntry({ src, repSrc, fallbackSrc })
      .then((entry) => { if (current && entry) setCached(entry); });

    return () => { current = false; };
  }, [src, repSrc, fallbackSrc]);

  const onImgError = (event) => {
    event.currentTarget.style.display = 'none';
    // Drop the entry so a later mount retries instead of pinning a broken glyph.
    svgCache.delete(src);
    setImgFailed(true);
  };

  if (!cached || imgFailed) return null;

  if (cached.imgSrc) {
    return <img alt={title || ''} className={className} onError={onImgError} src={cached.imgSrc} style={style} {...rest} />;
  }

  // display:contents needs explicit role/label to be announced; aria-hidden when decorative.
  const a11yProps = title
    ? { role: 'img', 'aria-label': title, title }
    : { 'aria-hidden': 'true' };

  return (
    <span
      {...a11yProps}
      dangerouslySetInnerHTML={{ __html: injectClass(cached.svg, className) }}
      style={{ display: 'contents', ...style }}
      {...rest}
    />
  );
};

const SvgIcon = ({ type, iconId, imageUrl, className, color, style, title, ...rest }) => {
  const communityValue = useSelector((state) => state.data.community?.value);

  const onImgError = (event) => {
    event.currentTarget.style.display = 'none';
  };

  if (type === 'subjects') {
    return <img alt={title || ''} className={className} onError={onImgError} src={imageUrl} style={style} {...rest} />;
  }

  const effectiveIconId = iconId || GENERIC_ICON_ID;
  const isGeneric = effectiveIconId.includes('generic');

  const iconSrc = buildIconUrl(effectiveIconId, communityValue, type);
  // On a 4xx for {iconId}, retry the {iconId}_rep variant before the generic fallback.
  const repSrc = effectiveIconId.endsWith(REP_SUFFIX)
    ? null
    : buildIconUrl(`${effectiveIconId}${REP_SUFFIX}`, communityValue, type);

  // Map the legacy color prop / style.fill to CSS color, and set fill:currentColor so the
  // fill-stripped inline SVG follows it — consumers pass a color without a fill:currentColor
  // CSS rule (e.g. the add-event popup), matching the old DasIcon fill={color} behavior.
  const { fill: styleFill, ...restStyle } = style || {};
  const effectiveColor = color || styleFill;
  const svgStyle = effectiveColor
    ? { ...restStyle, color: effectiveColor, fill: 'currentColor' }
    : restStyle;

  return (
    <InlineSvg
      className={`${className || ''} ${isGeneric ? 'generic' : ''}`.trim()}
      fallbackSrc={buildSpriteSvgUrl(GENERIC_ICON_ID, communityValue)}
      repSrc={repSrc}
      src={iconSrc}
      style={svgStyle}
      title={title}
      {...rest}
    />
  );
};

export default SvgIcon;
