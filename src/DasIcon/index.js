import React, { useEffect, useState } from 'react';
import { API_V2_URL, DAS_HOST } from '../constants';

const GENERIC_ICON_ID = 'generic_rep';
const svgCache = new Map();

const injectClass = (markup, className) => {
  if (!className) return markup;
  if (/<svg[^>]* class="/.test(markup)) {
    return markup.replace(/(<svg[^>]*) class="([^"]*)"/, `$1 class="$2 ${className}"`);
  }
  return markup.replace('<svg', `<svg class="${className}"`);
};

// Cache entries are either { svg: string } or { imgSrc: string }
const InlineSvg = ({ src, fallbackSrc, className, ...rest }) => {
  const [cached, setCached] = useState(() => svgCache.get(src) ?? null);

  useEffect(() => {
    if (svgCache.has(src)) {
      const entry = svgCache.get(src);
      Promise.resolve().then(() => setCached(entry));
      return;
    }

    const fetchIcon = (url) =>
      fetch(url).then(res => {
        if (!res.ok) return Promise.reject();
        const contentType = res.headers.get('Content-Type') || '';
        if (contentType.includes('svg')) {
          return res.text().then(text => ({ svg: text }));
        }
        return { imgSrc: url };
      });

    fetchIcon(src)
      .then(entry => {
        svgCache.set(src, entry);
        setCached(entry);
      })
      .catch(() => {
        if (!fallbackSrc || src === fallbackSrc) return;
        if (svgCache.has(fallbackSrc)) {
          setCached(svgCache.get(fallbackSrc));
          return;
        }
        fetchIcon(fallbackSrc)
          .then(entry => {
            svgCache.set(fallbackSrc, entry);
            setCached(entry);
          })
          .catch(() => {});
      });
  }, [src, fallbackSrc]);

  if (!cached) return null;

  if (cached.imgSrc) {
    return <img alt="" className={className} src={cached.imgSrc} {...rest} />;
  }

  return (
    <span
      dangerouslySetInnerHTML={{ __html: injectClass(cached.svg, className) }}
      style={{ display: 'contents' }}
      {...rest}
    />
  );
};

const DasIcon = ({ type, iconId, imageUrl, className, ...rest }) => {
  const onImgError = (event) => {
    event.currentTarget.style.display = 'none';
  };

  if (type === 'subjects') {
    return <img alt={`${type} icon`} className={className} onError={onImgError} src={imageUrl} {...rest} />;
  }

  if (window.location.pathname.startsWith('/community') && iconId) {
    const communityValue = window.location.pathname.split('/')[2];
    return (
      <img
        alt={`${type} icon`}
        className={className}
        onError={onImgError}
        src={`${API_V2_URL}community/${communityValue}/activity/events/eventtypes/icons/${iconId}`}
        {...rest}
      />
    );
  }

  const effectiveIconId = iconId || GENERIC_ICON_ID;
  const isGeneric = effectiveIconId.includes('generic');

  return (
    <InlineSvg
      className={`${className || ''} ${isGeneric ? 'generic' : ''}`.trim()}
      fallbackSrc={`${DAS_HOST}/static/sprite-src/${GENERIC_ICON_ID}.svg`}
      src={`${DAS_HOST}/static/sprite-src/${effectiveIconId}.svg`}
      {...rest}
    />
  );
};

export default DasIcon;
