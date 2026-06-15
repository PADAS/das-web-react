import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { API_V2_URL, DAS_HOST } from '../constants';

const GENERIC_ICON_ID = 'generic_rep';
export const svgCache = new Map();

const CONTAINER_SELECTOR = 'svg,g,defs,symbol,marker,clipPath,mask,pattern';

// Identify which containers have fill="none" as a base default before we strip anything.
// A container's fill="none" should be removed only if it was acting as a default that its
// children override — either via explicit fill attributes or CSS classes in a <style> block.
// Removing it unconditionally breaks stroke-based icons where fill="none" is the design intent.
const collectContainerDefaultFills = (doc) => {
  const containersToUnfill = new Set();
  doc.querySelectorAll(CONTAINER_SELECTOR).forEach((container) => {
    if (container.getAttribute('fill') !== 'none') return;
    const hasExplicitFill = !!container.querySelector('[fill]:not([fill="none"])');
    const hasClassBasedFill = !!container.querySelector('[class]');
    if (hasExplicitFill || hasClassBasedFill) containersToUnfill.add(container);
  });
  return containersToUnfill;
};

// Remove <style> blocks — their fill/color rules reference class names we're about to strip,
// and the class-defined colors would otherwise survive intact.
const removeStyleBlocks = (doc) => {
  doc.querySelectorAll('style').forEach((el) => el.remove());
};

// Remove class attributes — they reference the now-removed CSS rules and may also conflict
// with the app's own stylesheet.
const removeClassAttributes = (doc) => {
  doc.querySelectorAll('[class]').forEach((el) => el.removeAttribute('class'));
};

// Strip all hardcoded (non-"none") fill attributes so shapes inherit currentColor via CSS.
const stripHardcodedFills = (doc) => {
  doc.querySelectorAll('[fill]:not([fill="none"])').forEach((el) => el.removeAttribute('fill'));
};

// Replace hardcoded stroke colors with currentColor so stroked shapes (crosshairs, outlines,
// etc.) follow the icon's color context. We replace rather than remove because CSS does not
// set a global stroke: currentColor the way it does for fill.
const rewriteStrokesToCurrentColor = (doc) => {
  doc.querySelectorAll('[stroke]:not([stroke="none"])').forEach((el) => {
    el.setAttribute('stroke', 'currentColor');
  });
};

// Strip inline fill/stroke from style attributes (presentation attributes above handle these).
const stripInlineFillAndStroke = (doc) => {
  doc.querySelectorAll('[style]').forEach((el) => {
    const cleaned = el.getAttribute('style')
      .replace(/\bfill\s*:[^;]*(;?)/g, '')
      .replace(/\bstroke\s*:[^;]*(;?)/g, '');
    el.setAttribute('style', cleaned);
  });
};

// Remove fill="none" only from containers that were acting as a base default over colored
// children — not from containers whose fill="none" is the actual design intent.
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

  const containersToUnfill = collectContainerDefaultFills(doc);

  removeStyleBlocks(doc);
  removeClassAttributes(doc);
  stripHardcodedFills(doc);
  rewriteStrokesToCurrentColor(doc);
  stripInlineFillAndStroke(doc);
  removeContainerDefaultFills(doc, containersToUnfill);

  return new XMLSerializer().serializeToString(doc.documentElement) || null;
};

const injectClass = (markup, className) => {
  if (!className) return markup;
  if (/<svg[^>]* class="/.test(markup)) {
    return markup.replace(/(<svg[^>]*) class="([^"]*)"/, `$1 class="$2 ${className}"`);
  }
  return markup.replace('<svg', `<svg class="${className}"`);
};

// Cache entries are either { svg: string } or { imgSrc: string }
const InlineSvg = ({ src, fallbackSrc, className, style, ...rest }) => {
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

    const fetchIcon = (url) =>
      fetch(url, { signal }).then(res => {
        if (!res.ok) return Promise.reject();
        const contentType = res.headers.get('Content-Type') || '';
        if (contentType.includes('svg')) {
          return res.text().then(text => {
            const clean = sanitizeSvg(text);
            return clean ? { svg: clean } : Promise.reject();
          });
        }
        return { imgSrc: url };
      });

    fetchIcon(src)
      .then(entry => {
        svgCache.set(src, entry);
        if (current) setCached(entry);
      })
      .catch(() => {
        if (!current || !fallbackSrc || src === fallbackSrc) return;
        if (svgCache.has(fallbackSrc)) {
          setCached(svgCache.get(fallbackSrc));
          return;
        }
        fetchIcon(fallbackSrc)
          .then(entry => {
            svgCache.set(fallbackSrc, entry);
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
    return <img alt="" className={className} src={cached.imgSrc} style={style} {...rest} />;
  }

  return (
    <span
      dangerouslySetInnerHTML={{ __html: injectClass(cached.svg, className) }}
      style={{ display: 'contents', ...style }}
      {...rest}
    />
  );
};

const SvgIcon = ({ type, iconId, imageUrl, className, color, style, ...rest }) => {
  const onImgError = (event) => {
    event.currentTarget.style.display = 'none';
  };

  if (type === 'subjects') {
    return <img alt={`${type} icon`} className={className} onError={onImgError} src={imageUrl} style={style} {...rest} />;
  }

  const effectiveIconId = iconId || GENERIC_ICON_ID;
  const isGeneric = effectiveIconId.includes('generic');

  const communityMatch = window.location.pathname.match(/^\/community\/([^/]+)/);
  const iconBase = communityMatch
    ? `${API_V2_URL}community/${communityMatch[1]}/static/sprite-src`
    : `${DAS_HOST}/static/sprite-src`;

  // Map legacy color prop and style.fill to CSS color so fill:currentColor in the SVG inherits it.
  const { fill: styleFill, ...restStyle } = style || {};
  const effectiveColor = color || styleFill;
  const svgStyle = effectiveColor ? { ...restStyle, color: effectiveColor } : restStyle;

  return (
    <InlineSvg
      className={`${className || ''} ${isGeneric ? 'generic' : ''}`.trim()}
      fallbackSrc={`${DAS_HOST}/static/sprite-src/${GENERIC_ICON_ID}.svg`}
      src={`${iconBase}/${effectiveIconId}.svg`}
      style={svgStyle}
      {...rest}
    />
  );
};

export default SvgIcon;
