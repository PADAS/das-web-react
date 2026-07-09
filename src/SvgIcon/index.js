import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { API_V2_URL, DAS_HOST } from '../constants';

const GENERIC_ICON_ID = 'generic_rep';
export const svgCache = new Map();

const CONTAINER_SELECTOR = 'svg,g,defs,symbol,marker,clipPath,mask,pattern';

const buildSpriteSvgUrl = (iconId, communityValue) => (communityValue
  ? `${API_V2_URL}community/${communityValue}/static/sprite-src/${iconId}.svg`
  : `${DAS_HOST}/static/sprite-src/${iconId}.svg`);

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

const removeContainerDefaultFills = (doc, containers) => {
  containers.forEach((container) => container.removeAttribute('fill'));
};

const sanitizeSvg = (text) => {
  const sanitized = DOMPurify.sanitize(text, {
    USE_PROFILES: { svg: true, svgFilters: true },
    RETURN_DOM_IMPORT: false,
    RETURN_DOM: false,
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

// Cache entries are either { svg: string } or { imgSrc: string }
const InlineSvg = ({ src, fallbackSrc, className, style, title, ...rest }) => {
  const [cached, setCached] = useState(() => svgCache.get(src) ?? null);

  useEffect(() => {
    let current = true;

    if (svgCache.has(src)) {
      const entry = svgCache.get(src);
      Promise.resolve().then(() => { if (current) setCached(entry); });
      return () => { current = false; };
    }

    const controller = new AbortController();
    const { signal } = controller;

    // Use the app's axios instance so the auth interceptors attach the bearer token.
    // Force the fetch adapter — the default XHR adapter is unreliable under jsdom.
    const fetchIcon = (url) => axios.get(url, {
      signal,
      adapter: 'fetch',
      responseType: 'text',
      headers: { Accept: 'image/svg+xml,image/*,*/*;q=0.8' },
    }).then((response) => {
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('svg')) {
        const clean = sanitizeSvg(response.data);
        return clean ? { svg: clean } : Promise.reject();
      }
      return { imgSrc: url };
    });

    fetchIcon(src)
      .then((entry) => {
        svgCache.set(src, entry);
        if (current) setCached(entry);
      })
      .catch(() => {
        if (!current || !fallbackSrc || src === fallbackSrc) return;
        if (svgCache.has(fallbackSrc)) {
          const entry = svgCache.get(fallbackSrc);
          // Pin the fallback under the failing src so later mounts skip the dead URL (until reload).
          svgCache.set(src, entry);
          setCached(entry);
          return;
        }
        fetchIcon(fallbackSrc)
          .then((entry) => {
            svgCache.set(fallbackSrc, entry);
            svgCache.set(src, entry);
            if (current) setCached(entry);
          })
          .catch(() => {});
      });

    return () => {
      current = false;
      controller.abort();
    };
  }, [src, fallbackSrc]);

  if (!cached) return null;

  if (cached.imgSrc) {
    return <img alt={title || ''} className={className} src={cached.imgSrc} style={style} {...rest} />;
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

  let iconSrc;
  if (communityValue && type === 'events') {
    iconSrc = `${API_V2_URL}community/${communityValue}/activity/events/eventtypes/icons/${effectiveIconId}`;
  } else {
    iconSrc = buildSpriteSvgUrl(effectiveIconId, communityValue);
  }

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
      src={iconSrc}
      style={svgStyle}
      title={title}
      {...rest}
    />
  );
};

export default SvgIcon;
